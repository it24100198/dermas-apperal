import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getErrorMessage } from '../utils/mobile';
import { colors, radius, spacing, shadow } from '../theme';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (e) {
            setError(getErrorMessage(e, 'Invalid credentials or server error.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.topBg} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Brand Header */}
                <View style={styles.brandSection}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="shirt" size={36} color="#FFF" />
                    </View>
                    <Text style={styles.brandName}>Dermas Apparel</Text>
                    <Text style={styles.brandTagline}>ERP Management System</Text>
                </View>

                {/* Login Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sign In</Text>
                    <Text style={styles.cardSubtitle}>Access your dashboard</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Password"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Sign In</Text>
                                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                    Dermas Apparel · Garment Management ERP
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4FF' },
    topBg: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 280,
        backgroundColor: colors.primaryDark,
        borderBottomLeftRadius: 48,
        borderBottomRightRadius: 48,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.md,
        paddingTop: 60,
    },
    brandSection: {
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: 16,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    brandName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    brandTagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.lg,
        ...shadow.lg,
        marginBottom: spacing.lg,
    },
    cardTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.dangerLight,
        borderRadius: radius.sm,
        padding: 12,
        marginBottom: 14,
    },
    errorText: { color: '#B91C1C', fontSize: 14, flex: 1 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: 14,
        marginBottom: 14,
        height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
    },
    eyeBtn: { padding: 4 },
    loginBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        ...shadow.primary,
    },
    loginBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    forgotLink: { marginTop: 16, alignItems: 'center' },
    forgotText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
    footerText: { textAlign: 'center', color: colors.textMuted, fontSize: 12 },
});

export default LoginScreen;
