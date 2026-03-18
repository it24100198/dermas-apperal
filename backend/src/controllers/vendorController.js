const Vendor = require('../models/Vendor');
const Expense = require('../models/Expense');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	return value === 'true' || value === true;
};

exports.createVendor = catchAsync(async (req, res, next) => {
	if (!req.body.name || !req.body.type || !req.body.phone) {
		return next(new AppError('Vendor name, type, and phone are required', 400));
	}

	const vendor = await Vendor.create({
		...req.body,
		createdBy: req.user.id
	});

	await vendor.populate('createdBy', 'name email role');

	res.status(201).json({
		status: 'success',
		data: {
			vendor
		}
	});
});

exports.getAllVendors = catchAsync(async (req, res) => {
	const {
		page = 1,
		limit = 20,
		sort = '-createdAt',
		type,
		isActive,
		search
	} = req.query;

	const filter = {};
	if (type) filter.type = type;

	const parsedIsActive = parseBoolean(isActive);
	if (parsedIsActive !== undefined) {
		filter.isActive = parsedIsActive;
	}

	if (search) {
		filter.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } },
			{ phone: { $regex: search, $options: 'i' } },
			{ contactPerson: { $regex: search, $options: 'i' } }
		];
	}

	const pageNum = Number(page) > 0 ? Number(page) : 1;
	const limitNum = Number(limit) > 0 ? Number(limit) : 20;
	const skip = (pageNum - 1) * limitNum;

	const [vendors, totalCount] = await Promise.all([
		Vendor.find(filter)
			.sort(sort)
			.skip(skip)
			.limit(limitNum)
			.populate('createdBy', 'name email role'),
		Vendor.countDocuments(filter)
	]);

	res.status(200).json({
		status: 'success',
		results: vendors.length,
		totalCount,
		totalPages: Math.ceil(totalCount / limitNum),
		currentPage: pageNum,
		data: {
			vendors
		}
	});
});

exports.getVendor = catchAsync(async (req, res, next) => {
	const vendor = await Vendor.findById(req.params.id)
		.populate('createdBy', 'name email role');

	if (!vendor) {
		return next(new AppError('Vendor not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			vendor
		}
	});
});

exports.updateVendor = catchAsync(async (req, res, next) => {
	const vendor = await Vendor.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	).populate('createdBy', 'name email role');

	if (!vendor) {
		return next(new AppError('Vendor not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			vendor
		}
	});
});

exports.deleteVendor = catchAsync(async (req, res, next) => {
	const vendor = await Vendor.findById(req.params.id);

	if (!vendor) {
		return next(new AppError('Vendor not found', 404));
	}

	const linkedExpenseCount = await Expense.countDocuments({ vendor: vendor._id });

	if (linkedExpenseCount > 0) {
		vendor.isActive = false;
		await vendor.save({ validateBeforeSave: false });

		return res.status(200).json({
			status: 'success',
			message: 'Vendor is linked to expenses and has been deactivated instead of deleted'
		});
	}

	await Vendor.findByIdAndDelete(req.params.id);

	res.status(204).json({
		status: 'success',
		data: null
	});
});

exports.getVendorStats = catchAsync(async (req, res) => {
	const [summary, typeBreakdown] = await Promise.all([
		Vendor.aggregate([
			{
				$group: {
					_id: null,
					totalVendors: { $sum: 1 },
					activeVendors: {
						$sum: {
							$cond: [{ $eq: ['$isActive', true] }, 1, 0]
						}
					}
				}
			}
		]),
		Vendor.aggregate([
			{
				$group: {
					_id: '$type',
					count: { $sum: 1 }
				}
			},
			{ $sort: { count: -1 } }
		])
	]);

	res.status(200).json({
		status: 'success',
		data: {
			summary: summary[0] || { totalVendors: 0, activeVendors: 0 },
			typeBreakdown
		}
	});
});
