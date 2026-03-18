import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Table from '../../components/common/Table'
import expenseService from '../../services/expenseService'
import categoryService from '../../services/categoryService'
import { formatCurrency } from '../../utils/formatters'
import { DEPARTMENTS, EXPENSE_STATUS, USER_ROLES } from '../../utils/constants'
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'
import Modal from '../../components/common/Modal'
import Loader from '../../components/common/Loader'
import { getErrorMessage } from '../../utils/helpers'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { useSelector } from 'react-redux'

const ExpenseList = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 })
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    department: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  })
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkPayload, setBulkPayload] = useState('[\n  {\n    "title": "Factory Supplies",\n    "amount": 1200,\n    "category": "",\n    "department": "Production",\n    "paymentMethod": "cash",\n    "date": "2026-03-17"\n  }\n]')

  const canApprove = [USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(user?.role)
  const canDelete = user?.role === USER_ROLES.ADMIN

  const fetchExpenseData = async () => {
    try {
      setLoading(true)

      const [expenseResponse, categoryResponse] = await Promise.all([
        expenseService.getAllExpenses(filters),
        categoryService.getAllCategories({ type: 'master', limit: 200, isActive: true })
      ])

      setExpenses(expenseResponse?.data?.expenses || [])
      setMeta({
        totalCount: expenseResponse?.totalCount || 0,
        totalPages: expenseResponse?.totalPages || 1,
        currentPage: expenseResponse?.currentPage || 1
      })
      setCategories(categoryResponse?.data?.categories || [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch expenses'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenseData()
  }, [filters.page, filters.limit, filters.status, filters.category, filters.department, filters.startDate, filters.endDate])

  const handleApprove = async (id) => {
    try {
      await expenseService.approveExpense(id)
      toast.success('Expense approved successfully')
      fetchExpenseData()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to approve expense'))
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Provide rejection reason')
    if (!reason) return

    try {
      await expenseService.rejectExpense(id, reason)
      toast.success('Expense rejected successfully')
      fetchExpenseData()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reject expense'))
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this expense?')
    if (!confirmed) return

    try {
      await expenseService.deleteExpense(id)
      toast.success('Expense deleted successfully')
      fetchExpenseData()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete expense'))
    }
  }

  const submitBulkCreate = async () => {
    try {
      const parsedPayload = JSON.parse(bulkPayload)
      if (!Array.isArray(parsedPayload)) {
        toast.error('Bulk payload must be a JSON array')
        return
      }

      await expenseService.bulkCreateExpenses(parsedPayload)
      toast.success('Bulk expenses created successfully')
      setBulkModalOpen(false)
      fetchExpenseData()
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON payload')
        return
      }
      toast.error(getErrorMessage(error, 'Failed to create bulk expenses'))
    }
  }

  const columns = useMemo(
    () => [
      {
        header: 'Date',
        key: 'date',
        render: (row) => format(new Date(row.date), 'dd/MM/yyyy')
      },
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
        header: 'Category',
        key: 'category.name',
        render: (row) => row.category?.name || 'N/A'
      },
      {
        header: 'Department',
        key: 'department'
      },
      {
        header: 'Status',
        key: 'status',
        render: (row) => {
          const statusClass = {
            [EXPENSE_STATUS.PENDING]: 'status-pending',
            [EXPENSE_STATUS.APPROVED]: 'status-approved',
            [EXPENSE_STATUS.REJECTED]: 'status-rejected'
          }

          return (
            <span className={`status-badge ${statusClass[row.status] || 'status-pending'}`}>
              {row.status}
            </span>
          )
        },
      },
      {
        header: 'Actions',
        key: 'actions',
        render: (row) => (
          <div className="flex space-x-2" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => navigate(`/expenses/${row._id}`)}
              className="text-blue-600 hover:text-blue-900"
              title="View"
            >
              <EyeIcon className="h-5 w-5" />
            </button>

            {row.status === EXPENSE_STATUS.PENDING ? (
              <>
                {canApprove ? (
                  <>
                    <button
                      onClick={() => handleApprove(row._id)}
                      className="text-green-600 hover:text-green-900"
                      title="Approve"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleReject(row._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Reject"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </>
            ) : null}

            <button
              onClick={() => navigate(`/expenses/${row._id}/edit`)}
              className="text-indigo-600 hover:text-indigo-900"
              title="Edit"
            >
              <PencilIcon className="h-5 w-5" />
            </button>

            {canDelete ? (
              <button
                onClick={() => handleDelete(row._id)}
                className="text-red-600 hover:text-red-900"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [navigate, canApprove, canDelete]
  )

  if (loading) {
    return <Loader />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display text-brand-navy">Expense Management</h1>
        <div className="flex items-center gap-2">
          {user?.role === USER_ROLES.ADMIN ? (
            <Button type="button" variant="secondary" onClick={() => setBulkModalOpen(true)}>
              <ArrowsUpDownIcon className="h-4 w-4" />
              Bulk Create
            </Button>
          ) : null}

          <Button type="button" variant="dashboard" onClick={() => navigate('/expenses/new')}>
            <PlusIcon className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <Card title="Filters" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="input-field"
          >
            <option value="">All Statuses</option>
            {Object.values(EXPENSE_STATUS).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>

          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value, page: 1 })}
            className="input-field"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>

          <input
            type="date"
            className="input-field"
            value={filters.startDate}
            onChange={(event) => setFilters({ ...filters, startDate: event.target.value, page: 1 })}
          />

          <input
            type="date"
            className="input-field"
            value={filters.endDate}
            onChange={(event) => setFilters({ ...filters, endDate: event.target.value, page: 1 })}
          />
        </div>
      </Card>

      <Card title={`All Expenses (${meta.totalCount})`}>
        <Table
          columns={columns}
          data={expenses}
          loading={loading}
          searchable
          pageSize={filters.limit}
          onRowClick={(row) => navigate(`/expenses/${row._id}`)}
        />
      </Card>

      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Create Expenses"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkModalOpen(false)}>Cancel</Button>
            <Button onClick={submitBulkCreate}>Create Expenses</Button>
          </div>
        )}
      >
        <p className="text-sm text-slate-600 mb-3">
          Provide a JSON array using expense fields. Category ids must be valid ObjectIds.
        </p>
        <textarea
          className="input-field min-h-[220px] font-mono text-xs"
          value={bulkPayload}
          onChange={(event) => setBulkPayload(event.target.value)}
        />
      </Modal>
    </div>
  )
}

export default ExpenseList