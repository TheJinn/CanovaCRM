import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  employeeID: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // hashed
  location: { type: String, default: '', trim: true },
  language: { type: String, default: '', trim: true },

  ongoingLeadIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
  closedLeadsCount: { type: Number, default: 0 },

  status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

export const Employee = mongoose.model('Employee', employeeSchema);
