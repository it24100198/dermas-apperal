/**
 * LoadingSpinner — Animated loading indicator.
 */
const LoadingSpinner = ({ size = 'md', label = 'Loading...' }) => {
  const sizeMap = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
      <div
        className={`
          ${sizeMap[size]} border-primary-200 border-t-primary-600
          rounded-full animate-spin
        `}
      />
      <p className="text-sm text-gray-500 mt-4 font-medium">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
