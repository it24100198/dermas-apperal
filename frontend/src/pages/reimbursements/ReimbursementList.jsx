import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	CheckCircleIcon,
	CurrencyDollarIcon,
	EyeIcon,
	PlusIcon,
	XCircleIcon
} from '@heroicons/react/24/outline'
import reimbursementService from '../../services/reimbursementService'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import { EXPENSE_STATUS, REIMBURSEMENT_CATEGORIES, USER_ROLES } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'
import { getErrorMessage } from '../../utils/helpers'
import { useSelector } from 'react-redux'

const ReimbursementList = () => {
	const navigate = useNavigate()
	const { user } = useSelector((state) => state.auth)

	const [loading, setLoading] = useState(true)
	const [claims, setClaims] = useState([])
	const [summary, setSummary] = useState([])
	const [filters, setFilters] = useState({
		status: '',
		category: ''
	})

	const canApprove = [USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(user?.role)
	const canMarkPaid = [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT].includes(user?.role)

	const loadClaims = async () => {
		try {
			setLoading(true)
			const [listResponse, summaryResponse] = await Promise.all([
				reimbursementService.getAllReimbursements(filters),
				reimbursementService.getSummary()
			])
			setClaims(listResponse?.data?.reimbursements || [])
			setSummary(summaryResponse?.data?.summary || [])
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load reimbursements'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadClaims()
	}, [filters.status, filters.category])

	const updateStatus = async (id, status) => {
		try {
			const reason = status === EXPENSE_STATUS.REJECTED
				? window.prompt('Provide rejection reason')
				: undefined

			if (status === EXPENSE_STATUS.REJECTED && !reason) return

			await reimbursementService.updateStatus(id, status, reason)
			toast.success(`Claim ${status}`)
			loadClaims()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update reimbursement status'))
		}
	}

	const markAsPaid = async (id) => {
		try {
			const paymentReference = window.prompt('Payment reference (optional)')
			await reimbursementService.markAsPaid(id, { paymentReference })
			toast.success('Claim marked as paid')
			loadClaims()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to mark reimbursement as paid'))
		}
	}

	const columns = useMemo(() => [
		{
			header: 'Claim',
			key: 'expenseTitle',
			render: (row) => (
				<div>
					<p className="font-semibold text-slate-800">{row.expenseTitle}</p>
					<p className="text-xs text-slate-500">{row.employeeId?.firstName} {row.employeeId?.lastName}</p>
				</div>
			)
		},
		{
			header: 'Category',
			key: 'category'
		},
		{
			header: 'Amount',
			key: 'amount',
			render: (row) => formatCurrency(row.amount)
		},
		{
			header: 'Status',
			key: 'status',
			render: (row) => (
				<span className={`status-badge status-${row.status}`}>{row.status}</span>
			)
		},
		{
			header: 'Actions',
			key: 'actions',
			render: (row) => (
				<div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
					<button
						type="button"
						className="text-brand-cyan hover:text-brand-navy"
						onClick={() => navigate(`/reimbursements/${row._id}`)}
					>
						<EyeIcon className="h-5 w-5" />
					</button>

					{canApprove && row.status === EXPENSE_STATUS.PENDING ? (
						<>
							<button type="button" className="text-emerald-600" onClick={() => updateStatus(row._id, EXPENSE_STATUS.APPROVED)}>
								<CheckCircleIcon className="h-5 w-5" />
							</button>
							<button type="button" className="text-rose-600" onClick={() => updateStatus(row._id, EXPENSE_STATUS.REJECTED)}>
								<XCircleIcon className="h-5 w-5" />
							</button>
						</>
					) : null}

					{canMarkPaid && row.status === EXPENSE_STATUS.APPROVED ? (
						<button type="button" className="text-sky-600" onClick={() => markAsPaid(row._id)}>
							<CurrencyDollarIcon className="h-5 w-5" />
						</button>
					) : null}
				</div>
			)
		}
	], [navigate, canApprove, canMarkPaid])

	if (loading) {
		return <Loader />
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-display text-brand-navy">Reimbursement Claims</h1>
				<Button variant="dashboard" onClick={() => navigate('/reimbursements/new')}>
					<PlusIcon className="h-4 w-4" />
					Add New Claim
				</Button>
			</div>

			<div className="grid md:grid-cols-3 gap-4">
				{summary.map((item) => (
					<Card key={item._id} title={`Status: ${item._id}`}>
						<p className="text-2xl font-semibold text-brand-navy">{formatCurrency(item.totalAmount || 0)}</p>
						<p className="text-sm text-slate-500 mt-1">{item.totalCount || 0} claims</p>
					</Card>
				))}
			</div>

			<Card title="Filters" className="p-4">
				<div className="grid md:grid-cols-2 gap-4">
					<select className="input-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
						<option value="">All statuses</option>
						<option value={EXPENSE_STATUS.PENDING}>pending</option>
						<option value={EXPENSE_STATUS.APPROVED}>approved</option>
						<option value={EXPENSE_STATUS.REJECTED}>rejected</option>
						<option value="paid">paid</option>
					</select>

					<select className="input-field" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
						<option value="">All categories</option>
						{REIMBURSEMENT_CATEGORIES.map((category) => (
							<option key={category} value={category}>{category}</option>
						))}
					</select>
				</div>
			</Card>

			<Card title={`Claims (${claims.length})`}>
				<Table
					columns={columns}
					data={claims}
					searchable
					onRowClick={(row) => navigate(`/reimbursements/${row._id}`)}
					emptyMessage="No reimbursement claims found"
				/>
			</Card>
		</div>
	)
}

export default ReimbursementList
