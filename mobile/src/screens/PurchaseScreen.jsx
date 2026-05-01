import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, shadow } from '../theme';

const TILES = [
    { label: 'Suppliers', icon: 'business-outline', screen: 'Suppliers', color: colors.primary, desc: 'Manage supplier database' },
    { label: 'Material Catalog', icon: 'layers-outline', screen: 'Materials', color: colors.warning, desc: 'Raw material inventory' },
    { label: 'Requisitions', icon: 'document-text-outline', screen: 'Requisitions', color: colors.purple, desc: 'Material requisition orders' },
    { label: 'Purchase Orders', icon: 'cart-outline', screen: 'PurchaseOrders', color: colors.teal, desc: 'Vendor purchase orders' },
    { label: 'Goods Received', icon: 'checkmark-circle-outline', screen: 'GoodsReceived', color: colors.success, desc: 'GRN & receiving log' },
];

const PurchaseScreen = () => {
    const navigation = useNavigation();
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.banner}>
                <Ionicons name="bag-handle-outline" size={32} color="#FFF" />
                <Text style={styles.bannerTitle}>Purchase Management</Text>
                <Text style={styles.bannerSub}>Suppliers · Orders · Receiving</Text>
            </View>
            <View style={styles.list}>
                {TILES.map(tile => (
                    <TouchableOpacity key={tile.screen} style={styles.tile} onPress={() => navigation.navigate(tile.screen)} activeOpacity={0.78}>
                        <View style={[styles.tileIcon, { backgroundColor: tile.color + '18' }]}>
                            <Ionicons name={tile.icon} size={26} color={tile.color} />
                        </View>
                        <View style={styles.tileText}>
                            <Text style={styles.tileLabel}>{tile.label}</Text>
                            <Text style={styles.tileDesc}>{tile.desc}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md, paddingBottom: 40 },
    banner: {
        backgroundColor: colors.orange, borderRadius: radius.lg, padding: spacing.lg,
        alignItems: 'center', marginBottom: spacing.md,
    },
    bannerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 8 },
    bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    list: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.sm },
    tile: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    tileIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    tileText: { flex: 1 },
    tileLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    tileDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});

export default PurchaseScreen;
