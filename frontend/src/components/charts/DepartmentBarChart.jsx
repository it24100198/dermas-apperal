import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import PropTypes from 'prop-types'
import { formatCurrency } from '../../utils/formatters'

const DepartmentBarChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="_id" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          labelFormatter={(label) => `Department: ${label}`}
        />
        <Legend />
        <Bar dataKey="total" fill="#3b82f6" name="Total Expenses" />
      </BarChart>
    </ResponsiveContainer>
  )
}

DepartmentBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      total: PropTypes.number,
      count: PropTypes.number,
    })
  ).isRequired,
}

export default DepartmentBarChart