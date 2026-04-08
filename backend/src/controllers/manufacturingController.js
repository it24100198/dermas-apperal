import * as manufacturingOverviewService from '../services/manufacturingOverviewService.js';
import * as cuttingService from '../services/cuttingService.js';
import * as washingService from '../services/washingService.js';
import * as qcService from '../services/qcService.js';
import * as finalCheckService from '../services/finalCheckService.js';

export async function getOverview(req, res) {
  try {
    const data = await manufacturingOverviewService.getOverview();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listCutting(req, res) {
  try {
    const jobs = await cuttingService.listCuttingJobs();
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function saveCutting(req, res) {
  try {
    const job = await cuttingService.saveCuttingRecord(req.params.jobId, req.body);
    return res.json(job);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getWashing(req, res) {
  try {
    const data = await washingService.getWashingView();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createTransfer(req, res) {
  try {
    const transfer = await washingService.createTransfer(req.body);
    return res.status(201).json(transfer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function receiveTransfer(req, res) {
  try {
    const transfer = await washingService.receiveTransfer(req.params.id);
    return res.json(transfer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function completeWashing(req, res) {
  try {
    const transfer = await washingService.completeWashing(req.params.id);
    return res.json(transfer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getAvailableToSend(req, res) {
  try {
    const available = await washingService.getAvailableToSend(req.params.jobId);
    return res.json({ availableToSend: available });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// QC
export async function listQc(req, res) {
  try {
    const transfers = await qcService.listQcTransfers();
    return res.json(transfers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getQcDetail(req, res) {
  try {
    const data = await qcService.getQcDetail(req.params.transferId);
    return res.json(data);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function saveQc(req, res) {
  try {
    const qc = await qcService.saveQc(req.params.transferId, req.body, req.user._id);
    return res.status(201).json(qc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function issueAccessory(req, res) {
  try {
    await qcService.issueAccessoryToBatch(req.params.batchId, req.body, req.user._id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function sendToFinalCheck(req, res) {
  try {
    const batch = await qcService.sendBatchToFinalCheck(req.params.batchId);
    return res.json(batch);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Final checking
export async function listFinal(req, res) {
  try {
    const jobs = await finalCheckService.listFinalJobs();
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getFinalJobDetail(req, res) {
  try {
    const data = await finalCheckService.getFinalJobDetail(req.params.jobId);
    return res.json(data);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

export async function finalizeBatch(req, res) {
  try {
    const result = await finalCheckService.finalizeBatch(req.params.batchId, req.user._id);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
