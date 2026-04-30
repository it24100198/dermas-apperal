import React, { useContext, useState, useEffect } from 'react';
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
import { AuthContext } from '../context/AuthContext';
import { extractList, formatNumber, formatStatusLabel, getErrorMessage, hasAnyRole } from '../utils/mobile';

const MaterialsScreen = () => {
    const { user } = useContext(AuthContext);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [stockLevel, setStockLevel] = useState('');
    const [unit, setUnit] = useState('m');
    const [type, setType] = useState('fabric');
    const [unitPrice, setUnitPrice] = useState('');
    const canCreateMaterial = hasAnyRole(user, ['admin', 'manager']);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/meta/materials');
            setMaterials(extractList(response.data, ['materials']));
        } catch (e) {
            console.error('Failed to fetch materials', e);
            setMaterials([]);
            setError(getErrorMessage(e, 'Unable to load materials right now.'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!name || !stockLevel) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await api.post('/meta/materials', {
                name: name.trim(),
                type,
                stockQty: Number(stockLevel),
                unit: unit.trim(),
                unitPrice: Number(unitPrice) || 0,
            });
            await fetchMaterials();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Material added successfully');
        } catch (e) {
            Alert.alert('Unable to add material', getErrorMessage(e));
        }
    };

    const resetForm = () => {
        setName('');
        setStockLevel('');
        setUnit('m');
        setType('fabric');
        setUnitPrice('');
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>
                    {formatStatusLabel(item.type)} · {Number(item.unitPrice || 0) > 0 ? `$${Number(item.unitPrice).toFixed(2)}` : 'No unit price'}
                </Text>
            </View>
            <View style={styles.stockBadge}>
                <Text style={styles.stockText}>{formatNumber(item.stockQty)} {item.unit}</Text>
            </View>
        </View>
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
                    ListHeaderComponent={(
                        <View style={styles.headerCard}>
                            <Text style={styles.headerTitle}>Raw Materials</Text>
                            <Text style={styles.headerText}>
                                Browse live material stock from the manufacturing catalog.
                            </Text>
                            {!canCreateMaterial ? (
                                <Text style={styles.infoText}>Only admins and managers can add materials from mobile.</Text>
                            ) : null}
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No materials found</Text>
                            <Text style={styles.emptyText}>Add raw materials to start tracking stock.</Text>
                        </View>
                    ) : null}
                />
            )}

            {/* Floating Add Button */}
            {canCreateMaterial ? (
                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>
            ) : null}

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
                            placeholder="Initial Stock Level"
                            value={stockLevel}
                            onChangeText={setStockLevel}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Unit price (optional)"
                            value={unitPrice}
                            onChangeText={setUnitPrice}
                            keyboardType="numeric"
                        />

                        <View style={styles.unitContainer}>
                            {['fabric', 'accessory', 'etc'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.unitTab, type === option && styles.unitTabActive]}
                                    onPress={() => setType(option)}
                                >
                                    <Text style={[styles.unitText, type === option && styles.unitTextActive]}>
                                        {formatStatusLabel(option)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.unitContainer}>
                            {['m', 'kg', 'rolls', 'pcs'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.unitTab, unit === option && styles.unitTabActive]}
                                    onPress={() => setUnit(option)}
                                >
                                    <Text style={[styles.unitText, unit === option && styles.unitTextActive]}>{option}</Text>
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
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerText: { marginTop: 6, fontSize: 14, color: '#6B7280' },
    infoText: { marginTop: 8, fontSize: 13, color: '#92400E' },
    errorText: { marginTop: 10, fontSize: 14, color: '#B91C1C' },
    itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    itemSku: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    stockBadge: { backgroundColor: '#FEF08A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    stockText: { color: '#854D0E', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    emptyText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },

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
