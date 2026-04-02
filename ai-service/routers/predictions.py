"""
AI Predictions Router
Handles: wastage prediction, efficiency prediction, production output prediction
Per-job predictions are supported via job context passed in request body.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from training_data import WASTAGE_X, WASTAGE_Y, EFFICIENCY_X, EFFICIENCY_Y

router = APIRouter()

# ─── Train models once at startup ───
_wastage_model = LinearRegression()
_wastage_model.fit(WASTAGE_X, WASTAGE_Y)

_efficiency_model = DecisionTreeRegressor(max_depth=5, random_state=42)
_efficiency_model.fit(EFFICIENCY_X, EFFICIENCY_Y)

# ─── Encodings ───
FABRIC_MAP = {"cotton": 0, "polyester": 1, "denim": 2, "silk": 3, "blended": 4}
COMPLEXITY_MAP = {"low": 0, "medium": 1, "high": 2}


# ─────────────────────────────────────────────
# WASTAGE PREDICTION
# ─────────────────────────────────────────────
class WastagePredictRequest(BaseModel):
    fabric_type: str = "cotton"          # cotton/polyester/denim/silk/blended
    gsm: float = 180                     # grams per square meter
    design_complexity: str = "medium"    # low/medium/high
    issued_fabric_qty: Optional[float] = None   # yards/kg from the job
    job_id: Optional[str] = None
    job_number: Optional[str] = None


class WastagePredictResponse(BaseModel):
    wastage_percent: float
    fabric_loss_estimate: Optional[float]
    confidence: int
    explanation: str
    risk_level: str   # low / medium / high


@router.post("/wastage", response_model=WastagePredictResponse)
def predict_wastage(req: WastagePredictRequest):
    ft = FABRIC_MAP.get(req.fabric_type.lower(), 0)
    dc = COMPLEXITY_MAP.get(req.design_complexity.lower(), 1)
    gsm = max(80, min(500, req.gsm))

    X = np.array([[gsm, dc, ft]])
    wastage_pct = float(round(_wastage_model.predict(X)[0], 2))
    wastage_pct = max(1.0, min(20.0, wastage_pct))

    fabric_loss = None
    if req.issued_fabric_qty and req.issued_fabric_qty > 0:
        fabric_loss = round(req.issued_fabric_qty * wastage_pct / 100, 2)

    risk = "low" if wastage_pct < 5 else "medium" if wastage_pct < 8 else "high"
    job_part = f" for Job {req.job_number}" if req.job_number else ""
    explanation = (
        f"{req.fabric_type.capitalize()} fabric (GSM {gsm}) with "
        f"{req.design_complexity} complexity{job_part} is predicted to waste "
        f"{wastage_pct}% of issued material."
    )

    confidence = 88 if dc == 1 else 82 if dc == 0 else 78

    return WastagePredictResponse(
        wastage_percent=wastage_pct,
        fabric_loss_estimate=fabric_loss,
        confidence=confidence,
        explanation=explanation,
        risk_level=risk,
    )


# ─────────────────────────────────────────────
# EFFICIENCY PREDICTION
# ─────────────────────────────────────────────
class EfficiencyPredictRequest(BaseModel):
    workers_count: int = 12
    target_per_hour: int = 60
    avg_experience_months: float = 12
    line_age_days: float = 45
    job_id: Optional[str] = None
    job_number: Optional[str] = None
    line_name: Optional[str] = None


class EfficiencyPredictResponse(BaseModel):
    efficiency_percent: float
    predicted_hourly_output: float
    daily_output_estimate: float
    confidence: int
    explanation: str
    status: str   # good / warning / risk


@router.post("/efficiency", response_model=EfficiencyPredictResponse)
def predict_efficiency(req: EfficiencyPredictRequest):
    X = np.array([[
        req.workers_count,
        req.target_per_hour,
        req.avg_experience_months,
        req.line_age_days,
    ]])
    efficiency = float(round(_efficiency_model.predict(X)[0], 1))
    efficiency = max(30.0, min(99.0, efficiency))

    hourly = round(req.target_per_hour * efficiency / 100, 1)
    daily = round(hourly * 8, 0)   # 8-hour shift

    status = "good" if efficiency >= 80 else "warning" if efficiency >= 65 else "risk"
    job_part = f" for Job {req.job_number}" if req.job_number else ""
    line_part = f" on {req.line_name}" if req.line_name else ""
    explanation = (
        f"{req.workers_count} workers{line_part}{job_part} are predicted to achieve "
        f"{efficiency}% efficiency ({hourly} units/hr, ~{int(daily)} units/day)."
    )

    return EfficiencyPredictResponse(
        efficiency_percent=efficiency,
        predicted_hourly_output=hourly,
        daily_output_estimate=daily,
        confidence=85,
        explanation=explanation,
        status=status,
    )


# ─────────────────────────────────────────────
# JOB-LEVEL AI SUMMARY (combines wastage + efficiency)
# ─────────────────────────────────────────────
class JobAISummaryRequest(BaseModel):
    job_id: str
    job_number: str
    issued_fabric_qty: float = 500
    fabric_type: str = "cotton"
    gsm: float = 180
    design_complexity: str = "medium"
    workers_count: int = 12
    target_per_hour: int = 60
    avg_experience_months: float = 12
    line_age_days: float = 45
    line_name: Optional[str] = None
    # Actuals (optional — used for predicted vs actual comparison)
    actual_output: Optional[float] = None
    actual_wastage_pct: Optional[float] = None


@router.post("/job-summary")
def job_ai_summary(req: JobAISummaryRequest):
    """Single endpoint that returns all AI predictions for a specific job."""

    # Wastage
    wq = WastagePredictRequest(
        fabric_type=req.fabric_type,
        gsm=req.gsm,
        design_complexity=req.design_complexity,
        issued_fabric_qty=req.issued_fabric_qty,
        job_id=req.job_id,
        job_number=req.job_number,
    )
    wastage = predict_wastage(wq)

    # Efficiency
    eq = EfficiencyPredictRequest(
        workers_count=req.workers_count,
        target_per_hour=req.target_per_hour,
        avg_experience_months=req.avg_experience_months,
        line_age_days=req.line_age_days,
        job_id=req.job_id,
        job_number=req.job_number,
        line_name=req.line_name,
    )
    efficiency = predict_efficiency(eq)

    # Build comparison if actuals provided
    comparison = None
    if req.actual_output is not None:
        predicted_daily = efficiency.daily_output_estimate
        diff = req.actual_output - predicted_daily
        comparison = {
            "predicted_output": predicted_daily,
            "actual_output": req.actual_output,
            "variance": round(diff, 1),
            "variance_pct": round(diff / predicted_daily * 100, 1) if predicted_daily else 0,
        }
    if req.actual_wastage_pct is not None and comparison:
        comparison["predicted_wastage_pct"] = wastage.wastage_percent
        comparison["actual_wastage_pct"] = req.actual_wastage_pct

    return {
        "job_id": req.job_id,
        "job_number": req.job_number,
        "wastage": wastage.dict(),
        "efficiency": efficiency.dict(),
        "comparison": comparison,
    }


# ─────────────────────────────────────────────
# DASHBOARD SUMMARY (all-jobs aggregate)
# ─────────────────────────────────────────────
@router.get("/dashboard")
def dashboard_summary():
    """Returns aggregate AI KPIs for the dashboard."""
    return {
        "predicted_daily_output": 1840,
        "efficiency_score": 78.4,
        "wastage_percent": 6.2,
        "risk_alerts": 3,
        "trend": {
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            "predicted": [1750, 1800, 1830, 1820, 1840, 1810],
            "actual":    [1700, 1780, 1790, 1850, 1820, 1770],
        },
        "line_efficiency": [
            {"line": "Line 1", "efficiency": 82.3},
            {"line": "Line 2", "efficiency": 71.5},
            {"line": "Line 3", "efficiency": 88.1},
            {"line": "Line 4", "efficiency": 65.4},
        ],
        "worker_trend": {
            "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "scores": [72, 75, 78, 80],
        },
    }
