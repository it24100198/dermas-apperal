/**
 * StatsCard — Dashboard metric card with icon, value, label, and optional trend.
 */
const StatsCard = ({ icon: Icon, label, value, trend, trendUp, color = 'primary' }) => {
  const colorMap = {
    primary: 'from-primary-500 to-primary-700',
    green: 'from-emerald-500 to-emerald-700',
    yellow: 'from-amber-500 to-amber-700',
    red: 'from-rose-500 to-rose-700',
    blue: 'from-blue-500 to-blue-700',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 animate-fadeIn group">
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={22} className="text-white" />
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              trendUp
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trendUp ? '↑' : '↓'} {trend}%
          </span>
        )}
      </div>

      {/* Value + Label */}
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;
