import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/client';

const WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein',
  'welcome123',
  'abc12345',
  'iloveyou',
  'changeme',
  'dermas123',
]);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const errors = useMemo(() => {
    const next = {};
    if (!token) next.token = 'Invalid reset link. Please request a new one.';
    if (!password) next.password = 'New password is required.';
    else if (password.length < 12) next.password = 'Password must be at least 12 characters.';
    else if (!/[a-z]/.test(password)) next.password = 'Password must include at least one lowercase letter.';
    else if (!/[A-Z]/.test(password)) next.password = 'Password must include at least one uppercase letter.';
    else if (!/[0-9]/.test(password)) next.password = 'Password must include at least one number.';
    else if (!/[^A-Za-z0-9]/.test(password)) next.password = 'Password must include at least one special character.';
    else if (WEAK_PASSWORDS.has(password.trim().toLowerCase())) next.password = 'Choose a stronger password that is not commonly used.';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    return next;
  }, [password, confirmPassword, token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    setError('');
    setSuccess('');
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const { data } = await resetPassword(token, password);
      setSuccess(data?.message || 'Password updated successfully.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-amber-50/80 via-white to-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src="/dermas-logo.png" alt="Dermas Apparel" className="h-9 w-9 object-contain" />
          <span className="text-lg font-semibold text-slate-800">DERMAS APPAREL</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter a new password for your account.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {(error || errors.token) && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error || errors.token}</div>
          )}
          {success && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                className={`w-full px-4 py-3 pr-20 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                  touched.password && errors.password
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
                }`}
                placeholder="Min 12 chars with upper/lower/number/symbol"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.password && errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                className={`w-full px-4 py-3 pr-20 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
                }`}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700">
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(errors.token)}
            className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <i className="bi bi-arrow-repeat animate-spin" /> Updating...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          Back to{' '}
          <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
