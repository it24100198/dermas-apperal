import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const JobsScreen = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [jobNo, setJobNo] = useState('');
    const [expectedProduct, setExpectedProduct] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/manufacturing/jobs');
            setJobs(response.data.data || response.data || []);
        } catch (e) {
            console.error('Failed to fetch jobs', e);
            setJobs([
                { _id: '1', jobNo: 'JOB-2026-001', expectedProduct: 'Cotton T-Shirt', quantity: 500, status: 'In Progress' },
                { _id: '2', jobNo: 'JOB-2026-002', expectedProduct: 'Denim Jeans', quantity: 300, status: 'Pending' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddJob = async () => {
        if (!jobNo || !expectedProduct || !quantity) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const newJob = { jobNo, expectedProduct, quantity: Number(quantity), status: 'Pending' };

        try {
            await api.post('/manufacturing/jobs', newJob);
            fetchJobs();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Job scheduled successfully');
        } catch (e) {
            // Mocking Add
            setJobs([{ _id: Date.now().toString(), ...newJob }, ...jobs]);
            setModalVisible(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setJobNo('');
        setExpectedProduct('');
        setQuantity('');
    };

    const handleUpdateStatus = (id, currentStatus) => {
        const statuses = ['Pending', 'In Progress', 'Completed'];
        const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

        Alert.alert('Update Status', `Update job status to ${nextStatus}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                style: 'default',
                onPress: async () => {
                    try {
                        await api.put(`/manufacturing/jobs/${id}`, { status: nextStatus });
                        fetchJobs();
                    } catch (e) {
                        // Mocking Update
                        setJobs(jobs.map(j => (j._id === id ? { ...j, status: nextStatus } : j)));
                    }
                },
            },
        ]);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'In Progress': return { bg: '#FEF3C7', text: '#D97706' };
            case 'Pending': return { bg: '#F3F4F6', text: '#6B7280' };
            case 'Completed': return { bg: '#D1FAE5', text: '#059669' };
            default: return { bg: '#E0F2FE', text: '#0369A1' };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity
                style={styles.itemCard}
                onLongPress={() => handleUpdateStatus(item._id, item.status)}
                delayLongPress={500}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobNo}>{item.jobNo}</Text>
                    <Text style={styles.productText}>{item.expectedProduct} (x{item.quantity})</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {loading && jobs.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchJobs}
                />
            )}

            {/* Floating Add Job Button */}
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
                        <Text style={styles.modalTitle}>Schedule Manufacturing Job</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Job Number (e.g. JOB-003)"
                            value={jobNo}
                            onChangeText={setJobNo}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Target Product"
                            value={expectedProduct}
                            onChangeText={setExpectedProduct}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Quantity to Produce"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddJob}>
                                <Text style={styles.saveButtonText}>Create Job</Text>
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
    jobNo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    productText: { fontSize: 14, color: '#4B5563', marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { fontWeight: 'bold', fontSize: 12 },
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
});

export default JobsScreen;
