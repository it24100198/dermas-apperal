import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  Menu,
  X,
  Factory
} from 'lucide-react';
import dermasLogo from '../../assets/dermas-logo.svg';

// Navigation items for the sidebar
const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/stock', label: 'Stock Management', icon: Warehouse },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/issuances', label: 'Issuances', icon: Factory },
];

/**
 * Sidebar component with navigation links.
 * Collapsible on mobile via hamburger menu.
 */
const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-sidebar text-white shadow-lg hover:bg-sidebar-hover transition-colors"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 h-screen z-40 w-72 bg-sidebar text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:h-auto lg:min-h-screen lg:self-stretch
          flex flex-col shadow-2xl
        `}
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={dermasLogo}
              alt="Dermas Apparel logo"
              className="w-12 h-12 object-contain rounded-lg bg-white/95 p-1 shadow-lg"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Dermas Apparel</h1>
              <p className="text-xs text-blue-200 font-medium">Stock Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-sidebar-active text-white shadow-lg shadow-blue-950/40'
                      : 'text-blue-200 hover:bg-sidebar-hover hover:text-white'
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-blue-200' : ''
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse-slow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-blue-200 font-medium">Dermas Apparel</p>
            <p className="text-xs text-blue-300 mt-1">Management System v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
