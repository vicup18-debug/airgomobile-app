import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPushTokenAfterLogin } from '../../hooks/usePushNotifications';
import { API_URL } from '../../constants/config';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      if (response.ok) {
        await AsyncStorage.setItem('userId', data._id || data.userId);
        await AsyncStorage.setItem('userName', data.name || data.user?.name || 'Traveler');
        await AsyncStorage.setItem('userEmail', data.email || email);
        await AsyncStorage.setItem('userRole', data.role || 'user');
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
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Check your connection');
    } finally {
      setLoading(false);
    }
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '426051101549-nsa4ivjki5eo0muc1efn7tbp0p1qrpe1.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      // expo-auth-session uses response.authentication.idToken or response.params.id_token
      const idToken = response.authentication?.idToken || response.params?.id_token;
      if (idToken) {
        handleBackendGoogleLogin(idToken);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Authentication error', response.error?.message || 'Failed to authenticate with Google');
    }
  }, [response]);

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
        await AsyncStorage.setItem('userId', data._id || data.userId);
        await AsyncStorage.setItem('userName', data.name || data.user?.name || 'Traveler');
        await AsyncStorage.setItem('userEmail', data.email || data.user?.email || '');
        await AsyncStorage.setItem('userRole', data.role || 'user');
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
        Alert.alert('Google Sign-In Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    promptAsync();
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