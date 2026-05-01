import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { extractList, formatStatusLabel, getErrorMessage, hasAnyRole } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const EmployeesScreen = () => {
    const { user } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const canAccess = hasAnyRole(user, ['admin', 'manager']);

    useEffect(() => {
        if (!canAccess) { setLoading(false); return; }
        fetchData();
    }, [canAccess]);

    const fetchData = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/employees');
            setItems(extractList(res.data, ['employees', 'items']));
        } catch (e) { setError(getErrorMessage(e, 'Unable to load employees.')); }
        finally { setLoading(false); }
    };

    if (!canAccess) {
        return (
            <View style={styles.restrictedBox}>
                <Ionicons name="lock-closed-outline" size={36} color={colors.textMuted} />
                <Text style={styles.restrictedTitle}>Restricted Access</Text>
                <Text style={styles.restrictedText}>Only admins and managers can view employee records.</Text>
            </View>
        );
    }

    const getStatusColor = (s) => {
        if (s === 'active') return { bg: colors.successLight, text: colors.success };
        if (s === 'inactive') return { bg: '#F3F4F6', text: colors.textMuted };
        return { bg: colors.warningLight, text: colors.warning };
    };

    const renderItem = ({ item }) => {
        const sc = getStatusColor(item.status);
        const section = item.productionSection?.name || item.productionSection?.slug || '—';
        return (
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.user?.name || item.name || 'E')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.user?.name || item.name || 'Employee'}</Text>
                    <Text style={styles.cardMeta}>{formatStatusLabel(item.role || item.user?.role || 'employee')} · ID: {item.employeeId || '—'}</Text>
                    <Text style={styles.cardSection}>Section: {section}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{formatStatusLabel(item.status || 'active')}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading && items.length === 0 ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> : (
                <FlatList
                    data={items} keyExtractor={i => i._id} renderItem={renderItem}
                    contentContainerStyle={styles.list} refreshing={loading} onRefresh={fetchData}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.summary}>
                                <Ionicons name="people-outline" size={22} color={colors.primary} />
                                <Text style={styles.summaryText}>{items.length} employee{items.length !== 1 ? 's' : ''} on record</Text>
                            </View>
                            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
                        </View>
                    }
                    ListEmptyComponent={!loading ? <View style={styles.emptyState}><Ionicons name="people-outline" size={48} color={colors.textMuted} /><Text style={styles.emptyTitle}>No employees</Text><Text style={styles.emptyText}>No employee records found.</Text></View> : null}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.sm, padding: 12, marginBottom: 10, gap: 8 },
    summaryText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: 10, ...shadow.sm },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    cardSection: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
    badgeText: { fontSize: 11, fontWeight: '700' },
    errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 12, marginBottom: 12 },
    errorText: { color: '#B91C1C', fontSize: 14 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
    restrictedBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.bg },
    restrictedTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    restrictedText: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },
});

export default EmployeesScreen;
