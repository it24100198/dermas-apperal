import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/client';

export default function Login() {
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
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-gradient-to-b from-amber-50/80 via-white to-white relative overflow-hidden">
        {/* Subtle animated gradient orbs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-20 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl translate-x-1/3 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-md w-full animate-fade-in-left">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <img
              src="/dermas-logo.png"
              alt="Dermas Apparel"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-semibold text-slate-800">DERMAS APPAREL</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-1">Login to your account</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to access the ERP</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 animate-fade-in" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none transition-all duration-200 shadow-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none transition-all duration-200 shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-arrow-repeat animate-spin" /> Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400">
            
          </p>
        </div>
      </div>

      {/* Right: Image */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden animate-fade-in-right">
        <img
          src="/login-bg.png"
          alt="Manufacturing"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = document.getElementById('login-bg-fallback');
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
        {/* Fallback if image missing */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 hidden" id="login-bg-fallback" aria-hidden="true">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/90 px-8">
              <i className="bi bi-gear-wide-connected text-6xl mb-4 opacity-60" />
              <p className="text-xl font-medium">Manufacturing ERP</p>
              <p className="text-sm text-white/70 mt-1">DERMAS APPAREL</p>
            </div>
          </div>
        </div>
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-slate-900/20" />
      </div>
    </div>
  );
}
