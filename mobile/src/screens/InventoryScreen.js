import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const InventoryScreen = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            setProducts(response.data.data || response.data || []);
        } catch (e) {
            console.error('Failed to fetch inventory', e);
            // Mock data for display when server is offline
            setProducts([
                { _id: '1', name: 'Cotton T-Shirt', sku: 'TS-001', quantity: 150 },
                { _id: '2', name: 'Denim Jeans', sku: 'JN-001', quantity: 85 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async () => {
        if (!name || !sku || !quantity) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            const response = await api.post('/products', {
                name,
                sku,
                quantity: Number(quantity)
            });
            // Refresh list
            fetchInventory();
            setModalVisible(false);
            setName('');
            setSku('');
            setQuantity('');
            Alert.alert('Success', 'Product added successfully');
        } catch (e) {
            console.error('Failed to add product', e);
            // Mocking Add
            setProducts([{ _id: Date.now().toString(), name, sku, quantity: Number(quantity) }, ...products]);
            setModalVisible(false);
        }
    };

    const handleDeleteProduct = (id) => {
        Alert.alert('Delete', 'Are you sure you want to remove this product?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/products/${id}`);
                        fetchInventory();
                    } catch (e) {
                        console.error('Failed to delete', e);
                        // Mocking delete
                        setProducts(products.filter(p => p._id !== id));
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onLongPress={() => handleDeleteProduct(item._id)}
            delayLongPress={500}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>SKU: {item.sku}</Text>
            </View>
            <View style={styles.stockBadge}>
                <Text style={styles.stockText}>{item.quantity} in stock</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" style={{ marginLeft: 16 }} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && products.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchInventory}
                />
            )}

            {/* Floating Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Add Product Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add New Product</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Product Name"
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="SKU"
                            value={sku}
                            onChangeText={setSku}
                            autoCapitalize="characters"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Initial Stock Quantity"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddProduct}>
                                <Text style={styles.saveButtonText}>Save Product</Text>
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
    itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    itemSku: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    stockBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    stockText: { color: '#0369A1', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
    modalView: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    cancelButtonText: { color: '#4B5563', fontWeight: '600', fontSize: 16 },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

export default InventoryScreen;
