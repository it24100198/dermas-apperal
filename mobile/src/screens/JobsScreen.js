import React, { useEffect, useState } from 'react';
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
import { extractList, formatNumber, formatStatusLabel, getErrorMessage } from '../utils/mobile';

const JobsScreen = () => {
    const [jobs, setJobs] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');

    const [styleRef, setStyleRef] = useState('');
    const [batchRef, setBatchRef] = useState('');
    const [issuedFabricQuantity, setIssuedFabricQuantity] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');

    useEffect(() => {
        fetchJobs();
        fetchMaterials();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/jobs');
            setJobs(extractList(response.data, ['jobs']));
        } catch (e) {
            console.error('Failed to fetch jobs', e);
            setJobs([]);
            setError(getErrorMessage(e, 'Unable to load manufacturing jobs right now.'));
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await api.get('/meta/materials');
            const fabricMaterials = extractList(response.data, ['materials']).filter(
                (item) => item.type === 'fabric'
            );
            setMaterials(fabricMaterials);
            if (!selectedMaterialId && fabricMaterials[0]?._id) {
                setSelectedMaterialId(fabricMaterials[0]._id);
            }
        } catch (e) {
            console.error('Failed to fetch materials for job creation', e);
            setMaterials([]);
        }
    };

    const resetForm = () => {
        setStyleRef('');
        setBatchRef('');
        setIssuedFabricQuantity('');
        setSelectedMaterialId(materials[0]?._id || '');
    };

    const handleAddJob = async () => {
        if (!selectedMaterialId || !issuedFabricQuantity) {
            Alert.alert('Error', 'Select a fabric material and enter the issued quantity.');
            return;
        }

        try {
            await api.post('/jobs', {
                materialId: selectedMaterialId,
                styleRef: styleRef.trim(),
                batchRef: batchRef.trim(),
                issuedFabricQuantity: Number(issuedFabricQuantity),
            });
            await fetchJobs();
            setModalVisible(false);
            resetForm();
            Alert.alert('Success', 'Job created successfully.');
        } catch (e) {
            Alert.alert('Unable to create job', getErrorMessage(e));
        }
    };

    const handleSendToCutting = (item) => {
        if (item.status !== 'FABRIC_ISSUED') {
            Alert.alert(
                'Unavailable',
                'Only jobs in FABRIC_ISSUED status can be sent to cutting from mobile.'
            );
            return;
        }

        Alert.alert('Send to Cutting', 'Move this job to the cutting stage?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                onPress: async () => {
                    try {
                        await api.post(`/jobs/${item._id}/send-to-cutting`);
                        await fetchJobs();
                    } catch (e) {
                        Alert.alert('Unable to update job', getErrorMessage(e));
                    }
                },
            },
        ]);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'FABRIC_ISSUED': return { bg: '#DBEAFE', text: '#1D4ED8' };
            case 'SENT_TO_CUTTING': return { bg: '#FEF3C7', text: '#D97706' };
            case 'CUTTING_COMPLETED': return { bg: '#E0F2FE', text: '#0369A1' };
            case 'LINE_ASSIGNED': return { bg: '#EDE9FE', text: '#6D28D9' };
            case 'LINE_IN_PROGRESS': return { bg: '#DCFCE7', text: '#15803D' };
            default: return { bg: '#F3F4F6', text: '#6B7280' };
        }
    };

    const renderMaterialChip = (material) => {
        const selected = selectedMaterialId === material._id;

        return (
            <TouchableOpacity
                key={material._id}
                style={[styles.materialChip, selected && styles.materialChipActive]}
                onPress={() => setSelectedMaterialId(material._id)}
            >
                <Text style={[styles.materialChipText, selected && styles.materialChipTextActive]}>
                    {material.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={styles.itemCard}
                onLongPress={() => handleSendToCutting(item)}
                delayLongPress={500}
            >
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobNo}>{item.jobNumber}</Text>
                    <Text style={styles.productText}>
                        {item.styleRef || 'No style ref'} · Batch {item.batchRef || 'N/A'}
                    </Text>
                    <Text style={styles.metaText}>
                        Fabric issued: {formatNumber(item.issuedFabricQuantity)}
                        {item.productId?.name ? ` · Product ${item.productId.name}` : ''}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {formatStatusLabel(item.status)}
                    </Text>
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
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchJobs}
                    ListHeaderComponent={(
                        <View style={styles.headerCard}>
                            <Text style={styles.headerTitle}>Manufacturing Jobs</Text>
                            <Text style={styles.headerText}>
                                Long press a FABRIC_ISSUED job to send it to cutting.
                            </Text>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No manufacturing jobs yet</Text>
                            <Text style={styles.emptyText}>Create a new job once fabric has been issued.</Text>
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
                            <Text style={styles.modalTitle}>Create Manufacturing Job</Text>

                            <Text style={styles.modalLabel}>Fabric Material</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.materialScroller}>
                                {materials.length > 0 ? materials.map(renderMaterialChip) : (
                                    <Text style={styles.helperText}>No fabric materials available.</Text>
                                )}
                            </ScrollView>

                            <TextInput
                                style={styles.input}
                                placeholder="Style Reference"
                                value={styleRef}
                                onChangeText={setStyleRef}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Batch Reference"
                                value={batchRef}
                                onChangeText={setBatchRef}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Issued Fabric Quantity"
                                value={issuedFabricQuantity}
                                onChangeText={setIssuedFabricQuantity}
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
                                    onPress={handleAddJob}
                                >
                                    <Text style={styles.saveButtonText}>Create Job</Text>
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
    jobNo: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    productText: { fontSize: 14, color: '#4B5563', marginTop: 4 },
    metaText: { fontSize: 13, color: '#6B7280', marginTop: 6 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, maxWidth: 130 },
    statusText: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
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
    materialScroller: { marginBottom: 16 },
    materialChip: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: '#EFF6FF',
        marginRight: 8,
    },
    materialChipActive: { backgroundColor: '#3B82F6' },
    materialChipText: { color: '#1D4ED8', fontWeight: '600' },
    materialChipTextActive: { color: '#FFFFFF' },
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

export default JobsScreen;
