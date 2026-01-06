import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  source: { type: String, default: '', trim: true },
  date: { type: String, default: '', trim: true }, // keep as text from CSV (e.g., 08-12-2025)
  location: { type: String, default: '', trim: true },
  language: { type: String, default: '', trim: true },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  status: { type: String, enum: ['Ongoing', 'Closed'], default: 'Ongoing' },
  type: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Warm' },
  scheduleDate: { type: Date, default: null },

  assignedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true });

leadSchema.index({ language: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ scheduleDate: 1 });

export const Lead = mongoose.model('Lead', leadSchema);
