import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { requireAuth, requireRole, attachUser } from '../middleware/auth.js';
import { Employee } from '../models/Employee.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { Attendance } from '../models/Attendance.js';
import { getDateKey, addDays, startOfDay } from '../lib/time.js';
import { tryAssignUnassignedLeads } from '../services/assignment.js';

const router = express.Router();
router.use(requireAuth, requireRole('employee'), attachUser);

async function ensureTodayAttendance(employeeId) {
  const key = getDateKey(new Date());
  let doc = await Attendance.findOne({ employeeId, dateKey: key });
  if (!doc) doc = await Attendance.create({ employeeId, dateKey: key });
  return doc;
}

router.get('/me', async (req, res) => {
  res.json({ user: req.user });
});

const meUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  location: z.string().optional(),
  language: z.string().optional(),
  password: z.string().min(6).optional(),
});

router.put('/me', async (req, res, next) => {
  try {
    const data = meUpdateSchema.parse(req.body);
    const emp = await Employee.findById(req.user._id);
    if (!emp) return res.status(404).json({ message: 'Not found' });

    if (data.firstName !== undefined) emp.firstName = data.firstName;
    if (data.lastName !== undefined) emp.lastName = data.lastName;
    if (data.location !== undefined) emp.location = data.location;
    if (data.language !== undefined) emp.language = data.language;
    if (data.password) emp.password = await bcrypt.hash(data.password, 10);

    await emp.save();
    await Activity.create({ message: 'Profile updated', actorType: 'employee', actorId: emp._id, employeeId: emp._id });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

/**
 * Attendance / Timings
 */
router.get('/attendance/today', async (req, res, next) => {
  try {
    const doc = await ensureTodayAttendance(req.user._id);
    res.json({ attendance: doc });
  } catch (e) { next(e); }
});

router.get('/attendance/break-history', async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days || 7), 30);
    const today = startOfDay(new Date());
    const start = addDays(today, -days);

    const items = await Attendance.find({
      employeeId: req.user._id,
      createdAt: { $gte: start },
      breakStartAt: { $ne: null },
      breakEndAt: { $ne: null },
    }).sort({ createdAt: -1 }).limit(days).lean();

    res.json({ items });
  } catch (e) { next(e); }
});

router.post('/attendance/checkin', async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.user._id);
    const doc = await ensureTodayAttendance(emp._id);

    if (doc.checkInAt && doc.checkOutAt) return res.status(400).json({ message: 'Already checked out for today' });
    if (doc.checkInAt) return res.status(400).json({ message: 'Already checked in' });

    doc.checkInAt = new Date();
    await doc.save();

    emp.status = 'Active';
    await emp.save();

    await Activity.create({ message: 'Checked-In', actorType: 'employee', actorId: emp._id, employeeId: emp._id });

    res.json({ attendance: doc });
  } catch (e) { next(e); }
});

router.post('/attendance/checkout', async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.user._id);
    const doc = await ensureTodayAttendance(emp._id);

    if (!doc.checkInAt) return res.status(400).json({ message: 'Not checked in' });
    if (doc.checkOutAt) return res.status(400).json({ message: 'Already checked out' });

    doc.checkOutAt = new Date();
    await doc.save();

    emp.status = 'Inactive';
    await emp.save();

    await Activity.create({ message: 'Checked-Out', actorType: 'employee', actorId: emp._id, employeeId: emp._id });

    res.json({ attendance: doc });
  } catch (e) { next(e); }
});

router.post('/attendance/break/start', async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.user._id);
    const doc = await ensureTodayAttendance(emp._id);

    if (!doc.checkInAt || doc.checkOutAt) return res.status(400).json({ message: 'You must be checked-in' });
    if (doc.breakStartAt) return res.status(400).json({ message: 'Break already started' });

    doc.breakStartAt = new Date();
    await doc.save();

    await Activity.create({ message: 'Break started', actorType: 'employee', actorId: emp._id, employeeId: emp._id });

    res.json({ attendance: doc });
  } catch (e) { next(e); }
});

router.post('/attendance/break/end', async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.user._id);
    const doc = await ensureTodayAttendance(emp._id);

    if (!doc.breakStartAt) return res.status(400).json({ message: 'No break started' });
    if (doc.breakEndAt) return res.status(400).json({ message: 'Break already ended' });

    doc.breakEndAt = new Date();
    await doc.save();

    await Activity.create({ message: 'Break ended', actorType: 'employee', actorId: emp._id, employeeId: emp._id });

    res.json({ attendance: doc });
  } catch (e) { next(e); }
});

/**
 * Employee activities
 */
router.get('/activities', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 7), 50);
    const items = await Activity.find({ employeeId: req.user._id }).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

/**
 * Leads (employee scoped)
 */
router.get('/leads', async (req, res, next) => {
  try {
    const search = (req.query.search || '').toString().trim();
    const onlyScheduled = (req.query.onlyScheduled || 'false') === 'true';
    const q = { assignedTo: req.user._id };

    if (onlyScheduled) q.scheduleDate = { $ne: null };

    if (search) {
      q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await Lead.find(q).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

router.patch('/leads/:id/type', async (req, res, next) => {
  try {
    const schema = z.object({ type: z.enum(['Hot', 'Warm', 'Cold']) });
    const { type } = schema.parse(req.body);

    const lead = await Lead.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.type = type;
    await lead.save();

    await Activity.create({ message: `Lead type updated to ${type}`, actorType: 'employee', actorId: req.user._id, employeeId: req.user._id, leadId: lead._id });
    await Activity.create({ message: `Lead updated by ${req.user.firstName}`, actorType: 'admin', actorId: null, employeeId: req.user._id, leadId: lead._id });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.patch('/leads/:id/schedule', async (req, res, next) => {
  try {
    const schema = z.object({ scheduleDate: z.string().min(1) }); // ISO string
    const { scheduleDate } = schema.parse(req.body);
    const dt = new Date(scheduleDate);
    if (isNaN(dt.getTime())) return res.status(400).json({ message: 'Invalid date' });

    const lead = await Lead.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.scheduleDate = dt;
    await lead.save();

    await Activity.create({ message: `Lead scheduled`, actorType: 'employee', actorId: req.user._id, employeeId: req.user._id, leadId: lead._id });
    await Activity.create({ message: `Lead scheduled by ${req.user.firstName}`, actorType: 'admin', actorId: null, employeeId: req.user._id, leadId: lead._id });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.patch('/leads/:id/close', async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (lead.status === 'Closed') return res.json({ ok: true });

    // rule: cannot close if scheduled in future
    if (lead.scheduleDate && new Date() < lead.scheduleDate) {
      return res.status(400).json({ message: 'Lead cannot be closed if scheduled and time not reached yet.' });
    }

    lead.status = 'Closed';
    lead.closedAt = new Date();
    await lead.save();

    const emp = await Employee.findById(req.user._id);
    emp.ongoingLeadIds = (emp.ongoingLeadIds || []).filter(id => String(id) !== String(lead._id));
    emp.closedLeadsCount = (emp.closedLeadsCount || 0) + 1;
    await emp.save();

    await Activity.create({ message: `You Closed a deal today`, actorType: 'employee', actorId: req.user._id, employeeId: req.user._id, leadId: lead._id });
    await Activity.create({ message: `${req.user.firstName} closed a deal`, actorType: 'admin', actorId: null, employeeId: req.user._id, leadId: lead._id });

    // capacity freed => try assign unassigned leads for this language
    if (emp.language) await tryAssignUnassignedLeads(emp.language);

    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
