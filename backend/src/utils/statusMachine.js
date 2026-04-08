/**
 * Manufacturing Job Status Machine
 * Allowed transitions only.
 */
export const JOB_STATUS = {
  FABRIC_ISSUED: 'FABRIC_ISSUED',
  SENT_TO_CUTTING: 'SENT_TO_CUTTING',
  CUTTING_COMPLETED: 'CUTTING_COMPLETED',
  LINE_ASSIGNED: 'LINE_ASSIGNED',
  LINE_IN_PROGRESS: 'LINE_IN_PROGRESS',
  LINE_COMPLETED: 'LINE_COMPLETED',
  WASHING_OUT: 'WASHING_OUT',
  AFTER_WASH_RECEIVED: 'AFTER_WASH_RECEIVED',
  PACKING_COMPLETED: 'PACKING_COMPLETED',
  WAREHOUSE_RECEIVED: 'WAREHOUSE_RECEIVED',
};

const ALLOWED_TRANSITIONS = {
  [JOB_STATUS.FABRIC_ISSUED]: [JOB_STATUS.SENT_TO_CUTTING],
  [JOB_STATUS.SENT_TO_CUTTING]: [JOB_STATUS.CUTTING_COMPLETED],
  [JOB_STATUS.CUTTING_COMPLETED]: [JOB_STATUS.LINE_ASSIGNED],
  [JOB_STATUS.LINE_ASSIGNED]: [JOB_STATUS.LINE_IN_PROGRESS],
  [JOB_STATUS.LINE_IN_PROGRESS]: [JOB_STATUS.LINE_COMPLETED],
  [JOB_STATUS.LINE_COMPLETED]: [JOB_STATUS.WASHING_OUT],
  [JOB_STATUS.WASHING_OUT]: [JOB_STATUS.WASHING_OUT], // multiple transfers allowed; job stays WASHING_OUT
  [JOB_STATUS.AFTER_WASH_RECEIVED]: [JOB_STATUS.PACKING_COMPLETED],
  [JOB_STATUS.PACKING_COMPLETED]: [JOB_STATUS.WAREHOUSE_RECEIVED],
  [JOB_STATUS.WAREHOUSE_RECEIVED]: [],
};

/**
 * @param {string} current
 * @param {string} next
 * @throws Error if transition not allowed
 */
export function assertTransition(current, next) {
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed) throw new Error(`Unknown status: ${current}`);
  if (!allowed.includes(next)) {
    throw new Error(`Invalid transition: ${current} → ${next}. Allowed: ${allowed.join(', ')}`);
  }
}

export const WASHING_TRANSFER_STATUS = {
  PENDING: 'pending',
  RECEIVED: 'received',
  WASHING_COMPLETED: 'washing_completed',
  RETURNED: 'returned',
};

export const PACKING_BATCH_STATUS = {
  PACKING: 'packing',
  SENT_TO_FINAL_CHECK: 'sent_to_final_check',
  COMPLETED: 'completed',
};

export const PACKING_BATCH_TYPE = {
  GOOD: 'good',
  DAMAGE: 'damage',
};
