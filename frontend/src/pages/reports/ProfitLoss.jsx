import { useState } from 'react'
import toast from 'react-hot-toast'
import {
	CalculatorIcon,
	CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import reportService from '../../services/reportService'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { formatCurrency } from '../../utils/formatters'
import { getErrorMessage } from '../../utils/helpers'

const ProfitLoss = () => {
	const [loading, setLoading] = useState(false)
	const [inputs, setInputs] = useState({
		year: new Date().getFullYear(),
		month: new Date().getMonth() + 1,
		totalSales: '',
		rawMaterialCosts: ''
	})
	const [result, setResult] = useState(null)

	const calculate = async () => {
		try {
			setLoading(true)
			const response = await reportService.getProfitLoss({
				year: inputs.year,
				month: inputs.month,
				totalSales: Number(inputs.totalSales || 0),
				rawMaterialCosts: Number(inputs.rawMaterialCosts || 0)
			})
			setResult(response?.data || null)
		} catch (error) {
			toast.error(getErrorMessage(error, 'Failed to calculate profit and loss'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-display text-brand-navy">Profit And Loss</h1>

			<Card title="Calculation Inputs" subtitle="Net Profit = Total Sales - (Raw Material Costs + Operational Expenses)">
				<div className="grid md:grid-cols-2 gap-4">
					<input
						className="input-field"
						type="number"
						value={inputs.year}
						onChange={(event) => setInputs({ ...inputs, year: Number(event.target.value) })}
						min={2020}
						max={2100}
					/>

					<select
						className="input-field"
						value={inputs.month}
						onChange={(event) => setInputs({ ...inputs, month: Number(event.target.value) })}
					>
						{Array.from({ length: 12 }).map((_, index) => (
							<option key={index + 1} value={index + 1}>{index + 1}</option>
						))}
					</select>

					<input
						className="input-field"
						type="number"
						step="0.01"
						placeholder="Total Sales"
						value={inputs.totalSales}
						onChange={(event) => setInputs({ ...inputs, totalSales: event.target.value })}
					/>

					<input
						className="input-field"
						type="number"
						step="0.01"
						placeholder="Raw Material Costs"
						value={inputs.rawMaterialCosts}
						onChange={(event) => setInputs({ ...inputs, rawMaterialCosts: event.target.value })}
					/>
				</div>

				<div className="mt-4">
					<Button onClick={calculate} loading={loading}>
						<CalculatorIcon className="h-4 w-4" />
						Calculate
					</Button>
				</div>
			</Card>

			{result ? (
				<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
					<Card title="Total Revenue">
						<p className="text-2xl font-semibold text-brand-navy">{formatCurrency(result.totalRevenue || 0)}</p>
					</Card>
					<Card title="Raw Material Costs">
						<p className="text-2xl font-semibold text-rose-700">{formatCurrency(result.rawMaterialCosts || 0)}</p>
					</Card>
					<Card title="Operational Expenses">
						<p className="text-2xl font-semibold text-amber-700">{formatCurrency(result.operationalExpenses || 0)}</p>
					</Card>
					<Card title="Total Payroll">
						<p className="text-2xl font-semibold text-slate-700">{formatCurrency(result.totalPayroll || 0)}</p>
					</Card>
					<Card title="Total Expenses">
						<p className="text-2xl font-semibold text-slate-700">{formatCurrency(result.totalExpenses || 0)}</p>
					</Card>
					<Card title="Net Profit" className={result.netProfit >= 0 ? 'border-emerald-200' : 'border-rose-200'}>
						<p className={`text-2xl font-semibold ${result.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
							{formatCurrency(result.netProfit || 0)}
						</p>
						<p className="text-sm text-slate-500 mt-1">Margin: {result.profitMargin || 0}%</p>
						<p className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1">
							<CurrencyDollarIcon className="h-3.5 w-3.5" />
							{result.netProfit >= 0 ? 'Profitable period' : 'Loss period'}
						</p>
					</Card>
				</div>
			) : null}
		</div>
	)
}

export default ProfitLoss
