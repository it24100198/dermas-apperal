import { useState } from 'react';

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5';
const inputClass = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition';

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="pr-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function AccountSettings() {
  const [form, setForm] = useState({
    fullName: 'Admin User',
    email: 'admin@dermasapparel.com',
    phone: '+94 77 123 4567',
    employeeId: 'EMP-001',
    role: 'Administrator',
    department: 'Finance & HR',
    designation: 'Senior ERP Administrator',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    systemAlerts: true,
    darkMode: false,
  });

  const onFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, work details, security, and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className={cardClass}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Profile Information</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-xl font-semibold">
              {form.fullName.charAt(0)}
            </div>
            <button type="button" className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition w-fit">
              Change Photo
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input className={inputClass} value={form.fullName} onChange={(e) => onFieldChange('fullName', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => onFieldChange('email', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input className={inputClass} value={form.phone} onChange={(e) => onFieldChange('phone', e.target.value)} />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Work Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Employee ID</label>
              <input className={inputClass} value={form.employeeId} onChange={(e) => onFieldChange('employeeId', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input className={inputClass} value={form.role} onChange={(e) => onFieldChange('role', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input className={inputClass} value={form.department} onChange={(e) => onFieldChange('department', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input className={inputClass} value={form.designation} onChange={(e) => onFieldChange('designation', e.target.value)} />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Security Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input type="password" className={inputClass} value={form.currentPassword} onChange={(e) => onFieldChange('currentPassword', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input type="password" className={inputClass} value={form.newPassword} onChange={(e) => onFieldChange('newPassword', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input type="password" className={inputClass} value={form.confirmPassword} onChange={(e) => onFieldChange('confirmPassword', e.target.value)} />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="text-base font-semibold text-slate-800 mb-4">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Toggle
              checked={form.emailNotifications}
              onChange={() => onFieldChange('emailNotifications', !form.emailNotifications)}
              label="Email Notifications"
              hint="Receive updates for approvals and requests by email."
            />
            <Toggle
              checked={form.systemAlerts}
              onChange={() => onFieldChange('systemAlerts', !form.systemAlerts)}
              label="System Alerts"
              hint="Show in-app alerts for deadlines and critical updates."
            />
            <Toggle
              checked={form.darkMode}
              onChange={() => onFieldChange('darkMode', !form.darkMode)}
              label="Dark Mode"
              hint="Enable dark interface mode for low-light environments."
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" className="h-10 px-4 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" className="h-10 px-5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 shadow-sm transition">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
