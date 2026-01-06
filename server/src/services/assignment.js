import { Employee } from '../models/Employee.js';
import { AssignmentState } from '../models/AssignmentState.js';
import { Lead } from '../models/Lead.js';

const THRESHOLD = 3;

function byStableOrder(a, b) {
  // stable: createdAt asc, then employeeID
  const ca = a.createdAt?.getTime?.() ?? 0;
  const cb = b.createdAt?.getTime?.() ?? 0;
  if (ca !== cb) return ca - cb;
  return String(a.employeeID).localeCompare(String(b.employeeID));
}

export async function assignLeadToEmployee(leadDoc) {
  const language = (leadDoc.language || '').trim();
  if (!language) return null;

  const employees = await Employee.find({ language }).sort({ createdAt: 1, employeeID: 1 });
  const withCapacity = employees.filter(e => (e.ongoingLeadIds?.length || 0) < THRESHOLD);
  if (withCapacity.length === 0) return null;

  const minCount = Math.min(...withCapacity.map(e => e.ongoingLeadIds.length));
  const pool = withCapacity.filter(e => e.ongoingLeadIds.length === minCount).sort(byStableOrder);

  let state = await AssignmentState.findOne({ language });
  if (!state) state = await AssignmentState.create({ language, lastEmployeeId: null });

  let pick = pool[0];
  if (state.lastEmployeeId) {
    const idx = pool.findIndex(e => String(e._id) === String(state.lastEmployeeId));
    if (idx >= 0) {
      pick = pool[(idx + 1) % pool.length];
    }
  }

  // assign
  leadDoc.assignedTo = pick._id;
  leadDoc.assignedAt = new Date();
  await leadDoc.save();

  pick.ongoingLeadIds.push(leadDoc._id);
  await pick.save();

  state.lastEmployeeId = pick._id;
  await state.save();

  return pick;
}

export async function tryAssignUnassignedLeads(language) {
  // keep assigning until no more capacity
  while (true) {
    const lead = await Lead.findOne({ assignedTo: null, status: 'Ongoing', language }).sort({ createdAt: 1 });
    if (!lead) return;

    const assigned = await assignLeadToEmployee(lead);
    if (!assigned) return;
  }
}
