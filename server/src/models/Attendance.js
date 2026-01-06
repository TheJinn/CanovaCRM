import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  dateKey: { type: String, required: true }, // YYYY-MM-DD (server local time)
  checkInAt: { type: Date, default: null },
  checkOutAt: { type: Date, default: null },
  breakStartAt: { type: Date, default: null },
  breakEndAt: { type: Date, default: null },
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, dateKey: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
