import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UserSquare2,
} from 'lucide-react';
import { getAccountSettingsMe, updateAccountSettingsProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';

const cardClass = 'rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:p-6';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500';
const inputClass = 'h-11 w-full rounded-2xl border border-slate-300/90 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100';
const readOnlyInputClass = 'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600';
const inputErrorClass = 'border-rose-300 bg-rose-50/70 text-rose-900 focus:border-rose-400 focus:ring-rose-100';
const fieldErrorClass = 'mt-1 text-xs font-medium text-rose-600';

const allowedProfilePhotoTypes = ['image/jpeg', 'image/png'];
const maxProfilePhotoSize = 2 * 1024 * 1024;

const initialFormState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  profilePhoto: '',
  employeeId: '',
  role: '',
  department: '',
  designation: '',
  joinedDate: '',
  employmentStatus: '',
  lastLogin: '',
  notifications: true,
};

const formatDateLabel = (value) => {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
};

const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState(initialFormState);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoRemoved, setProfilePhotoRemoved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'AU';
  }, [form.fullName]);

  const hasUnsavedChanges = useMemo(() => {
    const profileChanged =
      form.fullName !== initialSnapshot.fullName ||
      form.email !== initialSnapshot.email ||
      form.phone !== initialSnapshot.phone ||
      form.address !== initialSnapshot.address ||
      form.dateOfBirth !== initialSnapshot.dateOfBirth;

    const photoChanged = Boolean(profilePhotoFile) || profilePhotoRemoved;

    return profileChanged || photoChanged;
  }, [form, initialSnapshot, profilePhotoFile, profilePhotoRemoved]);

  useEffect(() => () => clearAvatarObjectUrl(), []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await getAccountSettingsMe();
      const data = res.data?.data || {};

      const localAddress = String(user?.address || '').trim();
      const localDateOfBirth = toDateInputValue(user?.dateOfBirth);
      const accountStatus = user?.isActive === false ? 'Inactive' : 'Active';
      const joinedAt = user?.createdAt || '';
      const lastLogin = user?.lastLoginAt || user?.updatedAt || '';

      const nextState = {
        fullName: data.fullName || user?.name || '',
        email: data.email || user?.email || '',
        phone: data.phone || user?.phone || '',
        address: localAddress,
        dateOfBirth: localDateOfBirth,
        profilePhoto: data.profilePhoto || user?.profilePhoto || '',
        employeeId: data.employeeId || user?.employeeId || '',
        role: data.role || user?.role || '',
        department: data.department || user?.department || 'Not assigned',
        designation: data.designation || user?.role || 'Not specified',
        joinedDate: joinedAt,
        employmentStatus: accountStatus,
        lastLogin,
        notifications: Boolean(user?.preferences?.emailNotifications || user?.preferences?.systemAlerts),
      };

      setForm(nextState);
      setInitialSnapshot(nextState);
      setProfilePhotoFile(null);
      setProfilePhotoRemoved(false);
      setAvatarPreview(nextState.profilePhoto || '');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Profile endpoint was not found. Ensure backend account settings routes are running.');
      } else {
        setError(err.response?.data?.error || 'Unable to load profile information.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
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

  const onPhotoButtonClick = () => {
    profilePhotoInputRef.current?.click();
  };

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedProfilePhotoTypes.includes(file.type)) {
      event.target.value = '';
      setError('Only JPG and PNG images are allowed for the profile photo.');
      return;
    }

    if (file.size > maxProfilePhotoSize) {
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

  const onCancel = () => {
    clearAvatarObjectUrl();
    setForm(initialSnapshot);
    setProfilePhotoFile(null);
    setProfilePhotoRemoved(false);
    setAvatarPreview(initialSnapshot.profilePhoto || '');
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = '';
    }
    setError('');
    setFieldErrors({});
    setSuccess('Changes were reset.');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!String(form.fullName || '').trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    const emailValue = String(form.email || '').trim();
    if (!emailValue) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!String(form.phone || '').trim()) {
      nextErrors.phone = 'Phone number is required.';
    }

    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (Number.isNaN(dob.getTime())) {
        nextErrors.dateOfBirth = 'Please select a valid date of birth.';
      } else if (dob.getTime() > Date.now()) {
        nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
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

      const updatedSnapshot = {
        ...form,
        profilePhoto: savedProfilePhoto,
      };

      setForm(updatedSnapshot);
      setInitialSnapshot(updatedSnapshot);
      setProfilePhotoFile(null);
      setProfilePhotoRemoved(false);
      setAvatarPreview(savedProfilePhoto || '');

      if (typeof updateUser === 'function') {
        updateUser((prev) => ({
          ...prev,
          name: form.fullName,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          profilePhoto: savedProfilePhoto || '',
          address: form.address,
          dateOfBirth: form.dateOfBirth || '',
        }));
      }

      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = '';
      }

      setSuccess('Profile updated successfully.');
      setFieldErrors({});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-4">
        <div className="h-36 rounded-[28px] bg-slate-200/80" />
        <div className="h-52 rounded-[28px] bg-slate-200/80" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-52 rounded-[28px] bg-slate-200/80" />
          <div className="h-52 rounded-[28px] bg-slate-200/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] md:p-8 lg:p-9">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-200 shadow-md ring-4 ring-white sm:h-24 sm:w-24">
              {profilePhotoPreview ? (
                <img src={profilePhotoPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-600 text-2xl font-semibold uppercase tracking-wider text-white">
                  {initials}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">User Profile</p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-900 sm:text-3xl">{form.fullName || 'Admin User'}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">{form.role || 'Role not set'}</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">{form.designation || 'Designation not set'}</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">{form.department || 'Department not set'}</span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">Manage your personal profile and account details.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <UserSquare2 size={16} />
              Account Summary
            </div>
            <p className="mt-1">Keep your profile details up to date for team visibility and secure access control.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || success) && (
          <div
            className={`rounded-2xl border px-3.5 py-2.5 text-sm shadow-sm ${error ? 'border-rose-200 bg-rose-50/90 text-rose-700' : 'border-emerald-200 bg-emerald-50/90 text-emerald-700'}`}
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
              <h2 className="text-lg font-semibold tracking-tight">Personal Information</h2>
              <p className="text-sm text-slate-500">Primary contact details and optional personal profile fields.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className={`${inputClass} ${fieldErrors.fullName ? inputErrorClass : ''} pl-9`}
                  value={form.fullName}
                  onChange={(e) => onFieldChange('fullName', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.fullName && <p className={fieldErrorClass}>{fieldErrors.fullName}</p>}
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ''} pl-9`}
                  value={form.email}
                  onChange={(e) => onFieldChange('email', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.email && <p className={fieldErrorClass}>{fieldErrors.email}</p>}
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className={`${inputClass} ${fieldErrors.phone ? inputErrorClass : ''} pl-9`}
                  value={form.phone}
                  onChange={(e) => onFieldChange('phone', e.target.value)}
                  required
                />
              </div>
              {fieldErrors.phone && <p className={fieldErrorClass}>{fieldErrors.phone}</p>}
            </div>

            <div>
              <label className={labelClass}>Address (Optional)</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className={inputClass + ' pl-9'}
                  value={form.address}
                  onChange={(e) => onFieldChange('address', e.target.value)}
                  placeholder="Street, City, Country"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Date of Birth (Optional)</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  className={`${inputClass} ${fieldErrors.dateOfBirth ? inputErrorClass : ''} pl-9`}
                  value={form.dateOfBirth}
                  onChange={(e) => onFieldChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
              {fieldErrors.dateOfBirth && <p className={fieldErrorClass}>{fieldErrors.dateOfBirth}</p>}
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <BriefcaseBusiness size={17} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Work Information</h2>
              <p className="text-sm text-slate-500">Employee details associated with your account.</p>
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
            <div>
              <label className={labelClass}>Joined Date</label>
              <input className={readOnlyInputClass} value={formatDateLabel(form.joinedDate)} readOnly />
            </div>
            <div>
              <label className={labelClass}>Employment Status</label>
              <input className={readOnlyInputClass} value={form.employmentStatus || 'Active'} readOnly />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Camera size={17} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Profile Photo</h2>
              <p className="text-sm text-slate-500">Upload and manage the image shown across your admin dashboard.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-3.5 shadow-sm sm:p-5">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-200 shadow-md ring-2 ring-white sm:h-24 sm:w-24 sm:ring-4">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-600 text-2xl font-semibold uppercase tracking-wider text-white">
                    {initials}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <button
                  type="button"
                  onClick={onPhotoButtonClick}
                  className="inline-flex h-10 items-center rounded-2xl bg-slate-900 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 sm:h-11 sm:px-4"
                >
                  {profilePhotoPreview ? 'Change Profile Picture' : 'Upload Profile Picture'}
                </button>
                {(profilePhotoPreview || profilePhotoFile || (form.profilePhoto && !profilePhotoRemoved)) && (
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="block text-xs font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-xs text-slate-500">JPG or PNG, max 2MB</p>
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
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center gap-3 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <CheckCircle2 size={17} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Account Overview</h2>
              <p className="text-sm text-slate-500">Quick status summary of your account and access profile.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Role</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{form.role || 'Not assigned'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Account Status</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{form.employmentStatus || 'Active'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Last Login</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{formatDateLabel(form.lastLogin)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Notifications</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{form.notifications ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Quick Actions</h2>
              <p className="text-sm text-slate-500">Jump directly to account security and detailed settings.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/account-settings')}
                className="inline-flex h-11 items-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={() => navigate('/account-settings')}
                className="inline-flex h-11 items-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Go to Account Settings
              </button>
            </div>
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