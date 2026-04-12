import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BadgeCheck, BellRing, Building2, CheckCircle2, KeyRound, MoonStar, ShieldCheck, UserRound } from 'lucide-react';
import {
  getAccountSettingsMe,
  updateAccountSettingsPassword,
  updateAccountSettingsPreferences,
  updateAccountSettingsProfile,
} from '../api/client';

const cardClass = 'rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-sm';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';
const inputClass = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100';
const readOnlyInputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3 text-sm text-slate-600';

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  profilePhoto: '',
  employeeId: '',
  role: '',
  department: '',
  designation: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  preferences: {
    emailNotifications: true,
    systemAlerts: true,
    darkMode: false,
  },
};

function ToggleTile({ checked, onToggle, title, hint, icon }) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-slate-200 bg-white p-2 text-slate-600">
            <IconComponent size={15} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-800">{title}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
          </span>
        </div>
        <span
          role="switch"
          aria-checked={checked}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-1'}`}
          />
        </span>
      </div>
    </button>
  );
}

export default function AccountSettings() {
  const [form, setForm] = useState(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const profilePhotoInputRef = useRef(null);

  const initials = useMemo(() => {
    const name = String(form.fullName || '').trim();
    if (!name) return 'AU';
    const pieces = name.split(/\s+/).filter(Boolean);
    return (pieces[0]?.[0] || '') + (pieces[1]?.[0] || '');
  }, [form.fullName]);

  const loadAccountSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAccountSettingsMe();
      const data = res.data?.data || {};
      const nextState = {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        profilePhoto: data.profilePhoto || '',
        employeeId: data.employeeId || '',
        role: data.role || '',
        department: data.department || '',
        designation: data.designation || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        preferences: {
          emailNotifications: Boolean(data.preferences?.emailNotifications),
          systemAlerts: Boolean(data.preferences?.systemAlerts),
          darkMode: Boolean(data.preferences?.darkMode),
        },
      };
      setForm(nextState);
      setInitialSnapshot(nextState);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Account settings route was not found. Start the backend service from backend/src/app.js and ensure /api/account-settings routes are registered.');
      } else {
        setError(err.response?.data?.error || 'Unable to load account settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountSettings();
  }, []);

  const onFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onPreferenceToggle = (key) => {
    setForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key],
      },
    }));
  };

  const onCancel = () => {
    setForm({
      ...initialSnapshot,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setSuccess('Changes were reset.');
  };

  const hasPasswordInput = Boolean(form.currentPassword || form.newPassword || form.confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateAccountSettingsProfile({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        profilePhoto: form.profilePhoto,
      });

      if (hasPasswordInput) {
        await updateAccountSettingsPassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        });
      }

      await updateAccountSettingsPreferences({
        emailNotifications: form.preferences.emailNotifications,
        systemAlerts: form.preferences.systemAlerts,
        darkMode: form.preferences.darkMode,
      });

      const updatedSnapshot = {
        ...form,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      setForm(updatedSnapshot);
      setInitialSnapshot(updatedSnapshot);
      setSuccess('Account settings updated successfully.');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Account settings route was not found while saving. Verify backend /api/account-settings route registration.');
      } else {
        setError(err.response?.data?.error || 'Failed to update account settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl animate-pulse space-y-4">
        <div className="h-8 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 rounded bg-slate-200" />
        <div className="h-48 rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/60 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">User Preferences</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-[1.75rem]">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your profile, work details, security, and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || success) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          >
            <div className="flex items-start gap-2">
              {error ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
              <span>{error || success}</span>
            </div>
          </div>
        )}

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-2 text-slate-800">
            <UserRound size={17} />
            <h2 className="text-base font-semibold">Profile Information</h2>
          </div>

          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-200 text-slate-700">
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="inline-flex h-full w-full items-center justify-center text-lg font-semibold uppercase">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Profile Photo</p>
                <p className="text-xs text-slate-500">Use a direct image URL for your avatar.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.focus()}
              className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Change Photo
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                className={inputClass}
                value={form.fullName}
                onChange={(e) => onFieldChange('fullName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => onFieldChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => onFieldChange('phone', e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Profile Photo URL</label>
              <input
                ref={profilePhotoInputRef}
                className={inputClass}
                value={form.profilePhoto}
                onChange={(e) => onFieldChange('profilePhoto', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-2 text-slate-800">
            <Building2 size={17} />
            <h2 className="text-base font-semibold">Work Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Employee ID</label>
              <input className={readOnlyInputClass} value={form.employeeId} readOnly />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input className={readOnlyInputClass} value={form.role} readOnly />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input className={readOnlyInputClass} value={form.department} readOnly />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input className={readOnlyInputClass} value={form.designation} readOnly />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <ShieldCheck size={17} />
            <h2 className="text-base font-semibold">Security Settings</h2>
          </div>
          <p className="mb-4 text-xs text-slate-500">Leave blank if you do not want to change your password.</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Current Password</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  className={`${inputClass} pl-9`}
                  value={form.currentPassword}
                  onChange={(e) => onFieldChange('currentPassword', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                className={inputClass}
                value={form.newPassword}
                onChange={(e) => onFieldChange('newPassword', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                className={inputClass}
                value={form.confirmPassword}
                onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-2 text-slate-800">
            <BadgeCheck size={17} />
            <h2 className="text-base font-semibold">Preferences</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ToggleTile
              checked={form.preferences.emailNotifications}
              onToggle={() => onPreferenceToggle('emailNotifications')}
              title="Email Notifications"
              hint="Receive updates for approvals and requests by email."
              icon={BellRing}
            />
            <ToggleTile
              checked={form.preferences.systemAlerts}
              onToggle={() => onPreferenceToggle('systemAlerts')}
              title="System Alerts"
              hint="Show in-app alerts for deadlines and important actions."
              icon={BadgeCheck}
            />
            <ToggleTile
              checked={form.preferences.darkMode}
              onToggle={() => onPreferenceToggle('darkMode')}
              title="Dark Mode"
              hint="Enable dark interface mode for low-light environments."
              icon={MoonStar}
            />
          </div>
        </section>

        <div className="sticky bottom-0 z-10 -mx-1 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:mx-0 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
