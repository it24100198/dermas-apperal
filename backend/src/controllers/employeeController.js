const Employee = require('../models/Employee');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { USER_ROLES } = require('../config/constants');
const mongoose = require('mongoose');

exports.createEmployee = catchAsync(async (req, res, next) => {
	const { userId, employeeCode, email, firstName, lastName, department } = req.body;

	if (!employeeCode || !email || !firstName || !lastName || !department) {
		return next(new AppError('employeeCode, firstName, lastName, email, and department are required', 400));
	}

	const normalizedEmail = email.toLowerCase();
	let linkedUser = null;

	// If a valid userId is provided, try using it first.
	if (userId && mongoose.Types.ObjectId.isValid(userId)) {
		linkedUser = await User.findById(userId);
	}

	// Fallback: auto-link by employee email.
	if (!linkedUser) {
		linkedUser = await User.findOne({ email: normalizedEmail });
	}

	// Auto-create linked user if none exists.
	if (!linkedUser) {
		linkedUser = await User.create({
			name: `${firstName} ${lastName}`.trim(),
			email: normalizedEmail,
			password: process.env.DEFAULT_EMPLOYEE_PASSWORD || 'Employee123!',
			role: USER_ROLES.EMPLOYEE,
			department
		});
	}

	if (!linkedUser) {
		return next(new AppError('Unable to resolve linked user for employee', 400));
	}

	const duplicate = await Employee.findOne({
		$or: [{ userId: linkedUser._id }, { employeeCode }, { email: normalizedEmail }]
	});

	if (duplicate) {
		return next(new AppError('Employee already exists with this user, code, or email', 400));
	}

	const employee = await Employee.create({
		...req.body,
		userId: linkedUser._id,
		email: normalizedEmail,
		createdBy: req.user.id
	});

	await User.findByIdAndUpdate(linkedUser._id, {
		employeeId: employee._id,
		department: employee.department
	});

	await employee.populate([
		{ path: 'userId', select: 'name email role department' },
		{ path: 'createdBy', select: 'name email role' }
	]);

	res.status(201).json({
		status: 'success',
		data: {
			employee
		}
	});
});

exports.getAllEmployees = catchAsync(async (req, res) => {
	const {
		page = 1,
		limit = 20,
		sort = '-createdAt',
		department,
		status,
		search
	} = req.query;

	const filter = {};
	if (department) filter.department = department;
	if (status) filter.status = status;

	if (search) {
		filter.$or = [
			{ firstName: { $regex: search, $options: 'i' } },
			{ lastName: { $regex: search, $options: 'i' } },
			{ employeeCode: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } }
		];
	}

	const pageNum = Number(page) > 0 ? Number(page) : 1;
	const limitNum = Number(limit) > 0 ? Number(limit) : 20;
	const skip = (pageNum - 1) * limitNum;

	const [employees, totalCount] = await Promise.all([
		Employee.find(filter)
			.sort(sort)
			.skip(skip)
			.limit(limitNum)
			.populate('userId', 'name email role department')
			.populate('createdBy', 'name email role'),
		Employee.countDocuments(filter)
	]);

	res.status(200).json({
		status: 'success',
		results: employees.length,
		totalCount,
		totalPages: Math.ceil(totalCount / limitNum),
		currentPage: pageNum,
		data: {
			employees
		}
	});
});

exports.getEmployee = catchAsync(async (req, res, next) => {
	const employee = await Employee.findById(req.params.id)
		.populate('userId', 'name email role department')
		.populate('createdBy', 'name email role');

	if (!employee) {
		return next(new AppError('Employee not found', 404));
	}

	if (req.user.role === USER_ROLES.EMPLOYEE && employee.userId?._id?.toString() !== req.user.id) {
		return next(new AppError('You are not allowed to view this employee profile', 403));
	}

	res.status(200).json({
		status: 'success',
		data: {
			employee
		}
	});
});

exports.updateEmployee = catchAsync(async (req, res, next) => {
	const employee = await Employee.findById(req.params.id);

	if (!employee) {
		return next(new AppError('Employee not found', 404));
	}

	if (req.body.userId && req.body.userId.toString() !== employee.userId.toString()) {
		const otherEmployee = await Employee.findOne({ userId: req.body.userId });
		if (otherEmployee) {
			return next(new AppError('Selected user is already linked to another employee', 400));
		}

		const linkedUser = await User.findById(req.body.userId);
		if (!linkedUser) {
			return next(new AppError('Linked user not found', 404));
		}
	}

	if (req.body.email) {
		const duplicateEmail = await Employee.findOne({
			_id: { $ne: req.params.id },
			email: req.body.email.toLowerCase()
		});
		if (duplicateEmail) {
			return next(new AppError('Another employee already uses this email', 400));
		}
		req.body.email = req.body.email.toLowerCase();
	}

	const updatedEmployee = await Employee.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	)
		.populate('userId', 'name email role department')
		.populate('createdBy', 'name email role');

	if (updatedEmployee?.userId) {
		await User.findByIdAndUpdate(updatedEmployee.userId._id, {
			department: updatedEmployee.department
		});
	}

	res.status(200).json({
		status: 'success',
		data: {
			employee: updatedEmployee
		}
	});
});

exports.updateEmployeeStatus = catchAsync(async (req, res, next) => {
	const allowedStatuses = ['active', 'inactive', 'on_leave', 'terminated'];
	const { status } = req.body;

	if (!allowedStatuses.includes(status)) {
		return next(new AppError('Invalid employee status', 400));
	}

	const employee = await Employee.findByIdAndUpdate(
		req.params.id,
		{ status },
		{ new: true, runValidators: true }
	)
		.populate('userId', 'name email role department')
		.populate('createdBy', 'name email role');

	if (!employee) {
		return next(new AppError('Employee not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			employee
		}
	});
});

exports.deleteEmployee = catchAsync(async (req, res, next) => {
	const employee = await Employee.findById(req.params.id);

	if (!employee) {
		return next(new AppError('Employee not found', 404));
	}

	const shouldHardDelete = req.query.hardDelete === 'true' && req.user.role === USER_ROLES.ADMIN;

	if (shouldHardDelete) {
		await Employee.findByIdAndDelete(req.params.id);
		await User.findByIdAndUpdate(employee.userId, { $unset: { employeeId: 1 } });

		return res.status(204).json({
			status: 'success',
			data: null
		});
	}

	employee.status = 'terminated';
	await employee.save({ validateBeforeSave: false });

	res.status(200).json({
		status: 'success',
		message: 'Employee marked as terminated'
	});
});

exports.getEmployeeStats = catchAsync(async (req, res) => {
	const [summary, departmentBreakdown, statusBreakdown] = await Promise.all([
		Employee.aggregate([
			{
				$group: {
					_id: null,
					totalEmployees: { $sum: 1 },
					activeEmployees: {
						$sum: {
							$cond: [{ $eq: ['$status', 'active'] }, 1, 0]
						}
					},
					totalPayroll: {
						$sum: {
							$cond: [
								{ $in: ['$status', ['active', 'on_leave']] },
								'$salary',
								0
							]
						}
					}
				}
			}
		]),
		Employee.aggregate([
			{
				$group: {
					_id: '$department',
					employeeCount: { $sum: 1 },
					payroll: { $sum: '$salary' }
				}
			},
			{ $sort: { payroll: -1 } }
		]),
		Employee.aggregate([
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		])
	]);

	res.status(200).json({
		status: 'success',
		data: {
			summary: summary[0] || {
				totalEmployees: 0,
				activeEmployees: 0,
				totalPayroll: 0
			},
			departmentBreakdown,
			statusBreakdown
		}
	});
});
