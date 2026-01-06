import mongoose from 'mongoose';

const assignmentStateSchema = new mongoose.Schema({
  language: { type: String, required: true, unique: true, trim: true },
  lastEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
}, { timestamps: true });

export const AssignmentState = mongoose.model('AssignmentState', assignmentStateSchema);
