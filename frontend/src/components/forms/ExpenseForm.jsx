import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Input from '../common/Input'
import FileUpload from '../common/FileUpload'
import Button from '../common/Button'
import { DEPARTMENTS, PAYMENT_METHODS } from '../../utils/constants'
import { expenseSchema } from '../../utils/validators'

const normalizeDefaultValues = (initialValues = {}) => ({
	title: initialValues.title || '',
	amount: initialValues.amount || '',
	category: initialValues.category?._id || initialValues.category || '',
	subCategory: initialValues.subCategory?._id || initialValues.subCategory || '',
	vendor: initialValues.vendor?._id || initialValues.vendor || '',
	department: initialValues.department || '',
	paymentMethod: initialValues.paymentMethod || '',
	date: initialValues.date
		? new Date(initialValues.date).toISOString().slice(0, 10)
		: new Date().toISOString().slice(0, 10),
	description: initialValues.description || ''
})

const ExpenseForm = ({
	initialValues,
	categories,
	vendors,
	loading,
	submitLabel,
	onSubmit,
	onCancel
}) => {
	const [files, setFiles] = useState([])

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(expenseSchema),
		defaultValues: normalizeDefaultValues(initialValues)
	})

	const selectedCategory = watch('category')

	const subCategoryOptions = useMemo(() => {
		const category = categories.find((item) => item._id === selectedCategory)
		if (!category?.subCategories) return []

		return category.subCategories.map((item) => ({
			label: item.name,
			value: item._id
		}))
	}, [categories, selectedCategory])

	const submitHandler = (values) => {
		const payload = new FormData()
		Object.entries(values).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				payload.append(key, value)
			}
		})

		if (files[0]) {
			payload.append('receipt', files[0])
		}

		onSubmit(payload, values)
	}

	return (
		<form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
			<div className="grid md:grid-cols-2 gap-4">
				<Input
					label="Title"
					placeholder="Monthly electricity bill"
					{...register('title')}
					error={errors.title?.message}
				/>

				<Input
					label="Amount"
					type="number"
					step="0.01"
					placeholder="0.00"
					{...register('amount')}
					error={errors.amount?.message}
				/>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				<Input
					as="select"
					label="Master Category"
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
						...subCategoryOptions
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
					label="Date"
					type="date"
					{...register('date')}
					error={errors.date?.message}
				/>
			</div>

			<Input
				as="textarea"
				label="Description"
				rows={3}
				placeholder="Add expense details..."
				{...register('description')}
				error={errors.description?.message}
			/>

			<FileUpload
				label="Receipt"
				files={files}
				onChange={setFiles}
				helperText="Attach image or PDF receipt"
			/>

			<div className="flex items-center justify-end gap-3">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" loading={loading}>
					{submitLabel}
				</Button>
			</div>
		</form>
	)
}

ExpenseForm.propTypes = {
	initialValues: PropTypes.object,
	categories: PropTypes.arrayOf(PropTypes.object),
	vendors: PropTypes.arrayOf(PropTypes.object),
	loading: PropTypes.bool,
	submitLabel: PropTypes.string,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func
}

ExpenseForm.defaultProps = {
	initialValues: {},
	categories: [],
	vendors: [],
	loading: false,
	submitLabel: 'Save Expense',
	onCancel: () => {}
}

export default ExpenseForm
