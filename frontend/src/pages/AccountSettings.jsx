import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BadgeCheck, BellRing, Building2, Camera, CheckCircle2, KeyRound, MoonStar, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import {
  getAccountSettingsMe,
  updateAccountSettingsPassword,
  updateAccountSettingsPreferences,
  updateAccountSettingsProfile,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

const cardClass = 'rounded-[28px] border border-slate-200/80 bg-white/95 p-5 md:p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500';
const inputClass = 'h-11 w-full rounded-2xl border border-slate-300/90 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100';
const readOnlyInputClass = 'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600';
const actionButtonClass = 'inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50';

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
  const { updateUser } = useAuth();
  const [form, setForm] = useState(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState(initialFormState);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoRemoved, setProfilePhotoRemoved] = useState(false);
  const [passwordChangeEnabled, setPasswordChangeEnabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const profilePhotoInputRef = useRef(null);
  const avatarObjectUrlRef = useRef('');

  const clearAvatarObjectUrl = () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = '';
    }
  };

  const setAvatarPreview = (preview, objectUrl = '') => {
    clearAvatarObjectUrl();
    avatarObjectUrlRef.current = objectUrl;
    setProfilePhotoPreview(preview);
  };

  const initials = useMemo(() => {
    const name = String(form.fullName || '').trim();
    if (!name) return 'AU';
    const pieces = name.split(/\s+/).filter(Boolean);
    return (pieces[0]?.[0] || '') + (pieces[1]?.[0] || '');
  }, [form.fullName]);

  const hasUnsavedChanges = useMemo(() => {
    const profileChanged =
      form.fullName !== initialSnapshot.fullName ||
      form.email !== initialSnapshot.email ||
      form.phone !== initialSnapshot.phone;

    const preferencesChanged =
      form.preferences.emailNotifications !== initialSnapshot.preferences.emailNotifications ||
      form.preferences.systemAlerts !== initialSnapshot.preferences.systemAlerts ||
      form.preferences.darkMode !== initialSnapshot.preferences.darkMode;

    const photoChanged = Boolean(profilePhotoFile) || profilePhotoRemoved;
    const passwordChanged = passwordChangeEnabled && Boolean(form.currentPassword || form.newPassword || form.confirmPassword);

    return profileChanged || preferencesChanged || photoChanged || passwordChanged;
  }, [form, initialSnapshot, passwordChangeEnabled, profilePhotoFile, profilePhotoRemoved]);

  useEffect(() => () => clearAvatarObjectUrl(), []);

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
      setProfilePhotoFile(null);
      setProfilePhotoRemoved(false);
      setAvatarPreview(nextState.profilePhoto || '');
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
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onChangePasswordMode = () => {
    setPasswordChangeEnabled(true);
    setError('');
    setSuccess('');
  };

  const clearPasswordChange = () => {
    setForm((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.currentPassword;
      delete next.newPassword;
      delete next.confirmPassword;
      return next;
    });
  };

  const onCancelPasswordChange = () => {
    clearPasswordChange();
    setPasswordChangeEnabled(false);
  };

  const onPhotoButtonClick = () => {
    profilePhotoInputRef.current?.click();
  };

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      event.target.value = '';
      setError('Only JPG and PNG images are allowed for the profile photo.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      event.target.value = '';
      setError('Profile photo must be 2MB or smaller.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setProfilePhotoFile(file);
    setProfilePhotoRemoved(false);
    setError('');
    setAvatarPreview(objectUrl, objectUrl);
  };

  const onRemovePhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoRemoved(true);
    setAvatarPreview('');
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = '';
    }
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
    clearAvatarObjectUrl();
    setForm({
      ...initialSnapshot,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setProfilePhotoFile(null);
    setProfilePhotoRemoved(false);
    setAvatarPreview(initialSnapshot.profilePhoto || '');
    setPasswordChangeEnabled(false);
    setFieldErrors({});
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = '';
    }
    setError('');
    setSuccess('Changes were reset.');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (passwordChangeEnabled) {
      if (!form.currentPassword) nextErrors.currentPassword = 'Current password is required.';
      if (!form.newPassword) nextErrors.newPassword = 'New password is required.';
      if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your new password.';
      if (form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Confirm password must match new password.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please correct the highlighted fields before saving.');
      return;
    }

    setSaving(true);

    try {
      const profilePayload = new FormData();
      profilePayload.append('fullName', form.fullName);
      profilePayload.append('email', form.email);
      profilePayload.append('phone', form.phone);

      if (profilePhotoFile) {
        profilePayload.append('profilePhotoFile', profilePhotoFile);
      } else {
        profilePayload.append('profilePhoto', profilePhotoRemoved ? '' : form.profilePhoto || '');
      }

      const profileRes = await updateAccountSettingsProfile(profilePayload);
      const savedProfilePhoto = profileRes.data?.data?.profilePhoto ?? (profilePhotoRemoved ? '' : form.profilePhoto || '');

      if (passwordChangeEnabled) {
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
        profilePhoto: savedProfilePhoto,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      setForm(updatedSnapshot);
      setInitialSnapshot(updatedSnapshot);
      setProfilePhotoFile(null);
      setProfilePhotoRemoved(false);
      setAvatarPreview(savedProfilePhoto || '');
      setPasswordChangeEnabled(false);
      clearPasswordChange();
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = '';
      }

      if (typeof updateUser === 'function') {
        updateUser((prev) => ({
          ...prev,
          fullName: form.fullName,
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          profilePhoto: savedProfilePhoto || '',
        }));
      }

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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(125deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">User Preferences</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-[2.25rem]">Account Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">Update your profile, work details, security, and preferences from a clean premium dashboard surface.</p>
          </div>
          <div className="flex flex-wrap gap-2.5 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <UserRound size={14} className="text-slate-500" />
              Profile
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <ShieldCheck size={14} className="text-slate-500" />
              Security
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <BellRing size={14} className="text-slate-500" />
              Preferences
            </span>
          </div>
        </div>
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
          <div className="mb-5 flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <UserRound size={17} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Profile Information</h2>
              <p className="text-sm text-slate-500">Update your personal details and avatar.</p>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-200 shadow-md ring-4 ring-white">
                  {profilePhotoPreview ? (
                    <img
                      src={profilePhotoPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarPreview('')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-600 text-2xl font-semibold uppercase tracking-wider text-white">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Profile Photo</p>
                    <p className="max-w-xl text-sm text-slate-500">Upload a square JPG or PNG to keep your admin profile sharp and consistent across the dashboard.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={onPhotoButtonClick}
                      className={`${actionButtonClass} bg-slate-900 text-white shadow-sm hover:bg-slate-800`}
                    >
                      <Upload size={16} />
                      {profilePhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={onRemovePhoto}
                      disabled={!profilePhotoPreview && !profilePhotoFile && !form.profilePhoto}
                      className={`${actionButtonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                    >
                      <Trash2 size={16} />
                      Remove Photo
                    </button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Recommended: square image, max 2MB</p>
                    <p className="text-xs text-slate-500">Accepted formats: JPG and PNG.</p>
                    {profilePhotoFile && <p className="text-xs font-medium text-slate-700">Selected file: {profilePhotoFile.name}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm lg:max-w-sm">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Camera size={16} />
                  Avatar Preview
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">Preview updates instantly when you choose a file, before you save the form.</p>
              </div>
            </div>
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={onPhotoChange}
            />
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
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Building2 size={17} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Work Information</h2>
              <p className="text-sm text-slate-500">Reference details linked to your employee profile.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
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
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4 text-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <ShieldCheck size={17} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Security Settings</h2>
                <p className="text-sm text-slate-500">Control password changes when you need them.</p>
              </div>
            </div>

            {!passwordChangeEnabled ? (
              <button
                type="button"
                onClick={onChangePasswordMode}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <KeyRound size={15} />
                Change Password
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelPasswordChange}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <KeyRound size={15} />
                Cancel Password Change
              </button>
            )}
          </div>

          <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: passwordChangeEnabled ? '280px' : '0px', opacity: passwordChangeEnabled ? 1 : 0 }}>
            <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>Current Password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    className={`${inputClass} ${fieldErrors.currentPassword ? 'border-rose-300 bg-rose-50/70 focus:border-rose-400 focus:ring-rose-100' : ''} pl-9`}
                    value={form.currentPassword}
                    onChange={(e) => onFieldChange('currentPassword', e.target.value)}
                  />
                </div>
                {fieldErrors.currentPassword && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.currentPassword}</p>}
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  className={`${inputClass} ${fieldErrors.newPassword ? 'border-rose-300 bg-rose-50/70 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                  value={form.newPassword}
                  onChange={(e) => onFieldChange('newPassword', e.target.value)}
                />
                {fieldErrors.newPassword && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.newPassword}</p>}
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  className={`${inputClass} ${fieldErrors.confirmPassword ? 'border-rose-300 bg-rose-50/70 focus:border-rose-400 focus:ring-rose-100' : ''}`}
                  value={form.confirmPassword}
                  onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
                />
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <BadgeCheck size={17} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
              <p className="text-sm text-slate-500">Tune how the system notifies and displays information for you.</p>
            </div>
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

        <div
          aria-hidden={!hasUnsavedChanges}
          className={`sticky bottom-0 z-10 -mx-1 overflow-hidden transition-all duration-300 ease-out sm:mx-0 ${hasUnsavedChanges ? 'mt-1 max-h-24 translate-y-0 opacity-100' : 'max-h-0 translate-y-3 opacity-0 pointer-events-none'}`}
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:flex sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="mt-2 h-11 w-full rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:mt-0 sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
