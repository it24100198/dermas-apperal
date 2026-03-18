const AppError = require('../utils/AppError');
const { USER_ROLES } = require('../config/constants');

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

// Specific role checks
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== USER_ROLES.ADMIN) {
        return next(new AppError('Admin access required', 403));
    }
    next();
};

exports.isManager = (req, res, next) => {
    if (req.user.role !== USER_ROLES.MANAGER && req.user.role !== USER_ROLES.ADMIN) {
        return next(new AppError('Manager or Admin access required', 403));
    }
    next();
};

exports.isAdminOrManager = exports.isManager;

exports.isHR = (req, res, next) => {
    if (req.user.role !== USER_ROLES.HR && req.user.role !== USER_ROLES.ADMIN) {
        return next(new AppError('HR or Admin access required', 403));
    }
    next();
};

exports.isAccountant = (req, res, next) => {
    if (req.user.role !== USER_ROLES.ACCOUNTANT && req.user.role !== USER_ROLES.ADMIN) {
        return next(new AppError('Accountant or Admin access required', 403));
    }
    next();
};

exports.isEmployee = (req, res, next) => {
    if (req.user.role !== USER_ROLES.EMPLOYEE) {
        return next(new AppError('Employee access required', 403));
    }
    next();
};

// Check if user can approve expenses/reimbursements
exports.canApprove = (req, res, next) => {
    if (req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.MANAGER) {
        return next(new AppError('Only Admin and Manager can approve', 403));
    }
    next();
};