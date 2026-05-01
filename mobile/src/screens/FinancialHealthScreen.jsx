import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, formatCurrency, getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const MetricCard = ({ label, value, icon, color, lightColor }) => (
    <View style={[styles.metricCard, { borderTopColor: color, borderTopWidth: 3 }]}>
        <View style={[styles.metricIcon, { backgroundColor: lightColor }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
    </View>
);

const FinancialHealthScreen = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, recentExpenses: [] });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true); setError('');
            const [expRes, salesRes] = await Promise.allSettled([
                api.get('/expenses'),
                api.get('/sales/orders'),
            ]);
            const expenses = expRes.status === 'fulfilled' ? extractList(expRes.value.data, ['items']) : [];
            const sales = salesRes.status === 'fulfilled' ? extractList(salesRes.value.data, ['orders', 'items']) : [];
            const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
            const totalRevenue = sales.reduce((s, o) => s + Number(o.totalAmount || o.amount || 0), 0);
            setSummary({ totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses, recentExpenses: expenses.slice(0, 5) });
        } catch (e) {
            setError(getErrorMessage(e, 'Unable to load financial data.'));
        } finally { setLoading(false); }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

    const isProfit = summary.netProfit >= 0;
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}
            <View style={[styles.heroCard, { backgroundColor: isProfit ? colors.success : colors.danger }]}>
                <Text style={styles.heroLabel}>Net {isProfit ? 'Profit' : 'Loss'}</Text>
                <Text style={styles.heroValue}>{formatCurrency(Math.abs(summary.netProfit))}</Text>
                <View style={styles.heroRow}>
                    <Ionicons name={isProfit ? 'trending-up' : 'trending-down'} size={20} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.heroSub}>{isProfit ? 'In profit' : 'In loss'} this period</Text>
                </View>
            </View>
            <View style={styles.metricsGrid}>
                <MetricCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon="trending-up-outline" color={colors.success} lightColor={colors.successLight} />
                <MetricCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon="receipt-outline" color={colors.danger} lightColor={colors.dangerLight} />
            </View>
            {summary.recentExpenses.length > 0 ? (
                <View style={styles.recentSection}>
                    <Text style={styles.sectionLabel}>Recent Expenses</Text>
                    {summary.recentExpenses.map((item) => (
                        <View key={item._id} style={styles.expenseRow}>
                            <View style={styles.expenseDot} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.expenseDesc}>{item.description || item.category?.name || 'Expense'}</Text>
                                <Text style={styles.expenseVendor}>{item.vendorName || '—'}</Text>
                            </View>
                            <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
            <Text style={styles.footnote}>Data sourced from expense ledger and sales orders. Pull down to refresh.</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 12, marginBottom: 12, gap: 8 },
    errorText: { color: '#B91C1C', fontSize: 14, flex: 1 },
    heroCard: { borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
    heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    heroValue: { fontSize: 38, fontWeight: '900', color: '#FFF', marginTop: 4 },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
    metricCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
    metricIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    metricValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    metricLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    recentSection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow.sm },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
    expenseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    expenseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, marginRight: 12 },
    expenseDesc: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    expenseVendor: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    expenseAmount: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    footnote: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});

export default FinancialHealthScreen;
