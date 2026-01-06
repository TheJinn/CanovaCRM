import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { Admin } from '../models/Admin.js';
import { Employee } from '../models/Employee.js';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ role: 'admin', id: admin._id });
    res.json({
      token,
      user: { id: admin._id, firstName: admin.firstName, lastName: admin.lastName, email: admin.email, role: 'admin' }
    });
  } catch (e) { next(e); }
});

router.post('/employee/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const emp = await Employee.findOne({ email: email.toLowerCase() });
    if (!emp) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, emp.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    emp.lastLoginAt = new Date();
    await emp.save();

    const token = signToken({ role: 'employee', id: emp._id });

    res.json({
      token,
      user: {
        id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        employeeID: emp.employeeID,
        location: emp.location,
        language: emp.language,
        status: emp.status,
        role: 'employee'
      }
    });
  } catch (e) { next(e); }
});

export default router;
