import { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from './api';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await transactionAPI.getTransactions();
      setTransactions(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch transactions.');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction) => {
    try {
      const res = await transactionAPI.createTransaction(transaction);
      const newTransaction = res.data.data || res.data;
      setTransactions((prev) => [...prev, newTransaction]);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  return {
    transactions,
    setTransactions,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction,
  };
};
