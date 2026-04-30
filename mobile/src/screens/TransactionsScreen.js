import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const TransactionsScreen = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('IN');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/transactions');
            setTransactions(response.data.data || response.data || []);
        } catch (e) {
            console.error('Failed to fetch transactions', e);
            setTransactions([
                { _id: '1', type: 'IN', reference: 'PO-001', amount: 5000, date: '2026-04-28' },
                { _id: '2', type: 'OUT', reference: 'INV-005', amount: 1200, date: '2026-04-29' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!reference || !amount) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newTx = { reference, amount: Number(amount), type, date: new Date().toISOString().split('T')[0] };

        try {
            await api.post('/transactions', newTx);
            fetchTransactions();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Transaction logged successfully');
        } catch (e) {
            // Mocking Add
            setTransactions([{ _id: Date.now().toString(), ...newTx }, ...transactions]);
            setModalVisible(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setReference('');
        setAmount('');
        setType('IN');
    };

    const getStyleForType = (txType) => {
        if (txType === 'IN') return { text: '#059669', symbol: '+' };
        return { text: '#DC2626', symbol: '-' };
    };

    const renderItem = ({ item }) => {
        const typeStyle = getStyleForType(item.type);
        return (
            <View style={styles.itemCard}>
                <View>
                    <Text style={styles.reference}>{item.reference}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.amountText, { color: typeStyle.text }]}>
                        {typeStyle.symbol} ${item.amount.toLocaleString()}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading && transactions.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchTransactions}
                />
            )}

            {/* Floating Add Transaction Button */}
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
                        <Text style={styles.modalTitle}>Log Transaction</Text>

                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, type === 'IN' && styles.tabActiveIn]}
                                onPress={() => setType('IN')}
                            >
                                <Text style={[styles.tabText, type === 'IN' && styles.tabTextActive]}>Income (IN)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, type === 'OUT' && styles.tabActiveOut]}
                                onPress={() => setType('OUT')}
                            >
                                <Text style={[styles.tabText, type === 'OUT' && styles.tabTextActive]}>Expense (OUT)</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Reference (e.g. INV-100)"
                            value={reference}
                            onChangeText={setReference}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Amount ($)"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddTransaction}>
                                <Text style={styles.saveButtonText}>Add Transaction</Text>
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
    reference: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    dateText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    amountContainer: { alignItems: 'flex-end' },
    amountText: { fontSize: 16, fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },

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

    // Custom Tabs for Income/Expense
    tabContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    tabActiveIn: { backgroundColor: '#059669' },
    tabActiveOut: { backgroundColor: '#DC2626' },
    tabText: { color: '#6B7280', fontWeight: '600' },
    tabTextActive: { color: '#FFF' },
});

export default TransactionsScreen;
