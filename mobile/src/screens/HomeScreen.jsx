import React, { useContext, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { extractList, formatNumber, formatStatusLabel } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const QUICK_ACTIONS = [
    { label: 'Orders', icon: 'cart-outline', screen: 'Orders', color: colors.primary },
    { label: 'Manufacturing', icon: 'construct-outline', screen: 'Manufacturing', color: colors.purple },
    { label: 'Inventory', icon: 'cube-outline', screen: 'Inventory', color: colors.teal },
    { label: 'Finance', icon: 'card-outline', screen: 'Finance', tab: 'More', color: colors.warning },
    { label: 'Purchase', icon: 'bag-handle-outline', screen: 'Purchase', tab: 'More', color: colors.orange },
    { label: 'Sales', icon: 'trending-up-outline', screen: 'Sales', tab: 'More', color: colors.success },
];

const StatCard = ({ title, value, icon, color, lightColor }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
        <View style={[styles.statIcon, { backgroundColor: lightColor }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
    </View>
);

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeJobs: 0,
        openOrders: 0,
        products: 0,
        materials: 0,
        expenses: 0,
    });

    const loadDashboard = async () => {
        try {
            const [jobsRes, ordersRes, productsRes, materialsRes] = await Promise.allSettled([
                api.get('/jobs'),
                api.get('/orders'),
                api.get('/meta/products'),
                api.get('/meta/materials'),
            ]);

            const jobs = jobsRes.status === 'fulfilled' ? extractList(jobsRes.value.data, ['jobs']) : [];
            const orders = ordersRes.status === 'fulfilled' ? extractList(ordersRes.value.data, ['orders']) : [];
            const products = productsRes.status === 'fulfilled' ? extractList(productsRes.value.data, ['products']) : [];
            const materials = materialsRes.status === 'fulfilled' ? extractList(materialsRes.value.data, ['materials']) : [];

            setStats({
                activeJobs: jobs.filter(j => j.status !== 'COMPLETED').length,
                openOrders: orders.filter(o => o.status !== 'delivered').length,
                products: products.length,
                materials: materials.length,
            });
        } catch (e) {
            console.error('Dashboard load error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboard(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const navigateTo = (screen, tab) => {
        if (tab === 'More') {
            navigation.navigate('More', { screen });
        } else {
            navigation.navigate(screen);
        }
    };

    const sectionName = user?.employeeProfile?.productionSection?.name
        || user?.employeeProfile?.productionSection?.slug
        || 'Not assigned';

    const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>Good day,</Text>
                        <Text style={styles.name}>{user?.name || 'User'}</Text>
                        <Text style={styles.role}>{formatStatusLabel(user?.role)} · {sectionName}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('More', { screen: 'Profile' })}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Grid */}
            <Text style={styles.sectionTitle}>Overview</Text>
            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
            ) : (
                <View style={styles.statsGrid}>
                    <StatCard title="Active Jobs" value={formatNumber(stats.activeJobs)} icon="construct-outline" color={colors.purple} lightColor={colors.purpleLight} />
                    <StatCard title="Open Orders" value={formatNumber(stats.openOrders)} icon="cart-outline" color={colors.primary} lightColor={colors.primaryLight} />
                    <StatCard title="Products" value={formatNumber(stats.products)} icon="cube-outline" color={colors.teal} lightColor={colors.tealLight} />
                    <StatCard title="Materials" value={formatNumber(stats.materials)} icon="layers-outline" color={colors.warning} lightColor={colors.warningLight} />
                </View>
            )}

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.actionsGrid}>
                {QUICK_ACTIONS.map((action) => (
                    <TouchableOpacity
                        key={action.label}
                        style={styles.actionTile}
                        onPress={() => navigateTo(action.screen, action.tab)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                            <Ionicons name={action.icon} size={26} color={action.color} />
                        </View>
                        <Text style={styles.actionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>Pull down to refresh live data from the server.</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 32 },
    header: {
        backgroundColor: colors.primaryDark,
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: spacing.md,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        marginBottom: spacing.md,
    },
    headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    headerText: { flex: 1 },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
    name: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 2 },
    role: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    sectionTitle: {
        fontSize: 13, fontWeight: '700', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5,
        paddingHorizontal: spacing.md, marginBottom: spacing.sm,
    },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: spacing.sm, marginBottom: spacing.md,
    },
    statCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        width: '47%',
        margin: '1.5%',
        borderLeftWidth: 4,
        ...shadow.sm,
    },
    statIcon: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
    },
    statValue: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
    statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    actionsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: spacing.sm, marginBottom: spacing.md,
    },
    actionTile: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        width: '30%',
        margin: '1.5%',
        alignItems: 'center',
        ...shadow.sm,
    },
    actionIcon: {
        width: 52, height: 52, borderRadius: radius.md,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        borderRadius: radius.md,
        padding: 12,
        marginHorizontal: spacing.md,
    },
    infoText: { fontSize: 13, color: colors.primary, flex: 1, marginLeft: 8 },
});

export default HomeScreen;
