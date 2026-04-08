import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';
import TransactionsPage from './pages/TransactionsPage';
import IssuancePage from './pages/IssuancePage';
import { useProducts } from './utils/useProducts';
import { useTransactions } from './utils/useTransactions';

/**
 * App — Root component with routing and global state management.
 * State is lifted to this level for products and transactions.
 */
function App() {
  const {
    products,
    setProducts,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock
  } = useProducts();

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    addTransaction
  } = useTransactions();

  // ===== Stock Operations =====

  const handleIssuanceCreated = (productId, quantityIssued) => {
    setProducts((prev) =>
      prev.map((p) => {
        if ((p.id || p._id) === productId) {
          return { ...p, quantity: p.quantity - quantityIssued };
        }
        return p;
      })
    );
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                products={products}
                transactions={transactions}
                loading={productsLoading || transactionsLoading}
                error={productsError || transactionsError}
                refetch={() => { refetchProducts(); refetchTransactions(); }}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductsPage
                products={products}
                loading={productsLoading}
                error={productsError}
                refetch={refetchProducts}
                onAddProduct={addProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
              />
            }
          />
          <Route
            path="/stock"
            element={
              <StockPage
                products={products}
                loading={productsLoading}
                error={productsError}
                refetch={refetchProducts}
                onUpdateStock={updateStock}
                onAddTransaction={addTransaction}
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <TransactionsPage
                transactions={transactions}
                loading={transactionsLoading}
                error={transactionsError}
                refetch={refetchTransactions}
              />
            }
          />
          <Route
            path="/issuances"
            element={
              <IssuancePage
                products={products}
                onIssuanceCreated={handleIssuanceCreated}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
