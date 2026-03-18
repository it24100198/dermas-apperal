import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	CheckCircleIcon,
	PencilIcon,
	TrashIcon,
	XCircleIcon,
	ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline'
import expenseService from '../../services/expenseService'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { getErrorMessage } from '../../utils/helpers'
import { EXPENSE_STATUS, USER_ROLES } from '../../utils/constants'
import { useSelector } from 'react-redux'

const ExpenseDetails = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { user } = useSelector((state) => state.auth)

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [comment, setComment] = useState('')
	const [expense, setExpense] = useState(null)

	const canApprove = [USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(user?.role)
	const canDelete = user?.role === USER_ROLES.ADMIN

	const details = useMemo(() => {
		if (!expense) return []
		return [
			['Title', expense.title],
			['Amount', formatCurrency(expense.amount)],
			['Category', expense.category?.name || '-'],
			['Sub Category', expense.subCategory?.name || '-'],
			['Department', expense.department],
			['Vendor', expense.vendor?.name || '-'],
			['Payment Method', expense.paymentMethod?.replace('_', ' ').toUpperCase()],
			['Status', expense.status],
			['Date', formatDateTime(expense.date)],
			['Created By', expense.createdBy?.name || '-'],
			['Approved By', expense.approvedBy?.name || '-'],
			['Approved At', expense.approvedAt ? formatDateTime(expense.approvedAt) : '-']
		]
	}, [expense])

	const loadExpense = async () => {
		try {
			setLoading(true)
			const response = await expenseService.getExpense(id)
			setExpense(response?.data?.expense || null)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load expense details'))
			navigate('/expenses')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadExpense()
	}, [id])

	const updateStatus = async (status) => {
		try {
			setSaving(true)
			if (status === EXPENSE_STATUS.APPROVED) {
				await expenseService.approveExpense(id)
				toast.success('Expense approved')
			} else {
				const reason = window.prompt('Provide rejection reason')
				if (!reason) return
				await expenseService.rejectExpense(id, reason)
				toast.success('Expense rejected')
			}
			loadExpense()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update expense status'))
		} finally {
			setSaving(false)
		}
	}

	const deleteExpense = async () => {
		if (!window.confirm('Delete this expense permanently?')) return

		try {
			setSaving(true)
			await expenseService.deleteExpense(id)
			toast.success('Expense deleted')
			navigate('/expenses')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to delete expense'))
		} finally {
			setSaving(false)
		}
	}

	const addComment = async () => {
		if (!comment.trim()) return

		try {
			setSaving(true)
			await expenseService.addExpenseComment(id, comment.trim())
			setComment('')
			toast.success('Comment added')
			loadExpense()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to add comment'))
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
				<h1 className="text-3xl font-display text-brand-navy">Expense Details</h1>
				<div className="flex flex-wrap gap-2">
					<Link to="/expenses" className="btn-secondary">Back to list</Link>
					{expense?.status === EXPENSE_STATUS.PENDING ? (
						<Link to={`/expenses/${id}/edit`} className="btn-secondary">
							<PencilIcon className="h-4 w-4" />
							Edit
						</Link>
					) : null}
					{canDelete ? (
						<Button variant="danger" onClick={deleteExpense} loading={saving}>
							<TrashIcon className="h-4 w-4" />
							Delete
						</Button>
					) : null}
				</div>
			</div>

			<Card title={expense?.title} subtitle={expense?.description || 'No description available'}>
				<div className="grid sm:grid-cols-2 gap-3">
					{details.map(([label, value]) => (
						<div key={label} className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50">
							<p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
							<p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
						</div>
					))}
				</div>

				{expense?.receiptFile?.path ? (
					<a
						href={`http://localhost:5000/${expense.receiptFile.path.replace(/\\/g, '/')}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex mt-4 text-sm font-semibold text-brand-cyan hover:underline"
					>
						View receipt attachment
					</a>
				) : null}

				{canApprove && expense?.status === EXPENSE_STATUS.PENDING ? (
					<div className="mt-5 flex flex-wrap gap-2">
						<Button onClick={() => updateStatus(EXPENSE_STATUS.APPROVED)} loading={saving}>
							<CheckCircleIcon className="h-4 w-4" />
							Approve Expense
						</Button>
						<Button variant="danger" onClick={() => updateStatus(EXPENSE_STATUS.REJECTED)} loading={saving}>
							<XCircleIcon className="h-4 w-4" />
							Reject Expense
						</Button>
					</div>
				) : null}
			</Card>

			<Card title="Expense Comments">
				<div className="space-y-3">
					<div className="flex gap-2">
						<input
							type="text"
							className="input-field"
							placeholder="Add comment for this expense"
							value={comment}
							onChange={(event) => setComment(event.target.value)}
						/>
						<Button type="button" variant="secondary" onClick={addComment} loading={saving}>
							<ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
							Comment
						</Button>
					</div>

					{expense?.comments?.length ? (
						<ul className="space-y-2">
							{expense.comments.map((item, index) => (
								<li key={`${item._id || index}`} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
									<p className="text-sm text-slate-800">{item.comment}</p>
									<p className="text-xs text-slate-500 mt-1">
										{item.user?.name || 'User'} • {item.createdAt ? formatDateTime(item.createdAt) : 'recently'}
									</p>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-slate-500">No comments yet.</p>
					)}
				</div>
			</Card>
		</div>
	)
}

export default ExpenseDetails
