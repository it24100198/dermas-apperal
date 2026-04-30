import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const HomeScreen = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcome}>Welcome back,</Text>
                <Text style={styles.name}>{user?.name || 'User'}</Text>
            </View>

            <View style={styles.dashboard}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Active Jobs</Text>
                    <Text style={styles.cardValue}>12</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pending Orders</Text>
                    <Text style={styles.cardValue}>5</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        padding: 16,
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    welcome: {
        fontSize: 16,
        color: '#6B7280',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    dashboard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        width: '48%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    logoutButton: {
        marginTop: 'auto',
        backgroundColor: '#EF4444',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
