import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManufacturingOverview from './pages/ManufacturingOverview';
import ManufacturingWorkflowBoard from './pages/ManufacturingWorkflowBoard';
import Cutting from './pages/Cutting';
import Washing from './pages/Washing';
import QcList from './pages/QcList';
import QcDetail from './pages/QcDetail';
import FinalList from './pages/FinalList';
import FinalDetail from './pages/FinalDetail';
import JobsList from './pages/JobsList';
import JobCreate from './pages/JobCreate';
import JobDetail from './pages/JobDetail';
import LineAssignment from './pages/LineAssignment';
import HourlyProduction from './pages/HourlyProduction';
import SupervisorDashboard from './pages/SupervisorDashboard';
import SupervisorLogin from './pages/SupervisorLogin';
import SupervisorLayout from './components/SupervisorLayout';
import SectionManagement from './pages/SectionManagement';
import CustomerOrdersDashboard from './pages/CustomerOrdersDashboard';
import CustomerOrdersList from './pages/CustomerOrdersList';
import CustomerOrderDetail from './pages/CustomerOrderDetail';
import OrderReport from './pages/OrderReport';
import ExpenseCategories from './pages/ExpenseCategories';
import ExpenseList from './pages/ExpenseList';
import RecurringExpenses from './pages/RecurringExpenses';
import ReimbursementClaims from './pages/ReimbursementClaims';
import EmployeeManagement from './pages/EmployeeManagement';
import SupplierDatabase from './pages/SupplierDatabase';
import MaterialCatalogPage from './pages/MaterialCatalog';
import Requisitions from './pages/Requisitions';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceived from './pages/GoodsReceived';
import PurchaseAnalytics from './pages/PurchaseAnalytics';
import StockAdjustments from './pages/StockAdjustments';
import MaterialIssuancePage from './pages/MaterialIssuance';
import StockHistory from './pages/StockHistory';
import BarcodeScanner from './pages/BarcodeScanner';
import InventoryDashboard from './pages/InventoryDashboard';
import Quotations from './pages/Quotations';
import SalesOrders from './pages/SalesOrders';
import Invoices from './pages/Invoices';
import DeliveryDispatch from './pages/DeliveryDispatch';
import SalesReturns from './pages/SalesReturns';
import SalesAnalytics from './pages/SalesAnalytics';
import AIDashboard from './pages/ai/AIDashboard';
import WastagePrediction from './pages/ai/WastagePrediction';
import EfficiencyPrediction from './pages/ai/EfficiencyPrediction';
import SmartSuggestions from './pages/ai/SmartSuggestions';
import WorkerPerformanceAI from './pages/ai/WorkerPerformanceAI';
import AlertsRecommendations from './pages/ai/AlertsRecommendations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 1000 },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function SupervisorProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/supervisor/login" replace />;
  if (user.role !== 'supervisor' && user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/supervisor/login" element={<SupervisorLogin />} />
      <Route
        path="/supervisor"
        element={
          <SupervisorProtectedRoute>
            <SupervisorLayout />
          </SupervisorProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="hourly" element={<HourlyProduction />} />
        <Route path="*" element={<Navigate to="/supervisor/dashboard" replace />} />
      </Route>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="manufacturing/overview" element={<ManufacturingOverview />} />
        <Route path="manufacturing/workflow" element={<ManufacturingWorkflowBoard />} />
        <Route path="manufacturing/cutting" element={<Cutting />} />
        <Route path="manufacturing/washing" element={<Washing />} />
        <Route path="manufacturing/line-assignment" element={<LineAssignment />} />
        <Route path="manufacturing/sections" element={<SectionManagement />} />
        <Route path="manufacturing/qc" element={<QcList />} />
        <Route path="manufacturing/qc/:transferId" element={<QcDetail />} />
        <Route path="manufacturing/final" element={<FinalList />} />
        <Route path="manufacturing/final/:jobId" element={<FinalDetail />} />
        <Route path="jobs" element={<JobsList />} />
        <Route path="jobs/create" element={<JobCreate />} />
        <Route path="jobs/:jobId" element={<ErrorBoundary><JobDetail /></ErrorBoundary>} />
        <Route path="production/hourly" element={<HourlyProduction />} />
        {/* Order Tracking */}
        <Route path="orders/dashboard" element={<CustomerOrdersDashboard />} />
        <Route path="orders" element={<CustomerOrdersList />} />
        <Route path="orders/new" element={<CustomerOrdersList />} />
        <Route path="orders/report" element={<OrderReport />} />
        <Route path="orders/:orderId" element={<CustomerOrderDetail />} />
        {/* Expense & Employee Management */}
        <Route path="expenses/categories" element={<ExpenseCategories />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="expenses/recurring" element={<RecurringExpenses />} />
        <Route path="expenses/reimbursements" element={<ReimbursementClaims />} />
        <Route path="employees" element={<EmployeeManagement />} />
        {/* Purchase Management */}
        <Route path="purchase/suppliers" element={<SupplierDatabase />} />
        <Route path="purchase/materials" element={<MaterialCatalogPage />} />
        <Route path="purchase/requisitions" element={<Requisitions />} />
        <Route path="purchase/orders" element={<PurchaseOrders />} />
        <Route path="purchase/grn" element={<GoodsReceived />} />
        <Route path="purchase/analytics" element={<PurchaseAnalytics />} />
        {/* Stock Control */}
        <Route path="stock/adjustments" element={<StockAdjustments />} />
        <Route path="stock/issuance"    element={<MaterialIssuancePage />} />
        <Route path="stock/history"     element={<StockHistory />} />
        <Route path="stock/barcode"     element={<BarcodeScanner />} />
        <Route path="stock/inventory"   element={<InventoryDashboard />} />
        {/* Sales & POS */}
        <Route path="sales/quotations" element={<Quotations />} />
        <Route path="sales/orders"     element={<SalesOrders />} />
        <Route path="sales/invoices"   element={<Invoices />} />
        <Route path="sales/delivery"   element={<DeliveryDispatch />} />
        <Route path="sales/returns"    element={<SalesReturns />} />
        <Route path="sales/analytics"  element={<SalesAnalytics />} />
        {/* AI Production Intelligence */}
        <Route path="ai/dashboard"          element={<AIDashboard />} />
        <Route path="ai/wastage"             element={<WastagePrediction />} />
        <Route path="ai/efficiency"          element={<EfficiencyPrediction />} />
        <Route path="ai/suggestions"         element={<SmartSuggestions />} />
        <Route path="ai/worker-performance"  element={<WorkerPerformanceAI />} />
        <Route path="ai/alerts"              element={<AlertsRecommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}


