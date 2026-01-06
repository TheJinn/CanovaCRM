import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { parse } from 'csv-parse/sync';

import { requireAuth, requireRole, attachUser } from '../middleware/auth.js';
import { Employee } from '../models/Employee.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { Admin } from '../models/Admin.js';
import { assignLeadToEmployee, tryAssignUnassignedLeads } from '../services/assignment.js';
import { startOfWeek, endOfWeek, addDays, startOfDay } from '../lib/time.js';

const router = express.Router();

// Admin is seeded in DB and the Admin UI should not show a login screen.
// This endpoint issues a token automatically if an admin exists.
router.get('/bootstrap', async (req, res, next) => {
  try {
    const admin = await Admin.findOne({}).lean();
    if (!admin) return res.status(404).json({ message: 'admin not found' });

    const token = jwt.sign({ role: 'admin', id: admin._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (e) { next(e); }
});

router.use(requireAuth, requireRole('admin'), attachUser);

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

/**
 * Dashboard
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const unassignedLeads = await Lead.countDocuments({ assignedTo: null, status: 'Ongoing' });

    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const assignedThisWeek = await Lead.countDocuments({ assignedAt: { $gte: weekStart, $lt: weekEnd } });

    const activeSalespeople = await Employee.countDocuments({ status: 'Active' });

    const totalLeads = await Lead.countDocuments({});
    const closedLeads = await Lead.countDocuments({ status: 'Closed' });
    const conversionRate = totalLeads === 0 ? 0 : Math.round((closedLeads / totalLeads) * 100);

    // analytics: last 7 days (including today)
    const today = startOfDay(new Date());
    const ranges = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const d2 = addDays(d, 1);
      ranges.push({ start: d, end: d2 });
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const analyticsWeek = await Promise.all(ranges.map(async (r) => {
      const assigned = await Lead.countDocuments({ assignedAt: { $gte: r.start, $lt: r.end } });
      const closed = await Lead.countDocuments({ closedAt: { $gte: r.start, $lt: r.end } });
      const rate = assigned === 0 ? 0 : Math.round((closed / assigned) * 100);
      return {
        date: r.start.toISOString().slice(0,10),
        day: dayNames[new Date(r.start).getDay()],
        assigned,
        closed,
        rate
      };
    }));

    const activities = await Activity.find({}).sort({ createdAt: -1 }).limit(20).lean();

    // active employees list for dashboard table
    const employees = await Employee.find({ status: 'Active' }).sort({ updatedAt: -1 }).limit(50).lean();
    const activeEmployees = employees.map(e => ({
      id: e._id,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      employeeID: e.employeeID,
      assignedLeads: (e.ongoingLeadIds || []).length,
      closedLeads: e.closedLeadsCount || 0,
      status: e.status
    }));

    res.json({
      cards: {
        unassignedLeads,
        assignedThisWeek,
        activeSalespeople,
        conversionRate,
      },
      analyticsWeek,
      recentActivities: activities.slice(0, 7),
      activeEmployees
    });
  } catch (e) { next(e); }
});

/**
 * Activities
 */
router.get('/activities', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 7), 50);
    const activities = await Activity.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ items: activities });
  } catch (e) { next(e); }
});

/**
 * Settings (Admin profile)
 */
const adminUpdateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6).optional(),
});

router.get('/me', async (req, res) => {
  res.json({ user: req.user });
});

