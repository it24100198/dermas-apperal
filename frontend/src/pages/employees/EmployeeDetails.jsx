import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	PencilIcon,
	XMarkIcon,
	CheckIcon
} from '@heroicons/react/24/outline'
import employeeService from '../../services/employeeService'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import Modal from '../../components/common/Modal'
import EmployeeForm from '../../components/forms/EmployeeForm'
import Button from '../../components/common/Button'
import { getErrorMessage } from '../../utils/helpers'
import { formatDateTime } from '../../utils/formatters'

const EmployeeDetails = () => {
	const { id } = useParams()
	const navigate = useNavigate()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [employee, setEmployee] = useState(null)

	const loadEmployee = async () => {
		try {
			setLoading(true)
			const response = await employeeService.getEmployee(id)
			setEmployee(response?.data?.employee || null)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load employee'))
			navigate('/employees')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadEmployee()
	}, [id])

	const details = useMemo(() => {
		if (!employee) return []
		return [
			['Employee Code', employee.employeeCode],
			['Name', `${employee.firstName} ${employee.lastName}`],
			['Email', employee.email],
			['Phone', employee.phone],
			['Department', employee.department],
			['Designation', employee.designation],
			['Status', employee.status],
			['Joining Date', employee.joiningDate ? formatDateTime(employee.joiningDate) : '-'],
			['Salary', `$${Number(employee.salary || 0).toLocaleString()}`],
			['Linked User', employee.userId?.name || employee.userId?._id || '-']
		]
	}, [employee])

	const handleStatusAction = async (status) => {
		try {
			setSaving(true)
			await employeeService.updateEmployeeStatus(id, status)
			toast.success('Employee status updated')
			loadEmployee()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update status'))
		} finally {
			setSaving(false)
		}
	}

	const handleUpdate = async (payload) => {
		try {
			setSaving(true)
			await employeeService.updateEmployee(id, payload)
			toast.success('Employee updated')
			setEditOpen(false)
			loadEmployee()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update employee'))
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return <Loader />
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-display text-brand-navy">Employee Details</h1>
				<div className="flex gap-2">
					<Link to="/employees" className="btn-secondary">Back</Link>
					<Button variant="secondary" onClick={() => setEditOpen(true)}>
						<PencilIcon className="h-4 w-4" />
						Edit
					</Button>
				</div>
			</div>

			<Card title={`${employee?.firstName || ''} ${employee?.lastName || ''}`} subtitle={employee?.designation}>
				<div className="grid sm:grid-cols-2 gap-3">
					{details.map(([label, value]) => (
						<div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
							<p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
							<p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
						</div>
					))}
				</div>

				<div className="mt-5 flex flex-wrap gap-2">
					<Button variant="secondary" onClick={() => handleStatusAction('active')} loading={saving}>
						<CheckIcon className="h-4 w-4" />
						Mark Active
					</Button>
					<Button variant="secondary" onClick={() => handleStatusAction('on_leave')} loading={saving}>
						Mark On Leave
					</Button>
					<Button variant="danger" onClick={() => handleStatusAction('terminated')} loading={saving}>
						<XMarkIcon className="h-4 w-4" />
						Mark Terminated
					</Button>
				</div>
			</Card>

			<Modal
				open={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Employee"
			>
				<EmployeeForm
					initialValues={employee}
					loading={saving}
					submitLabel="Save Changes"
					onSubmit={handleUpdate}
					onCancel={() => setEditOpen(false)}
				/>
			</Modal>
		</div>
	)
}

export default EmployeeDetails
