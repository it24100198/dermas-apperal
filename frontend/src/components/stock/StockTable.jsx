import { PackagePlus, PackageMinus } from 'lucide-react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { getStockStatus } from '../../data/mockData';

/**
 * StockTable — Displays stock levels for all products.
 * Includes update button per row and color-coded status.
 */
const StockTable = ({ products, onUpdateStock }) => {
  if (products.length === 0) {
    return <EmptyState title="No stock data" description="Add products to see stock levels." />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => {
            const status = getStockStatus(product.quantity);
            return (
              <tr
                key={product.id}
                className={`
                  hover:bg-gray-50/60 transition-colors duration-150
                  ${product.quantity === 0 ? 'bg-rose-50/30' : ''}
                  ${product.quantity > 0 && product.quantity <= 10 ? 'bg-amber-50/20' : ''}
                `}
              >
                {/* Product info */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.size} · {product.color}
                    </p>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                    {product.category}
                  </span>
                </td>

                {/* Quantity bar */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold min-w-[36px] ${
                        product.quantity === 0
                          ? 'text-rose-600'
                          : product.quantity <= 10
                          ? 'text-amber-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {product.quantity}
                    </span>
                    {/* Mini progress bar */}
                    <div className="hidden sm:block w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          product.quantity === 0
                            ? 'bg-rose-500'
                            : product.quantity <= 10
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((product.quantity / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <Badge status={status.label} color={status.color} />
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onUpdateStock(product, 'in')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200
                                 transition-colors"
                      title="Stock In"
                    >
                      <PackagePlus size={14} />
                      <span className="hidden sm:inline">Stock In</span>
                    </button>
                    <button
                      onClick={() => onUpdateStock(product, 'out')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200
                                 transition-colors"
                      title="Stock Out"
                    >
                      <PackageMinus size={14} />
                      <span className="hidden sm:inline">Stock Out</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;
