import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const navigation = useNavigation();
    const mockUser = {
        name: user?.name || 'Jane Doe',
        email: user?.email || 'jane.doe@dermasapperal.com',
        role: user?.role || 'Production Supervisor',
        employeeId: user?.employeeId || 'EMP-1042'
    };

    return (
    <View style={styles.container}>
        <View style={styles.header}>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{mockUser.name.charAt(0)}</Text>
            </View>
            <Text style={styles.name}>{mockUser.name}</Text>
            <Text style={styles.role}>{mockUser.role}</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <Text style={styles.rowText}>{mockUser.email}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Ionicons name="id-card-outline" size={20} color="#6B7280" />
                    <Text style={styles.rowText}>{mockUser.employeeId}</Text>
                </View>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings & Modules</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Transactions')}>
                    <Ionicons name="card-outline" size={20} color="#6B7280" />
                    <Text style={styles.rowText}>Financial Ledger</Text>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.chevron} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Materials')}>
                    <Ionicons name="layers-outline" size={20} color="#6B7280" />
                    <Text style={styles.rowText}>Raw Materials</Text>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.chevron} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ProductionLogs')}>
                    <Ionicons name="stopwatch-outline" size={20} color="#6B7280" />
                    <Text style={styles.rowText}>Log Hourly Production</Text>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.chevron} />
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.row}>
                    <Ionicons name="notifications-outline" size={20} color="#6B7280" />
                    <Text style={styles.rowText}>Notification Preferences</Text>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.chevron} />
                </TouchableOpacity>
            </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
    </View>
);
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
    header: { alignItems: 'center', marginVertical: 32 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    avatarText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    role: { fontSize: 16, color: '#6B7280', marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    rowText: { fontSize: 16, color: '#4B5563', marginLeft: 12, flex: 1 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: -16 },
    chevron: { marginLeft: 'auto' },
    logoutButton: { flexDirection: 'row', backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 24, shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
    logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default ProfileScreen;
