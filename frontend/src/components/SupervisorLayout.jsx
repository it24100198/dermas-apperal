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
    <div className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,#f2f7fc_0%,#ecf3fa_100%)]">
      <header className="shrink-0 border-b border-slate-300/60 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
                `px-3 py-2 rounded-xl text-sm font-medium transition ${isActive ? 'bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/supervisor/hourly"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition ${isActive ? 'bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(14,116,144,0.92))] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
