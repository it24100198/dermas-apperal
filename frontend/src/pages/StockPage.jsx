import { useState, useMemo } from 'react';
import { Warehouse, AlertTriangle, XCircle, Camera } from 'lucide-react';
import StockTable from '../components/stock/StockTable';
import StockUpdateModal from '../components/stock/StockUpdateModal';
import BarcodeScanner from '../components/stock/BarcodeScanner';
import SearchBar from '../components/ui/SearchBar';
import StatsCard from '../components/ui/StatsCard';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { CATEGORIES, LOW_STOCK_THRESHOLD } from '../data/mockData';

/**
 * StockPage — Stock management page with overview cards, stock table, and update modal.
 */
const StockPage = ({ products, onUpdateStock, onAddTransaction, loading, error, refetch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockModal, setStockModal] = useState({ isOpen: false, product: null, type: 'in' });
  const [scannerModalOpen, setScannerModalOpen] = useState(false);

  // Compute stock metrics
  const metrics = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockCount = products.filter(
      (p) => p.quantity > 0 && p.quantity <= LOW_STOCK_THRESHOLD
    ).length;
    const outOfStockCount = products.filter((p) => p.quantity === 0).length;
    return { totalStock, lowStockCount, outOfStockCount };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Open stock update modal
  const handleUpdateStock = (product, type) => {
    setStockModal({ isOpen: true, product, type });
  };

  // Submit stock update
  const handleStockSubmit = (data) => {
    // Update product quantity
    const newQuantity =
      data.type === 'in'
        ? stockModal.product.quantity + data.quantity
        : stockModal.product.quantity - data.quantity;

    onUpdateStock(stockModal.product.id, newQuantity);

    // Record transaction
    onAddTransaction({
      id: Date.now(),
      ...data,
      date: new Date().toISOString(),
    });

    setStockModal({ isOpen: false, product: null, type: 'in' });
  };

  const handleBarcodeScan = (scannedText) => {
    setScannerModalOpen(false);
    const matchedProduct = products.find(
      (p) => p.id === scannedText || p._id === scannedText || p.name.toLowerCase() === scannedText.toLowerCase()
    );

    if (matchedProduct) {
      handleUpdateStock(matchedProduct, 'in'); // Defaults to 'in' type
    } else {
      alert(`No product found corresponding to: ${scannedText}`);
    }
  };

  const renderContent = () => {
    if (loading) return <LoadingSpinner label="Loading stock data..." />;
    if (error) return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    );
    if (products.length === 0) return (
      <EmptyState
        title="No products available"
        description="Add products in the catalog to manage stock."
      />
    );
    return (
      <StockTable
        products={filteredProducts}
        onUpdateStock={handleUpdateStock}
      />
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        <p className="text-gray-500 mt-1">Monitor and manage inventory levels</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          icon={Warehouse}
          label="Total Stock Units"
          value={metrics.totalStock.toLocaleString()}
          color="green"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={metrics.lowStockCount}
          color="yellow"
        />
        <StatsCard
          icon={XCircle}
          label="Out of Stock"
          value={metrics.outOfStockCount}
          color="red"
        />
      </div>

      {/* Search + Filter + Scan */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search products..."
            filterValue={categoryFilter}
            onFilterChange={setCategoryFilter}
            filterOptions={CATEGORIES}
            filterLabel="Categories"
          />
        </div>
        <button
          onClick={() => setScannerModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
        >
          <Camera className="w-5 h-5" />
          Scan Barcode
        </button>
      </div>

      {renderContent()}

      {/* Stock Update Modal */}
      <Modal
        isOpen={stockModal.isOpen}
        onClose={() => setStockModal({ isOpen: false, product: null, type: 'in' })}
        title="Update Stock"
        size="md"
      >
        {stockModal.product && (
          <StockUpdateModal
            product={stockModal.product}
            type={stockModal.type}
            onSubmit={handleStockSubmit}
            onClose={() => setStockModal({ isOpen: false, product: null, type: 'in' })}
          />
        )}
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        title="Scan Barcode"
        size="md"
      >
        {scannerModalOpen && (
          <BarcodeScanner onScan={handleBarcodeScan} />
        )}
      </Modal>
    </div>
  );
};

export default StockPage;
