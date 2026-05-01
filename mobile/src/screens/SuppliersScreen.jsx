import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { extractList, getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const SuppliersScreen = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/purchase/suppliers');
            setItems(extractList(res.data, ['suppliers', 'items']));
        } catch (e) { setError(getErrorMessage(e, 'Unable to load suppliers.')); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!name) { Alert.alert('Error', 'Supplier name is required.'); return; }
        try {
            await api.post('/purchase/suppliers', { name: name.trim(), contactPerson: contact.trim(), email: email.trim(), phone: phone.trim() });
            await fetchData(); setModalVisible(false);
            setName(''); setContact(''); setEmail(''); setPhone('');
            Alert.alert('Success', 'Supplier added.');
        } catch (e) { Alert.alert('Error', getErrorMessage(e)); }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardIconBox}><Ionicons name="business-outline" size={22} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.contactPerson ? <Text style={styles.cardMeta}>{item.contactPerson}</Text> : null}
                {item.email ? <Text style={styles.cardMeta}>{item.email}</Text> : null}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading && items.length === 0 ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} /> : (
                <FlatList
                    data={items} keyExtractor={i => i._id} renderItem={renderItem}
                    contentContainerStyle={styles.list} refreshing={loading} onRefresh={fetchData}
                    ListHeaderComponent={error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
                    ListEmptyComponent={!loading ? <View style={styles.emptyState}><Ionicons name="business-outline" size={48} color={colors.textMuted} /><Text style={styles.emptyTitle}>No suppliers</Text><Text style={styles.emptyText}>Add your first supplier to get started.</Text></View> : null}
                />
            )}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}><Ionicons name="add" size={32} color="#FFF" /></TouchableOpacity>
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Add Supplier</Text>
                        <TextInput style={styles.input} placeholder="Supplier Name *" value={name} onChangeText={setName} />
                        <TextInput style={styles.input} placeholder="Contact Person" value={contact} onChangeText={setContact} />
                        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleAdd}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
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
    cardIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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

export default SuppliersScreen;
