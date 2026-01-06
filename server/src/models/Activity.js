import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  message: { type: String, required: true },
  actorType: { type: String, enum: ['admin', 'employee', 'system'], required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
}, { timestamps: true });

activitySchema.index({ createdAt: -1 });
activitySchema.index({ employeeId: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
