import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  HomeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ReceiptRefundIcon,
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { USER_ROLES } from '../../utils/constants'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import authService from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: Object.values(USER_ROLES) },
  { name: 'Expenses', href: '/expenses', icon: CurrencyDollarIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT] },
  { name: 'Employees', href: '/employees', icon: UserGroupIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.HR] },
  { name: 'Reimbursements', href: '/reimbursements', icon: ReceiptRefundIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.EMPLOYEE] },
  { name: 'Recurring', href: '/recurring-expenses', icon: ArrowPathIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT] },
  { name: 'Categories', href: '/settings/categories', icon: Cog6ToothIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT] },
  { name: 'Vendors', href: '/settings/vendors', icon: BuildingStorefrontIcon, roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT] },
]

const Sidebar = ({ open, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  )

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore logout API failures and clear local auth anyway.
    }

    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const sidebarContent = (
    <div className="h-full flex flex-col bg-brand-navy text-white">
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="font-display text-sm tracking-wide uppercase text-brand-yellow">Dermas Apparel</p>
          <p className="text-xs text-slate-300">Management System</p>
        </div>
        <button
          type="button"
          className="md:hidden text-slate-300 hover:text-white"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-4 text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
        Menu
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-yellow text-brand-navy'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:block md:w-64">
        {sidebarContent}
      </aside>

      <div className={`fixed inset-0 z-40 md:hidden ${open ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-brand-navy/40" onClick={onClose} />
        <aside className="absolute inset-y-0 left-0 w-64">
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}

Sidebar.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func
}

Sidebar.defaultProps = {
  open: false,
  onClose: () => {}
}

export default Sidebar