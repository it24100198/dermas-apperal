import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { updateAccountSettingsPassword } from '../api/client';
import { useAuth } from '../context/AuthContext';

const passwordRuleText = 'Use at least 8 characters with upper/lowercase letters and numbers.';

export default function ForcePasswordChange() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const fieldErrors = useMemo(() => {
    const next = {};

    if (!form.currentPassword) next.currentPassword = 'Current temporary password is required.';
    if (!form.newPassword) next.newPassword = 'New password is required.';
    if (!form.confirmPassword) next.confirmPassword = 'Confirm your new password.';

    if (form.newPassword && form.newPassword.length < 8) {
      next.newPassword = 'New password must be at least 8 characters.';
    }

    if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword) {
      next.confirmPassword = 'Confirm password must match new password.';
    }

    return next;
  }, [form]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setError('');
    setSuccess('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setError('Please fix the highlighted fields before continuing.');
      return;
    }

    setSaving(true);
    try {
      await updateAccountSettingsPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      if (typeof updateUser === 'function') {
        updateUser((prev) => ({
          ...prev,
          mustChangePassword: false,
        }));
      }

      setSuccess('Password updated. Redirecting to dashboard...');
      setTimeout(() => navigate('/'), 700);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update password right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/60 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur md:p-7">
        <div className="mb-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <ShieldAlert size={20} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Password Update Required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Welcome {user?.name || user?.email || 'User'}. You must change your temporary password before accessing the system.
          </p>
        </div>

        {(error || success) && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <div className="flex items-start gap-2">
              {error ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
              <span>{error || success}</span>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Current Temporary Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => onChange('currentPassword', e.target.value)}
              className={`h-11 w-full rounded-2xl border bg-white px-3 text-sm text-slate-700 outline-none transition ${errors.currentPassword ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'}`}
              autoComplete="current-password"
            />
            {errors.currentPassword && <p className="mt-1 text-xs text-rose-600">{errors.currentPassword}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => onChange('newPassword', e.target.value)}
              className={`h-11 w-full rounded-2xl border bg-white px-3 text-sm text-slate-700 outline-none transition ${errors.newPassword ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'}`}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-slate-500">{passwordRuleText}</p>
            {errors.newPassword && <p className="mt-1 text-xs text-rose-600">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              className={`h-11 w-full rounded-2xl border bg-white px-3 text-sm text-slate-700 outline-none transition ${errors.confirmPassword ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'}`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-11 items-center rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <KeyRound size={15} />
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
