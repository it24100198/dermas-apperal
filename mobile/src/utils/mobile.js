export function extractList(payload, preferredKeys = []) {
    if (Array.isArray(payload)) return payload;

    for (const key of preferredKeys) {
        if (Array.isArray(payload?.[key])) {
            return payload[key];
        }
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    return (
        error?.response?.data?.error ||
        error?.message ||
        fallback
    );
}

export function formatStatusLabel(value) {
    return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDateLabel(value) {
    if (!value) return 'Not set';

    try {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}

export function formatCurrency(value, currency = 'USD') {
    const amount = Number(value || 0);

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `$${amount.toFixed(0)}`;
    }
}

export function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

export function hasAnyRole(user, roles = []) {
    return roles.includes(user?.role);
}
