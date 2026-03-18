import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import PropTypes from 'prop-types'
import { formatCurrency } from '../../utils/formatters'

const ExpenseTrendChart = ({ data }) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const chartData = months.map((month, index) => {
    const monthData = data.find(d => d._id === index + 1)
    return {
      name: month,
      total: monthData?.total || 0,
      count: monthData?.count || 0,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          name="Total Expenses"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

ExpenseTrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.number,
      total: PropTypes.number,
      count: PropTypes.number,
    })
  ).isRequired,
}

export default ExpenseTrendChart