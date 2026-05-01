import React, { useEffect, useState, useContext } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    ActivityIndicator, TouchableOpacity, Alert,
    Modal, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { extractList, formatStatusLabel, formatNumber, getErrorMessage, hasAnyRole } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const STAGE_TABS = [
    { key: 'all', label: 'All' },
    { key: 'FABRIC_ISSUED', label: 'Fabric' },
    { key: 'SENT_TO_CUTTING', label: 'Cutting' },
    { key: 'CUTTING_COMPLETED', label: 'Done Cutting' },
    { key: 'LINE_ASSIGNED', label: 'Assigned' },
    { key: 'LINE_IN_PROGRESS', label: 'In Progress' },
];

const STATUS_COLORS = {
    FABRIC_ISSUED: { bg: '#DBEAFE', text: '#1D4ED8' },
    SENT_TO_CUTTING: { bg: '#FEF3C7', text: '#D97706' },
    CUTTING_COMPLETED: { bg: '#E0F2FE', text: '#0369A1' },
    LINE_ASSIGNED: { bg: '#EDE9FE', text: '#6D28D9' },
    LINE_IN_PROGRESS: { bg: '#DCFCE7', text: '#15803D' },
};

const ManufacturingScreen = () => {
    const navigation = useNavigation();
    const { user } = useContext(AuthContext);
    const [jobs, setJobs] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [error, setError] = useState('');

    const [styleRef, setStyleRef] = useState('');
    const [batchRef, setBatchRef] = useState('');
    const [issuedFabricQuantity, setIssuedFabricQuantity] = useState('');
    const [selectedMaterialId, setSelectedMaterialId] = useState('');

    const canCreate = hasAnyRole(user, ['admin', 'manager', 'supervisor']);

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
            setError(getErrorMessage(e, 'Unable to load manufacturing jobs.'));
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await api.get('/meta/materials');
            const fabrics = extractList(response.data, ['materials']).filter(m => m.type === 'fabric');
            setMaterials(fabrics);
            if (!selectedMaterialId && fabrics[0]?._id) setSelectedMaterialId(fabrics[0]._id);
        } catch (e) { /* silent */ }
    };

    const handleCreateJob = async () => {
        if (!selectedMaterialId || !issuedFabricQuantity) {
            Alert.alert('Error', 'Select a fabric material and enter issued quantity.');
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
            setStyleRef(''); setBatchRef(''); setIssuedFabricQuantity('');
            Alert.alert('Success', 'Job created successfully.');
        } catch (e) {
            Alert.alert('Error', getErrorMessage(e));
        }
    };

    const handleAdvanceJob = (item) => {
        if (item.status !== 'FABRIC_ISSUED') {
            Alert.alert('Unavailable', 'Only FABRIC_ISSUED jobs can be advanced to cutting from mobile.');
            return;
        }
        Alert.alert('Send to Cutting', 'Move this job to the cutting stage?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm', onPress: async () => {
                    try {
                        await api.post(`/jobs/${item._id}/send-to-cutting`);
                        await fetchJobs();
                    } catch (e) { Alert.alert('Error', getErrorMessage(e)); }
                },
            },
        ]);
    };

    const filteredJobs = activeTab === 'all' ? jobs : jobs.filter(j => j.status === activeTab);
    const statusStyle = (s) => STATUS_COLORS[s] || { bg: '#F3F4F6', text: '#6B7280' };

    const renderItem = ({ item }) => {
        const sc = statusStyle(item.status);
        return (
            <TouchableOpacity style={styles.card} onLongPress={() => handleAdvanceJob(item)} delayLongPress={500} activeOpacity={0.85}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.jobNo}>{item.jobNumber}</Text>
                    <Text style={styles.jobMeta}>{item.styleRef || 'No style'} · Batch {item.batchRef || 'N/A'}</Text>
                    <Text style={styles.jobFabric}>Fabric: {formatNumber(item.issuedFabricQuantity)} units</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{formatStatusLabel(item.status)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Stage Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
                {STAGE_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading && jobs.length === 0 ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
            ) : (
                <FlatList
                    data={filteredJobs}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchJobs}
                    ListHeaderComponent={
                        <>
                            <View style={styles.headerCard}>
                                <Text style={styles.headerTitle}>Manufacturing Jobs</Text>
                                <Text style={styles.headerSubtitle}>
                                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} · Long-press to advance stage
                                </Text>
                                {error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : null}
                            </View>
                        </>
                    }
                    ListEmptyComponent={!loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="construct-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>No jobs in this stage</Text>
                            <Text style={styles.emptyText}>Tap + to create a new manufacturing job.</Text>
                        </View>
                    ) : null}
                />
            )}

            {canCreate ? (
                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>
            ) : null}

            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Create Manufacturing Job</Text>

                            <Text style={styles.modalLabel}>Fabric Material</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                {materials.map(m => (
                                    <TouchableOpacity
                                        key={m._id}
                                        style={[styles.chip, selectedMaterialId === m._id && styles.chipActive]}
                                        onPress={() => setSelectedMaterialId(m._id)}
                                    >
                                        <Text style={[styles.chipText, selectedMaterialId === m._id && styles.chipTextActive]}>{m.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TextInput style={styles.input} placeholder="Style Reference" value={styleRef} onChangeText={setStyleRef} />
                            <TextInput style={styles.input} placeholder="Batch Reference" value={batchRef} onChangeText={setBatchRef} />
                            <TextInput style={styles.input} placeholder="Issued Fabric Quantity" value={issuedFabricQuantity} onChangeText={setIssuedFabricQuantity} keyboardType="numeric" />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleCreateJob}>
                                    <Text style={styles.saveBtnText}>Create Job</Text>
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
    tabs: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 52 },
    tabsContent: { paddingHorizontal: spacing.md, paddingVertical: 10, gap: 8 },
    tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.bg },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { color: '#FFF' },
    list: { padding: spacing.md },
    headerCard: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        padding: spacing.md, marginBottom: spacing.sm, ...shadow.sm,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    errorText: { fontSize: 14, color: colors.danger, marginTop: 8 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: radius.md,
        padding: spacing.md, marginBottom: 10, ...shadow.sm,
    },
    jobNo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    jobMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
    jobFabric: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, maxWidth: 130 },
    badgeText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        backgroundColor: colors.primary, width: 56, height: 56,
        borderRadius: 28, justifyContent: 'center', alignItems: 'center',
        ...shadow.primary,
    },
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
    emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: spacing.md },
    modalView: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, maxHeight: '85%', ...shadow.lg },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: colors.primaryLight, marginRight: 8 },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: '#FFF' },
    input: {
        backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.sm, padding: 12, marginBottom: 12, fontSize: 16, color: colors.textPrimary,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.sm, alignItems: 'center' },
    cancelBtn: { backgroundColor: colors.bg, marginRight: 8 },
    cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, marginLeft: 8 },
    saveBtnText: { color: '#FFF', fontWeight: '600' },
});

export default ManufacturingScreen;
