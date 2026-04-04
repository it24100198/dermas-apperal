/**
 * AI Routes — rule-based engine using real MongoDB data.
 * Python AI microservice is called first; all fallbacks compute from real DB.
 */
import { Router } from 'express';
import axios from 'axios';
import AIPredictionLog from '../models/AIPredictionLog.js';
import ManufacturingJob from '../models/ManufacturingJob.js';
import HourlyProduction from '../models/HourlyProduction.js';
import Employee from '../models/Employee.js';
import QcCheck from '../models/QcCheck.js';
import PackingBatch from '../models/PackingBatch.js';
import MaterialIssue from '../models/MaterialIssue.js';
import JobLineAssignment from '../models/JobLineAssignment.js';

const router = Router();
const AI_SERVICE = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const USE_PYTHON_AI = process.env.AI_USE_PYTHON === 'true';

// ─── Helper: call Python AI service ────────────────────────────────────
async function callAI(method, path, data = null) {
  if (!USE_PYTHON_AI) return null; // default: do not return demo/prediction microservice output
  try {
    const config = { timeout: 8000 };
    const url = `${AI_SERVICE}${path}`;
    const res = method === 'get'
      ? await axios.get(url, config)
      : await axios.post(url, data, config);
    return res.data;
  } catch {
    return null; // Python service offline — use rule-based fallback
  }
}

// ─── Wastage model: industry-based regression ──────────────────────────
// Returns wastage % given fabric_type, gsm, design_complexity
function calcWastagePct(fabric_type, gsm, design_complexity) {
  const gsmN = Math.max(80, Math.min(500, Number(gsm) || 180));

  // Base wastage: 3% at GSM 80, 7% at GSM 300 (linear)
  const base = 3 + ((gsmN - 80) / 220) * 4; // 3–7% range

  // Complexity factor
  const cx = design_complexity === 'high' ? 1.35
    : design_complexity === 'low' ? 0.75
    : 1.0;

  // Fabric factor
  const fx = fabric_type === 'silk' ? 1.20
    : fabric_type === 'denim' ? 1.10
    : fabric_type === 'polyester' ? 0.90
    : fabric_type === 'blended' ? 0.95
    : 1.0; // cotton default

  const pct = parseFloat((base * cx * fx).toFixed(1));
  return Math.max(1.5, Math.min(18, pct)); // clamp 1.5–18%
}

function wastageRisk(pct) {
  return pct < 5 ? 'low' : pct < 9 ? 'medium' : 'high';
}

// ─── Efficiency model: weighted factor model ───────────────────────────
// Returns efficiency % given workers, target_per_hour, experience, line_age
function calcEfficiencyPct(workers_count, target_per_hour, avg_experience_months, line_age_days) {
  const workers = Math.max(1, Number(workers_count) || 1);
  const experience = Number(avg_experience_months) || 0;
  const lineAge = Number(line_age_days) || 0;

  // Experience factor: 0 months → 60%, 6 months → 75%, 24 months → 90%
  const expScore = Math.min(90, 60 + (experience / 24) * 30);

  // Line maturity factor: new lines are less efficient
  const maturityScore = Math.min(100, 65 + (lineAge / 120) * 35); // 65% at day 0, 100% at day 120+

  // Team size factor: optimal 8-15 workers, penalty below 3
  const teamFactor = workers < 3 ? 0.80 : workers < 6 ? 0.90 : workers < 20 ? 1.0 : 0.95;

  const eff = parseFloat(((expScore * 0.55 + maturityScore * 0.45) * teamFactor).toFixed(1));
  return Math.max(40, Math.min(98, eff));
}

function effStatus(pct) {
  return pct >= 80 ? 'good' : pct >= 65 ? 'warning' : 'risk';
}

// ─── Confidence: based on data quality ────────────────────────────────
function calcWastageConfidence(hasActualData, cuttingJobCount) {
  if (hasActualData) return 99;
  if (cuttingJobCount >= 10) return 88;
  if (cuttingJobCount >= 5) return 82;
  if (cuttingJobCount >= 1) return 75;
  return 65; // pure rule-based, no historical data
}

function calcEfficiencyConfidence(hasProductionData, recordCount) {
  if (hasProductionData && recordCount >= 20) return 94;
  if (hasProductionData && recordCount >= 5) return 87;
  if (hasProductionData) return 78;
  return 65;
}

