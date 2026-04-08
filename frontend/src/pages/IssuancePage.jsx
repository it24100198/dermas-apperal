import { useState, useEffect } from 'react';
import { issuanceAPI } from '../utils/api';
import { Plus, Package, Clock } from 'lucide-react';
import Modal from '../components/ui/Modal';

const IssuancePage = ({ products, onIssuanceCreated }) => {
  const [issuances, setIssuances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    issuedTo: '',
    issuedBy: '',
    purpose: '',
    notes: '',
  });

  useEffect(() => {
    fetchIssuances();
  }, []);

  const fetchIssuances = async () => {
    try {
      const res = await issuanceAPI.getIssuances();
      setIssuances(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching issuances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await issuanceAPI.createIssuance({
        ...formData,
        quantity: Number(formData.quantity)
      });
      const newIssuance = res.data.data || res.data;
      setIssuances((prev) => [newIssuance, ...prev]);
      
      // Update local product stock
      if (onIssuanceCreated) {
        onIssuanceCreated(newIssuance.productId, newIssuance.quantity);
      }
      
      setIsModalOpen(false);
      setFormData({
        productId: '',
        quantity: '',
        issuedTo: '',
        issuedBy: '',
        purpose: '',
        notes: '',
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create issuance');
      console.error('Error creating issuance:', err);
    }
  };

  if (loading) return <div>Loading issuances...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Material Issuances</h1>
          <p className="text-gray-500 mt-1">Issue materials to production lines</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Issue Material
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Quantity</th>
                <th className="p-4 font-medium">Issued To</th>
                <th className="p-4 font-medium">Issued By</th>
                <th className="p-4 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issuances.length > 0 ? (
                issuances.map((issuance) => (
                  <tr key={issuance._id || issuance.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(issuance.date || issuance.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 bg-opacity-50 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{issuance.productName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{issuance.quantity}</span> units
                    </td>
                    <td className="p-4 text-sm text-gray-600">{issuance.issuedTo}</td>
                    <td className="p-4 text-sm text-gray-600">{issuance.issuedBy}</td>
                    <td className="p-4 text-sm text-gray-600 truncate max-w-xs" title={issuance.purpose}>
                      {issuance.purpose}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No issuances found. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Issuance" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id} disabled={p.quantity <= 0}>
                  {p.name} (Stock: {p.quantity})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              max={formData.productId ? products.find((p) => (p._id || p.id) === formData.productId)?.quantity : ""}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issued To (Production Line)</label>
            <input
              type="text"
              name="issuedTo"
              value={formData.issuedTo}
              onChange={handleChange}
              required
              placeholder="e.g. Assembly Line A"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
            <input
              type="text"
              name="issuedBy"
              value={formData.issuedBy}
              onChange={handleChange}
              required
              placeholder="Your Name / ID"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              placeholder="e.g. Summer Collection Batch 1"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Record Issuance
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IssuancePage;
