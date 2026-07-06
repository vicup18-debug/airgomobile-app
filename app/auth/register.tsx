import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Image, ScrollView
} from 'react-native';
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

  // Dynamic validation — button activates when everything is correct
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
          role: 'user'
        })
      });

      const data = await response.json();

      if (response.ok) {
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

  const handleGoogleSignUp = () => {
    Alert.alert(
      'Coming Soon',
      'Google Sign-Up will be available in the next update. Please register with your email and password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── PREMIUM NAVY HEADER ── */}
        <View style={styles.header}>
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)' as any);
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Logo + tagline */}
          <View style={styles.headerCenter}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTagline}>CREATE YOUR ACCOUNT</Text>
          </View>
        </View>

        {/* ── WHITE CARD FORM ── */}
        <View style={styles.card}>

          {/* Google button */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>SIGN UP WITH GOOGLE</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or register with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* First & Last Name */}
          <View style={styles.nameRow}>
            <View style={[styles.inputRow, { flex: 1, marginRight: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#A0AEC0"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputRow, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#A0AEC0"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBox}>
              <Ionicons name="call-outline" size={14} color="#718096" style={{ marginRight: 4 }} />
              <Text style={styles.countryCodeText}>+234</Text>
            </View>
            <View style={[styles.inputRow, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#718096" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#A0AEC0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#718096" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#A0AEC0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#718096"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={[
            styles.inputRow,
            confirmPassword.length > 0 && confirmPassword !== password && styles.inputRowError
          ]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#718096" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#A0AEC0"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isFormValid && styles.registerButtonActive]}
            onPress={handleRegister}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={isFormValid ? '#000080' : '#A0AEC0'} />
            ) : (
              <Text style={[styles.registerButtonText, isFormValid && styles.registerButtonTextActive]}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Login redirect */}
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.replace('/auth/login' as any)}
          >
            <Text style={styles.footerText}>
              Already have an account?{'  '}
              <Text style={styles.footerLinkText}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  // ── Navy header ──
  header: {
    backgroundColor: '#000080',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  orb1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,184,28,0.08)',
  },
  orb2: {
    position: 'absolute', bottom: -30, left: -50,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { position: 'absolute', top: 60, left: 20, padding: 8 },
  headerCenter: { alignItems: 'center' },
  logoImage: { width: 160, height: 56, marginBottom: 14 },
  headerTagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── White form card ──
  card: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 24,
    shadowColor: '#000080',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 40,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  googleButtonText: { color: '#1A202C', fontSize: 14, fontWeight: '700' },

  // OR divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#A0AEC0', fontSize: 12, fontWeight: '500', marginHorizontal: 10 },

  // Name row (side by side)
  nameRow: { flexDirection: 'row', marginBottom: 0 },

  // Phone row
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
  },
  countryCodeText: { fontSize: 14, color: '#1A202C', fontWeight: '600' },

  // Input rows
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 14,
  },
  inputRowError: { borderColor: '#E53E3E' },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A202C',
    fontWeight: '500',
  },
  errorText: { color: '#E53E3E', fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 4 },

  // Register button — dead state
  registerButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  registerButtonText: { color: '#A0AEC0', fontSize: 16, fontWeight: '800' },

  // Register button — active state
  registerButtonActive: {
    backgroundColor: '#FFB81C',
    shadowColor: '#FFB81C',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  registerButtonTextActive: { color: '#000080' },

  // Footer
  footerLink: { alignItems: 'center' },
  footerText: { color: '#718096', fontSize: 14 },
  footerLinkText: { color: '#000080', fontWeight: '700' },
});