// ─── Core real-data calculator ─────────────────────────────────────────
async function computeRealMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7Start = new Date(now - 7 * 86400000);

  const [allHourly7d, todayHourly, cuttingJobs, qcChecks, lineAssignments] = await Promise.all([
    HourlyProduction.find({ createdAt: { $gte: last7Start } }).lean(),
    HourlyProduction.find({ createdAt: { $gte: todayStart } }).lean(),
    ManufacturingJob.find({ fabricUsedQty: { $gt: 0 }, fabricWasteQty: { $gte: 0 } }).lean(),
    QcCheck.find().lean(),
    JobLineAssignment.find().lean(),
  ]);

  // ── Today production ──
  const totalProducedToday = todayHourly.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalProduced7d = allHourly7d.reduce((s, r) => s + (r.quantity || 0), 0);

  // ── Predicted daily output: avg of last 7 days per-day ──
  const avgPerDay = totalProduced7d / 7;
  const predictedDailyOutput = Math.round(avgPerDay > 0 ? avgPerDay : totalProducedToday);

  // ── Efficiency vs 7-day daily average ──
  // Only calculate if there's meaningful production data
  let efficiencyScore = null;
  if (totalProduced7d > 0) {
    if (totalProducedToday > 0) {
      // Compare today vs daily average
      efficiencyScore = parseFloat(((totalProducedToday / avgPerDay) * 100).toFixed(1));
      efficiencyScore = Math.min(200, Math.max(0, efficiencyScore)); // cap at 200%
    }
    // If today = 0 but 7d data exists, efficiency is 0%
    else {
      efficiencyScore = 0;
    }
  }
  // If absolutely no production data, efficiencyScore remains null

  // ── Fabric wastage (real cutting records) ──
  let avgWastagePct = null;
  if (cuttingJobs.length > 0) {
    const totalUsed = cuttingJobs.reduce((s, j) => s + (j.fabricUsedQty || 0), 0);
    const totalWaste = cuttingJobs.reduce((s, j) => s + (j.fabricWasteQty || 0), 0);
    avgWastagePct = totalUsed > 0
      ? parseFloat(((totalWaste / totalUsed) * 100).toFixed(1))
      : null;
  }

  // ── QC damage rate ──
  let damageRate = null;
  if (qcChecks.length > 0) {
    const totalGood = qcChecks.reduce((s, q) => s + (q.finishedGoodQty || 0), 0);
    const totalDmg = qcChecks.reduce((s, q) => s + (q.damagedQty || 0), 0);
    const totalQc = totalGood + totalDmg;
    damageRate = totalQc > 0 ? parseFloat(((totalDmg / totalQc) * 100).toFixed(1)) : null;
  }

  // ── Line efficiency (production per line, target from JobLineAssignment) ──
  const lineMap = {};
  for (const r of allHourly7d) {
    const ln = r.lineName || 'Unknown';
    if (!lineMap[ln]) lineMap[ln] = { produced: 0, count: 0 };
    lineMap[ln].produced += r.quantity || 0;
    lineMap[ln].count += 1;
  }
  // Target per line = sum of assignedQuantity (all time, as overall capacity reference)
  const lineTargetMap = {};
  for (const la of lineAssignments) {
    const ln = la.lineName;
    lineTargetMap[ln] = (lineTargetMap[ln] || 0) + (la.assignedQuantity || 0);
  }

  const lineEfficiency = Object.entries(lineMap)
    .map(([line, v]) => {
      const totalTarget = lineTargetMap[line] || 0;
      // If no target set, derive efficiency from records vs expected (40 units/hour baseline)
      const expected7d = v.count * 40; // 40 pcs/hr baseline per record
      const efficiency = totalTarget > 0
        ? parseFloat(((v.produced / (totalTarget / 7 * 7)) * 100).toFixed(1)) // produced vs 7d portion of target
        : parseFloat(((v.produced / Math.max(expected7d, 1)) * 100).toFixed(1));
      return {
        line,
        efficiency: Math.min(150, Math.max(0, efficiency)),
        produced: v.produced,
        target: totalTarget,
        records: v.count,
      };
    })
    .filter(l => l.produced > 0)
    .sort((a, b) => b.produced - a.produced);

  // ── Daily trend (last 7 days) ──
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOrder = [];
  const dayBuckets = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
    dayOrder.push(label);
    dayBuckets[label] = { produced: 0 };
  }
  for (const r of allHourly7d) {
    const d = new Date(r.createdAt);
    const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
    if (dayBuckets[label] !== undefined) {
      dayBuckets[label].produced += r.quantity || 0;
    }
  }

  // Target per day from total assignments / estimated working days
  const totalAssigned = lineAssignments.reduce((s, la) => s + (la.assignedQuantity || 0), 0);
  const dailyTarget = totalAssigned > 0 ? Math.round(totalAssigned / 30) : 0; // /30 working days

  const weekLabels = dayOrder;
  const weekActual = dayOrder.map(d => dayBuckets[d].produced);
  const weekTarget = dayOrder.map(() => dailyTarget);

  // ── Risk alert count ──
  let riskAlerts = 0;
  if (efficiencyScore !== null && efficiencyScore < 70) riskAlerts++;
  if (avgWastagePct !== null && avgWastagePct > 8) riskAlerts++;
  if (damageRate !== null && damageRate > 5) riskAlerts++;
  lineEfficiency.forEach(l => { if (l.efficiency < 70) riskAlerts++; });
  if (totalProducedToday === 0 && totalProduced7d > 0) riskAlerts++; // no production today

  return {
    predictedDailyOutput,
    efficiencyScore,
    avgWastagePct,
    damageRate,
    lineEfficiency,
    weekLabels,
    weekActual,
    weekTarget,
    riskAlerts,
    totalProducedToday,
    totalProduced7d,
    cuttingJobCount: cuttingJobs.length,
    qcCheckCount: qcChecks.length,
  };
}

