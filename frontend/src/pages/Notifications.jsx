import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Settings2,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { formatRelativeTime, useNotifications } from '../context/NotificationsContext';

const cardClass = 'rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.08)] md:p-6';

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'employees', label: 'Employees' },
  { key: 'system', label: 'System' },
];

const iconTone = {
  approvals: 'bg-amber-50 text-amber-700 border-amber-100',
  expenses: 'bg-sky-50 text-sky-700 border-sky-100',
  employees: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  system: 'bg-violet-50 text-violet-700 border-violet-100',
};

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    isUnread,
    markAsRead,
    markAllAsRead,
    clearRead,
    unreadCount,
    readCount,
    highPriorityCount,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const filteredNotifications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = notifications.filter((item) => {
      if (activeFilter === 'unread' && !isUnread(item)) return false;
      if (activeFilter === 'read' && isUnread(item)) return false;
      if (!['all', 'unread', 'read'].includes(activeFilter) && item.type !== activeFilter) return false;

      if (!term) return true;
      const haystack = `${item.title} ${item.message} ${item.type}`.toLowerCase();
      return haystack.includes(term);
    });

    filtered.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [notifications, activeFilter, searchTerm, sortOrder, isUnread]);

  const onOpenNotification = (item) => {
    markAsRead(item.id);
    if (item.actionPath) {
      navigate(item.actionPath);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.1)] md:p-8 lg:p-9">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Activity Center</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-[2.25rem]">Notifications</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Track all recent updates, approvals, reminders, and system alerts in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <CheckCheck size={15} />
              Mark all as read
            </button>
            <button
              type="button"
              onClick={clearRead}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <Trash2 size={15} />
              Clear read
            </button>
            <button
              type="button"
              onClick={() => navigate('/account-settings')}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <Settings2 size={15} />
              Notification Settings
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Notifications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{notifications.length}</p>
        </article>
        <article className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Unread</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{unreadCount}</p>
        </article>
        <article className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Read</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{readCount}</p>
        </article>
        <article className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">High Priority</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{highPriorityCount}</p>
        </article>
      </section>

      <section className={cardClass}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] uppercase transition ${
                  activeFilter === option.key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-11 rounded-2xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Notification List</h2>
          <p className="text-sm text-slate-500">{filteredNotifications.length} item(s)</p>
        </div>

        <div className="mt-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center">
              <Bell className="mx-auto text-slate-400" size={26} />
              <h3 className="mt-3 text-base font-semibold text-slate-800">No notifications found</h3>
              <p className="mt-1 text-sm text-slate-500">Try another filter, search term, or check back later for new updates.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const unread = isUnread(item);
              return (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenNotification(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenNotification(item);
                    }
                  }}
                  className={`rounded-2xl border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    unread
                      ? 'border-sky-200 bg-sky-50/40 shadow-sm hover:border-sky-300 hover:bg-sky-50/60'
                      : 'border-slate-200 bg-white opacity-85 hover:opacity-100 hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconTone[item.type] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      <i className={`bi ${item.icon || 'bi-bell'} text-base`} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-sm text-slate-600">{item.message}</p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            unread
                              ? 'border-sky-200 bg-sky-100 text-sky-700'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {unread ? 'Unread' : 'Read'}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 size={12} />
                          {formatRelativeTime(item.timestamp)}
                        </span>
                        {item.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            <ShieldAlert size={12} />
                            High Priority
                          </span>
                        )}
                        {item.actionLabel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenNotification(item);
                            }}
                            className="ml-auto inline-flex h-8 items-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            {item.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
