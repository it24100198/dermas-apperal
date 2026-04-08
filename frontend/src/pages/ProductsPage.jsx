import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import ProductTable from '../components/products/ProductTable';
import ProductForm from '../components/products/ProductForm';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { CATEGORIES } from '../data/mockData';

/**
 * ProductsPage — Full product management page with table, search, filters, and CRUD modals.
 */
const ProductsPage = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct, loading, error, refetch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Filter products based on search + category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.color.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Handle add product
  const handleAddProduct = (data) => {
    onAddProduct({
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  // Handle edit product
  const handleEditProduct = (data) => {
    onUpdateProduct(data);
    setEditingProduct(null);
  };

  // Handle delete product
  const handleDeleteProduct = (id) => {
    onDeleteProduct(id);
    setShowDeleteConfirm(null);
  };

  const renderContent = () => {
    if (loading) return <LoadingSpinner label="Loading products..." />;
    if (error) return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    );
    if (products.length === 0) return (
      <EmptyState
        title="No products yet"
        description="Click 'Add Product' to start building your catalog."
      />
    );
    return (
      <ProductTable
        products={filteredProducts}
        onEdit={(p) => {
          setEditingProduct(p);
          setIsModalOpen(true);
        }}
        onDelete={(p) => setShowDeleteConfirm(p)}
      />
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            Manage your denim product catalog ({products.length} items)
          </p>
        </div>
        <button
          id="add-product-btn"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                     text-white bg-gradient-to-r from-primary-600 to-primary-700
                     hover:from-primary-700 hover:to-primary-800
                     shadow-lg shadow-primary-500/25 transition-all duration-200 hover:shadow-xl"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search + Filter */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search products by name, color, or description..."
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        filterOptions={CATEGORIES}
        filterLabel="Categories"
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filteredProducts.length}</span> of{' '}
          <span className="font-semibold text-gray-700">{products.length}</span> products
        </p>
      </div>

      {renderContent()}

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Product"
      >
        <ProductForm
          onSubmit={handleAddProduct}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
      >
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            onSubmit={handleEditProduct}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Product"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertIcon className="text-rose-600" />
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-btn"
              onClick={() => handleDeleteProduct(showDeleteConfirm)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-lg shadow-rose-500/25 transition-all"
            >
              Delete Product
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Simple alert icon for delete confirmation
const AlertIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default ProductsPage;
