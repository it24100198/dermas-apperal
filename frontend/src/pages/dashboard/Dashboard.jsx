import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  CurrencyDollarIcon,
  ClockIcon,
  BanknotesIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline'
import ExpenseTrendChart from '../../components/charts/ExpenseTrendChart'
import CategoryPieChart from '../../components/charts/CategoryPieChart'
import DepartmentBarChart from '../../components/charts/DepartmentBarChart'
import expenseService from '../../services/expenseService'
import api from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import Loader from '../../components/common/Loader'
import Card from '../../components/common/Card'
import { getErrorMessage } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { USER_ROLES } from '../../utils/constants'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    pettyCashBalance: 0,
    pendingReimbursements: 0
  })
  const [chartData, setChartData] = useState({
    monthlyTrend: [],
    categoryBreakdown: [],
    departmentBreakdown: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [expenseStats, dashboardStats, departmentStats] = await Promise.all([
          expenseService.getExpenseStats({ year: new Date().getFullYear() }),
          api.get('/dashboard'),
          api.get('/dashboard/department-stats')
        ])

        setStats({
          totalExpenses: expenseStats?.data?.summary?.totalExpenses || 0,
          pendingApprovals: dashboardStats?.data?.data?.summary?.pendingApprovals || 0,
          pettyCashBalance: dashboardStats?.data?.data?.summary?.pettyCashBalance || 0,
          pendingReimbursements: dashboardStats?.data?.data?.summary?.pendingReimbursements || 0
        })

        setChartData({
          monthlyTrend: expenseStats?.data?.monthlyTrend || [],
          categoryBreakdown: expenseStats?.data?.categoryBreakdown || [],
          departmentBreakdown: departmentStats?.data?.data || []
        })
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load dashboard data'))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const cards = useMemo(() => [
    {
      name: 'Total Expenses This Month',
      value: formatCurrency(stats.totalExpenses),
      icon: CurrencyDollarIcon,
      iconColor: 'text-blue-600'
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: ClockIcon,
      iconColor: 'text-amber-600'
    },
    {
      name: 'Petty Cash Balance',
      value: formatCurrency(stats.pettyCashBalance),
      icon: BanknotesIcon,
      iconColor: 'text-emerald-600'
    },
    {
      name: 'Pending Reimbursements',
      value: stats.pendingReimbursements,
      icon: ReceiptRefundIcon,
      iconColor: 'text-rose-600'
    }
  ], [stats])

  if (loading) {
    return <Loader />
  }

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="text-3xl text-brand-navy">
          Welcome to Expense Management System
        </h1>
        <p className="mt-1 text-slate-600">
          Here's what's happening with expenses today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.name} className="p-0 overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-slate-100 grid place-items-center">
                <card.icon className={`h-6 w-6 ${card.iconColor}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{card.name}</p>
                <p className="text-2xl font-semibold text-brand-navy">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Monthly Expense Trend">
          <div className="h-[300px]">
            <ExpenseTrendChart data={chartData.monthlyTrend} />
          </div>
        </Card>

        <Card title="Top Spending Categories">
          {chartData.categoryBreakdown.length > 0 ? (
            <CategoryPieChart data={chartData.categoryBreakdown} />
          ) : (
            <div className="h-64 grid place-items-center text-slate-500">
              No expense data available
            </div>
          )}
        </Card>
      </div>

      <Card title="Department Spending Analysis">
        {chartData.departmentBreakdown.length > 0 ? (
          <DepartmentBarChart
            data={chartData.departmentBreakdown.map((item) => ({
              _id: item.department,
              total: item.totalExpenses,
              count: item.expenseCount
            }))}
          />
        ) : (
          <div className="h-64 grid place-items-center text-slate-500">No department spending yet</div>
        )}
      </Card>

      {[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.MANAGER].includes(user?.role) ? (
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/expenses/new" className="btn-primary">
              Add New Expense
            </Link>
            <Link to="/recurring-expenses/new" className="btn-secondary">
              Create Recurring Expense
            </Link>
            <Link to="/reports" className="btn-secondary">
              View Reports
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

export default Dashboard
