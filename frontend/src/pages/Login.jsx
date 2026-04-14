import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/client';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const fieldErrors = useMemo(() => {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!validateEmail(form.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    }

    return errors;
  }, [form.email, form.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(fieldErrors).length > 0) return;

    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(form.email.trim(), form.password);
      login(data.user, data.token, form.rememberMe);
      navigate(data.user?.mustChangePassword ? '/force-password-change' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
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
          <div className="mb-10 flex items-center gap-3">
            <img
              src="/dermas-logo.png"
              alt="Dermas Apparel"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-semibold text-slate-800">DERMAS APPAREL</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">Login to your account</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to access the ERP workspace</p>

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
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@company.com"
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                  touched.email && fieldErrors.email
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
                }`}
                aria-invalid={Boolean(touched.email && fieldErrors.email)}
                aria-describedby="email-error"
              />
              {touched.email && fieldErrors.email && (
                <p id="email-error" className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-24 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                    touched.password && fieldErrors.password
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
                  }`}
                  aria-invalid={Boolean(touched.password && fieldErrors.password)}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-base`} />
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p id="password-error" className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Forgot password?
              </Link>
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

          <div className="mt-7 space-y-3 text-sm">
            <p className="text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                Register
              </Link>
            </p>
            <p className="text-slate-500">
              Waiting for approval?{' '}
              <Link to="/request-status" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                Check Request Status
              </Link>
            </p>
            <p>
              <Link to="/welcome" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <i className="bi bi-arrow-left" aria-hidden="true" />
                Back to Welcome
              </Link>
            </p>
          </div>
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
        <div className="absolute inset-0 bg-slate-900/25" />
        <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Dermas Apparel ERP</p>
          <p className="mt-2 text-xl font-semibold">Connected teams. Better production flow.</p>
          <p className="mt-1 text-sm text-white/80">Track jobs, inventory, and factory performance from one platform.</p>
        </div>
      </div>
    </div>
  );
}
