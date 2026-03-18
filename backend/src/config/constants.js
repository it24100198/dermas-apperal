module.exports = {
    // User Roles
    USER_ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        HR: 'hr',
        ACCOUNTANT: 'accountant',
        EMPLOYEE: 'employee'
    },
    
    // Expense Status
    EXPENSE_STATUS: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
        CASH: 'cash',
        BANK_TRANSFER: 'bank_transfer',
        CREDIT_CARD: 'credit_card',
        CHEQUE: 'cheque'
    },
    
    // Recurring Frequency
    RECURRING_FREQUENCY: {
        MONTHLY: 'monthly',
        QUARTERLY: 'quarterly',
        YEARLY: 'yearly'
    },
    
    // Master Categories
    MASTER_CATEGORIES: [
        'Rent',
        'Electricity',
        'Salaries',
        'Maintenance'
    ],
    
    // Sub Categories
    SUB_CATEGORIES: {
        Maintenance: [
            'Machine Repair',
            'Vehicle Service',
            'Equipment Maintenance',
            'Building Maintenance'
        ]
    },
    
    // Departments
    DEPARTMENTS: [
        'Production',
        'HR',
        'Accounts',
        'Maintenance',
        'Administration'
    ]
};