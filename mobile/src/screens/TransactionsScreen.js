import React, { useContext, useEffect, useState } from 'react';
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
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import {
    extractList,
    formatCurrency,
    formatDateLabel,
    formatStatusLabel,
    getErrorMessage,
    hasAnyRole,
} from '../utils/mobile';

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

    const canUseExpenses = hasAnyRole(user, ['admin', 'manager', 'accountant']);

    useEffect(() => {
        if (!canUseExpenses) {
            setLoading(false);
            return;
        }

        fetchTransactions();
        fetchCategories();
    }, [canUseExpenses]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/expenses');
            setTransactions(extractList(response.data, ['items']));
        } catch (e) {
            console.error('Failed to fetch expenses', e);
            setTransactions([]);
            setError(getErrorMessage(e, 'Unable to load expenses right now.'));
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/expenses/categories');
            const nextCategories = extractList(response.data, ['items']);
            setCategories(nextCategories);

            if (!categoryId && nextCategories[0]?._id) {
                setCategoryId(nextCategories[0]._id);
            }
        } catch (e) {
            console.error('Failed to fetch expense categories', e);
            setCategories([]);
        }
    };

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setVendorName('');
        setPaymentMethod('cash');
        setCategoryId(categories[0]?._id || '');
    };

    const handleAddTransaction = async () => {
        if (!categoryId || !amount) {
            Alert.alert('Error', 'Select a category and enter an amount.');
            return;
        }

        try {
            await api.post('/expenses', {
                category: categoryId,
                amount: Number(amount),
                description: description.trim(),
                vendorName: vendorName.trim(),
                paymentMethod,
                date: new Date().toISOString(),
                status: 'recorded',
            });
            await fetchTransactions();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Expense recorded successfully.');
        } catch (e) {
            Alert.alert('Unable to save expense', getErrorMessage(e));
        }
    };

    const handleDeleteTransaction = (item) => {
        Alert.alert('Delete Expense', 'Remove this expense entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/expenses/${item._id}`);
                        await fetchTransactions();
                    } catch (e) {
                        Alert.alert('Unable to delete expense', getErrorMessage(e));
                    }
                },
            },
        ]);
    };

    const renderOptionChip = (value, selectedValue, onPress) => {
        const selected = value === selectedValue;

        return (
            <TouchableOpacity
                key={value}
                style={[styles.optionChip, selected && styles.optionChipActive]}
                onPress={() => onPress(value)}
            >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextActive]}>
                    {formatStatusLabel(value)}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderCategoryChip = (category) => {
        const selected = category._id === categoryId;

        return (
            <TouchableOpacity
                key={category._id}
                style={[styles.optionChip, selected && styles.optionChipActive]}
                onPress={() => setCategoryId(category._id)}
            >
                <Text style={[styles.optionChipText, selected && styles.optionChipTextActive]}>
                    {category.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onLongPress={() => handleDeleteTransaction(item)}
            delayLongPress={500}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.reference}>{item.description || item.category?.name || 'Expense'}</Text>
                <Text style={styles.dateText}>
                    {formatDateLabel(item.date)}
                    {item.vendorName ? ` · ${item.vendorName}` : ''}
                </Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.methodText}>{formatStatusLabel(item.paymentMethod)}</Text>
            </View>
        </TouchableOpacity>
    );

    if (!canUseExpenses) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="lock-closed-outline" size={28} color="#6B7280" />
                <Text style={styles.permissionTitle}>Expenses are restricted</Text>
                <Text style={styles.permissionText}>
                    Only admins, managers, and accountants can access the financial ledger on mobile.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {loading && transactions.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchTransactions}
                    ListHeaderComponent={(
                        <View style={styles.headerCard}>
                            <Text style={styles.headerTitle}>Financial Ledger</Text>
                            <Text style={styles.headerText}>
                                Long press an expense to delete it.
                            </Text>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No expenses recorded</Text>
                            <Text style={styles.emptyText}>Add a transaction to start building the ledger.</Text>
                        </View>
                    ) : null}
                />
            )}

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
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Record Expense</Text>

                            <Text style={styles.modalLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroller}>
                                {categories.length > 0 ? categories.map(renderCategoryChip) : (
                                    <Text style={styles.helperText}>No categories available.</Text>
                                )}
                            </ScrollView>

                            <TextInput
                                style={styles.input}
                                placeholder="Amount"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Description"
                                value={description}
                                onChangeText={setDescription}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Vendor Name (optional)"
                                value={vendorName}
                                onChangeText={setVendorName}
                            />

                            <Text style={styles.modalLabel}>Payment Method</Text>
                            <View style={styles.optionRow}>
                                {PAYMENT_METHODS.map((method) =>
                                    renderOptionChip(method, paymentMethod, setPaymentMethod)
                                )}
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleAddTransaction}
                                >
                                    <Text style={styles.saveButtonText}>Save Expense</Text>
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
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    list: { padding: 16 },
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerText: { marginTop: 6, fontSize: 14, color: '#6B7280' },
    errorText: { marginTop: 10, fontSize: 14, color: '#B91C1C' },
    itemCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    reference: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    dateText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    amountContainer: { alignItems: 'flex-end' },
    amountText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    methodText: { fontSize: 12, color: '#6B7280', marginTop: 6, fontWeight: '600' },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#3B82F6',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    emptyText: { marginTop: 8, fontSize: 14, color: '#6B7280', textAlign: 'center' },
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#F3F4F6',
    },
    permissionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16 },
    permissionText: { fontSize: 15, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 22 },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
    modalView: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '80%',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
    modalLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    optionScroller: { marginBottom: 16 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    optionChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: '#EFF6FF',
        marginRight: 8,
        marginBottom: 8,
    },
    optionChipActive: { backgroundColor: '#3B82F6' },
    optionChipText: { color: '#1D4ED8', fontWeight: '600' },
    optionChipTextActive: { color: '#FFFFFF' },
    helperText: { color: '#6B7280', fontSize: 14 },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    cancelButtonText: { color: '#4B5563', fontWeight: '600' },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600' },
});

export default TransactionsScreen;
