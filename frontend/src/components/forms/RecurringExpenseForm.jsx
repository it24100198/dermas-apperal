import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Input from '../common/Input'
import Button from '../common/Button'
import { DEPARTMENTS, PAYMENT_METHODS, RECURRING_FREQUENCY } from '../../utils/constants'
import { recurringExpenseSchema } from '../../utils/validators'

const normalizeValues = (initialValues = {}) => ({
	title: initialValues.title || '',
	amount: initialValues.amount || '',
	category: initialValues.category?._id || initialValues.category || '',
	subCategory: initialValues.subCategory?._id || initialValues.subCategory || '',
	vendor: initialValues.vendor?._id || initialValues.vendor || '',
	department: initialValues.department || '',
	paymentMethod: initialValues.paymentMethod || '',
	frequency: initialValues.frequency || '',
	startDate: initialValues.startDate
		? new Date(initialValues.startDate).toISOString().slice(0, 10)
		: new Date().toISOString().slice(0, 10),
	endDate: initialValues.endDate
		? new Date(initialValues.endDate).toISOString().slice(0, 10)
		: '',
	autoApprove: Boolean(initialValues.autoApprove),
	notes: initialValues.notes || ''
})

const RecurringExpenseForm = ({
	initialValues,
	categories,
	vendors,
	loading,
	submitLabel,
	onSubmit,
	onCancel
}) => {
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(recurringExpenseSchema),
		defaultValues: normalizeValues(initialValues)
	})

	const selectedCategory = watch('category')
	const selectedCategoryObject = categories.find((item) => item._id === selectedCategory)

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
			<div className="grid md:grid-cols-2 gap-4">
				<Input label="Title" {...register('title')} error={errors.title?.message} />
				<Input label="Amount" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				<Input
					as="select"
					label="Category"
					{...register('category')}
					options={[
						{ value: '', label: 'Select category' },
						...categories.map((item) => ({ value: item._id, label: item.name }))
					]}
					error={errors.category?.message}
				/>

				<Input
					as="select"
					label="Sub Category"
					{...register('subCategory')}
					options={[
						{ value: '', label: 'Optional sub category' },
						...(selectedCategoryObject?.subCategories || []).map((item) => ({
							value: item._id,
							label: item.name
						}))
					]}
					error={errors.subCategory?.message}
				/>

				<Input
					as="select"
					label="Vendor"
					{...register('vendor')}
					options={[
						{ value: '', label: 'Optional vendor' },
						...vendors.map((item) => ({ value: item._id, label: item.name }))
					]}
					error={errors.vendor?.message}
				/>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				<Input
					as="select"
					label="Department"
					{...register('department')}
					options={[
						{ value: '', label: 'Select department' },
						...DEPARTMENTS.map((department) => ({ value: department, label: department }))
					]}
					error={errors.department?.message}
				/>

				<Input
					as="select"
					label="Payment Method"
					{...register('paymentMethod')}
					options={[
						{ value: '', label: 'Select method' },
						...Object.values(PAYMENT_METHODS).map((method) => ({
							value: method,
							label: method.replace('_', ' ').toUpperCase()
						}))
					]}
					error={errors.paymentMethod?.message}
				/>

				<Input
					as="select"
					label="Frequency"
					{...register('frequency')}
					options={[
						{ value: '', label: 'Select frequency' },
						...Object.values(RECURRING_FREQUENCY).map((value) => ({
							value,
							label: value.toUpperCase()
						}))
					]}
					error={errors.frequency?.message}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<Input label="Start Date" type="date" {...register('startDate')} error={errors.startDate?.message} />
				<Input label="End Date" type="date" {...register('endDate')} error={errors.endDate?.message} />
			</div>

			<Input
				as="textarea"
				rows={3}
				label="Notes"
				{...register('notes')}
				error={errors.notes?.message}
			/>

			<label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
				<input type="checkbox" className="h-4 w-4" {...register('autoApprove')} />
				Auto approve generated expenses
			</label>

			<div className="flex items-center justify-end gap-3">
				<Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
				<Button type="submit" loading={loading}>{submitLabel}</Button>
			</div>
		</form>
	)
}

RecurringExpenseForm.propTypes = {
	initialValues: PropTypes.object,
	categories: PropTypes.arrayOf(PropTypes.object),
	vendors: PropTypes.arrayOf(PropTypes.object),
	loading: PropTypes.bool,
	submitLabel: PropTypes.string,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func
}

RecurringExpenseForm.defaultProps = {
	initialValues: {},
	categories: [],
	vendors: [],
	loading: false,
	submitLabel: 'Save Recurring Expense',
	onCancel: () => {}
}

export default RecurringExpenseForm
