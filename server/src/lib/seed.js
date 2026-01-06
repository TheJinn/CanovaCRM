import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';

export async function seedDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@canova.com';
  const existing = await Admin.findOne({ email });
  if (existing) return;

  const passwordPlain = process.env.ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  await Admin.create({
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'User',
    email,
    password: passwordHash
  });

  console.log(`Seeded admin: ${email}`);
}
