"""
Smart Suggestions Router
Rule-based engine that generates actionable recommendations.
"""
from fastapi import APIRouter, Query
from typing import Optional
import random

router = APIRouter()

SUGGESTION_RULES = [
    {
        "id": "low_line2_efficiency",
        "condition": "efficiency < 70",
        "priority": "high",
        "icon": "bi-person-fill-gear",
        "title": "Reassign Experienced Worker",
        "message": "Line 2 efficiency is below 70%. Assign an experienced operator to boost output.",
        "action": "Reassign Worker",
        "color": "red",
    },
    {
        "id": "high_wastage_risk",
        "condition": "wastage > 8",
        "priority": "high",
        "icon": "bi-exclamation-triangle-fill",
        "title": "High Wastage Risk Detected",
        "message": "Predicted fabric wastage exceeds 8%. Review cutting patterns and reduce design complexity.",
        "action": "Review Cutting",
        "color": "red",
    },
    {
        "id": "reduce_batch_size",
        "condition": "batch_delay",
        "priority": "medium",
        "icon": "bi-layers-half",
        "title": "Reduce Batch Size",
        "message": "Large batch sizes are causing production delays. Consider splitting into smaller batches of 200-300 units.",
        "action": "Split Batch",
        "color": "yellow",
    },
    {
        "id": "line_rebalance",
        "condition": "uneven_load",
        "priority": "medium",
        "icon": "bi-distribute-horizontal",
        "title": "Rebalance Production Lines",
        "message": "Line 3 has 88% efficiency while Line 4 is at 65%. Redistribute workers for balanced output.",
        "action": "Rebalance Lines",
        "color": "yellow",
    },
    {
        "id": "good_performance",
        "condition": "efficiency > 85",
        "priority": "low",
        "icon": "bi-star-fill",
        "title": "Top Performance Detected",
        "message": "Line 3 is performing at 88%+ efficiency. Replicate this team configuration on other lines.",
        "action": "View Details",
        "color": "green",
    },
    {
        "id": "maintenance_due",
        "condition": "machine_age > 90",
        "priority": "medium",
        "icon": "bi-tools",
        "title": "Preventive Maintenance Due",
        "message": "Machines on Line 2 have been running for 90+ days without maintenance. Schedule downtime.",
        "action": "Schedule Maintenance",
        "color": "yellow",
    },
]


@router.get("")
def get_suggestions(
    job_id: Optional[str] = Query(None),
    efficiency: Optional[float] = Query(None),
    wastage: Optional[float] = Query(None),
):
    """Return rule-based suggestions, optionally filtered for a specific job."""
    results = []

    for rule in SUGGESTION_RULES:
        include = True

        # Filter by efficiency threshold
        if efficiency is not None:
            if rule["condition"] == "efficiency < 70" and efficiency >= 70:
                include = False
            if rule["condition"] == "efficiency > 85" and efficiency < 85:
                include = False
        else:
            # Use defaults for demo
            include = True

        # Filter by wastage threshold
        if wastage is not None:
            if rule["condition"] == "wastage > 8" and wastage <= 8:
                include = False

        if include:
            suggestion = dict(rule)
            if job_id:
                suggestion["job_id"] = job_id
            results.append(suggestion)

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: priority_order.get(x["priority"], 3))

    return {"suggestions": results, "total": len(results)}
