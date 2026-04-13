import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2' },
  { to: '/supervisor/dashboard', label: 'Supervisor', icon: 'bi-person-badge' },
];

const manufacturingItems = [
  { to: '/manufacturing/overview', label: 'Overview', icon: 'bi-pie-chart-fill' },
  { to: '/manufacturing/workflow', label: 'Workflow Board', icon: 'bi-kanban-fill' },
  { to: '/jobs', label: 'All Jobs', icon: 'bi-briefcase-fill' },
  { to: '/jobs/create', label: 'Material issue', icon: 'bi-box-seam' },
  { to: '/manufacturing/cutting', label: 'Cutting', icon: 'bi-scissors' },
  { to: '/manufacturing/line-assignment', label: 'Line assignment', icon: 'bi-list-task' },
  { to: '/manufacturing/sections', label: 'Sections & supervisors', icon: 'bi-diagram-3' },
  { to: '/manufacturing/washing', label: 'Washing gatepass', icon: 'bi-droplet' },
  { to: '/manufacturing/qc', label: 'QC Checking', icon: 'bi-clipboard-check' },
  { to: '/manufacturing/final', label: 'Final Checking', icon: 'bi-patch-check-fill' },
];

const orderTrackingItems = [
  { to: '/orders/dashboard', label: 'Dashboard', icon: 'bi-speedometer' },
  { to: '/orders', label: 'All Orders', icon: 'bi-cart3' },
  { to: '/orders/report', label: 'Report', icon: 'bi-graph-up-arrow' },
];

const expenseItems = [
  { to: '/financial-health', label: 'Financial Health', icon: 'bi-graph-up-arrow' },
  { to: '/expenses/categories', label: 'Categories', icon: 'bi-folder-fill' },
  { to: '/expenses', label: 'All Expenses', icon: 'bi-receipt' },
  { to: '/expenses/recurring', label: 'Recurring Costs', icon: 'bi-arrow-repeat' },
  { to: '/expenses/reimbursements', label: 'Reimbursements', icon: 'bi-person-check-fill' },
];

const employeeItems = [
  { to: '/employees', label: 'Employee Management', icon: 'bi-people-fill' },
  { to: '/employees/account-requests', label: 'Pending User Requests', icon: 'bi-person-lines-fill' },
];

const purchaseItems = [
  { to: '/purchase/suppliers', label: 'Suppliers', icon: 'bi-building' },
  { to: '/purchase/materials', label: 'Material Catalog', icon: 'bi-boxes' },
  { to: '/purchase/requisitions', label: 'Requisitions', icon: 'bi-clipboard-plus' },
  { to: '/purchase/orders', label: 'Purchase Orders', icon: 'bi-bag-check-fill' },
  { to: '/purchase/grn', label: 'Goods Received', icon: 'bi-box-arrow-in-down' },
  { to: '/purchase/analytics', label: 'Analytics', icon: 'bi-bar-chart-line-fill' },
];

const stockItems = [
  { to: '/stock/inventory',   label: 'Inventory Dashboard', icon: 'bi-speedometer2' },
  { to: '/stock/adjustments', label: 'Stock Adjustments', icon: 'bi-sliders' },
  { to: '/stock/issuance',    label: 'Material Issuance',  icon: 'bi-box-arrow-right' },
  { to: '/stock/history',    label: 'Stock History',      icon: 'bi-clock-history' },
  { to: '/stock/barcode',    label: 'Barcode Scanner',    icon: 'bi-upc-scan' },
];

const salesItems = [
  { to: '/sales/quotations', label: 'Quotations',           icon: 'bi-file-earmark-text' },
  { to: '/sales/orders',     label: 'Sales Orders',         icon: 'bi-bag-check' },
  { to: '/sales/invoices',   label: 'Invoices',             icon: 'bi-receipt' },
  { to: '/sales/delivery',   label: 'Delivery & Dispatch',  icon: 'bi-truck' },
  { to: '/sales/returns',    label: 'Sales Returns (RMA)',  icon: 'bi-arrow-return-left' },
  { to: '/sales/analytics',  label: 'Sales Analytics',      icon: 'bi-graph-up-arrow' },
];

const aiItems = [
  { to: '/ai/dashboard',         label: 'AI Dashboard',         icon: 'bi-cpu' },
  { to: '/ai/wastage',           label: 'Wastage Prediction',   icon: 'bi-recycle' },
  { to: '/ai/efficiency',        label: 'Efficiency AI',        icon: 'bi-speedometer2' },
  { to: '/ai/suggestions',       label: 'Smart Suggestions',    icon: 'bi-lightbulb' },
  { to: '/ai/worker-performance',label: 'Worker AI',            icon: 'bi-people' },
  { to: '/ai/alerts',            label: 'Alerts',               icon: 'bi-bell' },
];

