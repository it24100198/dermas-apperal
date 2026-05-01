// Dermas Apparel — Shared Design System
export const colors = {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#EFF6FF',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    purple: '#8B5CF6',
    purpleLight: '#EDE9FE',
    teal: '#14B8A6',
    tealLight: '#CCFBF1',
    orange: '#F97316',
    orangeLight: '#FFEDD5',
    bg: '#F3F4F6',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textBlue: '#1D4ED8',
};

export const shadow = {
    sm: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOpacity: 0.10,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    primary: {
        shadowColor: '#3B82F6',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const typography = {
    h1: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
    h2: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    h3: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    h4: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
    bodySmall: { fontSize: 14, color: colors.textSecondary },
    caption: { fontSize: 12, color: colors.textMuted },
    label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
};

// Reusable style blocks
export const commonStyles = {
    screen: { flex: 1, backgroundColor: colors.bg },
    listContent: { padding: spacing.md },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        ...shadow.sm,
    },
    headerCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadow.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadow.primary,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        color: colors.textPrimary,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: spacing.md,
    },
    modalView: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        maxHeight: '85%',
        ...shadow.lg,
    },
    emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: spacing.lg },
    badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.bg,
    },
};
