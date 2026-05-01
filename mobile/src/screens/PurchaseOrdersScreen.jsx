import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, formatCurrency, formatDateLabel, formatStatusLabel, getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const PurchaseOrdersScreen = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/purchase/orders');
            setItems(extractList(res.data, ['orders', 'items']));
        } catch (e) { setError(getErrorMessage(e, 'Unable to load purchase orders.')); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!supplierName || !totalAmount) { Alert.alert('Error', 'Fill in supplier name and amount.'); return; }
        try {
            await api.post('/purchase/orders', { supplierName: supplierName.trim(), description: description.trim(), totalAmount: Number(totalAmount), expectedDeliveryDate: expectedDate });
            await fetchData(); setModalVisible(false);
            setSupplierName(''); setDescription(''); setTotalAmount('');
            Alert.alert('Success', 'Purchase order created.');
        } catch (e) { Alert.alert('Error', getErrorMessage(e)); }
    };

    const getStatusColor = (s) => {
        if (s === 'received') return { bg: colors.successLight, text: colors.success };
        if (s === 'cancelled') return { bg: colors.dangerLight, text: colors.danger };
        if (s === 'confirmed') return { bg: colors.primaryLight, text: colors.primary };
        return { bg: colors.warningLight, text: colors.warning };
    };

    const renderItem = ({ item }) => {
        const sc = getStatusColor(item.status);
        return (
            <View style={styles.card}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.supplierName || item.supplier?.name || 'Supplier'}</Text>
                    <Text style={styles.cardMeta}>{formatDateLabel(item.expectedDeliveryDate || item.createdAt)}</Text>
                    {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amount}>{formatCurrency(item.totalAmount || item.amount)}</Text>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.badgeText, { color: sc.text }]}>{formatStatusLabel(item.status || 'pending')}</Text>
                    </View>
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
                    ListEmptyComponent={!loading ? <View style={styles.emptyState}><Ionicons name="cart-outline" size={48} color={colors.textMuted} /><Text style={styles.emptyTitle}>No purchase orders</Text><Text style={styles.emptyText}>Tap + to create a purchase order.</Text></View> : null}
                />
            )}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}><Ionicons name="add" size={32} color="#FFF" /></TouchableOpacity>
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Create Purchase Order</Text>
                        <TextInput style={styles.input} placeholder="Supplier Name *" value={supplierName} onChangeText={setSupplierName} />
                        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
                        <TextInput style={styles.input} placeholder="Total Amount *" value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" />
                        <TextInput style={styles.input} placeholder="Expected Date (YYYY-MM-DD)" value={expectedDate} onChangeText={setExpectedDate} autoCapitalize="none" />
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleAdd}><Text style={styles.saveText}>Create</Text></TouchableOpacity>
                        </View>
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
    cardDesc: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
    amount: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
    badgeText: { fontSize: 11, fontWeight: '700' },
    errorBox: { backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: 12, marginBottom: 12 },
    errorText: { color: '#B91C1C', fontSize: 14 },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadow.primary },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: spacing.md },
    modalView: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.lg },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, marginBottom: 12, fontSize: 16, color: colors.textPrimary },
    actions: { flexDirection: 'row', marginTop: 8 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center' },
    cancelBtn: { backgroundColor: colors.bg, marginRight: 8 },
    cancelText: { color: colors.textSecondary, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, marginLeft: 8 },
    saveText: { color: '#FFF', fontWeight: '600' },
});

export default PurchaseOrdersScreen;
