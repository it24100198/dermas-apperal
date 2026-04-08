import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

/**
 * TransactionTable — Displays stock transaction history.
 */
const TransactionTable = ({ transactions }) => {
  if (transactions.length === 0) {
    return <EmptyState title="No transactions found" description="Adjust your filters or record a new transaction." />;
  }

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              className="hover:bg-gray-50/60 transition-colors duration-150"
            >
              {/* Date */}
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(tx.date)}</p>
                  <p className="text-xs text-gray-400">{formatTime(tx.date)}</p>
                </div>
              </td>

              {/* Product */}
              <td className="px-6 py-4">
                <p className="text-sm font-semibold text-gray-900">{tx.productName}</p>
              </td>

              {/* Type */}
              <td className="px-6 py-4">
                <span
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                    ${tx.type === 'in'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }
                  `}
                >
                  {tx.type === 'in' ? (
                    <ArrowDownLeft size={12} />
                  ) : (
                    <ArrowUpRight size={12} />
                  )}
                  Stock {tx.type === 'in' ? 'In' : 'Out'}
                </span>
              </td>

              {/* Quantity */}
              <td className="px-6 py-4">
                <span
                  className={`text-sm font-bold ${
                    tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                </span>
              </td>

              {/* Notes */}
              <td className="px-6 py-4 hidden md:table-cell">
                <p className="text-sm text-gray-500 max-w-xs truncate">{tx.notes}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
