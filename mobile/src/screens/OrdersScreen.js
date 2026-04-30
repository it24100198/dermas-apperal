import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const OrdersScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [status, setStatus] = useState('Pending');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders');
            setOrders(response.data.data || response.data || []);
        } catch (e) {
            console.error('Failed to fetch orders', e);
            setOrders([
                { _id: '1', orderNo: 'ORD-001', customerName: 'Acme Corp', totalAmount: 1500, status: 'Pending' },
                { _id: '2', orderNo: 'ORD-002', customerName: 'Globex Inc', totalAmount: 4200, status: 'Shipped' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrder = async () => {
        if (!customerName || !totalAmount) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newOrder = {
            orderNo: `ORD-${Math.floor(100 + Math.random() * 900)}`,
            customerName,
            totalAmount: Number(totalAmount),
            status: 'Pending'
        };

        try {
            await api.post('/orders', newOrder);
            fetchOrders();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Customer order created successfully');
        } catch (e) {
            // Mocking Add
            setOrders([{ _id: Date.now().toString(), ...newOrder }, ...orders]);
            setModalVisible(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setCustomerName('');
        setTotalAmount('');
    };

    const handleUpdateStatus = (id, currentStatus) => {
        const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
        const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

        Alert.alert('Update Status', `Change order status to ${nextStatus}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                style: 'default',
                onPress: async () => {
                    try {
                        await api.put(`/orders/${id}`, { status: nextStatus });
                        fetchOrders();
                    } catch (e) {
                        // Mocking Update
                        setOrders(orders.map(o => (o._id === id ? { ...o, status: nextStatus } : o)));
                    }
                },
            },
        ]);
    };

    const getStatusStyle = (currentStatus) => {
        switch (currentStatus) {
            case 'Processing': return { bg: '#DBEAFE', text: '#1D4ED8' }; // blue
            case 'Shipped': return { bg: '#FEF3C7', text: '#D97706' }; // amber
            case 'Delivered': return { bg: '#D1FAE5', text: '#059669' }; // emerald
            default: return { bg: '#F3F4F6', text: '#6B7280' }; // gray
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity
                style={styles.itemCard}
                onLongPress={() => handleUpdateStatus(item._id, item.status)}
                delayLongPress={500}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.orderNo}>{item.orderNo}</Text>
                    <Text style={styles.customerText}>{item.customerName} - ${item.totalAmount.toLocaleString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {loading && orders.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchOrders}
                />
            )}

            {/* Floating Add Order Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Create New Order</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Customer Name"
                            value={customerName}
                            onChangeText={setCustomerName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Total Amount ($)"
                            value={totalAmount}
                            onChangeText={setTotalAmount}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddOrder}>
                                <Text style={styles.saveButtonText}>Create Order</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    list: { padding: 16 },
    itemCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    orderNo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    customerText: { fontSize: 14, color: '#4B5563', marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { fontWeight: 'bold', fontSize: 12 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
    modalView: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    cancelButtonText: { color: '#4B5563', fontWeight: '600' },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600' },
});

export default OrdersScreen;
