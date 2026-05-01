import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, formatDateLabel, getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/notifications');
            setNotifications(extractList(response.data, ['notifications', 'items']));
        } catch (e) {
            setError(getErrorMessage(e, 'Unable to load notifications.'));
        } finally {
            setLoading(false);
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'warning': return colors.warning;
            case 'error': return colors.danger;
            case 'success': return colors.success;
            default: return colors.primary;
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, !item.isRead && styles.unreadCard]}>
            <View style={[styles.dot, { backgroundColor: getIconColor(item.type) }]} />
            <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>{item.title || item.message || 'Notification'}</Text>
                {item.message && item.title ? (
                    <Text style={styles.notifBody}>{item.message}</Text>
                ) : null}
                <Text style={styles.notifDate}>{formatDateLabel(item.createdAt || item.date)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading && notifications.length === 0 ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchNotifications}
                    ListHeaderComponent={error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptyText}>No notifications at the moment.</Text>
                        </View>
                    ) : null}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: 10,
        ...shadow.sm,
    },
    unreadCard: { borderLeftWidth: 3, borderLeftColor: colors.primary },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12 },
    notifTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    notifBody: { fontSize: 14, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
    notifDate: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 12, marginBottom: 12 },
    errorText: { color: '#B91C1C', fontSize: 14, flex: 1 },
    emptyState: { alignItems: 'center', paddingVertical: 64 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
});

export default NotificationsScreen;
