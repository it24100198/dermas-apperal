import { useEffect, useRef, useState } from 'react';

export default function ProfileDropdown({
  userName = 'Admin User',
  role = 'Administrator',
  avatarUrl = '',
  className = '',
  onMyProfile,
  onAccountSettings,
  onChangePassword,
  onHelpSupport,
  onLogout,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const runAction = (fn) => {
    setOpen(false);
    if (typeof fn === 'function') fn();
  };

  const initial = (userName || 'A').charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all duration-200"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${userName} avatar`}
            className="h-9 w-9 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <span className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 inline-flex items-center justify-center text-sm font-semibold">
            {initial}
          </span>
        )}

        <span className="hidden sm:flex sm:flex-col sm:items-start sm:leading-tight min-w-0">
          <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">{userName}</span>
          <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{role}</span>
        </span>

        <i className={`bi bi-chevron-down text-[11px] text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg z-30 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => runAction(onMyProfile)}
            className="w-full px-3 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <i className="bi bi-person text-slate-500" />
            My Profile
          </button>

          <button
            type="button"
            onClick={() => runAction(onAccountSettings)}
            className="w-full px-3 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <i className="bi bi-gear text-slate-500" />
            Account Settings
          </button>

          <button
            type="button"
            onClick={() => runAction(onChangePassword)}
            className="w-full px-3 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <i className="bi bi-shield-lock text-slate-500" />
            Change Password
          </button>

          <button
            type="button"
            onClick={() => runAction(onHelpSupport)}
            className="w-full px-3 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <i className="bi bi-life-preserver text-slate-500" />
            Help / Support
          </button>

          <div className="border-t border-slate-200" />

          <button
            type="button"
            onClick={() => runAction(onLogout)}
            className="w-full px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 transition-colors inline-flex items-center gap-2"
          >
            <i className="bi bi-box-arrow-right" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
