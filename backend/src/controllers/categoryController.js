const ExpenseCategory = require('../models/ExpenseCategory');
const Expense = require('../models/Expense');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { MASTER_CATEGORIES, SUB_CATEGORIES } = require('../config/constants');

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	return value === 'true' || value === true;
};

exports.createCategory = catchAsync(async (req, res, next) => {
	const { name, type, parentCategory } = req.body;

	if (!name || !type) {
		return next(new AppError('Category name and type are required', 400));
	}

	const existingCategory = await ExpenseCategory.findOne({
		name: { $regex: `^${name.trim()}$`, $options: 'i' }
	});

	if (existingCategory) {
		return next(new AppError('Category with this name already exists', 400));
	}

	if (type === 'sub') {
		if (!parentCategory) {
			return next(new AppError('Sub category must include parentCategory', 400));
		}

		const parent = await ExpenseCategory.findById(parentCategory);
		if (!parent || parent.type !== 'master') {
			return next(new AppError('Parent category must be an existing master category', 400));
		}
	}

	const category = await ExpenseCategory.create({
		...req.body,
		name: name.trim(),
		createdBy: req.user.id
	});

	await category.populate([
		{ path: 'parentCategory', select: 'name type' },
		{ path: 'createdBy', select: 'name email role' }
	]);

	res.status(201).json({
		status: 'success',
		data: {
			category
		}
	});
});

exports.getAllCategories = catchAsync(async (req, res) => {
	const {
		page = 1,
		limit = 20,
		sort = 'name',
		type,
		parentCategory,
		isActive,
		search
	} = req.query;

	const filter = {};

	if (type) filter.type = type;
	if (parentCategory) filter.parentCategory = parentCategory;

	const parsedIsActive = parseBoolean(isActive);
	if (parsedIsActive !== undefined) {
		filter.isActive = parsedIsActive;
	}

	if (search) {
		filter.name = { $regex: search, $options: 'i' };
	}

	const pageNum = Number(page) > 0 ? Number(page) : 1;
	const limitNum = Number(limit) > 0 ? Number(limit) : 20;
	const skip = (pageNum - 1) * limitNum;

	const [categories, totalCount] = await Promise.all([
		ExpenseCategory.find(filter)
			.sort(sort)
			.skip(skip)
			.limit(limitNum)
			.populate('parentCategory', 'name type')
			.populate('createdBy', 'name email role'),
		ExpenseCategory.countDocuments(filter)
	]);

	res.status(200).json({
		status: 'success',
		results: categories.length,
		totalCount,
		totalPages: Math.ceil(totalCount / limitNum),
		currentPage: pageNum,
		data: {
			categories
		}
	});
});

exports.getCategoryTree = catchAsync(async (req, res) => {
	const categories = await ExpenseCategory.find({ isActive: true })
		.sort({ name: 1 })
		.lean();

	const masters = categories.filter((item) => item.type === 'master');
	const subs = categories.filter((item) => item.type === 'sub');

	const tree = masters.map((master) => ({
		...master,
		subCategories: subs.filter(
			(sub) => sub.parentCategory && sub.parentCategory.toString() === master._id.toString()
		)
	}));

	res.status(200).json({
		status: 'success',
		results: tree.length,
		data: {
			categories: tree
		}
	});
});

exports.getCategory = catchAsync(async (req, res, next) => {
	const category = await ExpenseCategory.findById(req.params.id)
		.populate('parentCategory', 'name type')
		.populate('createdBy', 'name email role');

	if (!category) {
		return next(new AppError('Category not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			category
		}
	});
});

exports.updateCategory = catchAsync(async (req, res, next) => {
	const category = await ExpenseCategory.findById(req.params.id);

	if (!category) {
		return next(new AppError('Category not found', 404));
	}

	if (req.body.name) {
		const duplicate = await ExpenseCategory.findOne({
			_id: { $ne: req.params.id },
			name: { $regex: `^${req.body.name.trim()}$`, $options: 'i' }
		});

		if (duplicate) {
			return next(new AppError('Another category with this name already exists', 400));
		}
	}

	if ((req.body.type === 'sub' || category.type === 'sub') && req.body.parentCategory) {
		const parent = await ExpenseCategory.findById(req.body.parentCategory);
		if (!parent || parent.type !== 'master') {
			return next(new AppError('Parent category must be an existing master category', 400));
		}
	}

	const updatedCategory = await ExpenseCategory.findByIdAndUpdate(
		req.params.id,
		req.body,
		{
			new: true,
			runValidators: true
		}
	)
		.populate('parentCategory', 'name type')
		.populate('createdBy', 'name email role');

	res.status(200).json({
		status: 'success',
		data: {
			category: updatedCategory
		}
	});
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
	const category = await ExpenseCategory.findById(req.params.id);

	if (!category) {
		return next(new AppError('Category not found', 404));
	}

	if (category.type === 'master') {
		const childCount = await ExpenseCategory.countDocuments({
			parentCategory: category._id,
			isActive: true
		});

		if (childCount > 0) {
			return next(new AppError('Deactivate or move sub categories before deleting this master category', 400));
		}
	}

	const linkedExpenseCount = await Expense.countDocuments({
		$or: [{ category: category._id }, { subCategory: category._id }]
	});

	if (linkedExpenseCount > 0) {
		category.isActive = false;
		await category.save({ validateBeforeSave: false });

		return res.status(200).json({
			status: 'success',
			message: 'Category is linked to expenses and has been deactivated instead of deleted'
		});
	}

	await ExpenseCategory.findByIdAndDelete(req.params.id);

	res.status(204).json({
		status: 'success',
		data: null
	});
});

exports.seedDefaultCategories = catchAsync(async (req, res) => {
	const createdMasters = [];
	const createdSubs = [];

	for (const masterName of MASTER_CATEGORIES) {
		const existingMaster = await ExpenseCategory.findOne({
			name: { $regex: `^${masterName}$`, $options: 'i' },
			type: 'master'
		});

		if (!existingMaster) {
			const master = await ExpenseCategory.create({
				name: masterName,
				type: 'master',
				description: `${masterName} category`,
				createdBy: req.user.id,
				isActive: true
			});
			createdMasters.push(master);
		}
	}

	const masterMap = await ExpenseCategory.find({ type: 'master' });
	const byName = new Map(masterMap.map((item) => [item.name.toLowerCase(), item]));

	for (const [masterName, subNames] of Object.entries(SUB_CATEGORIES)) {
		const parent = byName.get(masterName.toLowerCase());
		if (!parent) continue;

		for (const subName of subNames) {
			const existingSub = await ExpenseCategory.findOne({
				name: { $regex: `^${subName}$`, $options: 'i' },
				type: 'sub',
				parentCategory: parent._id
			});

			if (!existingSub) {
				const sub = await ExpenseCategory.create({
					name: subName,
					type: 'sub',
					parentCategory: parent._id,
					description: `${subName} sub-category`,
					createdBy: req.user.id,
					isActive: true
				});
				createdSubs.push(sub);
			}
		}
	}

	res.status(200).json({
		status: 'success',
		data: {
			createdMasters: createdMasters.length,
			createdSubCategories: createdSubs.length
		}
	});
});
