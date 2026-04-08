import { useState, useMemo } from 'react';
import {
  Package,
  Warehouse,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
} from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { LOW_STOCK_THRESHOLD } from '../data/mockData';

/**
 * Dashboard — Overview page with stats, recent activity, and low stock alerts.
 */
const Dashboard = ({ products, transactions, loading, error, refetch }) => {
  // Compute dashboard metrics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockItems = products.filter(
      (p) => p.quantity > 0 && p.quantity <= LOW_STOCK_THRESHOLD
    );
    const outOfStockItems = products.filter((p) => p.quantity === 0);
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    return {
      totalProducts,
      totalStock,
      lowStockItems,
      outOfStockItems,
      recentTransactions,
    };
  }, [products, transactions]);

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'red' };
    if (quantity <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock', color: 'yellow' };
    return { label: 'In Stock', color: 'green' };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <LoadingSpinner label="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  // Show EmptyState if neither products nor transactions exist
  if (products.length === 0 && transactions.length === 0) {
    return (
      <EmptyState
        title="No data found"
        description="Add some products or create transactions to view dashboard statistics."
      />
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your denim inventory and stock activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
          trend={12}
          trendUp={true}
          color="primary"
        />
        <StatsCard
          icon={Warehouse}
          label="Total Stock"
          value={stats.totalStock.toLocaleString()}
          trend={8}
          trendUp={true}
          color="green"
        />
        <StatsCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={stats.lowStockItems.length}
          trend={5}
          trendUp={false}
          color="yellow"
        />
        <StatsCard
          icon={ArrowLeftRight}
          label="Total Transactions"
          value={transactions.length}
          trend={15}
          trendUp={true}
          color="blue"
        />
      </div>

      {/* Bottom grid: Recent Activity + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-400">Latest stock transactions</p>
            </div>
            <TrendingUp size={20} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'in'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {tx.type === 'in' ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {tx.productName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{tx.notes}</p>
                </div>

                {/* Quantity + Date */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-sm font-bold ${
                      tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Stock Alerts</h2>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Items needing attention
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Out of stock items */}
            {stats.outOfStockItems.map((item) => {
              const status = getStockStatus(item.quantity);
              return (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category} · {item.size}</p>
                  </div>
                  <Badge status={status.label} color={status.color} />
                </div>
              );
            })}

            {/* Low stock items */}
            {stats.lowStockItems.map((item) => {
              const status = getStockStatus(item.quantity);
              return (
                <div
                  key={item.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-amber-50/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.category} · {item.quantity} left
                    </p>
                  </div>
                  <Badge status={status.label} color={status.color} />
                </div>
              );
            })}

            {stats.lowStockItems.length === 0 && stats.outOfStockItems.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-400">All items are well stocked 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
