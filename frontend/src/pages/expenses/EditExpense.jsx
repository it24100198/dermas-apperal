import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import ExpenseForm from '../../components/forms/ExpenseForm'
import expenseService from '../../services/expenseService'
import categoryService from '../../services/categoryService'
import vendorService from '../../services/vendorService'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import { getErrorMessage } from '../../utils/helpers'

const EditExpense = () => {
	const { id } = useParams()
	const navigate = useNavigate()

	const [bootLoading, setBootLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [expense, setExpense] = useState(null)
	const [categories, setCategories] = useState([])
	const [vendors, setVendors] = useState([])

	const loadData = async () => {
		try {
			setBootLoading(true)
			const [expenseResponse, categoryResponse, vendorResponse] = await Promise.all([
				expenseService.getExpense(id),
				categoryService.getCategoryTree(),
				vendorService.getAllVendors({ isActive: true, limit: 200 })
			])

			setExpense(expenseResponse?.data?.expense || null)
			setCategories(categoryResponse?.data?.categories || [])
			setVendors(vendorResponse?.data?.vendors || [])
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load expense'))
			navigate('/expenses')
		} finally {
			setBootLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [id])

	const handleUpdate = async (formData) => {
		try {
			setSaving(true)
			await expenseService.updateExpense(id, formData)
			toast.success('Expense updated successfully')
			navigate(`/expenses/${id}`)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to update expense'))
		} finally {
			setSaving(false)
		}
	}

	if (bootLoading) {
		return <Loader />
	}

	return (
		<div className="max-w-5xl mx-auto space-y-5">
			<h1 className="text-3xl font-display text-brand-navy">Edit Expense</h1>
			<Card>
				<ExpenseForm
					initialValues={expense}
					categories={categories}
					vendors={vendors}
					loading={saving}
					submitLabel="Save Changes"
					onSubmit={handleUpdate}
					onCancel={() => navigate(`/expenses/${id}`)}
				/>
			</Card>
		</div>
	)
}

export default EditExpense
