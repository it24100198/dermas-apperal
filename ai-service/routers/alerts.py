"""
Alerts Router — threshold-based alert system.
"""
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()


@router.get("")
def get_alerts(job_id: Optional[str] = Query(None)):
    """Return active production alerts, optionally for a specific job."""

    # These would normally come from real-time DB data.
    # For demo, return realistic static alerts filtered by job if provided.
    alerts = [
        {
            "id": "alert_001",
            "severity": "critical",
            "type": "efficiency_drop",
            "title": "Critical Efficiency Drop",
            "message": "Line 4 dropped to 58% efficiency — 22% below target.",
            "line": "Line 4",
            "value": 58.0,
            "threshold": 70.0,
            "timestamp": "2026-04-01T14:30:00Z",
            "acknowledged": False,
            "color": "red",
            "icon": "bi-graph-down-arrow",
        },
        {
            "id": "alert_002",
            "severity": "warning",
            "type": "high_rejection",
            "title": "High QC Rejection Rate",
            "message": "QC rejection rate reached 12.4% (threshold: 5%). Check stitching quality.",
            "line": "Line 2",
            "value": 12.4,
            "threshold": 5.0,
            "timestamp": "2026-04-01T13:15:00Z",
            "acknowledged": False,
            "color": "yellow",
            "icon": "bi-clipboard2-x",
        },
        {
            "id": "alert_003",
            "severity": "warning",
            "type": "wastage_high",
            "title": "Fabric Wastage Above Threshold",
            "message": "Predicted wastage (9.2%) exceeds 8% limit for current job.",
            "value": 9.2,
            "threshold": 8.0,
            "timestamp": "2026-04-01T12:00:00Z",
            "acknowledged": False,
            "color": "yellow",
            "icon": "bi-exclamation-diamond",
        },
        {
            "id": "alert_004",
            "severity": "info",
            "type": "output_target",
            "title": "Daily Output Target Met",
            "message": "Line 3 exceeded the daily output target by 7%. Excellent performance!",
            "line": "Line 3",
            "value": 107.0,
            "threshold": 100.0,
            "timestamp": "2026-04-01T11:00:00Z",
            "acknowledged": True,
            "color": "green",
            "icon": "bi-check-circle",
        },
    ]

    if job_id:
        # In production, filter by actual job data
        return {"alerts": alerts, "total": len(alerts), "job_id": job_id}

    return {"alerts": alerts, "total": len(alerts)}


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    return {"success": True, "alert_id": alert_id, "acknowledged": True}
