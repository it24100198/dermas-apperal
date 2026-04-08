export default function DelayAlertBanner({ expectedDeliveryDate, status, daysThreshold = 2 }) {
    if (status === 'delivered') return null;

    const now = new Date();
    const due = new Date(expectedDeliveryDate);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    const isDueSoon = diffDays >= 0 && diffDays <= daysThreshold;

    if (!isOverdue && !isDueSoon) return null;

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-4 ${isOverdue
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}
        >
            <i className={`bi ${isOverdue ? 'bi-exclamation-triangle-fill text-red-500' : 'bi-clock-history text-amber-500'} text-lg`} />
            <span>
                {isOverdue
                    ? `⚠ This order is ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue! Expected: ${new Date(expectedDeliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : `Delivery due in ${diffDays} day${diffDays !== 1 ? 's' : ''} — ${new Date(expectedDeliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            </span>
        </div>
    );
}
