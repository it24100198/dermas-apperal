import React, { useContext, useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { extractList, formatCurrency, formatDateLabel, formatStatusLabel, getErrorMessage, hasAnyRole } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'credit_card'];

const TransactionsScreen = () => {
    const { user } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const canUse = hasAnyRole(user, ['admin', 'manager', 'accountant']);

    useEffect(() => {
        if (!canUse) { setLoading(false); return; }
        fetchTransactions();
        fetchCategories();
    }, [canUse]);

    const fetchTransactions = async () => {
        try {
            setLoading(true); setError('');
            const res = await api.get('/expenses');
            setTransactions(extractList(res.data, ['items']));
        } catch (e) {
            setError(getErrorMessage(e, 'Unable to load expenses.'));
        } finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/expenses/categories');
            const cats = extractList(res.data, ['items']);
            setCategories(cats);
            if (!categoryId && cats[0]?._id) setCategoryId(cats[0]._id);
        } catch (e) { /* silent */ }
    };

    const resetForm = () => {
        setAmount(''); setDescription(''); setVendorName(''); setPaymentMethod('cash');
        setCategoryId(categories[0]?._id || '');
    };

    const handleAdd = async () => {
        if (!categoryId || !amount) { Alert.alert('Error', 'Select a category and enter amount.'); return; }
        try {
            await api.post('/expenses', {
                category: categoryId, amount: Number(amount),
                description: description.trim(), vendorName: vendorName.trim(),
                paymentMethod, date: new Date().toISOString(), status: 'recorded',
            });
            await fetchTransactions(); setModalVisible(false); resetForm();
            Alert.alert('Success', 'Expense recorded.');
        } catch (e) { Alert.alert('Error', getErrorMessage(e)); }
    };

    const handleDelete = (item) => {
        Alert.alert('Delete Expense', 'Remove this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/expenses/${item._id}`);
                        await fetchTransactions();
                    } catch (e) { Alert.alert('Error', getErrorMessage(e)); }
                },
            },
        ]);
    };

    if (!canUse) {
        return (
            <View style={styles.restrictedBox}>
                <Ionicons name="lock-closed-outline" size={36} color={colors.textMuted} />
                <Text style={styles.restrictedTitle}>Restricted Access</Text>
                <Text style={styles.restrictedText}>Only admins, managers, and accountants can view the financial ledger.</Text>
            </View>
        );
    }

    const totalAmount = transactions.reduce((s, t) => s + Number(t.amount || 0), 0);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item)} delayLongPress={500} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.description || item.category?.name || 'Expense'}</Text>
                <Text style={styles.cardMeta}>{formatDateLabel(item.date)}{item.vendorName ? ` · ${item.vendorName}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.method}>{formatStatusLabel(item.paymentMethod)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && transactions.length === 0 ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchTransactions}
                    ListHeaderComponent={(
                        <View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total Expenses</Text>
                                <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
                                <Text style={styles.summaryCount}>{transactions.length} record{transactions.length !== 1 ? 's' : ''}</Text>
                            </View>
                            <View style={styles.headerCard}>
                                <Text style={styles.headerTitle}>Financial Ledger</Text>
                                <Text style={styles.headerSubtitle}>Long-press an entry to delete it.</Text>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>No expenses yet</Text>
                            <Text style={styles.emptyText}>Tap + to record your first expense.</Text>
                        </View>
                    ) : null}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Record Expense</Text>

                            <Text style={styles.modalLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {categories.map(cat => (
                                    <TouchableOpacity key={cat._id} style={[styles.chip, categoryId === cat._id && styles.chipActive]} onPress={() => setCategoryId(cat._id)}>
                                        <Text style={[styles.chipText, categoryId === cat._id && styles.chipTextActive]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
                            <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
                            <TextInput style={styles.input} placeholder="Vendor Name (optional)" value={vendorName} onChangeText={setVendorName} />

                            <Text style={styles.modalLabel}>Payment Method</Text>
                            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                                {PAYMENT_METHODS.map(m => (
                                    <TouchableOpacity key={m} style={[styles.chip, paymentMethod === m && styles.chipActive]} onPress={() => setPaymentMethod(m)}>
                                        <Text style={[styles.chipText, paymentMethod === m && styles.chipTextActive]}>{formatStatusLabel(m)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setModalVisible(false); resetForm(); }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAdd}>
                                    <Text style={styles.saveBtnText}>Save Expense</Text>
                                </TouchableOpacity>
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
    summaryCard: {
        backgroundColor: colors.primaryDark, borderRadius: radius.lg,
        padding: spacing.lg, marginBottom: 10, alignItems: 'center',
    },
    summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
    summaryAmount: { fontSize: 34, fontWeight: '800', color: '#FFF', marginTop: 4 },
    summaryCount: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
    headerCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: 10, ...shadow.sm },
    headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    errorText: { fontSize: 13, color: colors.danger, marginTop: 6 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: radius.md,
        padding: spacing.md, marginBottom: 10, ...shadow.sm,
    },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    cardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
    amount: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    method: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', ...shadow.primary },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
    restrictedBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.bg },
    restrictedTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    restrictedText: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: spacing.md },
    modalView: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '85%', ...shadow.lg },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.primaryLight, marginRight: 8 },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: '#FFF' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, marginBottom: 12, fontSize: 16, color: colors.textPrimary },
    modalActions: { flexDirection: 'row', marginTop: 8 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center' },
    cancelBtn: { backgroundColor: colors.bg, marginRight: 8 },
    cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, marginLeft: 8 },
    saveBtnText: { color: '#FFF', fontWeight: '600' },
});

export default TransactionsScreen;
