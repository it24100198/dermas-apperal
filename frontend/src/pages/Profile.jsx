import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, BadgeCheck, BellRing, Camera, CheckCircle2, Clock3, KeyRound, Sparkles, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAccountSettingsMe, updateAccountSettingsProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';

const cardClass = 'group rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:p-7';
const labelClass = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500';
const inputClass = 'h-12 w-full rounded-2xl border border-slate-300/80 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/80';
const readOnlyInputClass = 'h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 shadow-sm';
const actionButtonClass = 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50';

function SectionHeader({ icon: IconComponent, title, description }) {
  return (
    <div className="mb-6 flex items-center gap-3 text-slate-900">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm shadow-slate-900/10">
        <IconComponent size={17} />
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">{title}</h2>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

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
  lastLoginAt: '',
  employmentStatus: '',
};

const profileEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const profilePhoneRegex = /^\+?[0-9()\-\s]{7,20}$/;

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
};

function SummaryCard({ icon: IconComponent, label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)]">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10">
          <IconComponent size={15} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialFormState);
  const [initialSnapshot, setInitialSnapshot] = useState(initialFormState);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoRemoved, setProfilePhotoRemoved] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
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
    const name = String(form.fullName || user?.name || user?.email || 'A').trim();
    const pieces = name.split(/\s+/).filter(Boolean);
    return ((pieces[0]?.[0] || 'A') + (pieces[1]?.[0] || '')).toUpperCase();
  }, [form.fullName, user?.email, user?.name]);

  const hasUnsavedChanges = useMemo(() => {
    const textChanged =
      form.fullName !== initialSnapshot.fullName ||
      form.email !== initialSnapshot.email ||
      form.phone !== initialSnapshot.phone ||
      form.address !== initialSnapshot.address ||
      form.dateOfBirth !== initialSnapshot.dateOfBirth;

    const photoChanged = Boolean(profilePhotoFile) || profilePhotoRemoved;
    return textChanged || photoChanged;
  }, [form, initialSnapshot, profilePhotoFile, profilePhotoRemoved]);

  useEffect(() => () => clearAvatarObjectUrl(), []);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAccountSettingsMe();
        const data = res.data?.data || {};
        const nextState = {
          fullName: data.fullName || user?.fullName || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || user?.phone || '',
          address: data.address || user?.address || '',
          dateOfBirth: formatDateInput(data.dateOfBirth || user?.dateOfBirth || ''),
          profilePhoto: data.profilePhoto || user?.profilePhoto || '',
          employeeId: data.employeeId || '',
          role: data.role || user?.role || '',
          department: data.department || '',
          designation: data.designation || '',
          joinedDate: data.joinedDate || user?.createdAt || '',
          lastLoginAt: data.lastLoginAt || user?.lastLoginAt || '',
          employmentStatus: data.employmentStatus || (user?.isActive ? 'Active' : 'Inactive'),
        };

        setForm(nextState);
        setInitialSnapshot(nextState);
        setProfilePhotoFile(null);
        setProfilePhotoRemoved(false);
        setAvatarLoadFailed(false);
        setAvatarPreview(nextState.profilePhoto || '');
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const onFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    setAvatarLoadFailed(false);
    setAvatarPreview(objectUrl, objectUrl);
  };

  const onRemovePhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoRemoved(true);
    setAvatarLoadFailed(false);
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
    setAvatarLoadFailed(false);
    setAvatarPreview(initialSnapshot.profilePhoto || '');
    if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
    setError('');
    setSuccess('Changes were reset.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasUnsavedChanges) {
      setSuccess('No changes to save.');
      return;
    }

    const fullName = String(form.fullName || '').trim();
    const email = String(form.email || '').trim().toLowerCase();
    const phone = String(form.phone || '').trim();
    const address = String(form.address || '').trim();
    const dateOfBirth = String(form.dateOfBirth || '').trim();

    if (fullName.length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    if (!profileEmailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!profilePhoneRegex.test(phone)) {
      setError('Please provide a valid phone number.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      payload.append('fullName', fullName);
      payload.append('email', email);
      payload.append('phone', phone);
      payload.append('address', address);
      payload.append('dateOfBirth', dateOfBirth);

      if (profilePhotoFile) {
        payload.append('profilePhotoFile', profilePhotoFile);
      } else {
        payload.append('profilePhoto', profilePhotoRemoved ? '' : form.profilePhoto || '');
      }

      const res = await updateAccountSettingsProfile(payload);
      const savedProfilePhoto = res.data?.data?.profilePhoto ?? (profilePhotoRemoved ? '' : form.profilePhoto || '');
      const updatedSnapshot = {
        ...form,
        profilePhoto: savedProfilePhoto,
      };

      setForm(updatedSnapshot);
      setInitialSnapshot(updatedSnapshot);
      setProfilePhotoFile(null);
      setProfilePhotoRemoved(false);
      setAvatarLoadFailed(false);
      setAvatarPreview(savedProfilePhoto || '');
      if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';

      if (typeof updateUser === 'function') {
        updateUser((prev) => ({
          ...prev,
          fullName,
          name: fullName,
          email,
          phone,
          address,
          dateOfBirth,
          profilePhoto: savedProfilePhoto || '',
        }));
      }

      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl animate-pulse space-y-4">
        <div className="h-40 rounded-[32px] bg-slate-200/80" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-60 rounded-[28px] bg-slate-200/80" />
          <div className="h-60 rounded-[28px] bg-slate-200/80" />
        </div>
      </div>
    );
  }

  const displayRole = String(form.role || user?.role || 'Administrator')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="relative overflow-hidden rounded-[38px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98),rgba(226,232,240,0.85))] px-6 py-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur md:px-8 md:py-10 lg:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-14 top-0 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-52 w-52 rounded-full bg-slate-900/8 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-200/25 blur-3xl" />
        </div>

        <div className="relative grid gap-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            <button
              type="button"
              onClick={onPhotoButtonClick}
              className="group relative h-36 w-36 shrink-0 overflow-hidden rounded-full border border-white/90 bg-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-8 ring-white/80 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(15,23,42,0.2)] focus:outline-none focus:ring-4 focus:ring-sky-100 md:h-40 md:w-40"
              aria-label="Change profile photo"
            >
              {profilePhotoPreview && !avatarLoadFailed ? (
                <img
                  src={profilePhotoPreview}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 text-3xl font-semibold uppercase tracking-[0.16em] text-white">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition duration-300 group-hover:bg-slate-950/35 group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                  <Camera size={15} />
                  Change Photo
                </div>
              </div>
            </button>

            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                  <Sparkles size={12} />
                  Profile
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                  <CheckCircle2 size={12} />
                  Active
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[3.25rem]">{form.fullName || 'Admin User'}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm">{displayRole}</span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm">{form.designation || form.department || 'Account details'}</span>
              </div>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-[1.03rem]">A refined workspace for managing your profile, identity, and account details with a premium dashboard feel.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1 shadow-sm">Employee ID: {form.employeeId || '—'}</span>
                <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1 shadow-sm">Joined {formatDateLabel(form.joinedDate)}</span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[28px] border border-slate-200/80 bg-white/75 px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                  <Camera size={12} />
                  Avatar
                </span>
                <span className="text-sm text-slate-500">Click the profile photo to change it. Instant preview is supported.</span>
                {profilePhotoFile && <span className="text-xs font-medium text-slate-700">Selected file: {profilePhotoFile.name}</span>}
              </div>

              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={onPhotoChange}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || success) && (
          <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            <div className="flex items-start gap-2">
              {error ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
              <span>{error || success}</span>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={cardClass}>
            <SectionHeader icon={UserRound} title="Personal Information" description="Update your public profile details and contact information." />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={form.fullName} onChange={(e) => onFieldChange('fullName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input className={inputClass} type="email" value={form.email} onChange={(e) => onFieldChange('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input className={inputClass} value={form.phone} onChange={(e) => onFieldChange('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input className={inputClass} type="date" value={form.dateOfBirth} onChange={(e) => onFieldChange('dateOfBirth', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-slate-300/90 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.address}
                  onChange={(e) => onFieldChange('address', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <SectionHeader icon={ShieldCheck} title="Work Information" description="Employment details linked to your account." />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Employee ID</label>
                <input className={readOnlyInputClass} value={form.employeeId} readOnly />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <input className={readOnlyInputClass} value={displayRole} readOnly />
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <input className={readOnlyInputClass} value={form.department || '—'} readOnly />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input className={readOnlyInputClass} value={form.designation || '—'} readOnly />
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
            <SectionHeader icon={KeyRound} title="Quick Actions" description="Fast access to security and account settings." />

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => navigate('/account-settings')} className={`${actionButtonClass} justify-center border border-slate-900 bg-slate-900 text-white hover:bg-slate-800`}>
                <KeyRound size={16} />
                Change Password
                <ArrowRight size={15} className="ml-1 opacity-80" />
              </button>
              <button type="button" onClick={() => navigate('/account-settings')} className={`${actionButtonClass} justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
                <BadgeCheck size={16} />
                Go to Account Settings
                <ArrowRight size={15} className="ml-1 opacity-70" />
              </button>
            </div>
          </section>

          <section className={cardClass}>
            <SectionHeader icon={BadgeCheck} title="Account Overview" description="A quick snapshot of your account." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard icon={ShieldCheck} label="Role" value={displayRole} />
              <SummaryCard icon={BadgeCheck} label="Account Status" value={form.employmentStatus || 'Active'} />
              <SummaryCard icon={Clock3} label="Last Login" value={formatDateLabel(form.lastLoginAt)} />
              <SummaryCard icon={BellRing} label="Notifications" value={String(user?.preferences?.emailNotifications ? 'Enabled' : 'Disabled')} />
            </div>
          </section>
        </div>

        <div
          aria-hidden={!hasUnsavedChanges}
          className={`sticky bottom-0 z-10 -mx-1 overflow-hidden transition-all duration-300 ease-out sm:mx-0 ${hasUnsavedChanges ? 'mt-1 max-h-24 translate-y-0 opacity-100' : 'max-h-0 translate-y-3 opacity-0 pointer-events-none'}`}
        >
          <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:flex sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="mt-2 h-12 w-full rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:mt-0 sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}