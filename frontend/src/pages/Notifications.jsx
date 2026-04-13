import { useMemo, useState } from 'react';
import { AlertCircle, ArrowDownWideNarrow, BadgeCheck, Bell, BellOff, Building2, CheckCheck, ChevronDown, CircleCheckBig, CircleEllipsis, CirclePlus, Clock3, Filter, Search, Settings2, Sparkles, Store, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const initialNotifications = [
  {
    id: 'notif-1',
    type: 'expenses',
    title: 'New Expense Added',
    description: 'Expense claim EXP-1042 was submitted by Accounts for review.',
    timestamp: '2 minutes ago',
    read: false,
    highPriority: true,
    icon: CirclePlus,
    actionLabel: 'Review',
  },
  {
    id: 'notif-2',
    type: 'approvals',
    title: 'Approval Pending',
    description: 'Travel allowance request requires finance approval before 5:00 PM.',
    timestamp: '8 minutes ago',
    read: false,
    highPriority: true,
    icon: CircleEllipsis,
    actionLabel: 'Open',
  },
  {
    id: 'notif-3',
    type: 'expenses',
    title: 'Expense Approved',
    description: 'Meal reimbursement request EXP-1035 was approved successfully.',
    timestamp: '21 minutes ago',
    read: true,
    highPriority: false,
    icon: CheckCheck,
    actionLabel: 'View',
  },
  {
    id: 'notif-4',
    type: 'employees',
    title: 'Employee Added',
    description: 'Employee profile created for Sewing Line Operator EMP-229.',
    timestamp: '42 minutes ago',
    read: false,
    highPriority: false,
    icon: UserPlus,
    actionLabel: 'Inspect',
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'System Alert',
    description: 'A scheduled sync detected a delay in the finance integration.',
    timestamp: '1 hour ago',
    read: false,
    highPriority: true,
    icon: AlertCircle,
    actionLabel: 'Check',
  },
  {
    id: 'notif-6',
    type: 'system',
    title: 'System Update',
    description: 'Expense and employee modules were updated successfully overnight.',
    timestamp: '3 hours ago',
    read: true,
    highPriority: false,
    icon: Sparkles,
    actionLabel: 'Details',
  },
  {
    id: 'notif-7',
    type: 'employees',
    title: 'Profile Updated',
    description: 'Contact details were updated for employee EMP-229.',
    timestamp: '4 hours ago',
    read: true,
    highPriority: false,
    icon: Building2,
    actionLabel: 'View',
  },
  {
    id: 'notif-8',
    type: 'expenses',
    title: 'Petty Cash Alert',
    description: 'Petty cash balance dropped below the configured threshold.',
    timestamp: '7 hours ago',
    read: false,
    highPriority: true,
    icon: BellOff,
    actionLabel: 'Review',
  },
];

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'employees', label: 'Employees' },
  { key: 'system', label: 'System' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const typeMeta = {
  approvals: { label: 'Approval', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  expenses: { label: 'Expense', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  employees: { label: 'Employee', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  system: { label: 'System', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const cardClass = 'rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur';

function SummaryCard({ label, value, icon: IconComponent, tone }) {
  return (
    <div className={`${cardClass} p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tone} shadow-sm`}>
          <IconComponent size={18} />
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ item, onClick }) {
  const IconComponent = item.icon;
  const meta = typeMeta[item.type] || typeMeta.system;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[28px] border px-5 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${item.read ? 'border-slate-200 bg-white' : 'border-sky-200 bg-sky-50/60 shadow-[0_12px_30px_rgba(59,130,246,0.08)]'}`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${item.read ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-sky-200 bg-white text-sky-700'}`}>
          <IconComponent size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-slate-950">{item.title}</h3>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${meta.color}`}>{meta.label}</span>
            {item.highPriority && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-700">High Priority</span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock3 size={14} />
              <span>{item.timestamp}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${item.read ? 'border-slate-200 bg-white text-slate-600' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
                {item.read ? 'Read' : 'Unread'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                {item.actionLabel}
                <ChevronDown size={12} className="rotate-[-90deg]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let items = notifications.filter((item) => {
      const matchesTab =
        activeTab === 'all'
          || (activeTab === 'unread' && !item.read)
          || (activeTab === 'read' && item.read)
          || item.type === activeTab;

      const matchesQuery = !normalizedQuery
        || [item.title, item.description, item.timestamp].some((field) => field.toLowerCase().includes(normalizedQuery));

      return matchesTab && matchesQuery;
    });

    items = items.slice().sort((left, right) => {
      const leftScore = initialNotifications.findIndex((item) => item.id === left.id);
      const rightScore = initialNotifications.findIndex((item) => item.id === right.id);
      return sortOrder === 'newest' ? leftScore - rightScore : rightScore - leftScore;
    });

    return items;
  }, [activeTab, notifications, query, sortOrder]);

  const totals = useMemo(() => {
    const unread = notifications.filter((item) => !item.read).length;
    const read = notifications.filter((item) => item.read).length;
    const highPriority = notifications.filter((item) => item.highPriority).length;
    return {
      total: notifications.length,
      unread,
      read,
      highPriority,
    };
  }, [notifications]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleClearRead = () => {
    setNotifications((prev) => prev.filter((item) => !item.read));
  };

  const handleNotificationClick = (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className={cardClass}>
        <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98),rgba(226,232,240,0.78))] px-6 py-7 md:px-8 md:py-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-sky-200/25 blur-3xl" />
            <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-slate-900/5 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                <Bell size={12} />
                Notifications
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Notifications</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Track all recent updates, approvals, reminders, and system alerts in one place.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleMarkAllAsRead} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800">
                <CheckCheck size={16} />
                Mark all as read
              </button>
              <button type="button" onClick={handleClearRead} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50">
                <BellOff size={16} />
                Clear read
              </button>
              <button type="button" onClick={() => navigate('/account-settings')} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50">
                <Settings2 size={16} />
                Notification Settings
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Notifications" value={totals.total} icon={Bell} tone="border-slate-200 bg-slate-900 text-white" />
        <SummaryCard label="Unread" value={totals.unread} icon={BellOff} tone="border-sky-200 bg-sky-50 text-sky-700" />
        <SummaryCard label="Read" value={totals.read} icon={CheckCheck} tone="border-emerald-200 bg-emerald-50 text-emerald-700" />
        <SummaryCard label="High Priority" value={totals.highPriority} icon={AlertCircle} tone="border-rose-200 bg-rose-50 text-rose-700" />
      </div>

      <section className={`${cardClass} p-5 md:p-6`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ${activeTab === tab.key ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-[240px] md:min-w-[320px]">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications"
                className="h-12 w-full rounded-2xl border border-slate-300/80 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80"
              />
            </div>

            <div className="relative">
              <ArrowDownWideNarrow size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="h-12 appearance-none rounded-2xl border border-slate-300/80 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100/80"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <NotificationItem key={item.id} item={item} onClick={() => handleNotificationClick(item.id)} />
          ))
        ) : (
          <div className={`${cardClass} flex flex-col items-center justify-center px-6 py-16 text-center`}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 shadow-sm">
              <Bell size={24} />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">No notifications found</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">There are no notifications for the current filter. Try switching tabs or clearing the search term.</p>
          </div>
        )}
      </section>
    </div>
  );
}