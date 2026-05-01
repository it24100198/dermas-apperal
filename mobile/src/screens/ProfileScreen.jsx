import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { formatStatusLabel } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const Row = ({ icon, label, value, onPress, color }) => (
    <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
    >
        <View style={[styles.rowIcon, { backgroundColor: (color || colors.primary) + '18' }]}>
            <Ionicons name={icon} size={20} color={color || colors.primary} />
        </View>
        <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>{label}</Text>
            {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </TouchableOpacity>
);

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useContext(AuthContext);

    const name = user?.name || 'User';
    const email = user?.email || '';
    const role = formatStatusLabel(user?.role || '');
    const employeeId = user?.employeeProfile?.employeeId || 'Not assigned';
    const section = user?.employeeProfile?.productionSection?.name
        || user?.employeeProfile?.productionSection?.slug
        || 'Not assigned';

    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.role}>{role}</Text>
            </View>

            {/* Account Info */}
            <Text style={styles.sectionLabel}>Account Information</Text>
            <View style={styles.card}>
                <Row icon="mail-outline" label="Email Address" value={email} />
                <View style={styles.divider} />
                <Row icon="id-card-outline" label="Employee ID" value={employeeId} color={colors.purple} />
                <View style={styles.divider} />
                <Row icon="business-outline" label="Production Section" value={section} color={colors.teal} />
            </View>

            {/* Actions */}
            <Text style={styles.sectionLabel}>Settings</Text>
            <View style={styles.card}>
                <Row
                    icon="notifications-outline"
                    label="Notifications"
                    onPress={() => navigation.navigate('Notifications')}
                    color={colors.warning}
                />
                <View style={styles.divider} />
                <Row
                    icon="card-outline"
                    label="Financial Ledger"
                    onPress={() => navigation.navigate('Transactions')}
                    color={colors.success}
                />
                <View style={styles.divider} />
                <Row
                    icon="layers-outline"
                    label="Raw Materials"
                    onPress={() => navigation.navigate('Materials')}
                    color={colors.warning}
                />
                <View style={styles.divider} />
                <Row
                    icon="stopwatch-outline"
                    label="Log Hourly Production"
                    onPress={() => navigation.navigate('ProductionLog')}
                    color={colors.purple}
                />
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
    avatarSection: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: 16 },
    avatarCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
        ...shadow.primary,
    },
    avatarText: { color: '#FFF', fontSize: 32, fontWeight: '700' },
    name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    role: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    sectionLabel: {
        fontSize: 12, fontWeight: '700', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: spacing.sm, marginLeft: 4, marginTop: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        overflow: 'hidden',
        ...shadow.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
    },
    rowIcon: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    rowContent: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
    rowValue: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 64 },
    logoutBtn: {
        flexDirection: 'row',
        backgroundColor: colors.danger,
        borderRadius: radius.md,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
    },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default ProfileScreen;
