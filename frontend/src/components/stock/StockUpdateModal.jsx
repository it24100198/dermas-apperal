import { useState } from 'react';
import { PackagePlus, PackageMinus } from 'lucide-react';

/**
 * StockUpdateModal — Form to record stock in/out transactions.
 * Displayed inside a Modal wrapper.
 */
const StockUpdateModal = ({ product, type: initialType, onSubmit, onClose }) => {
  const [type, setType] = useState(initialType || 'in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }

    // Prevent stock out more than available
    if (type === 'out' && qty > product.quantity) {
      setError(`Cannot remove more than ${product.quantity} items (current stock)`);
      return;
    }

    onSubmit({
      productId: product.id,
      productName: product.name,
      type,
      quantity: qty,
      notes: notes.trim() || `Stock ${type === 'in' ? 'added' : 'removed'}`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Product info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-500">Product</p>
        <p className="font-semibold text-gray-900">{product.name}</p>
        <p className="text-sm text-gray-500 mt-1">
          Current stock: <span className="font-bold text-gray-900">{product.quantity}</span> units
        </p>
      </div>

      {/* Transaction type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setType('in'); setError(''); }}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
              border-2 transition-all duration-200
              ${type === 'in'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }
            `}
          >
            <PackagePlus size={18} />
            Stock In
          </button>
          <button
            type="button"
            onClick={() => { setType('out'); setError(''); }}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold
              border-2 transition-all duration-200
              ${type === 'out'
                ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }
            `}
          >
            <PackageMinus size={18} />
            Stock Out
          </button>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="stock-quantity" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Quantity
        </label>
        <input
          id="stock-quantity"
          type="number"
          value={quantity}
          onChange={(e) => { setQuantity(e.target.value); setError(''); }}
          placeholder="Enter quantity"
          min="1"
          className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                     ${error ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 bg-white'}
                     placeholder:text-gray-400`}
        />
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="stock-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Notes (optional)
        </label>
        <textarea
          id="stock-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Received from supplier..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
                     transition-all duration-200 placeholder:text-gray-400 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          id="stock-submit-btn"
          type="submit"
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl ${
            type === 'in'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-500/25'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-500/25'
          }`}
        >
          {type === 'in' ? 'Add Stock' : 'Remove Stock'}
        </button>
      </div>
    </form>
  );
};

export default StockUpdateModal;
