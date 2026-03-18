import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899']

const CategoryPieChart = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.categoryName,
    value: item.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => entry.name}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `$${value.toLocaleString()}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

CategoryPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      categoryName: PropTypes.string,
      total: PropTypes.number,
    })
  ).isRequired,
}

export default CategoryPieChart