// ─── Rule-based suggestion engine ─────────────────────────────────────
function buildSuggestions({ efficiencyPct, wastagePct, damageRate, lineEfficiency = [], totalProducedToday }) {
  const suggestions = [];
  let id = 1;

  // Efficiency
  if (efficiencyPct === null) {
    suggestions.push({
      id: id++, priority: 'low', icon: 'bi-info-circle',
      title: 'No Production Data Yet',
      message: 'No hourly production records found. Start entering production data through the Supervisor module to enable AI analysis.',
      action: 'Go to Production',
    });
  } else if (efficiencyPct < 60) {
    suggestions.push({
      id: id++, priority: 'high', icon: 'bi-speedometer2',
      title: 'Critical: Very Low Production Efficiency',
      message: `Today's efficiency is ${efficiencyPct}% of the 7-day average. Investigate line capacity, machine downtime, and worker attendance immediately.`,
      action: 'View Line Assignments',
    });
  } else if (efficiencyPct < 80) {
    suggestions.push({
      id: id++, priority: 'medium', icon: 'bi-speedometer2',
      title: 'Below-Average Production Today',
      message: `Today's output is ${efficiencyPct}% of the recent daily average. Check if all lines are running at full capacity.`,
      action: 'Review Production',
    });
  } else if (efficiencyPct >= 110) {
    suggestions.push({
      id: id++, priority: 'low', icon: 'bi-stars',
      title: 'Above-Average Production Today',
      message: `Today's output is ${efficiencyPct}% of the daily average — excellent performance. Consider reviewing if targets can be raised.`,
      action: 'View Performance',
    });
  }

  // Wastage
  if (wastagePct === null) {
    suggestions.push({
      id: id++, priority: 'low', icon: 'bi-recycle',
      title: 'No Cutting Data Available',
      message: 'Fabric wastage cannot be calculated — enter cutting records (fabric used vs waste) to enable wastage AI analysis.',
      action: 'Go to Cutting',
    });
  } else if (wastagePct > 10) {
    suggestions.push({
      id: id++, priority: 'high', icon: 'bi-recycle',
      title: 'High Fabric Wastage',
      message: `Fabric wastage is ${wastagePct}% — above the critical 10% level. Perform marker efficiency analysis and review cutting patterns immediately.`,
      action: 'Analyze Cutting',
    });
  } else if (wastagePct > 6) {
    suggestions.push({
      id: id++, priority: 'medium', icon: 'bi-recycle',
      title: 'Above-Average Fabric Wastage',
      message: `Fabric wastage at ${wastagePct}% (target: below 6%). Consider trial cuts for complex designs and improved nesting.`,
      action: 'Review Cutting',
    });
  } else {
    suggestions.push({
      id: id++, priority: 'low', icon: 'bi-check-circle',
      title: 'Fabric Wastage Under Control',
      message: `Current average wastage is ${wastagePct}% — within acceptable limits. Maintain current cutting practices.`,
      action: 'View Cutting',
    });
  }

  // QC damage
  if (damageRate === null) {
    suggestions.push({
      id: id++, priority: 'low', icon: 'bi-clipboard-check',
      title: 'No QC Records Yet',
      message: 'Complete QC inspections to enable damage rate tracking and AI-driven quality analysis.',
      action: 'Go to QC',
    });
  } else if (damageRate > 8) {
    suggestions.push({
      id: id++, priority: 'high', icon: 'bi-clipboard-x',
      title: 'Critical QC Rejection Rate',
      message: `QC damage rate is ${damageRate}% — above the critical 8% threshold. Review stitching quality and operator technique on all affected lines.`,
      action: 'View QC Records',
    });
  } else if (damageRate > 3) {
    suggestions.push({
      id: id++, priority: 'medium', icon: 'bi-clipboard-x',
      title: 'Elevated QC Rejection Rate',
      message: `QC damage rate is ${damageRate}% (target: below 3%). Identify which batches have the highest damage and address root causes.`,
      action: 'View QC',
    });
  } else {
    suggestions.push({
      id: id++, priority: 'low', icon: 'bi-patch-check',
      title: 'QC Quality on Target',
      message: `Damage rate is ${damageRate}% — within the 3% target. Maintain current QC standards.`,
      action: 'View QC',
    });
  }

  // Per-line warnings
  lineEfficiency.filter(l => l.efficiency < 65).forEach(l => {
    suggestions.push({
      id: id++, priority: 'medium', icon: 'bi-list-task',
      title: `${l.line}: Low Output`,
      message: `${l.line} produced ${l.produced} pcs over 7 days (efficiency: ${l.efficiency}%). Check staffing and machine status for this line.`,
      action: 'View Line',
    });
  });

  return suggestions;
}

