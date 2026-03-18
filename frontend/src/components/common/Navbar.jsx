import {
  Bars3Icon,
  BellIcon,
} from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

const titleMap = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expense Management',
  '/employees': 'Employee Management',
  '/reimbursements': 'Reimbursement Claims',
  '/recurring-expenses': 'Recurring Expenses',
  '/reports': 'Financial Reports',
  '/settings/categories': 'Expense Categories',
  '/settings/vendors': 'Vendors'
}

const Navbar = ({ setSidebarOpen }) => {
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)

  const matchedRoute = Object.keys(titleMap).find((route) =>
    location.pathname === route || location.pathname.startsWith(`${route}/`)
  )

  const pageTitle = matchedRoute ? titleMap[matchedRoute] : 'Expense Platform'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="h-16 px-4 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Expense And Employee</p>
            <h1 className="font-display text-lg text-brand-navy">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
          </button>
          <div className="rounded-lg border border-slate-200 px-3 py-1.5 bg-slate-50 text-right">
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'user'}</p>
            <p className="text-sm font-semibold text-brand-navy leading-tight">{user?.name || 'User'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

Navbar.propTypes = {
  setSidebarOpen: PropTypes.func.isRequired
}

export default Navbar