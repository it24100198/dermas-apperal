import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Input from '../common/Input'
import Button from '../common/Button'
import { DEPARTMENTS } from '../../utils/constants'
import { employeeSchema } from '../../utils/validators'

const normalizeValues = (initialValues = {}) => ({
	employeeCode: initialValues.employeeCode || '',
	firstName: initialValues.firstName || '',
	lastName: initialValues.lastName || '',
	email: initialValues.email || '',
	phone: initialValues.phone || '',
	department: initialValues.department || '',
	designation: initialValues.designation || '',
	joiningDate: initialValues.joiningDate
		? new Date(initialValues.joiningDate).toISOString().slice(0, 10)
		: new Date().toISOString().slice(0, 10),
	salary: initialValues.salary || ''
})

const EmployeeForm = ({ initialValues, loading, submitLabel, onSubmit, onCancel }) => {
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(employeeSchema),
		defaultValues: normalizeValues(initialValues)
	})

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
			<div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
				Linked User ID is auto-linked using employee email. If no user exists, one is created automatically.
			</div>

			<div className="grid md:grid-cols-1 gap-4">
				<Input label="Employee Code" {...register('employeeCode')} error={errors.employeeCode?.message} />
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<Input label="First Name" {...register('firstName')} error={errors.firstName?.message} />
				<Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} />
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
				<Input label="Phone" {...register('phone')} error={errors.phone?.message} />
			</div>

			<div className="grid md:grid-cols-2 gap-4">
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
				<Input label="Designation" {...register('designation')} error={errors.designation?.message} />
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<Input label="Joining Date" type="date" {...register('joiningDate')} error={errors.joiningDate?.message} />
				<Input label="Salary" type="number" step="0.01" {...register('salary')} error={errors.salary?.message} />
			</div>

			<div className="flex items-center justify-end gap-3">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" loading={loading}>{submitLabel}</Button>
			</div>
		</form>
	)
}

EmployeeForm.propTypes = {
	initialValues: PropTypes.object,
	loading: PropTypes.bool,
	submitLabel: PropTypes.string,
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func
}

EmployeeForm.defaultProps = {
	initialValues: {},
	loading: false,
	submitLabel: 'Save Employee',
	onCancel: () => {}
}

export default EmployeeForm
