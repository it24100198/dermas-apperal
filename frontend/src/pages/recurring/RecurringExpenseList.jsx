import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	ArrowPathIcon,
	PauseCircleIcon,
	PencilSquareIcon,
	PlayCircleIcon,
	PlusIcon,
	TrashIcon
} from '@heroicons/react/24/outline'
import recurringExpenseService from '../../services/recurringExpenseService'
import categoryService from '../../services/categoryService'
import vendorService from '../../services/vendorService'
import Table from '../../components/common/Table'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import RecurringExpenseForm from '../../components/forms/RecurringExpenseForm'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { getErrorMessage } from '../../utils/helpers'

const RecurringExpenseList = () => {
	const navigate = useNavigate()

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [items, setItems] = useState([])
	const [categories, setCategories] = useState([])
	const [vendors, setVendors] = useState([])
	const [statusFilter, setStatusFilter] = useState('')
	const [editing, setEditing] = useState(null)

	const loadData = async () => {
		try {
			setLoading(true)
			const [listResponse, categoryResponse, vendorResponse] = await Promise.all([
				recurringExpenseService.getAllRecurringExpenses({ status: statusFilter || undefined }),
				categoryService.getCategoryTree(),
				vendorService.getAllVendors({ isActive: true, limit: 200 })
			])

			setItems(listResponse?.data || [])
			setCategories(categoryResponse?.data?.categories || [])
			setVendors(vendorResponse?.data?.vendors || [])
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load recurring expenses'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [statusFilter])

	const handleGenerate = async () => {
		try {
			setSaving(true)
			const response = await recurringExpenseService.generateRecurringExpenses()
			toast.success(response?.message || 'Recurring expenses generated')
			loadData()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to generate recurring expenses'))
		} finally {
			setSaving(false)
		}
	}

	const handlePauseResume = async (id, status) => {
		try {
			setSaving(true)
			if (status === 'paused') {
				await recurringExpenseService.resumeRecurringExpense(id)
				toast.success('Recurring expense resumed')
			} else {
				await recurringExpenseService.pauseRecurringExpense(id)
				toast.success('Recurring expense paused')
			}
			loadData()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update recurring status'))
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this recurring setup?')) return

		try {
			setSaving(true)
			await recurringExpenseService.deleteRecurringExpense(id)
			toast.success('Recurring expense deleted')
			loadData()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to delete recurring expense'))
		} finally {
			setSaving(false)
		}
	}

	const saveEdit = async (payload) => {
		if (!editing?._id) return

		try {
			setSaving(true)
			await recurringExpenseService.updateRecurringExpense(editing._id, payload)
			toast.success('Recurring expense updated')
			setEditing(null)
			loadData()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update recurring expense'))
		} finally {
			setSaving(false)
		}
	}

	const columns = useMemo(() => [
		{
			header: 'Title',
			key: 'title'
		},
		{
			header: 'Amount',
			key: 'amount',
			render: (row) => formatCurrency(row.amount)
		},
		{
			header: 'Frequency',
			key: 'frequency'
		},
		{
			header: 'Department',
			key: 'department'
		},
		{
			header: 'Next Due',
			key: 'nextDueDate',
			render: (row) => row.nextDueDate ? formatDate(row.nextDueDate) : '-'
		},
		{
			header: 'Status',
			key: 'status',
			render: (row) => <span className="status-badge status-approved">{row.status}</span>
		},
		{
			header: 'Actions',
			key: 'actions',
			render: (row) => (
				<div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
					<button type="button" className="text-brand-cyan" onClick={() => setEditing(row)} title="Edit">
						<PencilSquareIcon className="h-5 w-5" />
					</button>

					<button
						type="button"
						className="text-amber-600"
						onClick={() => handlePauseResume(row._id, row.status)}
						title={row.status === 'paused' ? 'Resume' : 'Pause'}
					>
						{row.status === 'paused' ? <PlayCircleIcon className="h-5 w-5" /> : <PauseCircleIcon className="h-5 w-5" />}
					</button>

					<button type="button" className="text-rose-600" onClick={() => handleDelete(row._id)} title="Delete">
						<TrashIcon className="h-5 w-5" />
					</button>
				</div>
			)
		}
	], [])

	if (loading) {
		return <Loader />
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-display text-brand-navy">Recurring Expenses</h1>
				<div className="flex gap-2">
					<Button variant="dashboard" onClick={handleGenerate} loading={saving}>
						<ArrowPathIcon className="h-4 w-4" />
						Generate Due Expenses
					</Button>
					<Button variant="dashboard" onClick={() => navigate('/recurring-expenses/new')}>
						<PlusIcon className="h-4 w-4" />
						New Recurring Entry
					</Button>
				</div>
			</div>

			<Card title="Filters" className="p-4">
				<select className="input-field max-w-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
					<option value="">All statuses</option>
					<option value="active">active</option>
					<option value="paused">paused</option>
					<option value="completed">completed</option>
					<option value="cancelled">cancelled</option>
				</select>
			</Card>

			<Card title={`Recurring Entries (${items.length})`}>
				<Table columns={columns} data={items} searchable emptyMessage="No recurring entries found" />
			</Card>

			<Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit Recurring Expense">
				<RecurringExpenseForm
					initialValues={editing || {}}
					categories={categories}
					vendors={vendors}
					loading={saving}
					submitLabel="Save Changes"
					onSubmit={saveEdit}
					onCancel={() => setEditing(null)}
				/>
			</Modal>
		</div>
	)
}

export default RecurringExpenseList
