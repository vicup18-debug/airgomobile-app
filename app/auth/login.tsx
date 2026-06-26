import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPushTokenAfterLogin } from '../../hooks/usePushNotifications';
import { API_URL } from '../../constants/config';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const LOGIN_API_URL = `${API_URL}/auth/login`;

    // 🟢 DYNAMIC VALIDATION
    const isFormValid = email.includes('@') && password.length >= 6;

    const handleLogin = async () => {
        if (!isFormValid) return; // Prevent submission if button is somehow bypassed

        setLoading(true);
        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem('userId', data._id || data.userId);
                await AsyncStorage.setItem('userName', data.name || data.user?.name || 'Traveler');
                await AsyncStorage.setItem('userEmail', data.email || email);
                await AsyncStorage.setItem('userRole', data.role || 'user');
                // Store JWT so authenticated endpoints can be called later
                if (data.token) {
                    await AsyncStorage.setItem('authToken', data.token);
                }

                // Register / sync FCM device token now that userId is stored
                syncPushTokenAfterLogin().catch(e =>
                    console.warn('FCM post-login sync failed:', e)
                );

                // 🟢 THE MAGIC TRAFFIC COP
                if (data.role === 'superadmin') {
                    router.replace('/superadmin/dashboard' as any);
                } else if (data.role === 'partner') {
                    router.replace('/partner/dashboard' as any);
                } else {
                    router.replace('/(tabs)' as any);
                }
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Check your connection');
        } finally {
            setLoading(false);
        }
    };

    return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)' as any);
                    }
                }}
                style={styles.backBtn}
            >
                <Ionicons name="arrow-back" size={24} color="#1A202C" />
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
            <View style={styles.titleContainer}>
                {/* 🟢 YOUR ACTUAL LOGO HERE */}
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.subtitle}>SIGN IN TO CONTINUE</Text>
            </View>

            <TouchableOpacity style={styles.googleButton}>
                <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
                <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
            </TouchableOpacity>

            <TextInput
                style={styles.inputBox}
                placeholder="Email Address"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#718096" />
                </TouchableOpacity>
            </View>

            {/* 🟢 DYNAMIC LOGIN BUTTON */}
            <TouchableOpacity
                style={[styles.loginButton, isFormValid && styles.loginButtonActive]}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
            >
                {loading ? (
                    <ActivityIndicator color={isFormValid ? "#FFF" : "#004A99"} />
                ) : (
                    <Text style={[styles.loginButtonText, isFormValid && styles.loginButtonTextActive]}>
                        Sign in
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerLink} onPress={() => router.replace('/auth/register' as any)}>
                <Text style={styles.footerText}>Don&apos;t have an account? <Text style={styles.footerLinkText}>Sign up</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

        </View>
    </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    content: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },

    titleContainer: { alignItems: 'center', marginBottom: 30 },
    logoImage: {
        width: 180,
        height: 60,
        marginBottom: 10
    },
    brandTitle: { fontSize: 42, fontWeight: '900', color: '#1A202C', letterSpacing: -1, marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#4A5568', textTransform: 'uppercase', letterSpacing: 1 },

    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 15, borderRadius: 8, marginBottom: 25 },
    googleButtonText: { color: '#1A202C', fontSize: 14, fontWeight: 'bold' },

    inputBox: { borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, height: 55, borderRadius: 8, fontSize: 16, color: '#1A202C', marginBottom: 15 },

    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, height: 55, paddingHorizontal: 15, marginBottom: 15 },
    passwordInput: { flex: 1, fontSize: 16, color: '#1A202C' },

    // Default "Dead" State
    loginButton: { backgroundColor: '#E2E8F0', paddingVertical: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    loginButtonText: { color: '#A0AEC0', fontSize: 16, fontWeight: 'bold' },

    // Awake "Premium" State
    loginButtonActive: { backgroundColor: '#004A99', shadowColor: '#004A99', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    loginButtonTextActive: { color: '#FFF' },

    footerLink: { marginTop: 25, alignItems: 'center' },
    footerText: { color: '#4A5568', fontSize: 14 },
    footerLinkText: { color: '#004A99', fontWeight: 'bold' },

    forgotPassword: { marginTop: 15, alignItems: 'center' },
    forgotPasswordText: { color: '#718096', fontSize: 14, textDecorationLine: 'underline' }
});