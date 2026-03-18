import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import RecurringExpenseForm from '../../components/forms/RecurringExpenseForm'
import recurringExpenseService from '../../services/recurringExpenseService'
import categoryService from '../../services/categoryService'
import vendorService from '../../services/vendorService'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import { getErrorMessage } from '../../utils/helpers'

const AddRecurringExpense = () => {
	const navigate = useNavigate()

	const [loading, setLoading] = useState(false)
	const [bootLoading, setBootLoading] = useState(true)
	const [categories, setCategories] = useState([])
	const [vendors, setVendors] = useState([])

	const loadDependencies = async () => {
		try {
			setBootLoading(true)
			const [categoryResponse, vendorResponse] = await Promise.all([
				categoryService.getCategoryTree(),
				vendorService.getAllVendors({ isActive: true, limit: 200 })
			])

			setCategories(categoryResponse?.data?.categories || [])
			setVendors(vendorResponse?.data?.vendors || [])
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load setup data'))
		} finally {
			setBootLoading(false)
		}
	}

	useEffect(() => {
		loadDependencies()
	}, [])

	const submitHandler = async (payload) => {
		try {
			setLoading(true)
			const cleanedPayload = {
				...payload,
				subCategory: payload.subCategory || undefined,
				vendor: payload.vendor || undefined,
				endDate: payload.endDate || undefined
			}

			await recurringExpenseService.createRecurringExpense(cleanedPayload)
			toast.success('Recurring expense created')
			navigate('/recurring-expenses')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to create recurring expense'))
		} finally {
			setLoading(false)
		}
	}

	if (bootLoading) {
		return <Loader />
	}

	return (
		<div className="max-w-5xl mx-auto space-y-5">
			<h1 className="text-3xl font-display text-brand-navy">Create Recurring Expense</h1>
			<Card>
				<RecurringExpenseForm
					categories={categories}
					vendors={vendors}
					loading={loading}
					submitLabel="Create Recurring Expense"
					onSubmit={submitHandler}
					onCancel={() => navigate('/recurring-expenses')}
				/>
			</Card>
		</div>
	)
}

export default AddRecurringExpense
