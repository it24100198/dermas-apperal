import { useState, useEffect, useCallback } from 'react';
import { productAPI } from './api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productAPI.getProducts();
      setProducts(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch products. Please check your connection.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product) => {
    try {
      const res = await productAPI.createProduct(product);
      const newProduct = res.data.data || res.data;
      setProducts((prev) => [...prev, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const res = await productAPI.updateProduct(updatedProduct.id || updatedProduct._id, updatedProduct);
      const data = res.data.data || res.data;
      setProducts((prev) =>
        prev.map((p) => (p.id === data.id || p._id === data._id ? { ...p, ...data } : p))
      );
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await productAPI.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => (p.id || p._id) !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const updateStock = async (productId, newQuantity) => {
    try {
      const res = await productAPI.updateStock(productId, { quantity: newQuantity });
      const data = res.data.data || res.data;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId || p._id === productId ? { ...p, quantity: data.quantity || newQuantity } : p))
      );
      return data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  };

  return {
    products,
    setProducts,
    loading,
    error,
    refetch: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
  };
};
