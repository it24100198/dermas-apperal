import { createContext, useContext, useMemo, useState } from 'react';

const NotificationsContext = createContext(null);

const initialNotifications = [
  {
    id: 'n1',
    type: 'expenses',
    icon: 'bi-receipt-cutoff',
    title: 'New Expense Added',
    message: 'Expense claim EXP-1042 was submitted by Accounts.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'medium',
    actionLabel: 'Review Expense',
    actionPath: '/expenses',
  },
  {
    id: 'n2',
    type: 'approvals',
    icon: 'bi-hourglass-split',
    title: 'Approval Pending',
    message: 'Travel allowance request requires finance approval.',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'high',
    actionLabel: 'Open Approvals',
    actionPath: '/employees/account-requests',
  },
  {
    id: 'n3',
    type: 'expenses',
    icon: 'bi-check-circle',
    title: 'Expense Approved',
    message: 'Meal reimbursement request EXP-1035 was approved.',
    timestamp: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
    status: 'read',
    priority: 'low',
    actionLabel: 'View Expenses',
    actionPath: '/expenses',
  },
  {
    id: 'n4',
    type: 'approvals',
    icon: 'bi-x-circle',
    title: 'Approval Rejected',
    message: 'Fuel claim EXP-1031 was rejected due to missing receipt.',
    timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'high',
    actionLabel: 'Review Rejection',
    actionPath: '/expenses',
  },
  {
    id: 'n5',
    type: 'expenses',
    icon: 'bi-wallet2',
    title: 'Reimbursement Submitted',
    message: 'Reimbursement request was submitted by N. Perera.',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'medium',
    actionLabel: 'Open Reimbursements',
    actionPath: '/expenses/reimbursements',
  },
  {
    id: 'n6',
    type: 'system',
    icon: 'bi-arrow-repeat',
    title: 'System Update',
    message: 'Expense and employee modules were updated successfully.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'read',
    priority: 'low',
  },
  {
    id: 'n7',
    type: 'employees',
    icon: 'bi-person-plus',
    title: 'New Employee Added',
    message: 'Employee profile created for Sewing Line Operator.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'medium',
    actionLabel: 'Open Employees',
    actionPath: '/employees',
  },
  {
    id: 'n8',
    type: 'employees',
    icon: 'bi-person-gear',
    title: 'Profile Updated',
    message: 'Contact details were updated for employee EMP-229.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'read',
    priority: 'low',
    actionLabel: 'Open Employees',
    actionPath: '/employees',
  },
  {
    id: 'n9',
    type: 'system',
    icon: 'bi-calendar-check',
    title: 'Salary Reminder',
    message: 'Monthly payroll processing is due tomorrow at 10:00 AM.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'high',
  },
  {
    id: 'n10',
    type: 'system',
    icon: 'bi-exclamation-triangle',
    title: 'Petty Cash Alert',
    message: 'Petty cash balance dropped below the configured threshold.',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    status: 'unread',
    priority: 'high',
  },
];

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return 'Just now';

  const deltaSeconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(then));
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const isUnread = (item) => item.status === 'unread';

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id && isUnread(item) ? { ...item, status: 'read' } : item))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' })));
  };

  const clearRead = () => {
    setNotifications((prev) => prev.filter((item) => isUnread(item)));
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => isUnread(item)).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;
  const highPriorityCount = notifications.filter((item) => item.priority === 'high').length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        setNotifications,
        isUnread,
        markAsRead,
        markAllAsRead,
        clearRead,
        unreadCount,
        readCount,
        highPriorityCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
