import { Navigate, Route, Routes } from 'react-router-dom'
import PrivateRoute from './components/common/PrivateRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import ExpenseList from './pages/expenses/ExpenseList'
import AddExpense from './pages/expenses/AddExpense'
import EditExpense from './pages/expenses/EditExpense'
import ExpenseDetails from './pages/expenses/ExpenseDetails'
import EmployeeList from './pages/employees/EmployeeList'
import AddEmployee from './pages/employees/AddEmployee'
import EmployeeDetails from './pages/employees/EmployeeDetails'
import ReimbursementList from './pages/reimbursements/ReimbursementList'
import AddReimbursement from './pages/reimbursements/AddReimbursement'
import ReimbursementDetails from './pages/reimbursements/ReimbursementDetails'
import RecurringExpenseList from './pages/recurring/RecurringExpenseList'
import AddRecurringExpense from './pages/recurring/AddRecurringExpense'
import FinancialReports from './pages/reports/FinancialReports'
import ProfitLoss from './pages/reports/ProfitLoss'
import Categories from './pages/settings/Categories'
import Vendors from './pages/settings/Vendors'
import { USER_ROLES } from './utils/constants'

const NotFound = () => (
  <div className="min-h-screen grid place-items-center bg-shell p-8">
    <div className="panel max-w-xl text-center">
      <h1 className="font-display text-4xl text-brand-navy">Page Not Found</h1>
      <p className="mt-3 text-slate-600">
        The page you requested does not exist.
      </p>
    </div>
  </div>
)

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/expenses/new" element={<AddExpense />} />
        <Route path="/expenses/:id" element={<ExpenseDetails />} />
        <Route path="/expenses/:id/edit" element={<EditExpense />} />

        <Route
          path="/employees"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HR]}>
              <EmployeeList />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HR]}>
              <AddEmployee />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.HR]}>
              <EmployeeDetails />
            </PrivateRoute>
          }
        />

        <Route path="/reimbursements" element={<ReimbursementList />} />
        <Route path="/reimbursements/new" element={<AddReimbursement />} />
        <Route path="/reimbursements/:id" element={<ReimbursementDetails />} />

        <Route
          path="/recurring-expenses"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT]}>
              <RecurringExpenseList />
            </PrivateRoute>
          }
        />
        <Route
          path="/recurring-expenses/new"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT]}>
              <AddRecurringExpense />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <PrivateRoute
              allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT]}
            >
              <FinancialReports />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports/profit-loss"
          element={
            <PrivateRoute
              allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT]}
            >
              <ProfitLoss />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings/categories"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT]}>
              <Categories />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings/vendors"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT]}>
              <Vendors />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
