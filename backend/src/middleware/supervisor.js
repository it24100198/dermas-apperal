import { Employee } from '../models/index.js';
import { ProductionSection } from '../models/index.js';

/**
 * Require current user to be washing supervisor (for receive/complete washing).
 */
export async function requireWashingSupervisor(req, res, next) {
  const employee = await Employee.findOne({ userId: req.user._id }).populate('productionSectionId');
  if (!employee) return res.status(403).json({ error: 'Employee record not found' });
  if (employee.role !== 'washing_supervisor') {
    return res.status(403).json({ error: 'Only washing supervisor can perform this action' });
  }
  const section = await ProductionSection.findOne({ slug: 'washing', isActive: true });
  if (!section || !section._id.equals(employee.productionSectionId?._id)) {
    return res.status(403).json({ error: 'Not assigned to washing section' });
  }
  req.employee = employee;
  next();
}

/**
 * Require current user to be supervisor of the given line (by line name or section slug).
 * Used for line complete.
 */
export async function requireSupervisorOfLine(req, res, next) {
  const employee = await Employee.findOne({ userId: req.user._id }).populate('productionSectionId');
  if (!employee) return res.status(403).json({ error: 'Employee record not found' });
  const isLineSupervisor = employee.role === 'line_supervisor' || employee.role === 'admin';
  if (!isLineSupervisor) {
    return res.status(403).json({ error: 'Only line supervisor can complete line' });
  }
  req.employee = employee;
  next();
}
