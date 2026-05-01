import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { formatStatusLabel, hasAnyRole } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const MODULE_TILES = [
    { label: 'Profile', icon: 'person-circle-outline', screen: 'Profile', color: colors.primary, desc: 'View & edit your account' },
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', color: colors.warning, desc: 'Alerts & updates' },
    { label: 'Financial Ledger', icon: 'card-outline', screen: 'Transactions', color: colors.success, desc: 'Expense entries' },
    { label: 'Financial Health', icon: 'bar-chart-outline', screen: 'FinancialHealth', color: colors.teal, desc: 'Revenue & P&L overview' },
    { label: 'Purchase', icon: 'bag-handle-outline', screen: 'Purchase', color: colors.orange, desc: 'Suppliers, POs, GRN' },
    { label: 'Sales', icon: 'trending-up-outline', screen: 'Sales', color: colors.purple, desc: 'Quotations, invoices' },
    { label: 'Stock Control', icon: 'swap-vertical-outline', screen: 'Stock', color: '#0EA5E9', desc: 'Adjustments & history' },
    { label: 'Raw Materials', icon: 'layers-outline', screen: 'Materials', color: colors.warning, desc: 'Material catalog' },
    { label: 'Production Log', icon: 'stopwatch-outline', screen: 'ProductionLog', color: colors.purple, desc: 'Log hourly output' },
    { label: 'Employees', icon: 'people-outline', screen: 'Employees', color: colors.danger, desc: 'Manage employee records', adminOnly: true },
];

const ModuleTile = ({ item, onPress }) => (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.tileIcon, { backgroundColor: item.color + '18' }]}>
            <Ionicons name={item.icon} size={26} color={item.color} />
        </View>
        <View style={styles.tileText}>
            <Text style={styles.tileLabel}>{item.label}</Text>
            <Text style={styles.tileDesc}>{item.desc}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
);

const MoreScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useContext(AuthContext);
    const isAdmin = hasAnyRole(user, ['admin', 'manager']);

    const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const visibleTiles = MODULE_TILES.filter(t => !t.adminOnly || isAdmin);

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* User Card */}
            <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{formatStatusLabel(user?.role)}</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Modules */}
            <Text style={styles.sectionLabel}>Modules</Text>
            <View style={styles.tileList}>
                {visibleTiles.map((item) => (
                    <ModuleTile
                        key={item.screen}
                        item={item}
                        onPress={() => navigation.navigate(item.screen)}
                    />
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md, paddingBottom: 40 },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.md,
    },
    avatar: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginRight: spacing.md,
        ...shadow.primary,
    },
    avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
    userInfo: { flex: 1 },
    userName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primaryLight,
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginTop: 6,
    },
    roleText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
    sectionLabel: {
        fontSize: 13, fontWeight: '700', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: spacing.sm, marginLeft: 2,
    },
    tileList: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: 'hidden',
        ...shadow.sm,
        marginBottom: spacing.md,
    },
    tile: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    tileIcon: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: spacing.md,
    },
    tileText: { flex: 1 },
    tileLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    tileDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    logoutBtn: {
        flexDirection: 'row',
        backgroundColor: colors.danger,
        borderRadius: radius.md,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadow.sm,
    },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default MoreScreen;