// ─── Real threshold-based alert engine ────────────────────────────────
function buildAlerts({ efficiencyPct, wastagePct, damageRate, lineEfficiency = [], totalProducedToday, jobNumber }) {
  const alerts = [];
  const now = new Date().toISOString();
  let id = 1;

  if (efficiencyPct !== null && efficiencyPct < 60) {
    alerts.push({
      id: `eff-critical-${id++}`, severity: 'critical', icon: 'bi-speedometer2',
      title: 'Critical: Production Efficiency Very Low',
      message: `Today's output is only ${efficiencyPct}% of the daily average. Immediate action required.`,
      value: efficiencyPct, threshold: 60, line: jobNumber || null,
      timestamp: now, acknowledged: false,
    });
  } else if (efficiencyPct !== null && efficiencyPct < 80) {
    alerts.push({
      id: `eff-warn-${id++}`, severity: 'warning', icon: 'bi-speedometer2',
      title: 'Warning: Below-Average Production Today',
      message: `Today's output is ${efficiencyPct}% of the 7-day average (target ≥ 80%).`,
      value: efficiencyPct, threshold: 80,
      timestamp: now, acknowledged: false,
    });
  }

  if (wastagePct !== null && wastagePct > 10) {
    alerts.push({
      id: `waste-critical-${id++}`, severity: 'critical', icon: 'bi-recycle',
      title: 'Critical: Fabric Wastage Excessive',
      message: `Fabric wastage is ${wastagePct}% — above the critical 10% threshold.`,
      value: wastagePct, threshold: 10,
      timestamp: now, acknowledged: false,
    });
  } else if (wastagePct !== null && wastagePct > 6) {
    alerts.push({
      id: `waste-warn-${id++}`, severity: 'warning', icon: 'bi-recycle',
      title: 'Warning: Fabric Wastage Elevated',
      message: `Fabric wastage at ${wastagePct}% — above the 6% threshold.`,
      value: wastagePct, threshold: 6,
      timestamp: now, acknowledged: false,
    });
  }

  if (damageRate !== null && damageRate > 8) {
    alerts.push({
      id: `qc-critical-${id++}`, severity: 'critical', icon: 'bi-clipboard-x',
      title: 'Critical: QC Rejection Rate High',
      message: `QC damage rate is ${damageRate}% — exceeds the 8% critical threshold.`,
      value: damageRate, threshold: 8,
      timestamp: now, acknowledged: false,
    });
  } else if (damageRate !== null && damageRate > 3) {
    alerts.push({
      id: `qc-warn-${id++}`, severity: 'warning', icon: 'bi-clipboard-x',
      title: 'Warning: QC Rejection Rate Elevated',
      message: `QC damage rate is ${damageRate}% — above the 3% target.`,
      value: damageRate, threshold: 3,
      timestamp: now, acknowledged: false,
    });
  }

  lineEfficiency.filter(l => l.efficiency < 60).forEach(l => {
    alerts.push({
      id: `line-${l.line}-${id++}`, severity: 'critical', icon: 'bi-list-task',
      title: `Critical: ${l.line} Very Low Output`,
      message: `${l.line} is at ${l.efficiency}% efficiency over the last 7 days.`,
      value: l.efficiency, threshold: 60, line: l.line,
      timestamp: now, acknowledged: false,
    });
  });

  if (totalProducedToday === 0) {
    alerts.push({
      id: `no-prod-${id++}`, severity: 'warning', icon: 'bi-pause-circle',
      title: 'No Production Recorded Today',
      message: 'No hourly production has been recorded today. Ensure supervisors are entering shift data.',
      timestamp: now, acknowledged: false,
    });
  } else {
    alerts.push({
      id: `prod-ok-${id++}`, severity: 'info', icon: 'bi-check-circle',
      title: 'Production Active Today',
      message: `${totalProducedToday.toLocaleString()} pieces recorded today across all lines.`,
      timestamp: now, acknowledged: false,
    });
  }

  return alerts;
}

