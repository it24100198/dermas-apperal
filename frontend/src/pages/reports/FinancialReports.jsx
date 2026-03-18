import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
	ArrowDownTrayIcon,
	ChartBarIcon,
	DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import reportService from '../../services/reportService'
import useExport from '../../hooks/useExport'
import Card from '../../components/common/Card'
import Loader from '../../components/common/Loader'
import Button from '../../components/common/Button'
import ExpenseTrendChart from '../../components/charts/ExpenseTrendChart'
import CategoryPieChart from '../../components/charts/CategoryPieChart'
import DepartmentBarChart from '../../components/charts/DepartmentBarChart'
import { formatCurrency } from '../../utils/formatters'
import { getErrorMessage } from '../../utils/helpers'

const currentYear = new Date().getFullYear()

const FinancialReports = () => {
	const { exportBlob, exportJson } = useExport()

	const [loading, setLoading] = useState(true)
	const [exporting, setExporting] = useState(false)
	const [filters, setFilters] = useState({
		year: currentYear,
		month: new Date().getMonth() + 1
	})

	const [monthlyReport, setMonthlyReport] = useState(null)
	const [yearlyReport, setYearlyReport] = useState(null)
	const [departmentSpending, setDepartmentSpending] = useState([])
	const [analytics, setAnalytics] = useState(null)

	const loadReports = async () => {
		try {
			setLoading(true)

			const [monthly, yearly, department, analyticsResponse] = await Promise.all([
				reportService.getMonthlyExpenseReport(filters),
				reportService.getYearlyExpenseReport({ year: filters.year }),
				reportService.getDepartmentSpending(filters),
				reportService.getAnalytics(filters)
			])

			setMonthlyReport(monthly?.data || null)
			setYearlyReport(yearly?.data || null)
			setDepartmentSpending(department?.data?.departmentSpending || [])
			setAnalytics(analyticsResponse?.data || null)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to load reports'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadReports()
	}, [filters.year, filters.month])

	const summaryCards = useMemo(() => {
		const summary = monthlyReport?.summary || {}

		return [
			{ label: 'Total Expenses', value: formatCurrency(summary.totalExpenses || 0) },
			{ label: 'Total Payroll', value: formatCurrency(summary.totalPayroll || 0) },
			{ label: 'Total Reimbursements', value: formatCurrency(summary.totalReimbursements || 0) },
			{ label: 'Operational Expenses', value: formatCurrency(summary.operationalExpenses || 0) }
		]
	}, [monthlyReport])

	const handleExportCsv = async () => {
		try {
			setExporting(true)
			const blob = await reportService.exportCsv(filters)
			exportBlob(blob, `expense-report-${filters.year}-${filters.month}.csv`)
			toast.success('CSV export downloaded')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to export CSV'))
		} finally {
			setExporting(false)
		}
	}

	const handleExportJson = async () => {
		try {
			setExporting(true)
			const payload = await reportService.exportJson(filters)
			exportJson(payload, `expense-report-${filters.year}-${filters.month}.json`)
			toast.success('JSON export downloaded')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to export JSON'))
		} finally {
			setExporting(false)
		}
	}

	if (loading) {
		return <Loader />
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-3xl font-display text-brand-navy">Financial Reports</h1>
				<div className="flex gap-2">
					<Button variant="secondary" onClick={handleExportCsv} loading={exporting}>
						<ArrowDownTrayIcon className="h-4 w-4" />
						Export CSV
					</Button>
					<Button variant="secondary" onClick={handleExportJson} loading={exporting}>
						<DocumentArrowDownIcon className="h-4 w-4" />
						Export JSON
					</Button>
					<Link to="/reports/profit-loss" className="btn-primary">
						<ChartBarIcon className="h-4 w-4" />
						Profit And Loss
					</Link>
				</div>
			</div>

			<Card title="Filters" className="p-4">
				<div className="grid sm:grid-cols-2 gap-4 max-w-xl">
					<input
						type="number"
						className="input-field"
						value={filters.year}
						onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}
						min={2020}
						max={2100}
					/>

					<select
						className="input-field"
						value={filters.month}
						onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}
					>
						{Array.from({ length: 12 }).map((_, index) => (
							<option key={index + 1} value={index + 1}>
								{index + 1}
							</option>
						))}
					</select>
				</div>
			</Card>

			<div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
				{summaryCards.map((item) => (
					<Card key={item.label} title={item.label}>
						<p className="text-2xl font-semibold text-brand-navy">{item.value}</p>
					</Card>
				))}
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				<Card title="Monthly Trend">
					<ExpenseTrendChart data={yearlyReport?.monthlyBreakdown || []} />
				</Card>

				<Card title="Category Breakdown">
					<CategoryPieChart data={monthlyReport?.categoryBreakdown || []} />
				</Card>
			</div>

			<Card title="Department Spending Analysis">
				<DepartmentBarChart
					data={departmentSpending.map((item) => ({
						_id: item._id,
						total: item.totalExpenses,
						count: item.transactionCount
					}))}
				/>
			</Card>

			<Card title="Top Vendors">
				{analytics?.topVendors?.length ? (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr>
									<th className="table-header">Vendor</th>
									<th className="table-header">Total</th>
									<th className="table-header">Transactions</th>
								</tr>
							</thead>
							<tbody>
								{analytics.topVendors.map((vendor) => (
									<tr key={vendor.vendor}>
										<td className="table-cell">{vendor.vendor}</td>
										<td className="table-cell">{formatCurrency(vendor.totalAmount)}</td>
										<td className="table-cell">{vendor.count}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="text-sm text-slate-500">No vendor analytics available.</p>
				)}
			</Card>
		</div>
	)
}

export default FinancialReports
