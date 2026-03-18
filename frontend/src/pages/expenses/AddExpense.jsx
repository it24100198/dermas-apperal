import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import expenseService from '../../services/expenseService'
import ExpenseForm from '../../components/forms/ExpenseForm'
import categoryService from '../../services/categoryService'
import vendorService from '../../services/vendorService'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import { getErrorMessage } from '../../utils/helpers'

const AddExpense = () => {
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
      toast.error(getErrorMessage(error, 'Failed to load expense dependencies'))
    } finally {
      setBootLoading(false)
    }
  }

  useEffect(() => {
    loadDependencies()
  }, [])

  const handleCreate = async (formData) => {
    try {
      setLoading(true)
      await expenseService.createExpense(formData)
      toast.success('Expense created successfully')
      navigate('/expenses')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create expense'))
    } finally {
      setLoading(false)
    }
  }

  if (bootLoading) {
    return <Loader />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-3xl font-display text-brand-navy">Add New Expense</h1>

      <Card>
        <ExpenseForm
          categories={categories}
          vendors={vendors}
          loading={loading}
          submitLabel="Create Expense"
          onSubmit={handleCreate}
          onCancel={() => navigate('/expenses')}
        />
      </Card>
    </div>
  )
}

export default AddExpense