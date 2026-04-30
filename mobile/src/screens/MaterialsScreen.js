import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const MaterialsScreen = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [stockLevel, setStockLevel] = useState('');
    const [unit, setUnit] = useState('meters');

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const response = await api.get('/materials');
            setMaterials(response.data.data || response.data || []);
        } catch (e) {
            console.error('Failed to fetch materials', e);
            // Fallback data
            setMaterials([
                { _id: '1', name: 'Raw Cotton', sku: 'MAT-COT-01', stockLevel: 2500, unit: 'kg' },
                { _id: '2', name: 'Blue Denim Fabric', sku: 'MAT-DEN-02', stockLevel: 1200, unit: 'meters' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!name || !sku || !stockLevel) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newMaterial = { name, sku, stockLevel: Number(stockLevel), unit };

        try {
            await api.post('/materials', newMaterial);
            fetchMaterials();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Material added successfully');
        } catch (e) {
            // Mocking Add
            setMaterials([{ _id: Date.now().toString(), ...newMaterial }, ...materials]);
            setModalVisible(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setName('');
        setSku('');
        setStockLevel('');
        setUnit('meters');
    };

    const handleDeleteMaterial = (id) => {
        Alert.alert('Delete', 'Remove this material from inventory?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/materials/${id}`);
                        fetchMaterials();
                    } catch (e) {
                        setMaterials(materials.filter(m => m._id !== id));
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onLongPress={() => handleDeleteMaterial(item._id)}
            delayLongPress={500}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>SKU: {item.sku}</Text>
            </View>
            <View style={styles.stockBadge}>
                <Text style={styles.stockText}>{item.stockLevel} {item.unit}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && materials.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchMaterials}
                />
            )}

            {/* Floating Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Add Material Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add Raw Material</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Material Name (e.g. Silk Thread)"
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
                            placeholder="Initial Stock Level"
                            value={stockLevel}
                            onChangeText={setStockLevel}
                            keyboardType="numeric"
                        />

                        <View style={styles.unitContainer}>
                            {['meters', 'kg', 'rolls', 'units'].map(u => (
                                <TouchableOpacity
                                    key={u}
                                    style={[styles.unitTab, unit === u && styles.unitTabActive]}
                                    onPress={() => setUnit(u)}
                                >
                                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddMaterial}>
                                <Text style={styles.saveButtonText}>Save Material</Text>
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
    stockBadge: { backgroundColor: '#FEF08A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    stockText: { color: '#854D0E', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },

    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
    modalView: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    unitContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    unitTab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F3F4F6' },
    unitTabActive: { backgroundColor: '#3B82F6' },
    unitText: { color: '#4B5563', fontSize: 14, fontWeight: '500' },
    unitTextActive: { color: '#FFF' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    cancelButtonText: { color: '#4B5563', fontWeight: '600' },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600' },
});

export default MaterialsScreen;
