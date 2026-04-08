/**
 * Badge — Status badge with color-coded variants.
 * Used for stock status display (In Stock / Low Stock / Out of Stock).
 */
const Badge = ({ status, color }) => {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    red: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
    gray: 'bg-gray-50 text-gray-600 border-gray-200 ring-gray-600/10',
  };

  const dotColorMap = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-400',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        border ring-1 ring-inset
        ${colorMap[color] || colorMap.gray}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[color] || dotColorMap.gray}`} />
      {status}
    </span>
  );
};

export default Badge;
