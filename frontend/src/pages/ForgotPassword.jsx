import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const emailError = useMemo(() => {
    const value = email.trim();
    if (!value) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
    return '';
  }, [email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    setSuccess('');

    if (emailError) return;

    setLoading(true);
    try {
      const { data } = await forgotPassword(email.trim());
      setSuccess(data?.message || 'If an account with this email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to process request right now.');
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

        <h1 className="text-2xl font-bold text-slate-800">Forgot Password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your email to receive a password reset link.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                touched && emailError
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
              }`}
              placeholder="you@company.com"
              autoComplete="email"
            />
            {touched && emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <i className="bi bi-arrow-repeat animate-spin" /> Sending link...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
