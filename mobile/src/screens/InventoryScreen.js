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
import { extractList, formatNumber, formatStatusLabel, getErrorMessage } from '../utils/mobile';

const InventoryScreen = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');

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
            setError('');
            const response = await api.get('/meta/products');
            setProducts(extractList(response.data, ['products']));
        } catch (e) {
            console.error('Failed to fetch inventory', e);
            setProducts([]);
            setError(getErrorMessage(e, 'Unable to load products right now.'));
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
            await api.post('/meta/products', {
                name: name.trim(),
                sku: sku.trim().toUpperCase(),
                stockQty: Number(quantity),
                classification: 'normal',
                status: 'active',
            });
            await fetchInventory();
            setModalVisible(false);
            setName('');
            setSku('');
            setQuantity('');
            Alert.alert('Success', 'Product added successfully');
        } catch (e) {
            console.error('Failed to add product', e);
            Alert.alert('Unable to add product', getErrorMessage(e));
        }
    };

    const handleToggleProductStatus = (item) => {
        const nextStatus = item.status === 'inactive' ? 'active' : 'inactive';

        Alert.alert('Update Product', `Set this product to ${nextStatus}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                onPress: async () => {
                    try {
                        await api.put(`/meta/products/${item._id}`, { status: nextStatus });
                        await fetchInventory();
                    } catch (e) {
                        console.error('Failed to update product', e);
                        Alert.alert('Unable to update product', getErrorMessage(e));
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onLongPress={() => handleToggleProductStatus(item)}
            delayLongPress={500}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>SKU: {item.sku || 'Not set'}</Text>
            </View>
            <View style={styles.rightContent}>
                <View style={styles.stockBadge}>
                    <Text style={styles.stockText}>{formatNumber(item.stockQty)} in stock</Text>
                </View>
                <Text style={styles.statusText}>{formatStatusLabel(item.status || 'draft')}</Text>
            </View>
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
                    ListHeaderComponent={(
                        <View style={styles.headerCard}>
                            <Text style={styles.headerTitle}>Product Inventory</Text>
                            <Text style={styles.headerText}>
                                Long press a product to archive or reactivate it.
                            </Text>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptyText}>Add a product to start tracking inventory.</Text>
                        </View>
                    ) : null}
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
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerText: { marginTop: 6, fontSize: 14, color: '#6B7280' },
    errorText: { marginTop: 10, fontSize: 14, color: '#B91C1C' },
    itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    itemSku: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    rightContent: { alignItems: 'flex-end' },
    stockBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    stockText: { color: '#0369A1', fontWeight: 'bold' },
    statusText: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#6B7280' },
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
    cancelButtonText: { color: '#4B5563', fontWeight: '600', fontSize: 16 },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

export default InventoryScreen;
