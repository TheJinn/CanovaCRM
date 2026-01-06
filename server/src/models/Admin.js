import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // hashed
}, { timestamps: true });

export const Admin = mongoose.model('Admin', adminSchema);
