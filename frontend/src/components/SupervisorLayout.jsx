import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SupervisorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/supervisor/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/dermas-logo.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <span className="font-semibold text-slate-800">Section supervisor</span>
              <p className="text-xs text-slate-500">{user?.name || user?.email}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-3">
            <NavLink
              to="/supervisor/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/supervisor/hourly"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Hourly output
            </NavLink>
            {(user?.role === 'admin') && (
              <NavLink
                to="/"
                className="px-3 py-2 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50"
              >
                Full ERP
              </NavLink>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
