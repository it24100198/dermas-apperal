import { useState, useEffect } from 'react';
import { CATEGORIES, SIZES, COLORS } from '../../data/mockData';

/**
 * ProductForm — Form for adding or editing a product.
 * Rendered inside a Modal component.
 */
const ProductForm = ({ product, onSubmit, onClose }) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    size: '',
    color: '',
    price: '',
    quantity: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        size: product.size || '',
        color: product.color || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        description: product.description || '',
      });
    }
  }, [product]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.size) newErrors.size = 'Size is required';
    if (!formData.color) newErrors.color = 'Color is required';
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.quantity === '' || isNaN(formData.quantity) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      ...(product ? { id: product.id, createdAt: product.createdAt } : {}),
    });
  };

  // Shared input styles
  const inputClass = (field) => `
    w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
    ${errors[field] ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200 bg-white'}
    placeholder:text-gray-400
  `;

  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Product Name */}
      <div>
        <label htmlFor="product-name" className={labelClass}>Product Name</label>
        <input
          id="product-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Classic Slim Fit Jeans"
          className={inputClass('name')}
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
      </div>

      {/* Category + Size (2 col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product-category" className={labelClass}>Category</label>
          <select
            id="product-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={inputClass('category')}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="product-size" className={labelClass}>Size</label>
          <select
            id="product-size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className={inputClass('size')}
          >
            <option value="">Select size</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.size && <p className="text-xs text-rose-500 mt-1">{errors.size}</p>}
        </div>
      </div>

      {/* Color + Price (2 col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product-color" className={labelClass}>Color</label>
          <select
            id="product-color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className={inputClass('color')}
          >
            <option value="">Select color</option>
            {COLORS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.color && <p className="text-xs text-rose-500 mt-1">{errors.color}</p>}
        </div>

        <div>
          <label htmlFor="product-price" className={labelClass}>Price (LKR)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="e.g. 4500"
            min="0"
            className={inputClass('price')}
          />
          {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="product-quantity" className={labelClass}>Initial Quantity</label>
        <input
          id="product-quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="e.g. 50"
          min="0"
          className={inputClass('quantity')}
        />
        {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="product-description" className={labelClass}>Description</label>
        <textarea
          id="product-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief product description..."
          rows={3}
          className={`${inputClass('description')} resize-none`}
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
          id="product-submit-btn"
          type="submit"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25 transition-all duration-200 hover:shadow-xl"
        >
          {isEditing ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