const sampleNotifications = [
  {
    id: 'n1',
    icon: 'bi-receipt-cutoff',
    title: 'New Expense Added',
    message: 'Expense claim EXP-1042 was submitted by Accounts.',
    time: '2m ago',
    status: 'unread',
  },
  {
    id: 'n2',
    icon: 'bi-hourglass-split',
    title: 'Approval Pending',
    message: 'Travel allowance request requires finance approval.',
    time: '8m ago',
    status: 'unread',
  },
  {
    id: 'n3',
    icon: 'bi-check-circle',
    title: 'Expense Approved',
    message: 'Meal reimbursement request EXP-1035 was approved.',
    time: '21m ago',
    status: 'read',
  },
  {
    id: 'n4',
    icon: 'bi-x-circle',
    title: 'Expense Rejected',
    message: 'Fuel claim EXP-1031 was rejected due to missing receipt.',
    time: '34m ago',
    status: 'unread',
  },
  {
    id: 'n5',
    icon: 'bi-wallet2',
    title: 'Reimbursement Submitted',
    message: 'Reimbursement request was submitted by N. Perera.',
    time: '48m ago',
    status: 'unread',
  },
  {
    id: 'n6',
    icon: 'bi-arrow-repeat',
    title: 'System Update',
    message: 'Expense and employee modules were updated successfully.',
    time: '1h ago',
    status: 'read',
  },
  {
    id: 'n7',
    icon: 'bi-person-plus',
    title: 'New Employee Added',
    message: 'Employee profile created for Sewing Line Operator.',
    time: '2h ago',
    status: 'unread',
  },
  {
    id: 'n8',
    icon: 'bi-person-gear',
    title: 'Profile Updated',
    message: 'Contact details were updated for employee EMP-229.',
    time: '3h ago',
    status: 'read',
  },
  {
    id: 'n9',
    icon: 'bi-calendar-check',
    title: 'Salary Reminder',
    message: 'Monthly payroll processing is due tomorrow at 10:00 AM.',
    time: '5h ago',
    status: 'unread',
  },
  {
    id: 'n10',
    icon: 'bi-exclamation-triangle',
    title: 'Petty Cash Alert',
    message: 'Petty cash balance dropped below the configured threshold.',
    time: '7h ago',
    status: 'unread',
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('expense');
  const [aiOpen, setAiOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.fullName || user?.name || user?.email || 'Admin User';
  const displayRole = String(user?.role || 'Administrator')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const avatarUrl = user?.profilePhoto || '';
  const avatarInitial = (displayName || 'A').charAt(0).toUpperCase();

  const displayedNotifications = notifications;
  const isUnread = (item) => (item.status ? item.status === 'unread' : Boolean(item.unread));
  const unreadCount = displayedNotifications.filter((item) => isUnread(item)).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' })));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleModuleSelect = (moduleKey) => {
    setActiveModule(moduleKey);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar - dark like screenshot */}
      <aside
        className={`${sidebarOpen ? 'w-56' : 'w-16'
          } bg-slate-800 text-white flex flex-col transition-all duration-200 overflow-hidden`}
      >
        <div className={`p-4 border-b border-slate-700 flex items-center gap-2 min-h-[52px] ${sidebarOpen ? '' : 'justify-center'}`}>
          <img
            src="/dermas-logo.png"
            alt="Dermas Apparel"
            className="h-8 w-8 shrink-0 object-contain [filter:brightness(0)_invert(1)]"
          />
          {sidebarOpen && (
            <span className="font-semibold text-lg whitespace-nowrap overflow-hidden text-white">
              DERMAS APPAREL
            </span>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <div className="px-3 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Quick Access'}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors ${isActive ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <i className={`bi ${item.icon} text-lg shrink-0 w-6 text-center`} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
          {/* Expense Management module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('expense')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'expense' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-cash-stack text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Expenses </span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'expense' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'expense' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {expenseItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-rose-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/financial-health"
              end
              onClick={() => handleModuleSelect('expense')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'expense') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-cash-stack text-xl" />
            </NavLink>
          )}

          {/* Employee Management module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('employee')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'employee' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-people-fill text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Employees</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'employee' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'employee' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {employeeItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-indigo-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/employees"
              onClick={() => handleModuleSelect('employee')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'employee') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-people-fill text-xl" />
            </NavLink>
          )}

          {/* Purchase Management module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('purchase')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'purchase' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-cart3 text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Purchasing</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'purchase' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'purchase' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {purchaseItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-teal-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/purchase/suppliers"
              onClick={() => handleModuleSelect('purchase')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'purchase') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-cart3 text-xl" />
            </NavLink>
          )}

          {/* Manufacturing module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('manufacturing')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'manufacturing' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-gear-wide-connected text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Manufacturing</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'manufacturing' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'manufacturing' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {manufacturingItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-blue-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}

                  {/* ── AI Production Intelligence sub-submenu ── */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-700">
                    <button
                      onClick={() => setAiOpen(!aiOpen)}
                      className="flex items-center justify-between w-full pl-3 pr-2 py-2 rounded-lg mx-2 text-sm text-indigo-300 hover:bg-indigo-900/50 hover:text-white transition-colors group -ml-px"
                    >
                      <span className="flex items-center gap-2">
                        <i className="bi bi-cpu shrink-0 w-5 text-center text-indigo-400" />
                        <span className="font-medium">AI Insights</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full font-semibold">AI</span>
                      </span>
                      <i className={`bi bi-chevron-down text-indigo-400 text-xs transition-transform duration-200 ${aiOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {aiOpen && (
                      <div className="ml-3 pl-2 border-l border-indigo-600/40 space-y-0.5 mt-0.5">
                        {aiItems.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              `flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg mx-1 text-xs transition-colors border-l-2 -ml-px ${isActive
                                ? 'bg-indigo-700/60 text-white border-indigo-400'
                                : 'text-indigo-300 hover:bg-indigo-900/50 hover:text-white border-transparent'
                              }`
                            }
                          >
                            <i className={`bi ${item.icon} shrink-0 w-4 text-center opacity-90`} />
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/manufacturing/overview"
              onClick={() => handleModuleSelect('manufacturing')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'manufacturing') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-gear-wide-connected text-xl" />
            </NavLink>
          )}

          {/* Stock Control module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('stock')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'stock' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-boxes text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Stock Control</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'stock' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'stock' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {stockItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-teal-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/stock/adjustments"
              onClick={() => handleModuleSelect('stock')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'stock') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-boxes text-xl" />
            </NavLink>
          )}

          {/* Sales & POS module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('sales')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'sales' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-cart-check text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Sales & POS</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'sales' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'sales' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {salesItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-purple-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/sales/quotations"
              onClick={() => handleModuleSelect('sales')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'sales') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-cart-check text-xl" />
            </NavLink>
          )}

          {/* Order Tracking module */}
          {sidebarOpen ? (
            <>
              <button
                onClick={() => handleModuleSelect('orderTracking')}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 transition-colors group ${activeModule === 'orderTracking' ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-truck text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Order Tracking</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${activeModule === 'orderTracking' ? 'rotate-180' : ''}`} />
              </button>
              {activeModule === 'orderTracking' && (
                <div className="ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                  {orderTrackingItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/orders'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg mx-2 text-sm transition-colors border-l-2 -ml-px ${isActive
                          ? 'bg-slate-600 text-white border-emerald-400'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border-transparent'
                        }`
                      }
                    >
                      <i className={`bi ${item.icon} shrink-0 w-5 text-center opacity-90`} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/orders/dashboard"
              onClick={() => handleModuleSelect('orderTracking')}
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${(isActive || activeModule === 'orderTracking') ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-truck text-xl" />
            </NavLink>
          )}

        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list text-xl" />
          </button>
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search..."
              className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" aria-label="Apps">
              <i className="bi bi-grid-3x3-gap text-lg" />
            </button>
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen((prev) => !prev)}
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-700 inline-flex items-center justify-center relative transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:bg-slate-100"
                aria-label="Notifications for alerts, approvals, and updates"
                aria-expanded={notificationOpen}
                title="Alerts, approvals, and updates"
              >
                <i className="bi bi-bell text-[15px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-none inline-flex items-center justify-center ring-2 ring-white font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-[320px] max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white shadow-xl z-30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      <span className="text-xs text-slate-500">{unreadCount} unread</span>
                    </div>
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {displayedNotifications.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                        onClick={() => setNotificationOpen(false)}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`h-8 w-8 rounded-lg shrink-0 inline-flex items-center justify-center ${isUnread(item) ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            <i className={`bi ${item.icon || 'bi-bell'} text-sm`} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="text-[11px] text-slate-400">{item.time}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isUnread(item) ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-slate-500 border-slate-200 bg-white'}`}>
                                {isUnread(item) ? 'Unread' : 'Read'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                    <button
                      onClick={() => {
                        setNotificationOpen(false);
                        navigate('/notifications');
                      }}
                      className="text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/account-settings')}
              className="relative z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:translate-y-0 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              aria-label="Open account settings"
              title="Open account settings"
            >
              <i className="bi bi-gear text-[15px]" />
            </button>
            <div className="relative pl-2 md:pl-3" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all duration-200"
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
              >
                {avatarUrl && !avatarLoadFailed ? (
                  <img
                    src={avatarUrl}
                    alt={`${displayName} avatar`}
                    onError={() => setAvatarLoadFailed(true)}
                    className="h-9 w-9 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                ) : (
                  <span className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-sm font-semibold">
                    {avatarInitial}
                  </span>
                )}
                <span className="hidden sm:flex sm:flex-col sm:items-start sm:leading-tight min-w-0">
                  <span className="text-sm font-semibold text-slate-700 truncate max-w-[132px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{displayRole}</span>
                </span>
                <i className="bi bi-chevron-down text-[11px] text-slate-500" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors inline-flex items-center gap-2"
                  >
                    <i className="bi bi-person" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/account-settings');
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors inline-flex items-center gap-2"
                  >
                    <i className="bi bi-gear" />
                    Account Settings
                  </button>
                  <div className="my-1 border-t border-slate-200" />
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors inline-flex items-center gap-2"
                  >
                    <i className="bi bi-box-arrow-right" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
