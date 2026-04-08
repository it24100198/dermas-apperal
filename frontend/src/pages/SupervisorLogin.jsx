import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/client';

export default function SupervisorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(email, password);
      const role = data.user?.role;
      if (role !== 'supervisor' && role !== 'admin') {
        setError('This login is for section supervisors only. Use the main ERP login for other roles.');
        setLoading(false);
        return;
      }
      login(data.user, data.token);
      navigate('/supervisor/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-gradient-to-b from-slate-50 via-white to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-slate-200/40 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 max-w-md w-full">
          <div className="mb-8 flex items-center gap-3">
            <img src="/dermas-logo.png" alt="" className="h-10 w-10 object-contain" />
            <span className="text-xl font-semibold text-slate-800">DERMAS APPAREL</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-1">Section supervisor</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in with your section supervisor email and password</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="sup-email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="sup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-400/40 focus:border-slate-400 outline-none transition-shadow"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sup-password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="sup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-400/40 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold disabled:opacity-60"
            >
              {loading ? <span className="inline-flex items-center gap-2"><i className="bi bi-arrow-repeat animate-spin" /> Signing in…</span> : 'Sign in to supervisor dashboard'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            <Link to="/login" className="text-slate-700 font-medium hover:underline">ERP staff login</Link>
            {' · '}
            <span className="text-slate-400">/supervisor/login</span>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-slate-700 to-slate-900 items-center justify-center p-12">
        <div className="text-center text-white/90 max-w-sm">
          <i className="bi bi-person-badge text-6xl mb-4 opacity-80" />
          <p className="text-xl font-medium">Your section dashboard</p>
          <p className="text-sm text-white/70 mt-2">Jobs on your line, hourly output, and line completion.</p>
        </div>
      </div>
    </div>
  );
}
