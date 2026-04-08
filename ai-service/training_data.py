"""
Synthetic training data for the AI models.
These realistic factory averages are used when no historical DB data is available.
As real data accumulates, the models retrain on actual records.
"""

import numpy as np

# ─────────────────────────────────────────────
# WASTAGE PREDICTION TRAINING DATA
# Features: [gsm, design_complexity_encoded, fabric_type_encoded]
# Target: wastage_percent
#
# design_complexity: Low=0, Medium=1, High=2
# fabric_type: Cotton=0, Polyester=1, Denim=2, Silk=3, Blended=4
# ─────────────────────────────────────────────
WASTAGE_X = np.array([
    [120, 0, 0], [130, 0, 0], [140, 0, 0], [160, 0, 0], [180, 1, 0],
    [150, 1, 0], [200, 1, 0], [220, 2, 0], [240, 2, 0], [260, 2, 0],
    [120, 0, 1], [130, 0, 1], [160, 1, 1], [180, 1, 1], [200, 2, 1],
    [220, 2, 1], [250, 2, 1], [180, 0, 2], [200, 1, 2], [240, 1, 2],
    [280, 2, 2], [300, 2, 2], [320, 2, 2], [100, 0, 3], [110, 1, 3],
    [120, 2, 3], [150, 0, 4], [170, 1, 4], [190, 2, 4], [210, 2, 4],
    [140, 0, 0], [155, 1, 1], [175, 1, 2], [195, 2, 3], [215, 2, 4],
])

WASTAGE_Y = np.array([
    4.2, 4.5, 4.8, 5.0, 6.1,
    5.8, 6.5, 8.2, 8.9, 9.5,
    3.8, 4.0, 5.2, 5.9, 7.1,
    7.8, 8.5, 6.5, 7.2, 7.8,
    9.2, 9.8, 10.5, 5.5, 6.8,
    8.1, 4.9, 6.2, 7.5, 8.3,
    4.6, 5.4, 7.0, 7.9, 7.2,
])

# ─────────────────────────────────────────────
# EFFICIENCY PREDICTION TRAINING DATA
# Features: [workers_count, target_per_hour, avg_experience_months, line_age_days]
# Target: efficiency_percent (0–100)
# ─────────────────────────────────────────────
EFFICIENCY_X = np.array([
    [10, 50, 6,  30],  [12, 60, 12, 45],  [15, 80, 18, 60],  [8,  40, 3,  15],
    [20, 100, 24, 90], [18, 90, 20, 80],  [10, 55, 8,  35],  [14, 70, 15, 55],
    [16, 85, 22, 75],  [9,  45, 5,  20],  [11, 58, 10, 40],  [13, 65, 14, 50],
    [17, 88, 21, 78],  [19, 95, 23, 85],  [7,  35, 2,  10],  [10, 52, 7,  28],
    [15, 75, 16, 62],  [12, 62, 13, 48],  [20, 98, 26, 95],  [8,  42, 4,  18],
])

EFFICIENCY_Y = np.array([
    68.5, 72.3, 81.2, 55.4,
    88.7, 85.1, 70.2, 76.8,
    83.4, 60.1, 71.5, 74.9,
    84.7, 87.3, 48.2, 69.3,
    79.6, 73.2, 90.1, 57.8,
])

# ─────────────────────────────────────────────
# WORKER PERFORMANCE BASELINE DATA
# Fields: avg_hourly_output, qc_pass_rate, days_worked
# Performance score = weighted formula
# ─────────────────────────────────────────────
SAMPLE_WORKER_DATA = [
    {"name": "Worker A", "avg_output": 52, "qc_pass_rate": 96.5, "days_worked": 25},
    {"name": "Worker B", "avg_output": 45, "qc_pass_rate": 91.2, "days_worked": 20},
    {"name": "Worker C", "avg_output": 61, "qc_pass_rate": 98.1, "days_worked": 28},
    {"name": "Worker D", "avg_output": 38, "qc_pass_rate": 85.4, "days_worked": 18},
    {"name": "Worker E", "avg_output": 58, "qc_pass_rate": 94.7, "days_worked": 26},
]
