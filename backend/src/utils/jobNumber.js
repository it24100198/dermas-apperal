import ManufacturingJob from '../models/ManufacturingJob.js';

/**
 * Generate next job number: JOB-YYYY-0001
 */
export async function getNextJobNumber() {
  const year = new Date().getFullYear();
  const prefix = `JOB-${year}-`;
  const last = await ManufacturingJob.findOne(
    { jobNumber: new RegExp(`^${prefix}`) },
    { jobNumber: 1 },
    { sort: { jobNumber: -1 } }
  ).lean();
  let seq = 1;
  if (last?.jobNumber) {
    const match = last.jobNumber.match(/-(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}
