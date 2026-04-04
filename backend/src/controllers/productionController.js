import { Employee } from '../models/index.js';
import * as hourlyProductionService from '../services/hourlyProductionService.js';

export async function listHourly(req, res) {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate('productionSectionId')
      .lean();
    const jobs = await hourlyProductionService.listJobsForHourlyProduction(employee);
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function saveHourly(req, res) {
  try {
    await hourlyProductionService.saveHourlyProduction(req.body);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
