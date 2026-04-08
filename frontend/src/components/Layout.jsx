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

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState('expense');
  const [aiOpen, setAiOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

        <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
