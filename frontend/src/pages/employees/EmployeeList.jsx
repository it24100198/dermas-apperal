import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	EyeIcon,
	PlusIcon,
	TrashIcon,
	UserCircleIcon
} from '@heroicons/react/24/outline'
import employeeService from '../../services/employeeService'
import Table from '../../components/common/Table'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { DEPARTMENTS, USER_ROLES } from '../../utils/constants'
import { getErrorMessage } from '../../utils/helpers'
import { useSelector } from 'react-redux'

const STATUS_OPTIONS = ['active', 'inactive', 'on_leave', 'terminated']

const EmployeeList = () => {
	const navigate = useNavigate()
	const { user } = useSelector((state) => state.auth)

	const [loading, setLoading] = useState(true)
	const [employees, setEmployees] = useState([])
	const [stats, setStats] = useState(null)
	const [filters, setFilters] = useState({
		department: '',
		status: '',
		search: ''
	})

	const loadEmployees = async () => {
		try {
			setLoading(true)
			const [employeeResponse, statsResponse] = await Promise.all([
				employeeService.getAllEmployees(filters),
				employeeService.getEmployeeStats()
			])
			setEmployees(employeeResponse?.data?.employees || [])
			setStats(statsResponse?.data?.summary || null)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load employees'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadEmployees()
	}, [filters.department, filters.status, filters.search])

	const handleStatusChange = async (employeeId, status) => {
		try {
			await employeeService.updateEmployeeStatus(employeeId, status)
			toast.success('Employee status updated')
			loadEmployees()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update employee status'))
		}
	}

	const handleDelete = async (employeeId) => {
		if (!window.confirm('Mark this employee as terminated?')) return

		try {
			await employeeService.deleteEmployee(employeeId)
			toast.success('Employee terminated')
			loadEmployees()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update employee status'))
		}
	}

	const columns = useMemo(() => [
		{
			header: 'Employee',
			key: 'employee',
			render: (row) => (
				<div className="flex items-center gap-2">
					<UserCircleIcon className="h-8 w-8 text-slate-400" />
					<div>
						<p className="font-semibold text-slate-800">{row.firstName} {row.lastName}</p>
						<p className="text-xs text-slate-500">{row.email}</p>
					</div>
				</div>
			)
		},
		{
			header: 'Code',
			key: 'employeeCode'
		},
		{
			header: 'Department',
			key: 'department'
		},
		{
			header: 'Designation',
			key: 'designation'
		},
		{
			header: 'Status',
			key: 'status',
			render: (row) => (
				<select
					className="input-field py-1"
					value={row.status}
					onChange={(event) => handleStatusChange(row._id, event.target.value)}
					onClick={(event) => event.stopPropagation()}
				>
					{STATUS_OPTIONS.map((item) => (
						<option key={item} value={item}>{item}</option>
					))}
				</select>
			)
		},
		{
			header: 'Actions',
			key: 'actions',
			render: (row) => (
				<div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
					<button
						type="button"
						className="text-brand-cyan hover:text-brand-navy"
						onClick={() => navigate(`/employees/${row._id}`)}
						title="View details"
					>
						<EyeIcon className="h-5 w-5" />
					</button>

					{user?.role === USER_ROLES.ADMIN ? (
						<button
							type="button"
							className="text-rose-600 hover:text-rose-700"
							onClick={() => handleDelete(row._id)}
							title="Terminate"
						>
							<TrashIcon className="h-5 w-5" />
						</button>
					) : null}
				</div>
			)
		}
	], [navigate, user?.role])

	if (loading) {
		return <Loader />
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-display text-brand-navy">Employee Management</h1>
				<Button variant="dashboard" onClick={() => navigate('/employees/new')}>
					<PlusIcon className="h-4 w-4" />
					Add Employee
				</Button>
			</div>

			{stats ? (
				<div className="grid sm:grid-cols-3 gap-4">
					<Card title="Total Employees">
						<p className="text-2xl font-semibold text-brand-navy">{stats.totalEmployees || 0}</p>
					</Card>
					<Card title="Active Employees">
						<p className="text-2xl font-semibold text-emerald-700">{stats.activeEmployees || 0}</p>
					</Card>
					<Card title="Total Payroll">
						<p className="text-2xl font-semibold text-brand-cyan">${(stats.totalPayroll || 0).toLocaleString()}</p>
					</Card>
				</div>
			) : null}

			<Card title="Filters" className="p-4">
				<div className="grid md:grid-cols-3 gap-4">
					<select className="input-field" value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })}>
						<option value="">All departments</option>
						{DEPARTMENTS.map((department) => (
							<option key={department} value={department}>{department}</option>
						))}
					</select>

					<select className="input-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
						<option value="">All statuses</option>
						{STATUS_OPTIONS.map((status) => (
							<option key={status} value={status}>{status}</option>
						))}
					</select>

					<input
						type="text"
						className="input-field"
						placeholder="Search by name, code, email"
						value={filters.search}
						onChange={(event) => setFilters({ ...filters, search: event.target.value })}
					/>
				</div>
			</Card>

			<Card title={`Employees (${employees.length})`}>
				<Table
					columns={columns}
					data={employees}
					searchable
					onRowClick={(row) => navigate(`/employees/${row._id}`)}
					emptyMessage="No employees found"
				/>
			</Card>
		</div>
	)
}

export default EmployeeList
