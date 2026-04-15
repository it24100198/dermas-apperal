import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FinancialHealth from './pages/FinancialHealth';
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
import AccountRequests from './pages/AccountRequests';
import AccountSettings from './pages/AccountSettings';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
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
import StockProducts from './pages/StockProducts';
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
import SidebarTabsDemo from './pages/SidebarTabsDemo';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import RequestStatus from './pages/RequestStatus';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForcePasswordChange from './pages/ForcePasswordChange';
import { ROLES } from './utils/roles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 1000 },
  },
});

function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      Loading...
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoadingFallback />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.mustChangePassword && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }
  return children;
}

function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingFallback />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.mustChangePassword) return <Navigate to="/force-password-change" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children, redirectTo = '/' }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingFallback />;
  if (user) {
    if (user.mustChangePassword) return <Navigate to="/force-password-change" replace />;
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

function ForcePasswordChangeRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingFallback />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.mustChangePassword) return <Navigate to="/" replace />;
  return children;
}

function SupervisorProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingFallback />;
  if (!user) return <Navigate to="/supervisor/login" replace />;
  if (user.role !== 'supervisor' && user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/sidebar-demo" element={<SidebarTabsDemo />} />
      <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/request-status" element={<PublicRoute><RequestStatus /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="force-password-change" element={<ForcePasswordChangeRoute><ForcePasswordChange /></ForcePasswordChangeRoute>} />
      <Route path="/supervisor/login" element={<PublicRoute><SupervisorLogin /></PublicRoute>} />
      <Route
        path="/supervisor"
        element={
          <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}>
            <SupervisorLayout />
          </RoleRoute>
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
        <Route path="financial-health" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><FinancialHealth /></RoleRoute>} />
        <Route path="manufacturing/overview" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><ManufacturingOverview /></RoleRoute>} />
        <Route path="manufacturing/workflow" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><ManufacturingWorkflowBoard /></RoleRoute>} />
        <Route path="manufacturing/cutting" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><Cutting /></RoleRoute>} />
        <Route path="manufacturing/washing" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><Washing /></RoleRoute>} />
        <Route path="manufacturing/line-assignment" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><LineAssignment /></RoleRoute>} />
        <Route path="manufacturing/sections" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><SectionManagement /></RoleRoute>} />
        <Route path="manufacturing/qc" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><QcList /></RoleRoute>} />
        <Route path="manufacturing/qc/:transferId" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><QcDetail /></RoleRoute>} />
        <Route path="manufacturing/final" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><FinalList /></RoleRoute>} />
        <Route path="manufacturing/final/:jobId" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><FinalDetail /></RoleRoute>} />
        <Route path="jobs" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><JobsList /></RoleRoute>} />
        <Route path="jobs/create" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}><JobCreate /></RoleRoute>} />
        <Route path="jobs/:jobId" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><ErrorBoundary><JobDetail /></ErrorBoundary></RoleRoute>} />
        <Route path="production/hourly" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.OPERATOR]}><HourlyProduction /></RoleRoute>} />
        {/* Order Tracking */}
        <Route path="orders/dashboard" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><CustomerOrdersDashboard /></RoleRoute>} />
        <Route path="orders" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><CustomerOrdersList /></RoleRoute>} />
        <Route path="orders/new" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}><CustomerOrdersList /></RoleRoute>} />
        <Route path="orders/report" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><OrderReport /></RoleRoute>} />
        <Route path="orders/:orderId" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><CustomerOrderDetail /></RoleRoute>} />
        {/* Expense & Employee Management */}
        <Route path="expenses/categories" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><ExpenseCategories /></RoleRoute>} />
        <Route path="expenses" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><ExpenseList /></RoleRoute>} />
        <Route path="expenses/recurring" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><RecurringExpenses /></RoleRoute>} />
        <Route path="expenses/reimbursements" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.EMPLOYEE, ROLES.OPERATOR, ROLES.SUPERVISOR]}><ReimbursementClaims /></RoleRoute>} />
        <Route path="employees" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}><EmployeeManagement /></RoleRoute>} />
        <Route path="employees/account-requests" element={<RoleRoute allowedRoles={[ROLES.ADMIN]}><AccountRequests /></RoleRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="account-settings" element={<AccountSettings />} />
        {/* Purchase Management */}
        <Route path="purchase/suppliers" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><SupplierDatabase /></RoleRoute>} />
        <Route path="purchase/materials" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><MaterialCatalogPage /></RoleRoute>} />
        <Route path="purchase/requisitions" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><Requisitions /></RoleRoute>} />
        <Route path="purchase/orders" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><PurchaseOrders /></RoleRoute>} />
        <Route path="purchase/grn" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><GoodsReceived /></RoleRoute>} />
        <Route path="purchase/analytics" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><PurchaseAnalytics /></RoleRoute>} />
        {/* Stock Control */}
        <Route path="stock/adjustments" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><StockAdjustments /></RoleRoute>} />
        <Route path="stock/issuance"    element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.OPERATOR]}><MaterialIssuancePage /></RoleRoute>} />
        <Route path="stock/history"     element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><StockHistory /></RoleRoute>} />
        <Route path="stock/barcode"     element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.OPERATOR]}><BarcodeScanner /></RoleRoute>} />
        <Route path="stock/inventory"   element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><InventoryDashboard /></RoleRoute>} />
        <Route path="stock/products"    element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><StockProducts /></RoleRoute>} />
        {/* Sales & POS */}
        <Route path="sales/quotations" element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><Quotations /></RoleRoute>} />
        <Route path="sales/orders"     element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><SalesOrders /></RoleRoute>} />
        <Route path="sales/invoices"   element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><Invoices /></RoleRoute>} />
        <Route path="sales/delivery"   element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><DeliveryDispatch /></RoleRoute>} />
        <Route path="sales/returns"    element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><SalesReturns /></RoleRoute>} />
        <Route path="sales/analytics"  element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}><SalesAnalytics /></RoleRoute>} />
        {/* AI Production Intelligence */}
        <Route path="ai/dashboard"          element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><AIDashboard /></RoleRoute>} />
        <Route path="ai/wastage"             element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><WastagePrediction /></RoleRoute>} />
        <Route path="ai/efficiency"          element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><EfficiencyPrediction /></RoleRoute>} />
        <Route path="ai/suggestions"         element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><SmartSuggestions /></RoleRoute>} />
        <Route path="ai/worker-performance"  element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><WorkerPerformanceAI /></RoleRoute>} />
        <Route path="ai/alerts"              element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR]}><AlertsRecommendations /></RoleRoute>} />
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


