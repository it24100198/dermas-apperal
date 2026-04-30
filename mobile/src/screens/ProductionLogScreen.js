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
    formatDateLabel,
    formatNumber,
    formatStatusLabel,
    getErrorMessage,
    hasAnyRole,
} from '../utils/mobile';

function getDefaultHour() {
    const hour = new Date().getHours();
    return String(Math.min(Math.max(hour, 0), 23));
}

const ProductionLogScreen = () => {
    const { user } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');

    const [selectedJobId, setSelectedJobId] = useState('');
    const [quantityProduced, setQuantityProduced] = useState('');
    const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
    const [hour, setHour] = useState(getDefaultHour());
    const [lineName, setLineName] = useState(
        user?.employeeProfile?.productionSection?.name
        || user?.employeeProfile?.productionSection?.slug
        || ''
    );

    const canUseHourlyProduction = hasAnyRole(user, ['admin', 'manager', 'supervisor', 'operator']);
    const employeeRecordId = user?.employeeProfile?._id || '';
    const currentSectionName = user?.employeeProfile?.productionSection?.name
        || user?.employeeProfile?.productionSection?.slug
        || '';

    useEffect(() => {
        if (!canUseHourlyProduction) {
            setLoading(false);
            return;
        }

        fetchJobs();
    }, [canUseHourlyProduction]);

    useEffect(() => {
        if (!selectedJobId) {
            setLogs([]);
            return;
        }

        fetchLogs(selectedJobId);
    }, [selectedJobId]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/production/hourly');
            const nextJobs = extractList(response.data, ['jobs']);
            setJobs(nextJobs);

            if (!selectedJobId && nextJobs[0]?._id) {
                setSelectedJobId(nextJobs[0]._id);
            }
        } catch (e) {
            console.error('Failed to fetch hourly jobs', e);
            setJobs([]);
            setError(getErrorMessage(e, 'Unable to load hourly production jobs right now.'));
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (jobId) => {
        try {
            const response = await api.get(`/production/hourly/${jobId}`);
            setLogs(extractList(response.data, ['logs']));
        } catch (e) {
            console.error('Failed to fetch hourly production records', e);
            setLogs([]);
        }
    };

    const resetForm = () => {
        setQuantityProduced('');
        setProductionDate(new Date().toISOString().slice(0, 10));
        setHour(getDefaultHour());
        setLineName(currentSectionName);
    };

    const handleAddLog = async () => {
        if (!selectedJobId || !quantityProduced || !lineName) {
            Alert.alert('Error', 'Select a job and fill in all required fields.');
            return;
        }

        if (!employeeRecordId) {
            Alert.alert(
                'Employee profile required',
                'This account needs a linked employee profile before hourly production can be recorded.'
            );
            return;
        }

        try {
            await api.post('/production/hourly', {
                jobId: selectedJobId,
                rows: [
                    {
                        lineName: lineName.trim(),
                        productionDate,
                        hour: Number(hour),
                        employeeId: employeeRecordId,
                        quantity: Number(quantityProduced),
                    },
                ],
            });
            await fetchLogs(selectedJobId);
            await fetchJobs();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Hourly production saved.');
        } catch (e) {
            Alert.alert('Unable to save production log', getErrorMessage(e));
        }
    };

    const renderJobChip = (job) => {
        const selected = selectedJobId === job._id;

        return (
            <TouchableOpacity
                key={job._id}
                style={[styles.jobChip, selected && styles.jobChipActive]}
                onPress={() => setSelectedJobId(job._id)}
            >
                <Text style={[styles.jobChipText, selected && styles.jobChipTextActive]}>
                    {job.jobNumber}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.jobText}>
                    {item.lineName} · {formatDateLabel(item.productionDate)}
                </Text>
                <Text style={styles.timeText}>{String(item.hour).padStart(2, '0')}:00</Text>
            </View>
            <View style={styles.statsContainer}>
                <Text style={styles.producedText}>+ {formatNumber(item.quantity)} units</Text>
            </View>
        </View>
    );

    if (!canUseHourlyProduction) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="lock-closed-outline" size={28} color="#6B7280" />
                <Text style={styles.permissionTitle}>Hourly production is restricted</Text>
                <Text style={styles.permissionText}>
                    Only admins, managers, supervisors, and operators can use this module on mobile.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {loading && jobs.length === 0 ? (
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchJobs}
                    ListHeaderComponent={(
                        <View style={styles.headerCard}>
                            <Text style={styles.headerTitle}>Hourly Production</Text>
                            <Text style={styles.headerText}>
                                Select an active job, then add a log for your current hour.
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobScroller}>
                                {jobs.map(renderJobChip)}
                            </ScrollView>
                            <Text style={styles.helperText}>
                                Line: {lineName || 'Not assigned'} · Employee: {user?.employeeProfile?.employeeId || 'Not linked'}
                            </Text>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No hourly records for this job</Text>
                            <Text style={styles.emptyText}>Add a production row to start tracking output.</Text>
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
                            <Text style={styles.modalTitle}>Log Production Output</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Production Date (YYYY-MM-DD)"
                                value={productionDate}
                                onChangeText={setProductionDate}
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Hour (0-23)"
                                value={hour}
                                onChangeText={setHour}
                                keyboardType="numeric"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Line Name"
                                value={lineName}
                                onChangeText={setLineName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Quantity Produced"
                                value={quantityProduced}
                                onChangeText={setQuantityProduced}
                                keyboardType="numeric"
                            />

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
                                    onPress={handleAddLog}
                                >
                                    <Text style={styles.saveButtonText}>Submit Log</Text>
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
    jobScroller: { marginTop: 14, marginBottom: 12 },
    jobChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: '#EFF6FF',
        marginRight: 8,
    },
    jobChipActive: { backgroundColor: '#3B82F6' },
    jobChipText: { color: '#1D4ED8', fontWeight: '600' },
    jobChipTextActive: { color: '#FFFFFF' },
    helperText: { fontSize: 13, color: '#4B5563' },
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
    jobText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    timeText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
    statsContainer: { alignItems: 'flex-end' },
    producedText: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
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
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#F3F4F6', marginRight: 8 },
    cancelButtonText: { color: '#4B5563', fontWeight: '600' },
    saveButton: { backgroundColor: '#3B82F6', marginLeft: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '600' },
});

export default ProductionLogScreen;
