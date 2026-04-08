import { Pencil, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { getStockStatus } from '../../data/mockData';

/**
 * ProductTable — Displays products in a responsive table.
 * Includes edit/delete actions and stock status badges.
 */
const ProductTable = ({ products, onEdit, onDelete }) => {
  if (products.length === 0) {
    return <EmptyState title="No products found" description="Try adjusting your search or add a new product." />;
  }

  // Format price as LKR currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Size</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Color</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product, index) => {
            const status = getStockStatus(product.quantity);
            return (
              <tr
                key={product.id}
                className={`
                  hover:bg-gray-50/60 transition-colors duration-150
                  ${product.quantity === 0 ? 'bg-rose-50/30' : ''}
                  ${product.quantity > 0 && product.quantity <= 10 ? 'bg-amber-50/20' : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product name + description */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-[200px]">
                      {product.description}
                    </p>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                    {product.category}
                  </span>
                </td>

                {/* Size */}
                <td className="px-6 py-4 hidden lg:table-cell">
                  <span className="text-sm text-gray-600">{product.size}</span>
                </td>

                {/* Color */}
                <td className="px-6 py-4 hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{product.color}</span>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</span>
                </td>

                {/* Quantity */}
                <td className="px-6 py-4">
                  <span
                    className={`text-sm font-bold ${
                      product.quantity === 0
                        ? 'text-rose-600'
                        : product.quantity <= 10
                        ? 'text-amber-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {product.quantity}
                  </span>
                </td>

                {/* Status badge */}
                <td className="px-6 py-4">
                  <Badge status={status.label} color={status.color} />
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit product"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 size={16} />
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

export default ProductTable;
