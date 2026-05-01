import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, formatDateLabel, formatNumber, formatStatusLabel, getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const StockHistoryScreen = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/stock/history');
            setItems(extractList(res.data, ['history', 'items']));
        } catch (e) { setError(getErrorMessage(e, 'Unable to load stock history.')); }
        finally { setLoading(false); }
    };

    const getTypeColor = (t) => {
        if (t === 'in' || t === 'increase' || t === 'return') return { text: colors.success, symbol: '+' };
        return { text: colors.danger, symbol: '-' };
    };

    const renderItem = ({ item }) => {
        const tc = getTypeColor(item.type || item.movementType);
        return (
            <View style={styles.card}>
                <View style={[styles.dot, { backgroundColor: tc.text }]} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.material?.name || item.product?.name || 'Item'}</Text>
                    <Text style={styles.cardMeta}>{formatStatusLabel(item.type || item.movementType || 'movement')} · {formatDateLabel(item.createdAt)}</Text>
                    {item.reason ? <Text style={styles.cardReason}>{item.reason}</Text> : null}
                </View>
                <Text style={[styles.qty, { color: tc.text }]}>{tc.symbol}{formatNumber(item.quantity)}</Text>
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
                            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
                            <View style={styles.infoCard}>
                                <Ionicons name="time-outline" size={20} color={colors.primary} />
                                <Text style={styles.infoText}>Full audit log of all stock movements.</Text>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={!loading ? <View style={styles.emptyState}><Ionicons name="time-outline" size={48} color={colors.textMuted} /><Text style={styles.emptyTitle}>No history yet</Text><Text style={styles.emptyText}>Stock movements will appear here.</Text></View> : null}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.sm, padding: 12, marginBottom: 10, gap: 8 },
    infoText: { fontSize: 13, color: colors.primary, flex: 1 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: 10, ...shadow.sm },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    cardReason: { fontSize: 12, color: colors.textMuted, marginTop: 3, fontStyle: 'italic' },
    qty: { fontSize: 18, fontWeight: '800' },
    errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 12, marginBottom: 12 },
    errorText: { color: '#B91C1C', fontSize: 14 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
});

export default StockHistoryScreen;
