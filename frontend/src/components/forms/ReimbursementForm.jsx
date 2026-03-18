import { useState } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Input from '../common/Input'
import FileUpload from '../common/FileUpload'
import Button from '../common/Button'
import { reimbursementSchema } from '../../utils/validators'
import { REIMBURSEMENT_CATEGORIES } from '../../utils/constants'

const ReimbursementForm = ({ initialValues, loading, submitLabel, onSubmit, onCancel }) => {
	const [files, setFiles] = useState([])

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(reimbursementSchema),
		defaultValues: {
			expenseTitle: initialValues.expenseTitle || '',
			category: initialValues.category || '',
			amount: initialValues.amount || '',
			description: initialValues.description || '',
			expenseDate: initialValues.expenseDate
				? new Date(initialValues.expenseDate).toISOString().slice(0, 10)
				: new Date().toISOString().slice(0, 10)
		}
	})

	const submitHandler = (values) => {
		const payload = new FormData()
		Object.entries(values).forEach(([key, value]) => {
			payload.append(key, value)
		})

		if (files[0]) {
			payload.append('receipt', files[0])
		}

		onSubmit(payload, values)
	}

	return (
		<form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
			<div className="grid md:grid-cols-2 gap-4">
				<Input label="Expense Title" {...register('expenseTitle')} error={errors.expenseTitle?.message} />
				<Input
					as="select"
					label="Category"
					{...register('category')}
					options={[
						{ value: '', label: 'Select category' },
						...REIMBURSEMENT_CATEGORIES.map((category) => ({
							value: category,
							label: category.replace('_', ' ').toUpperCase()
						}))
					]}
					error={errors.category?.message}
				/>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<Input label="Amount" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
				<Input label="Expense Date" type="date" {...register('expenseDate')} error={errors.expenseDate?.message} />
			</div>

			<Input
				as="textarea"
				rows={4}
				label="Description"
				placeholder="Purpose, location and business context"
				{...register('description')}
				error={errors.description?.message}
			/>

			<FileUpload
				label="Receipt"
				files={files}
				onChange={setFiles}
				helperText="Attach receipt image or PDF"
			/>

			<div className="flex items-center justify-end gap-3">
				<Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
				<Button type="submit" loading={loading}>{submitLabel}</Button>
			</div>
		</form>
	)
}

ReimbursementForm.propTypes = {
	initialValues: PropTypes.object,
	loading: PropTypes.bool,
	submitLabel: PropTypes.string,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func
}

ReimbursementForm.defaultProps = {
	initialValues: {},
	loading: false,
	submitLabel: 'Submit Claim',
	onCancel: () => {}
}

export default ReimbursementForm
