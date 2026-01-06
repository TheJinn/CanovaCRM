import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { Employee } from '../models/Employee.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload; // { role, id }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ message: 'Unauthorized' });
    if (req.auth.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

export async function attachUser(req, res, next) {
  if (!req.auth) return next();
  const { role, id } = req.auth;
  if (role === 'admin') req.user = await Admin.findById(id).select('-password');
  if (role === 'employee') req.user = await Employee.findById(id).select('-password');
  next();
}
