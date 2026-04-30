import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, formatDateLabel, formatStatusLabel, getErrorMessage } from '../utils/mobile';

const ORDER_STATUSES = ['confirmed', 'in_production', 'cutting', 'washing', 'qc', 'packing', 'delivered'];

function getDefaultDeliveryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
}

const OrdersScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(getDefaultDeliveryDate());

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/orders');
            setOrders(extractList(response.data, ['orders']));
        } catch (e) {
            console.error('Failed to fetch orders', e);
            setOrders([]);
            setError(getErrorMessage(e, 'Unable to load customer orders right now.'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrder = async () => {
        if (!customerName || !productDescription || !quantity || !expectedDeliveryDate) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await api.post('/orders', {
                orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
                customerName: customerName.trim(),
                customerContact: customerContact.trim(),
                productDescription: productDescription.trim(),
                quantity: Number(quantity),
                expectedDeliveryDate,
                notes: '',
            });
            await fetchOrders();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Customer order created successfully');
        } catch (e) {
            Alert.alert('Unable to create order', getErrorMessage(e));
        }
    };

    const resetForm = () => {
        setCustomerName('');
        setCustomerContact('');
        setProductDescription('');
        setQuantity('');
        setExpectedDeliveryDate(getDefaultDeliveryDate());
    };

    const handleUpdateStatus = (id, currentStatus) => {
        const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
        const nextStatus = ORDER_STATUSES[(currentIndex + 1) % ORDER_STATUSES.length];

        Alert.alert('Update Status', `Change order status to ${formatStatusLabel(nextStatus)}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                style: 'default',
                onPress: async () => {
                    try {
                        await api.patch(`/orders/${id}/status`, {
                            status: nextStatus,
                            note: 'Updated from mobile',
                        });
                        await fetchOrders();
                    } catch (e) {
                        Alert.alert('Unable to update status', getErrorMessage(e));
                    }
                },
            },
        ]);
    };

    const getStatusStyle = (currentStatus) => {
        switch (currentStatus) {
            case 'in_production': return { bg: '#DBEAFE', text: '#1D4ED8' };
            case 'cutting': return { bg: '#E0F2FE', text: '#0369A1' };
            case 'washing': return { bg: '#F3E8FF', text: '#7C3AED' };
            case 'qc': return { bg: '#FEF3C7', text: '#D97706' };
            case 'packing': return { bg: '#FDE68A', text: '#92400E' };
            case 'delivered': return { bg: '#D1FAE5', text: '#059669' };
            default: return { bg: '#F3F4F6', text: '#6B7280' };
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
                    <Text style={styles.orderNo}>{item.orderNumber}</Text>
                    <Text style={styles.customerText}>
                        {item.customerName} · {item.productDescription} x{item.quantity}
                    </Text>
                    <Text style={styles.deliveryText}>Due {formatDateLabel(item.expectedDeliveryDate)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {formatStatusLabel(item.status)}
                    </Text>
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
                    ListHeaderComponent={(
                        <View style={styles.headerCard}>
                            <Text style={styles.headerTitle}>Customer Orders</Text>
                            <Text style={styles.headerText}>
                                Long press an order to move it to the next production stage.
                            </Text>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No customer orders yet</Text>
                            <Text style={styles.emptyText}>Create an order to start tracking production progress.</Text>
                        </View>
                    ) : null}
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
                            placeholder="Customer Contact (optional)"
                            value={customerContact}
                            onChangeText={setCustomerContact}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Product Description"
                            value={productDescription}
                            onChangeText={setProductDescription}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Quantity"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Expected Delivery Date (YYYY-MM-DD)"
                            value={expectedDeliveryDate}
                            onChangeText={setExpectedDeliveryDate}
                            autoCapitalize="none"
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
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerText: { marginTop: 6, fontSize: 14, color: '#6B7280' },
    errorText: { marginTop: 10, fontSize: 14, color: '#B91C1C' },
    orderNo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    customerText: { fontSize: 14, color: '#4B5563', marginTop: 4 },
    deliveryText: { fontSize: 13, color: '#6B7280', marginTop: 6 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { fontWeight: 'bold', fontSize: 12 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    emptyText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },

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
