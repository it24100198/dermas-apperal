export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  HR: 'hr',
  ACCOUNTANT: 'accountant',
  EMPLOYEE: 'employee',
}

export const EXPENSE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  CHEQUE: 'cheque',
}

export const RECURRING_FREQUENCY = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
}

export const DEPARTMENTS = [
  'Production',
  'HR',
  'Accounts',
  'Maintenance',
  'Administration',
]

export const MASTER_CATEGORIES = [
  'Rent',
  'Electricity',
  'Salaries',
  'Maintenance',
]

export const REIMBURSEMENT_CATEGORIES = [
  'travel',
  'meals',
  'field_expenses',
  'office_supplies',
  'other'
]

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.HR]: 'HR',
  [USER_ROLES.ACCOUNTANT]: 'Accountant',
  [USER_ROLES.EMPLOYEE]: 'Employee'
}