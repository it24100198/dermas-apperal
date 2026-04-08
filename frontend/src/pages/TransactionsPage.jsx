import { useState, useMemo } from 'react';
import TransactionTable from '../components/transactions/TransactionTable';
import SearchBar from '../components/ui/SearchBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

/**
 * TransactionsPage — Transaction history with search and type filter.
 */
const TransactionsPage = ({ transactions, loading, error, refetch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((tx) => {
        const matchesSearch = tx.productName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesType = !typeFilter || tx.type === typeFilter;
        return matchesSearch && matchesType;
      });
  }, [transactions, searchTerm, typeFilter]);

  // Stats
  const stockInCount = transactions.filter((t) => t.type === 'in').length;
  const stockOutCount = transactions.filter((t) => t.type === 'out').length;

  const renderContent = () => {
    if (loading) return <LoadingSpinner label="Loading transactions..." />;
    if (error) return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    );
    if (transactions.length === 0) return (
      <EmptyState
        title="No transactions found"
        description="Transactions will appear here when you add or reduce stock."
      />
    );
    return <TransactionTable transactions={filteredTransactions} />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 mt-1">Stock movement history and records</p>
      </div>

      {/* Quick stats */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            typeFilter === ''
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All ({transactions.length})
        </button>
        <button
          onClick={() => setTypeFilter('in')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            typeFilter === 'in'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Stock In ({stockInCount})
        </button>
        <button
          onClick={() => setTypeFilter('out')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            typeFilter === 'out'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Stock Out ({stockOutCount})
        </button>
      </div>

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search transactions by product name..."
      />

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{filteredTransactions.length}</span>{' '}
        transactions
      </p>

      {renderContent()}
    </div>
  );
};

export default TransactionsPage;
