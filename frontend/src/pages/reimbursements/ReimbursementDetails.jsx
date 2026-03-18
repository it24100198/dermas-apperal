import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	CheckCircleIcon,
	CurrencyDollarIcon,
	XCircleIcon
} from '@heroicons/react/24/outline'
import reimbursementService from '../../services/reimbursementService'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { EXPENSE_STATUS, USER_ROLES } from '../../utils/constants'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { getErrorMessage } from '../../utils/helpers'
import { useSelector } from 'react-redux'

const ReimbursementDetails = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { user } = useSelector((state) => state.auth)

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [claim, setClaim] = useState(null)

	const canApprove = [USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(user?.role)
	const canMarkPaid = [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT].includes(user?.role)

	const details = useMemo(() => {
		if (!claim) return []

		return [
			['Expense Title', claim.expenseTitle],
			['Category', claim.category],
			['Amount', formatCurrency(claim.amount)],
			['Status', claim.status],
			['Employee', `${claim.employeeId?.firstName || ''} ${claim.employeeId?.lastName || ''}`],
			['Expense Date', claim.expenseDate ? formatDateTime(claim.expenseDate) : '-'],
			['Submitted At', claim.createdAt ? formatDateTime(claim.createdAt) : '-'],
			['Approved By', claim.approvedBy?.name || '-'],
			['Approved At', claim.approvedAt ? formatDateTime(claim.approvedAt) : '-'],
			['Payment Date', claim.paymentDate ? formatDateTime(claim.paymentDate) : '-'],
			['Payment Reference', claim.paymentReference || '-']
		]
	}, [claim])

	const loadDetails = async () => {
		try {
			setLoading(true)
			const response = await reimbursementService.getReimbursement(id)
			setClaim(response?.data?.reimbursement || null)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load reimbursement details'))
			navigate('/reimbursements')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadDetails()
	}, [id])

	const updateStatus = async (status) => {
		try {
			setSaving(true)
			const reason = status === EXPENSE_STATUS.REJECTED
				? window.prompt('Provide rejection reason')
				: undefined

			if (status === EXPENSE_STATUS.REJECTED && !reason) return

			await reimbursementService.updateStatus(id, status, reason)
			toast.success(`Claim ${status}`)
			loadDetails()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update claim status'))
		} finally {
			setSaving(false)
		}
	}

	const markAsPaid = async () => {
		try {
			setSaving(true)
			const paymentReference = window.prompt('Payment reference (optional)')
			await reimbursementService.markAsPaid(id, { paymentReference })
			toast.success('Claim marked as paid')
			loadDetails()
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to mark claim as paid'))
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return <Loader />
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-display text-brand-navy">Reimbursement Details</h1>
				<Link to="/reimbursements" className="btn-secondary">Back to list</Link>
			</div>

			<Card title={claim?.expenseTitle} subtitle={claim?.description || 'No description'}>
				<div className="grid sm:grid-cols-2 gap-3">
					{details.map(([label, value]) => (
						<div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
							<p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
							<p className="text-sm font-semibold text-slate-800 mt-1">{value}</p>
						</div>
					))}
				</div>

				{claim?.receiptFile?.path ? (
					<a
						href={`http://localhost:5000/${claim.receiptFile.path.replace(/\\/g, '/')}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex mt-4 text-sm font-semibold text-brand-cyan hover:underline"
					>
						View receipt attachment
					</a>
				) : null}

				<div className="mt-5 flex flex-wrap gap-2">
					{canApprove && claim?.status === EXPENSE_STATUS.PENDING ? (
						<>
							<Button onClick={() => updateStatus(EXPENSE_STATUS.APPROVED)} loading={saving}>
								<CheckCircleIcon className="h-4 w-4" />
								Approve
							</Button>
							<Button variant="danger" onClick={() => updateStatus(EXPENSE_STATUS.REJECTED)} loading={saving}>
								<XCircleIcon className="h-4 w-4" />
								Reject
							</Button>
						</>
					) : null}

					{canMarkPaid && claim?.status === EXPENSE_STATUS.APPROVED ? (
						<Button variant="secondary" onClick={markAsPaid} loading={saving}>
							<CurrencyDollarIcon className="h-4 w-4" />
							Mark As Paid
						</Button>
					) : null}
				</div>
			</Card>
		</div>
	)
}

export default ReimbursementDetails
