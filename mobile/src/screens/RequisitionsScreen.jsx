import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, formatDateLabel, formatStatusLabel, formatNumber, getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const RequisitionsScreen = () => {
    const [items, setItems] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => { fetchData(); fetchMaterials(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/purchase/requisitions');
            setItems(extractList(res.data, ['requisitions', 'items']));
        } catch (e) { setError(getErrorMessage(e, 'Unable to load requisitions.')); }
        finally { setLoading(false); }
    };

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/meta/materials');
            const mats = extractList(res.data, ['materials']);
            setMaterials(mats);
            if (!selectedMaterialId && mats[0]?._id) setSelectedMaterialId(mats[0]._id);
        } catch (e) { /* silent */ }
    };

    const handleAdd = async () => {
        if (!selectedMaterialId || !quantity) { Alert.alert('Error', 'Select a material and enter quantity.'); return; }
        try {
            await api.post('/purchase/requisitions', { materialId: selectedMaterialId, quantityRequested: Number(quantity), notes: notes.trim() });
            await fetchData(); setModalVisible(false); setQuantity(''); setNotes('');
            Alert.alert('Success', 'Requisition submitted.');
        } catch (e) { Alert.alert('Error', getErrorMessage(e)); }
    };

    const getStatusColor = (status) => {
        if (status === 'approved') return { bg: colors.successLight, text: colors.success };
        if (status === 'rejected') return { bg: colors.dangerLight, text: colors.danger };
        return { bg: colors.warningLight, text: colors.warning };
    };

    const renderItem = ({ item }) => {
        const sc = getStatusColor(item.status);
        return (
            <View style={styles.card}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.material?.name || item.materialId || 'Material'}</Text>
                    <Text style={styles.cardMeta}>Qty: {formatNumber(item.quantityRequested)} · {formatDateLabel(item.createdAt)}</Text>
                    {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
                </View>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{formatStatusLabel(item.status || 'pending')}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading && items.length === 0 ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> : (
                <FlatList
                    data={items} keyExtractor={i => i._id} renderItem={renderItem}
                    contentContainerStyle={styles.list} refreshing={loading} onRefresh={fetchData}
                    ListHeaderComponent={error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
                    ListEmptyComponent={!loading ? <View style={styles.emptyState}><Ionicons name="document-text-outline" size={48} color={colors.textMuted} /><Text style={styles.emptyTitle}>No requisitions</Text><Text style={styles.emptyText}>Create a material requisition request.</Text></View> : null}
                />
            )}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}><Ionicons name="add" size={32} color="#FFF" /></TouchableOpacity>
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Create Requisition</Text>
                            <Text style={styles.modalLabel}>Material</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {materials.map(m => (
                                    <TouchableOpacity key={m._id} style={[styles.chip, selectedMaterialId === m._id && styles.chipActive]} onPress={() => setSelectedMaterialId(m._id)}>
                                        <Text style={[styles.chipText, selectedMaterialId === m._id && styles.chipTextActive]}>{m.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TextInput style={styles.input} placeholder="Quantity Requested" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                            <TextInput style={styles.input} placeholder="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleAdd}><Text style={styles.saveText}>Submit</Text></TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: 10, ...shadow.sm },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    cardNotes: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
    badgeText: { fontSize: 11, fontWeight: '700' },
    errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 12, marginBottom: 12 },
    errorText: { color: '#B91C1C', fontSize: 14 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadow.primary },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: spacing.md },
    modalView: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '85%', ...shadow.lg },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.primaryLight, marginRight: 8 },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: '#FFF' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, marginBottom: 12, fontSize: 16, color: colors.textPrimary },
    actions: { flexDirection: 'row', marginTop: 8 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center' },
    cancelBtn: { backgroundColor: colors.bg, marginRight: 8 },
    cancelText: { color: colors.textSecondary, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, marginLeft: 8 },
    saveText: { color: '#FFF', fontWeight: '600' },
});

export default RequisitionsScreen;
