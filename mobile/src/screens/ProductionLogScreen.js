import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';

const ProductionLogScreen = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [jobId, setJobId] = useState('');
    const [quantityProduced, setQuantityProduced] = useState('');
    const [defects, setDefects] = useState('0');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/production/hourly-logs');
            setLogs(response.data.data || response.data || []);
        } catch (e) {
            console.error('Failed to fetch logs', e);
            setLogs([
                { _id: '1', jobId: 'JOB-2026-001', quantityProduced: 120, defects: 2, timestamp: new Date().toISOString() },
                { _id: '2', jobId: 'JOB-2026-002', quantityProduced: 85, defects: 0, timestamp: new Date(Date.now() - 3600000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLog = async () => {
        if (!jobId || !quantityProduced) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const newLog = {
            jobId,
            quantityProduced: Number(quantityProduced),
            defects: Number(defects),
            timestamp: new Date().toISOString()
        };

        try {
            await api.post('/production/hourly-logs', newLog);
            fetchLogs();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Production log recorded');
        } catch (e) {
            // Mocking Add
            setLogs([{ _id: Date.now().toString(), ...newLog }, ...logs]);
            setModalVisible(false);
            resetForm();
        }
    };

    const resetForm = () => {
        setJobId('');
        setQuantityProduced('');
        setDefects('0');
    };

    const renderItem = ({ item }) => {
        const timeString = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
            <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobText}>Job: {item.jobId}</Text>
                    <Text style={styles.timeText}>{timeString}</Text>
                </View>
                <View style={styles.statsContainer}>
                    <Text style={styles.producedText}>+ {item.quantityProduced} units</Text>
                    {item.defects > 0 && <Text style={styles.defectText}>{item.defects} defects</Text>}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading && logs.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchLogs}
                />
            )}

            {/* Floating Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Add Log Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Log Production Yield</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Job ID (e.g. JOB-001)"
                            value={jobId}
                            onChangeText={setJobId}
                            autoCapitalize="characters"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Quantity Produced"
                            value={quantityProduced}
                            onChangeText={setQuantityProduced}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Defect Count (Optional)"
                            value={defects}
                            onChangeText={setDefects}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddLog}>
                                <Text style={styles.saveButtonText}>Submit Log</Text>
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
    jobText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    timeText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    statsContainer: { alignItems: 'flex-end' },
    producedText: { fontSize: 16, fontWeight: 'bold', color: '#059669' }, // emerald
    defectText: { fontSize: 12, fontWeight: 'bold', color: '#DC2626', marginTop: 4 }, // red
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#3B82F6', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },

    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16 },
    modalView: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    cancelButtonText: { color: '#4B5563', fontWeight: '600' },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600' },
});

export default ProductionLogScreen;
