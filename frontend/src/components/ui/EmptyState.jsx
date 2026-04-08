import { PackageOpen } from 'lucide-react';

/**
 * EmptyState — Placeholder shown when no data is available.
 */
const EmptyState = ({ title = 'No items found', description = 'Try adjusting your search or filters.' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <PackageOpen size={36} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;
