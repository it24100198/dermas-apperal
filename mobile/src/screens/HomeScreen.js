import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { extractList, formatNumber, formatStatusLabel } from '../utils/mobile';

const HomeScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        activeJobs: 0,
        openOrders: 0,
        products: 0,
    });

    const loadDashboard = async () => {
        try {
            const [jobsResult, ordersResult, productsResult] = await Promise.allSettled([
                api.get('/jobs'),
                api.get('/orders'),
                api.get('/meta/products'),
            ]);

            const jobs = jobsResult.status === 'fulfilled'
                ? extractList(jobsResult.value.data, ['jobs'])
                : [];
            const orders = ordersResult.status === 'fulfilled'
                ? extractList(ordersResult.value.data, ['orders'])
                : [];
            const products = productsResult.status === 'fulfilled'
                ? extractList(productsResult.value.data, ['products'])
                : [];

            setStats({
                activeJobs: jobs.length,
                openOrders: orders.filter((order) => order.status !== 'delivered').length,
                products: products.length,
            });
        } catch (error) {
            console.error('Failed to load dashboard', error);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const sectionName = user?.employeeProfile?.productionSection?.name
        || user?.employeeProfile?.productionSection?.slug
        || 'Not assigned';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.welcome}>Welcome back,</Text>
                <Text style={styles.name}>{user?.name || 'User'}</Text>
                <Text style={styles.metaText}>
                    {formatStatusLabel(user?.role)} · {sectionName}
                </Text>
            </View>

            <View style={styles.dashboard}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Active Jobs</Text>
                    <Text style={styles.cardValue}>{formatNumber(stats.activeJobs)}</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Open Orders</Text>
                    <Text style={styles.cardValue}>{formatNumber(stats.openOrders)}</Text>
                </View>
            </View>

            <View style={styles.dashboard}>
                <View style={[styles.card, styles.fullWidthCard]}>
                    <Text style={styles.cardTitle}>Products in Catalog</Text>
                    <Text style={styles.cardValue}>{formatNumber(stats.products)}</Text>
                    <Text style={styles.cardHint}>Pull down to refresh live counts from the backend.</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    content: {
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
    metaText: {
        marginTop: 8,
        fontSize: 14,
        color: '#4B5563',
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
    fullWidthCard: {
        width: '100%',
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
    cardHint: {
        marginTop: 8,
        fontSize: 13,
        color: '#6B7280',
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
