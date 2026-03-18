import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import EmployeeForm from '../../components/forms/EmployeeForm'
import employeeService from '../../services/employeeService'
import Card from '../../components/common/Card'
import { getErrorMessage } from '../../utils/helpers'

const AddEmployee = () => {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)

	const submitHandler = async (payload) => {
		try {
			setLoading(true)
			await employeeService.createEmployee(payload)
			toast.success('Employee created successfully')
			navigate('/employees')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to create employee'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="max-w-4xl mx-auto space-y-5">
			<h1 className="text-3xl font-display text-brand-navy">Add Employee</h1>
			<Card>
				<EmployeeForm
					loading={loading}
					submitLabel="Create Employee"
					onSubmit={submitHandler}
					onCancel={() => navigate('/employees')}
				/>
			</Card>
		</div>
	)
}

export default AddEmployee
