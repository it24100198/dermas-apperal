const PettyCash = require('../models/PettyCash');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const applyFilters = (queryParams) => {
	const { type, category, handledBy, startDate, endDate } = queryParams;
	const filter = {};

	if (type) filter.type = type;
	if (category) filter.category = category;
	if (handledBy) filter.handledBy = handledBy;

	if (startDate || endDate) {
		filter.transactionDate = {};
		if (startDate) filter.transactionDate.$gte = new Date(startDate);
		if (endDate) filter.transactionDate.$lte = new Date(endDate);
	}

	return filter;
};

const buildReceiptFile = (file) => {
	if (!file) return undefined;

	return {
		filename: file.filename,
		path: file.path,
		mimetype: file.mimetype,
		size: file.size
	};
};

const recalculateRunningBalance = async () => {
	const transactions = await PettyCash.find().sort({ transactionDate: 1, createdAt: 1 });

	let runningBalance = 0;
	for (const txn of transactions) {
		runningBalance += txn.type === 'addition' ? txn.amount : -txn.amount;
		txn.balance = runningBalance;
		await txn.save({ validateBeforeSave: false });
	}
};

exports.createTransaction = catchAsync(async (req, res, next) => {
	const { type, amount, handledBy } = req.body;
	const numericAmount = Number(amount);

	if (!type || !handledBy || Number.isNaN(numericAmount) || numericAmount <= 0) {
		return next(new AppError('type, handledBy, and a valid positive amount are required', 400));
	}

	const employee = await Employee.findById(handledBy);
	if (!employee) {
		return next(new AppError('HandledBy employee not found', 404));
	}

	const currentBalance = await PettyCash.getCurrentBalance();

	if (type === 'expense' && numericAmount > currentBalance) {
		return next(new AppError('Insufficient petty cash balance for this expense', 400));
	}

	const nextBalance = type === 'addition'
		? currentBalance + numericAmount
		: currentBalance - numericAmount;

	const transaction = await PettyCash.create({
		...req.body,
		amount: numericAmount,
		balance: nextBalance,
		receiptFile: buildReceiptFile(req.file)
	});

	await transaction.populate([
		{ path: 'handledBy', select: 'firstName lastName employeeCode department' },
		{ path: 'approvedBy', select: 'name email role' }
	]);

	res.status(201).json({
		status: 'success',
		data: {
			transaction
		}
	});
});

exports.getAllTransactions = catchAsync(async (req, res) => {
	const {
		page = 1,
		limit = 20,
		sort = '-transactionDate'
	} = req.query;

	const filter = applyFilters(req.query);

	const pageNum = Number(page) > 0 ? Number(page) : 1;
	const limitNum = Number(limit) > 0 ? Number(limit) : 20;
	const skip = (pageNum - 1) * limitNum;

	const [transactions, totalCount] = await Promise.all([
		PettyCash.find(filter)
			.sort(sort)
			.skip(skip)
			.limit(limitNum)
			.populate('handledBy', 'firstName lastName employeeCode department')
			.populate('approvedBy', 'name email role'),
		PettyCash.countDocuments(filter)
	]);

	res.status(200).json({
		status: 'success',
		results: transactions.length,
		totalCount,
		totalPages: Math.ceil(totalCount / limitNum),
		currentPage: pageNum,
		data: {
			transactions
		}
	});
});

exports.getTransaction = catchAsync(async (req, res, next) => {
	const transaction = await PettyCash.findById(req.params.id)
		.populate('handledBy', 'firstName lastName employeeCode department')
		.populate('approvedBy', 'name email role');

	if (!transaction) {
		return next(new AppError('Petty cash transaction not found', 404));
	}

	res.status(200).json({
		status: 'success',
		data: {
			transaction
		}
	});
});

exports.deleteTransaction = catchAsync(async (req, res, next) => {
	const transaction = await PettyCash.findById(req.params.id);

	if (!transaction) {
		return next(new AppError('Petty cash transaction not found', 404));
	}

	await PettyCash.findByIdAndDelete(req.params.id);
	await recalculateRunningBalance();

	res.status(200).json({
		status: 'success',
		message: 'Petty cash transaction deleted and balances recalculated'
	});
});

exports.getSummary = catchAsync(async (req, res) => {
	const { month, year } = req.query;
	const matchStage = {};

	if (year) {
		const yearNum = Number(year);
		const monthNum = month ? Number(month) : undefined;

		const startDate = monthNum
			? new Date(yearNum, monthNum - 1, 1)
			: new Date(yearNum, 0, 1);

		const endDate = monthNum
			? new Date(yearNum, monthNum, 0, 23, 59, 59)
			: new Date(yearNum, 11, 31, 23, 59, 59);

		matchStage.transactionDate = { $gte: startDate, $lte: endDate };
	}

	const [summary, currentBalance, recentTransactions] = await Promise.all([
		PettyCash.aggregate([
			{ $match: matchStage },
			{
				$group: {
					_id: null,
					totalAdditions: {
						$sum: {
							$cond: [{ $eq: ['$type', 'addition'] }, '$amount', 0]
						}
					},
					totalExpenses: {
						$sum: {
							$cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
						}
					},
					transactionCount: { $sum: 1 }
				}
			}
		]),
		PettyCash.getCurrentBalance(),
		PettyCash.find(matchStage)
			.sort('-transactionDate')
			.limit(10)
			.populate('handledBy', 'firstName lastName employeeCode')
	]);

	const info = summary[0] || {
		totalAdditions: 0,
		totalExpenses: 0,
		transactionCount: 0
	};

	res.status(200).json({
		status: 'success',
		data: {
			summary: {
				...info,
				currentBalance
			},
			recentTransactions
		}
	});
});
