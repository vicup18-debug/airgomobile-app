import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../../constants/config';

export default function RegisterScreen() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const REGISTER_API_URL = `${API_URL}/auth/register`;

    // 🟢 DYNAMIC VALIDATION: Wakes up button when everything is correct
    const isFormValid =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        phone.trim().length > 0 &&
        email.includes('@') &&
        password.length >= 6 &&
        password === confirmPassword;

    const handleRegister = async () => {
        if (!isFormValid) return;

        setLoading(true);
        try {
            const response = await fetch(REGISTER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`,
                    email,
                    password,
                    phone: `+234${phone}`,
                    role: 'user' // Default role
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Instantly log them in after registration
                await AsyncStorage.setItem('userId', data._id || data.userId);
                await AsyncStorage.setItem('userName', data.name || `${firstName} ${lastName}`);
                await AsyncStorage.setItem('userEmail', email);
                router.replace('/(tabs)' as any);
            } else {
                Alert.alert('Registration Failed', data.message || 'Something went wrong');
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* 🟢 EXACT TEMPLATE HEADER */}
                <View style={styles.titleContainer}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                {/* 🟢 GOOGLE SIGN UP BUTTON */}
                <TouchableOpacity style={styles.googleButton}>
                    <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
                    <Text style={styles.googleButtonText}>SIGN UP WITH GOOGLE</Text>
                </TouchableOpacity>

                {/* 🟢 FIRST & LAST NAME */}
                <TextInput
                    style={styles.inputBox}
                    placeholder="First Name"
                    placeholderTextColor="#A0AEC0"
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <TextInput
                    style={styles.inputBox}
                    placeholder="Last Name"
                    placeholderTextColor="#A0AEC0"
                    value={lastName}
                    onChangeText={setLastName}
                />

                {/* 🟢 PHONE NUMBER ROW (+234 Block) */}
                <View style={styles.phoneRow}>
                    <View style={styles.countryCodeBox}>
                        <Text style={styles.countryCodeText}>+234</Text>
                    </View>
                    <TextInput
                        style={[styles.inputBox, styles.phoneInput]}
                        placeholder="Phone Number"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                {/* 🟢 EMAIL & PASSWORDS */}
                <TextInput
                    style={styles.inputBox}
                    placeholder="Email"
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

                <TextInput
                    style={styles.inputBox}
                    placeholder="Confirm Password"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                {/* 🟢 DYNAMIC REGISTER BUTTON */}
                <TouchableOpacity
                    style={[styles.registerButton, isFormValid && styles.registerButtonActive]}
                    onPress={handleRegister}
                    disabled={!isFormValid || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={isFormValid ? "#FFF" : "#004A99"} />
                    ) : (
                        <Text style={[styles.registerButtonText, isFormValid && styles.registerButtonTextActive]}>
                            Register Now
                        </Text>
                    )}
                </TouchableOpacity>

                {/* 🟢 LOGIN REDIRECT */}
                <TouchableOpacity style={styles.footerLink} onPress={() => router.replace('/auth/login' as any)}>
                    <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLinkText}>Sign in</Text></Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    content: { paddingHorizontal: 30, paddingBottom: 50 },

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

    phoneRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    countryCodeBox: { width: '25%', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', borderRadius: 8, height: 55 },
    countryCodeText: { fontSize: 16, color: '#1A202C', fontWeight: '500' },
    phoneInput: { width: '70%', marginBottom: 0 },

    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, height: 55, paddingHorizontal: 15, marginBottom: 15 },
    passwordInput: { flex: 1, fontSize: 16, color: '#1A202C' },

    // Default "Dead" State
    registerButton: { backgroundColor: '#E2E8F0', paddingVertical: 18, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    registerButtonText: { color: '#A0AEC0', fontSize: 16, fontWeight: 'bold' },

    // Awake "Premium" State
    registerButtonActive: { backgroundColor: '#004A99', shadowColor: '#004A99', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    registerButtonTextActive: { color: '#FFF' },

    footerLink: { marginTop: 25, alignItems: 'center' },
    footerText: { color: '#4A5568', fontSize: 14 },
    footerLinkText: { color: '#004A99', fontWeight: 'bold' }
});