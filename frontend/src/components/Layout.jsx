import { useState } from 'react';
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
  { to: '/', label: 'Financial Health', icon: 'bi-graph-up-arrow' },
  { to: '/employees', label: 'Employees', icon: 'bi-people-fill' },
  { to: '/expenses/categories', label: 'Categories', icon: 'bi-folder-fill' },
  { to: '/expenses', label: 'All Expenses', icon: 'bi-receipt' },
  { to: '/expenses/recurring', label: 'Recurring Costs', icon: 'bi-arrow-repeat' },
  { to: '/expenses/reimbursements', label: 'Reimbursements', icon: 'bi-person-check-fill' },
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

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [manufacturingOpen, setManufacturingOpen] = useState(true);
  const [orderTrackingOpen, setOrderTrackingOpen] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(true);
  const [purchaseOpen, setPurchaseOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar - dark like screenshot */}
      <aside
        className={`${sidebarOpen ? 'w-56' : 'w-16'
          } bg-slate-800 text-white flex flex-col transition-all duration-200`}
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
        <nav className="flex-1 py-4 overflow-y-auto">
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
          {/* Expense & Employee section */}
          <div className="px-3 mt-5 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Expense & Employee'}
          </div>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => setExpenseOpen(!expenseOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-cash-stack text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Expense & Employee</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${expenseOpen ? 'rotate-180' : ''}`} />
              </button>
              {expenseOpen && (
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
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${isActive ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-cash-stack text-xl" />
            </NavLink>
          )}

          {/* Purchase Management section */}
          <div className="px-3 mt-5 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Purchase Management'}
          </div>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => setPurchaseOpen(!purchaseOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-cart3 text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Purchase Mgmt</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${purchaseOpen ? 'rotate-180' : ''}`} />
              </button>
              {purchaseOpen && (
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
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${isActive ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-cart3 text-xl" />
            </NavLink>
          )}

          <div className="px-3 mt-5 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Manufacturing'}
          </div>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => setManufacturingOpen(!manufacturingOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-gear-wide-connected text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Manufacturing</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${manufacturingOpen ? 'rotate-180' : ''}`} />
              </button>
              {manufacturingOpen && (
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
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${isActive ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-gear-wide-connected text-xl" />
            </NavLink>
          )}

          {/* Stock Control section */}
          <div className="px-3 mt-5 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Stock Control'}
          </div>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => setStockOpen(!stockOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-boxes text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Stock Control</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${stockOpen ? 'rotate-180' : ''}`} />
              </button>
              {stockOpen && (
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
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${isActive ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-boxes text-xl" />
            </NavLink>
          )}

          {/* Sales & POS section */}
          <div className="px-3 mt-5 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Sales & POS'}
          </div>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => setSalesOpen(!salesOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-cart-check text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Sales & POS</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${salesOpen ? 'rotate-180' : ''}`} />
              </button>
              {salesOpen && (
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
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${isActive ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-cart-check text-xl" />
            </NavLink>
          )}

          {/* Order Tracking section */}
          <div className="px-3 mt-5 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            {sidebarOpen && 'Order Tracking'}
          </div>
          {sidebarOpen ? (
            <>
              <button
                onClick={() => setOrderTrackingOpen(!orderTrackingOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg mx-2 mb-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-3">
                  <i className="bi bi-truck text-lg shrink-0 w-6 text-center group-hover:text-slate-200" />
                  <span className="font-medium">Order Tracking</span>
                </span>
                <i className={`bi bi-chevron-down shrink-0 text-slate-400 transition-transform duration-200 ${orderTrackingOpen ? 'rotate-180' : ''}`} />
              </button>
              {orderTrackingOpen && (
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
              className={({ isActive }) =>
                `flex items-center justify-center py-2.5 rounded-lg mx-2 mb-1 ${isActive ? 'bg-slate-600' : 'text-slate-300 hover:bg-slate-700'}`
              }
            >
              <i className="bi bi-truck text-xl" />
            </NavLink>
          )}

        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
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
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" aria-label="Apps">
              <i className="bi bi-grid-3x3-gap text-lg" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative transition-colors" aria-label="Notifications">
              <i className="bi bi-bell text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" aria-label="Settings">
              <i className="bi bi-gear text-lg" />
            </button>
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
              <i className="bi bi-person-circle text-slate-500 text-xl" />
              <span className="text-sm text-slate-600 truncate max-w-[120px]">{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