router.put('/me', async (req, res, next) => {
  try {
    const data = adminUpdateSchema.parse(req.body);
    const admin = await Admin.findById(req.user._id);
    admin.firstName = data.firstName;
    admin.lastName = data.lastName;
    if (data.password) admin.password = await bcrypt.hash(data.password, 10);
    await admin.save();
    await Activity.create({ message: 'Admin updated settings', actorType: 'admin', actorId: admin._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

/**
 * Employees CRUD
 */
function makeEmployeeID() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const employeeCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  location: z.string().optional().default(''),
  language: z.string().optional().default(''),
});

const employeeUpdateSchema = employeeCreateSchema.partial();

router.get('/employees', async (req, res, next) => {
  try {
    const search = (req.query.search || '').toString().trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 8;
    const skip = (page - 1) * limit;

    const q = {};
    if (search) {
      q.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeID: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Employee.countDocuments(q);
    const items = await Employee.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    res.json({
      items: items.map(e => ({
        id: e._id,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        employeeID: e.employeeID,
        location: e.location,
        language: e.language,
        assignedLeads: (e.ongoingLeadIds || []).length,
        closedLeads: e.closedLeadsCount || 0,
        status: e.status
      })),
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (e) { next(e); }
});

router.post('/employees', async (req, res, next) => {
  try {
    const data = employeeCreateSchema.parse(req.body);
    const email = data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(email, 10); // default password = email
    const employeeID = makeEmployeeID();

    const emp = await Employee.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      password: passwordHash,
      employeeID,
      location: data.location || '',
      language: data.language || '',
      ongoingLeadIds: [],
      closedLeadsCount: 0,
      status: 'Inactive'
    });

    await Activity.create({ message: `Employee created: ${emp.firstName} ${emp.lastName}`, actorType: 'admin', actorId: req.user._id, employeeId: emp._id });

    // new employee may free unassigned leads for their language
    if (emp.language) await tryAssignUnassignedLeads(emp.language);

    res.status(201).json({ id: emp._id });
  } catch (e) { next(e); }
});

router.put('/employees/:id', async (req, res, next) => {
  try {
    const data = employeeUpdateSchema.parse(req.body);
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    if (data.firstName !== undefined) emp.firstName = data.firstName;
    if (data.lastName !== undefined) emp.lastName = data.lastName;
    if (data.location !== undefined) emp.location = data.location;
    if (data.language !== undefined) emp.language = data.language;
    // email is editable via admin? requirement says can edit employee information; keep email editable but careful unique
    if (data.email !== undefined) emp.email = data.email.toLowerCase();

    await emp.save();
    await Activity.create({ message: `Employee updated: ${emp.firstName} ${emp.lastName}`, actorType: 'admin', actorId: req.user._id, employeeId: emp._id });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/employees/:id', async (req, res, next) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    // unassign their ongoing leads (keep them unassigned to be reassigned)
    await Lead.updateMany({ assignedTo: emp._id, status: 'Ongoing' }, { $set: { assignedTo: null, assignedAt: null } });

    await Activity.create({ message: `Employee deleted: ${emp.firstName} ${emp.lastName}`, actorType: 'admin', actorId: req.user._id });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/employees/bulk-delete', async (req, res, next) => {
  try {
    const schema = z.object({ ids: z.array(z.string().min(1)).min(1) });
    const { ids } = schema.parse(req.body);

    const empIds = ids.map(id => id);
    const emps = await Employee.find({ _id: { $in: empIds } }).lean();

    await Employee.deleteMany({ _id: { $in: empIds } });
    await Lead.updateMany({ assignedTo: { $in: empIds }, status: 'Ongoing' }, { $set: { assignedTo: null, assignedAt: null } });

    await Activity.create({ message: `Bulk deleted employees: ${empIds.length}`, actorType: 'admin', actorId: req.user._id });

    res.json({ ok: true, deleted: emps.length });
  } catch (e) { next(e); }
});

/**
 * Leads list + search + pagination
 */
router.get('/leads', async (req, res, next) => {
  try {
    const search = (req.query.search || '').toString().trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = 8;
    const skip = (page - 1) * limit;

    const q = {};
    if (search) {
      q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Lead.countDocuments(q);
    const items = await Lead.find(q)
      .populate('assignedTo', 'employeeID firstName lastName')
      // Stable sort so pagination never repeats/shuffles when multiple docs share same createdAt
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      items: items.map((l, idx) => ({
        id: l._id,
        name: l.name,
        email: l.email,
        source: l.source,
        date: l.date,
        location: l.location,
        language: l.language,
        assignedTo: l.assignedTo ? { id: l.assignedTo._id, employeeID: l.assignedTo.employeeID } : null,
        status: l.status,
        type: l.type,
        scheduleDate: l.scheduleDate,
      })),
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (e) { next(e); }
});

/**
 * Manual lead creation
 */
const leadCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  source: z.string().trim().optional().default(''),
  date: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default(''),
  language: z.string().trim().optional().default(''),
});

router.post('/leads/manual', async (req, res, next) => {
  try {
    const data = leadCreateSchema.parse(req.body);

    const lead = await Lead.create({
      name: data.name,
      email: data.email.toLowerCase(),
      source: data.source || '',
      date: data.date || '',
      location: data.location || '',
      language: data.language || '',
      assignedTo: null,
      status: 'Ongoing',
      type: 'Warm',
      scheduleDate: null,
      assignedAt: null,
      closedAt: null
    });

    const assigned = await assignLeadToEmployee(lead);
    if (assigned) {
      await Activity.create({ message: `You assigned a lead to ${assigned.firstName}`, actorType: 'admin', actorId: req.user._id, employeeId: assigned._id, leadId: lead._id });
      await Activity.create({ message: `You were assigned a new lead`, actorType: 'system', actorId: null, employeeId: assigned._id, leadId: lead._id });
    } else {
      await Activity.create({ message: `New lead added (unassigned): ${lead.name}`, actorType: 'admin', actorId: req.user._id, leadId: lead._id });
    }

    res.status(201).json({ id: lead._id, assignedTo: assigned ? assigned._id : null });
  } catch (e) { next(e); }
});

/**
 * CSV Upload
 */
router.post('/leads/upload-csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File required' });

    // Read using fs module (requirement)
    const csvText = fs.readFileSync(req.file.path, 'utf-8');

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // validate headers strictly
    const allowed = ['Name', 'Email', 'Source', 'Date', 'Location', 'Language'];
    const headerKeys = records.length ? Object.keys(records[0]) : [];
    const invalid = headerKeys.filter(k => !allowed.includes(k));
    if (invalid.length > 0) {
      return res.status(400).json({ message: `Invalid CSV columns: ${invalid.join(', ')}` });
    }

    const leadDocs = records.map(r => ({
      name: (r.Name || '').trim(),
      email: (r.Email || '').trim().toLowerCase(),
      source: (r.Source || '').trim(),
      date: (r.Date || '').trim(),
      location: (r.Location || '').trim(),
      language: (r.Language || '').trim(),
      assignedTo: null,
      status: 'Ongoing',
      type: 'Warm',
      scheduleDate: null,
      assignedAt: null,
      closedAt: null
    })).filter(x => x.name && x.email);

    // insert in parallel (requirement)
    const createdLeads = await Promise.all(leadDocs.map(ld => Lead.create(ld)));

    // assign sequentially per language to keep distribution logic stable
    const assignedResults = [];
    for (const lead of createdLeads) {
      const emp = await assignLeadToEmployee(lead);
      if (emp) {
        assignedResults.push({ leadId: lead._id, employeeId: emp._id });
        await Activity.create({ message: `You assigned a lead to ${emp.firstName}`, actorType: 'admin', actorId: req.user._id, employeeId: emp._id, leadId: lead._id });
        await Activity.create({ message: `You were assigned a new lead`, actorType: 'system', actorId: null, employeeId: emp._id, leadId: lead._id });
      } else {
        await Activity.create({ message: `New lead added (unassigned): ${lead.name}`, actorType: 'admin', actorId: req.user._id, leadId: lead._id });
      }
    }

    res.json({
      ok: true,
      inserted: createdLeads.length,
      assigned: assignedResults.length,
      fileName: req.file.originalname
    });
  } catch (e) { next(e); }
});

export default router;
