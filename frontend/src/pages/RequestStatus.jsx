import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { lookupRegistrationRequestStatus } from '../api/client';

const statusStyle = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

const statusLabel = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function RequestStatus() {
  const [form, setForm] = useState({ email: '', requestId: '' });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const errors = useMemo(() => {
    const next = {};
    const email = form.email.trim();
    const requestId = form.requestId.trim();
    if (!email) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';
    if (!requestId) next.requestId = 'Request ID is required.';
    return next;
  }, [form.email, form.requestId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, requestId: true });
    setError('');
    setResult(null);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const { data } = await lookupRegistrationRequestStatus(form.email.trim(), form.requestId.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to find request status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-gradient-to-b from-amber-50/80 via-white to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-20 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl translate-x-1/3 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-lg w-full animate-fade-in-left">
          <div className="mb-10 flex items-center gap-3">
            <img src="/dermas-logo.png" alt="Dermas Apparel" className="h-10 w-10 object-contain" />
            <span className="text-xl font-semibold text-slate-800">DERMAS APPAREL</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">Check Request Status</h1>
          <p className="text-slate-500 text-sm mb-8">Use your email and Request ID to check approval progress.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                  touched.email && errors.email ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
                }`}
              />
              {touched.email && errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="requestId" className="block text-sm font-medium text-slate-700 mb-2">Request ID</label>
              <input
                id="requestId"
                name="requestId"
                value={form.requestId}
                onChange={handleChange}
                onBlur={() => setTouched((prev) => ({ ...prev, requestId: true }))}
                placeholder="Paste request ID"
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
                  touched.requestId && errors.requestId ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
                }`}
              />
              {touched.requestId && errors.requestId && <p className="mt-1 text-xs text-red-600">{errors.requestId}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-arrow-repeat animate-spin" /> Checking...
                </span>
              ) : (
                'Check Status'
              )}
            </button>
          </form>

          {result && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">Request Details</h2>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${statusStyle[result.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {statusLabel[result.status] || result.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Request ID</p>
                  <p className="font-mono text-slate-800">{String(result.requestId)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Requested Date</p>
                  <p className="text-slate-800">{formatDate(result.requestedAt)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Full Name</p>
                  <p className="text-slate-800">{result.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Requested Department</p>
                  <p className="text-slate-800">{result.requestedDepartment || '—'}</p>
                </div>
              </div>

              {result.status === 'pending' && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Your account request is still under review.
                </p>
              )}
              {result.status === 'approved' && (
                <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  Your request is approved. You can sign in now.
                </p>
              )}
              {result.status === 'rejected' && (
                <p className="text-sm text-rose-800 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  Your request was declined. {result.rejectionReason ? `Reason: ${result.rejectionReason}` : 'Please contact the administrator.'}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 text-sm text-slate-500 space-y-2">
            <p>
              Need to submit a new request?{' '}
              <Link to="/register" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">Request Access</Link>
            </p>
            <p>
              Already approved?{' '}
              <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden animate-fade-in-right">
        <img src="/login-bg.png" alt="Manufacturing" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/25" />
        <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Dermas Apparel ERP</p>
          <p className="mt-2 text-xl font-semibold">Track your request securely</p>
          <p className="mt-1 text-sm text-white/80">Check Pending Approval, Approved, or Rejected status anytime.</p>
        </div>
      </div>
    </div>
  );
}