// ═══════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════

// GET /api/ai/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const aiData = await callAI('get', '/predict/dashboard');
    if (aiData) return res.json(aiData);

    const m = await computeRealMetrics();

    // Worker trend = daily production vs target ratio
    const workerScores = m.weekActual.map((produced, i) => {
      const target = m.weekTarget[i] || 0;
      if (target > 0) return parseFloat(((produced / target) * 100).toFixed(1));
      if (produced > 0) return 75; // have output but no target = neutral
      return 0;
    });

    res.json({
      predicted_daily_output: m.predictedDailyOutput,
      efficiency_score: m.efficiencyScore,           // can be null — frontend handles
      wastage_percent: m.avgWastagePct,              // can be null
      damage_rate: m.damageRate,                     // can be null
      risk_alerts: m.riskAlerts,
      trend: {
        labels: m.weekLabels,
        predicted: m.weekTarget,   // target = "predicted"
        actual: m.weekActual,
      },
      line_efficiency: m.lineEfficiency,
      worker_trend: {
        labels: m.weekLabels,
        scores: workerScores,
      },
      _source: 'realtime_db',
      _computed_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/predict/wastage
router.post('/predict/wastage', async (req, res) => {
  const aiResult = await callAI('post', '/predict/wastage', req.body);

  if (!aiResult) {
    const { fabric_type, gsm, design_complexity, issued_fabric_qty } = req.body;

    // Count historical jobs to calibrate confidence
    const cuttingJobCount = await ManufacturingJob.countDocuments({ fabricUsedQty: { $gt: 0 } });

    const wastagePct = calcWastagePct(fabric_type, gsm, design_complexity);
    const risk = wastageRisk(wastagePct);

    // Sanitize issued_fabric_qty: clamp to realistic range 0–99999 yards/kg
    const rawQty = Number(issued_fabric_qty);
    const safeQty = (issued_fabric_qty && !isNaN(rawQty) && rawQty > 0 && rawQty <= 99999)
      ? rawQty : null;
    const fabricLoss = safeQty
      ? parseFloat((safeQty * wastagePct / 100).toFixed(2))
      : null;

    const confidence = calcWastageConfidence(false, cuttingJobCount);

    const result = {
      wastage_percent: wastagePct,
      fabric_loss_estimate: fabricLoss,
      risk_level: risk,
      confidence,
      explanation: `${(fabric_type || 'cotton').charAt(0).toUpperCase() + (fabric_type || 'cotton').slice(1)} fabric at GSM ${gsm || 180} with ${design_complexity || 'medium'} design complexity — estimated ${wastagePct}% wastage. ${cuttingJobCount > 0 ? `Calibrated from ${cuttingJobCount} historical jobs.` : 'No historical data yet; using industry model.'}`,
      _source: 'rule_based',
    };

    await AIPredictionLog.create({
      type: 'wastage', jobId: req.body.job_id || null,
      jobNumber: req.body.job_number || null,
      input: req.body, output: result,
    }).catch(() => {});

    return res.json(result);
  }

  await AIPredictionLog.create({
    type: 'wastage', jobId: req.body.job_id || null,
    jobNumber: req.body.job_number || null,
    input: req.body, output: aiResult,
  }).catch(() => {});

  res.json(aiResult);
});

// POST /api/ai/predict/efficiency
router.post('/predict/efficiency', async (req, res) => {
  const aiResult = await callAI('post', '/predict/efficiency', req.body);

  if (!aiResult) {
    const { workers_count, target_per_hour, avg_experience_months, line_age_days, line_name } = req.body;
    const workersN = Number(workers_count) || 1;
    const targetN = Number(target_per_hour) || 60;
    const expN = Number(avg_experience_months) || 0;
    const ageN = Number(line_age_days) || 0;

    // Get actual production data for this line if available
    const lineQuery = line_name
      ? { lineName: line_name, createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }
      : { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } };
    const recentRecords = await HourlyProduction.find(lineQuery).lean();
    const recordCount = recentRecords.length;

    let effPct, confidence, explanation;

    if (recordCount >= 3) {
      // Use real production data
      const totalProduced = recentRecords.reduce((s, r) => s + (r.quantity || 0), 0);
      const avgHourly = totalProduced / recordCount;
      effPct = parseFloat(Math.min(150, (avgHourly / targetN) * 100).toFixed(1));
      confidence = calcEfficiencyConfidence(true, recordCount);
      explanation = `Based on ${recordCount} real production records${line_name ? ` for ${line_name}` : ''}: average ${avgHourly.toFixed(1)} units/hr vs target ${targetN}/hr = ${effPct}% efficiency.`;
    } else {
      // Rule-based model
      effPct = calcEfficiencyPct(workersN, targetN, expN, ageN);
      confidence = calcEfficiencyConfidence(false, 0);
      explanation = `${workersN} worker${workersN > 1 ? 's' : ''} with ${expN} months avg experience, line active ${ageN} days: predicted ${effPct}% efficiency. ${recordCount > 0 ? `${recordCount} production records available.` : 'No production records yet.'}`;
    }

    const predictedHourly = parseFloat((targetN * effPct / 100).toFixed(1));
    const dailyEst = Math.round(predictedHourly * 8);

    const result = {
      efficiency_percent: effPct,
      predicted_hourly_output: predictedHourly,
      daily_output_estimate: dailyEst,
      confidence,
      status: effStatus(effPct),
      explanation,
      _source: recordCount >= 3 ? 'real_production_data' : 'rule_based',
    };

    await AIPredictionLog.create({
      type: 'efficiency', jobId: req.body.job_id || null,
      jobNumber: req.body.job_number || null,
      input: req.body, output: result,
    }).catch(() => {});

    return res.json(result);
  }

  await AIPredictionLog.create({
    type: 'efficiency', jobId: req.body.job_id || null,
    jobNumber: req.body.job_number || null,
    input: req.body, output: aiResult,
  }).catch(() => {});

  res.json(aiResult);
});

// GET /api/ai/job/:jobId — full per-job AI summary
router.get('/job/:jobId', async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await ManufacturingJob.findById(jobId).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const [hourlyRecords, materialIssues, qcCheck, batches, lineAssignments, employees] = await Promise.all([
      HourlyProduction.find({ jobId }).lean(),
      MaterialIssue.find({ jobId }).populate('materialId', 'name unit unitPrice type').lean(),
      QcCheck.findOne({ jobId }).lean(),
      PackingBatch.find({ jobId }).lean(),
      JobLineAssignment.find({ jobId }).lean(),
      Employee.find().lean(),
    ]);

    // ── Production stats ──
    const totalProduced = hourlyRecords.reduce((s, r) => s + (r.quantity || 0), 0);
    const totalTarget = lineAssignments.reduce((s, la) => s + (la.assignedQuantity || 0), 0);

    // Efficiency: use actual vs target if target exists, else vs expected output
    let efficiencyPct = null;
    if (totalProduced > 0) {
      if (totalTarget > 0) {
        efficiencyPct = parseFloat(((totalProduced / totalTarget) * 100).toFixed(1));
      } else {
        // No target set; derive efficiency from production pace
        // Expected: 40 pcs/hr × records count
        const expectedOutput = hourlyRecords.length * 40;
        efficiencyPct = parseFloat(((totalProduced / expectedOutput) * 100).toFixed(1));
      }
    }

    // ── Wastage (actual if available, else rule-based) ──
    let wastagePct, wastageSource, fabricLoss;
    if (job.fabricUsedQty > 0) {
      wastagePct = parseFloat(((job.fabricWasteQty || 0) / job.fabricUsedQty * 100).toFixed(1));
      wastageSource = 'actual_cutting_record';
      fabricLoss = job.fabricWasteQty || 0;
    } else {
      wastagePct = calcWastagePct('cotton', 180, 'medium');
      wastageSource = 'rule_based_estimate';
      fabricLoss = parseFloat(((job.issuedFabricQuantity || 0) * wastagePct / 100).toFixed(2));
    }
    const wastageRiskLevel = wastageRisk(wastagePct);

    // ── Material cost ──
    const materialCost = materialIssues.reduce((s, mi) => {
      return s + ((mi.materialId?.unitPrice || 0) * mi.quantityIssued);
    }, 0);

    // ── QC stats ──
    const goodPcs = batches.filter(b => b.type === 'good').reduce((s, b) => s + b.quantity, 0);
    const damagePcs = batches.filter(b => b.type === 'damage').reduce((s, b) => s + b.quantity, 0);
    const totalQcPcs = goodPcs + damagePcs;
    const damageRate = totalQcPcs > 0 ? parseFloat((damagePcs / totalQcPcs * 100).toFixed(1)) : null;

    // ── Workers ──
    const workerIds = [...new Set(hourlyRecords.map(r => r.employeeId?.toString()).filter(Boolean))];
    const workerCount = workerIds.length || lineAssignments.reduce((s, la) => s + (la.workerCount || 0), 0) || 1;
    const daysSinceCreated = Math.max(1, Math.round((Date.now() - new Date(job.createdAt).getTime()) / 86400000));

    // ── AI confidence ──
    const cuttingJobCount = await ManufacturingJob.countDocuments({ fabricUsedQty: { $gt: 0 } });
    const wastageConfidence = calcWastageConfidence(job.fabricUsedQty > 0, cuttingJobCount);
    const efficiencyConfidence = calcEfficiencyConfidence(totalProduced > 0, hourlyRecords.length);

    // ── Efficiency status ──
    const effPctForStatus = efficiencyPct ?? calcEfficiencyPct(workerCount, 60, 12, daysSinceCreated);

    const avgHourly = hourlyRecords.length > 0 ? totalProduced / hourlyRecords.length : 0;
    const dailyEst = Math.round(avgHourly * 8);

    const responseData = {
      job_id: job._id.toString(),
      job_number: job.jobNumber,
      wastage: {
        wastage_percent: wastagePct,
        fabric_loss_estimate: fabricLoss,
        confidence: wastageConfidence,
        risk_level: wastageRiskLevel,
        explanation: job.fabricUsedQty > 0
          ? `Actual cutting data: ${job.fabricWasteQty ?? 0} wasted from ${job.fabricUsedQty} used = ${wastagePct}% wastage.`
          : `No cutting data yet. Estimated at ${wastagePct}% based on standard garment manufacturing model.`,
        _source: wastageSource,
      },
      efficiency: {
        efficiency_percent: efficiencyPct ?? effPctForStatus,
        predicted_hourly_output: parseFloat(avgHourly.toFixed(1)),
        daily_output_estimate: dailyEst,
        confidence: efficiencyConfidence,
        status: effStatus(efficiencyPct ?? effPctForStatus),
        explanation: totalProduced > 0
          ? `${hourlyRecords.length} production records: ${totalProduced} pcs produced${totalTarget > 0 ? ` vs target ${totalTarget} = ${efficiencyPct}% efficiency` : `, avg ${avgHourly.toFixed(1)} pcs/hr`}.`
          : `No production records for this job yet. Predicted based on ${workerCount} workers over ${daysSinceCreated} days.`,
        _source: totalProduced > 0 ? 'real_production_data' : 'rule_based',
      },
      material_cost: {
        total: parseFloat(materialCost.toFixed(2)),
        good_pcs: goodPcs,
        damage_pcs: damagePcs,
        damage_rate: damageRate,
        cost_per_good_piece: goodPcs > 0 ? parseFloat((materialCost / goodPcs).toFixed(2)) : null,
      },
      comparison: totalProduced > 0 && dailyEst > 0 ? {
        predicted_output: dailyEst,
        actual_output: totalProduced,
        variance: totalProduced - dailyEst,
        variance_pct: parseFloat(((totalProduced - dailyEst) / dailyEst * 100).toFixed(1)),
      } : null,
    };

    await AIPredictionLog.create({
      type: 'job_summary', jobId,
      jobNumber: job.jobNumber,
      input: { jobId, workerCount, totalProduced, totalTarget, wastagePct },
      output: responseData,
    }).catch(() => {});

    const suggestions = buildSuggestions({
      efficiencyPct: efficiencyPct,
      wastagePct,
      damageRate,
      lineEfficiency: [],
      totalProducedToday: totalProduced,
    });
    const alerts = buildAlerts({
      efficiencyPct,
      wastagePct,
      damageRate,
      lineEfficiency: [],
      totalProducedToday: totalProduced,
      jobNumber: job.jobNumber,
    });

    res.json({ ...responseData, suggestions, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const aiResult = await callAI('get', '/suggestions');
    if (aiResult) return res.json(aiResult);

    const m = await computeRealMetrics();
    const suggestions = buildSuggestions({
      efficiencyPct: m.efficiencyScore,
      wastagePct: m.avgWastagePct,
      damageRate: m.damageRate,
      lineEfficiency: m.lineEfficiency,
      totalProducedToday: m.totalProducedToday,
    });

    res.json({ suggestions, total: suggestions.length, _source: 'realtime_db' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/alerts
router.get('/alerts', async (req, res) => {
  try {
    const aiResult = await callAI('get', '/alerts');
    if (aiResult) return res.json(aiResult);

    const m = await computeRealMetrics();
    const alerts = buildAlerts({
      efficiencyPct: m.efficiencyScore,
      wastagePct: m.avgWastagePct,
      damageRate: m.damageRate,
      lineEfficiency: m.lineEfficiency,
      totalProducedToday: m.totalProducedToday,
    });

    res.json({ alerts, total: alerts.length, _source: 'realtime_db' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/alerts/:id/acknowledge
router.post('/alerts/:id/acknowledge', async (req, res) => {
  res.json({ ok: true });
});

// GET /api/ai/worker-performance
router.get('/worker-performance', async (req, res) => {
  try {
    const employees = await Employee.find().lean();
    if (employees.length === 0) return res.json({ workers: [], _source: 'realtime_db' });

    const workers = await Promise.all(employees.map(async (emp) => {
      const records = await HourlyProduction.find({ employeeId: emp._id }).lean();
      const totalQty = records.reduce((s, r) => s + (r.quantity || 0), 0);
      const avgHourly = records.length > 0 ? totalQty / records.length : 0;

      // Output efficiency: avg output vs 40 pcs/hr baseline
      const outputScore = records.length > 0
        ? Math.min(100, (avgHourly / 40) * 100) // 40 pcs/hr = 100%
        : 0;

      // QC pass rate from jobs this worker contributed to
      const jobIds = [...new Set(records.map(r => r.jobId?.toString()).filter(Boolean))];
      let qcPassRate = null;
      if (jobIds.length > 0) {
        const qcDocs = await QcCheck.find({ jobId: { $in: jobIds } }).lean();
        const totalGood = qcDocs.reduce((s, q) => s + (q.finishedGoodQty || 0), 0);
        const totalAll = qcDocs.reduce((s, q) => s + (q.finishedGoodQty || 0) + (q.damagedQty || 0), 0);
        qcPassRate = totalAll > 0
          ? parseFloat(((totalGood / totalAll) * 100).toFixed(1))
          : null;
      }

      // Composite AI score:
      // If we have both output and QC data: 60% output + 40% QC
      // If only output: 100% output score
      // If no records: score = 0
      let efficiencyScore;
      if (records.length === 0) {
        efficiencyScore = 0;
      } else if (qcPassRate !== null) {
        efficiencyScore = parseFloat((outputScore * 0.60 + qcPassRate * 0.40).toFixed(1));
      } else {
        efficiencyScore = parseFloat(outputScore.toFixed(1));
      }

      const bestFitRole = efficiencyScore >= 80 ? 'Senior Operator'
        : efficiencyScore >= 55 ? 'Operator'
        : records.length === 0 ? 'Not Assigned'
        : 'Trainee';

      const trend = records.length === 0 ? 'stable'
        : efficiencyScore >= 75 ? 'up'
        : efficiencyScore >= 50 ? 'stable'
        : 'down';

      return {
        _id: emp._id,
        name: emp.name || 'Unknown',
        role: emp.role,
        avg_hourly_output: parseFloat(avgHourly.toFixed(1)),
        total_production: totalQty,
        shifts_worked: records.length,
        qc_pass_rate: qcPassRate,           // null if no QC data
        efficiency_score: efficiencyScore,
        best_fit_role: bestFitRole,
        trend,
        _source: 'real_db',
      };
    }));

    workers.sort((a, b) => b.efficiency_score - a.efficiency_score);
    res.json({ workers, _source: 'realtime_db' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/prediction-history/:jobId
router.get('/prediction-history/:jobId', async (req, res) => {
  try {
    const logs = await AIPredictionLog.find({ jobId: req.params.jobId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
