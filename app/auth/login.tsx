import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, ScrollView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPushTokenAfterLogin } from '../../hooks/usePushNotifications';
import { API_URL } from '../../constants/config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '426051101549-nsa4ivjki5eo0muc1efn7tbp0p1qrpe1.apps.googleusercontent.com',
  // offlineAccess: true,
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const params = useLocalSearchParams<{ verifyEmail?: string }>();
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState('');

  const LOGIN_API_URL = `${API_URL}/auth/login`;

  // Dynamic validation — button activates when form is complete
  const isFormValid = email.includes('@') && password.length >= 6;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.status === 429) {
        Toast.show({ type: 'error', text1: 'Account Locked', text2: 'Too many failed attempts. Please try again in 15 minutes.' });
      } else if (response.ok) {
        await AsyncStorage.setItem('userId', String(data._id || data.userId || ''));
        await AsyncStorage.setItem('userName', String(data.name || data.user?.name || 'Traveler'));
        await AsyncStorage.setItem('userEmail', String(data.email || email || ''));
        await AsyncStorage.setItem('userRole', String(data.role || 'user'));
        await AsyncStorage.setItem('isApproved', String(data.isApproved || 'false'));
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        }

        syncPushTokenAfterLogin().catch(e =>
          console.warn('FCM post-login sync failed:', e)
        );

        if (data.role === 'superadmin') {
          router.replace('/superadmin/dashboard' as any);
        } else if (data.role === 'partner') {
          router.replace('/partner/dashboard' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      } else {
        Toast.show({ type: 'error', text1: 'Login Failed', text2: data.message || 'Invalid credentials' });
        if (response.status === 403 && data.message?.toLowerCase().includes('pending approval')) {
          setPendingApprovalMsg(data.message);
        } else if (response.status === 403 && data.message?.toLowerCase().includes('verify')) {
          setShowResend(true);
        } else {
          setShowResend(false);
        }
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Verification Sent', text2: 'Please check your email inbox.' });
        setShowResend(false);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'Failed to resend email.' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || response.idToken;
      
      if (idToken) {
        handleBackendGoogleLogin(idToken);
      } else {
        Toast.show({ type: 'error', text1: 'Authentication Error', text2: 'No ID token returned' });
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Sign in failed', text2: error.message || 'Could not connect to Google' });
    }
  };

  const handleBackendGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken })
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem('userId', String(data._id || data.userId || ''));
        await AsyncStorage.setItem('userName', String(data.name || data.user?.name || 'Traveler'));
        await AsyncStorage.setItem('userEmail', String(data.email || data.user?.email || ''));
        await AsyncStorage.setItem('userRole', String(data.role || 'user'));
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        }

        syncPushTokenAfterLogin().catch(e => console.warn('FCM sync failed:', e));

        if (data.role === 'superadmin') {
          router.replace('/superadmin/dashboard' as any);
        } else if (data.role === 'partner') {
          router.replace('/partner/dashboard' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      } else {
        Toast.show({ type: 'error', text1: 'Google Sign-In Failed', text2: data.message || 'Invalid credentials' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection' });
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.headerTagline}>SIGN IN TO CONTINUE</Text>
          </View>
        </View>

        {/* ── WHITE CARD FORM ── */}
        <View style={styles.card}>

          {params.verifyEmail === 'true' && (
            <View style={{ backgroundColor: '#EBF8FF', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#BEE3F8' }}>
              <Text style={{ color: '#2B6CB0', fontSize: 14, textAlign: 'center', fontWeight: '500' }}>
                Account created successfully! Please check your email to verify your account before logging in.
              </Text>
            </View>
          )}

          {pendingApprovalMsg ? (
            <View style={{ backgroundColor: '#FEFCBF', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#F6E05E' }}>
              <Text style={{ color: '#975A16', fontSize: 14, textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}>
                Approval Pending
              </Text>
              <Text style={{ color: '#975A16', fontSize: 13, textAlign: 'center' }}>
                {pendingApprovalMsg}
              </Text>
            </View>
          ) : null}

          {/* Google Button */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
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
              placeholder="Password"
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/auth/forgot-password' as any)}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button — activates when form is valid */}
          <TouchableOpacity
            style={[styles.loginButton, isFormValid && styles.loginButtonActive]}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={isFormValid ? '#000080' : '#A0AEC0'} />
            ) : (
              <Text style={[styles.loginButtonText, isFormValid && styles.loginButtonTextActive]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Verification Email Button */}
          {showResend && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendEmail}
              disabled={resendLoading}
              activeOpacity={0.85}
            >
              {resendLoading ? (
                <ActivityIndicator color="#000080" />
              ) : (
                <Text style={styles.resendButtonText}>
                  Resend Verification Email
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Register redirect */}
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.replace('/auth/register' as any)}
          >
            <Text style={styles.footerText}>
              Don't have an account?{'  '}
              <Text style={styles.footerLinkText}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  resendButton: { marginTop: 15, paddingVertical: 12, backgroundColor: '#EDF2F7', borderRadius: 8, alignItems: 'center' },
  resendButtonText: { color: '#000080', fontWeight: 'bold' },

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
    padding: 28,
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#A0AEC0', fontSize: 12, fontWeight: '500', marginHorizontal: 10 },

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
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A202C',
    fontWeight: '500',
  },

  // Forgot password
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#000080', fontSize: 13, fontWeight: '600' },

  // Login button — dead state
  loginButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 22,
  },
  loginButtonText: { color: '#A0AEC0', fontSize: 16, fontWeight: '800' },

  // Login button — active state
  loginButtonActive: {
    backgroundColor: '#FFB81C',
    shadowColor: '#FFB81C',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonTextActive: { color: '#000080' },

  // Footer
  footerLink: { alignItems: 'center' },
  footerText: { color: '#718096', fontSize: 14 },
  footerLinkText: { color: '#000080', fontWeight: '700' },
});