import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/config';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState('');

  const handleSend = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Could not send reset email. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orb1} /><View style={styles.orb2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="lock-open-outline" size={28} color="#FFB81C" />
          </View>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <Text style={styles.headerSub}>We'll send a reset link to your email</Text>
        </View>
      </View>

      <View style={styles.content}>
        {sent ? (
          // ── SUCCESS STATE ──
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="mail-open-outline" size={48} color="#38A169" />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successBody}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successNote}>
              Didn't receive it? Check your spam folder or try again.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setSent(false)}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/auth/login' as any)}>
              <Text style={styles.loginBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── INPUT STATE ──
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter Your Email</Text>
            <Text style={styles.cardSub}>
              Enter the email address associated with your Airgo account.
            </Text>

            <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
              <Ionicons name="mail-outline" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#E53E3E" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#000080" />
                : <Text style={styles.sendBtnText}>Send Reset Link</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToLogin} onPress={() => router.back()}>
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    backgroundColor: '#000080', paddingTop: 60, paddingBottom: 40,
    paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  orb1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,184,28,0.08)' },
  orb2: { position: 'absolute', bottom: -30, left: -50, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  backBtn:      { position: 'absolute', top: 60, left: 20, padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  headerTitle:  { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  headerSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' },

  content: { flex: 1, padding: 20, justifyContent: 'center' },

  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    shadowColor: '#000080', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 8 },
  cardSub:   { fontSize: 14, color: '#718096', lineHeight: 22, marginBottom: 24 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#F8F9FA', marginBottom: 8,
  },
  inputRowError: { borderColor: '#E53E3E' },
  inputIcon:     { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1A202C', fontWeight: '500' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  errorText: { color: '#E53E3E', fontSize: 13 },

  sendBtn: {
    backgroundColor: '#FFB81C', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
    shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#FDE68A' },
  sendBtnText:     { color: '#000080', fontSize: 16, fontWeight: '900' },

  backToLogin:     { alignItems: 'center' },
  backToLoginText: { color: '#718096', fontSize: 14, fontWeight: '600' },

  // Success state
  successCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 28, alignItems: 'center',
    shadowColor: '#000080', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6,
  },
  successIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FFF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '900', color: '#1A202C', marginBottom: 10, textAlign: 'center' },
  successBody:  { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  successEmail: { color: '#000080', fontWeight: '700' },
  successNote:  { fontSize: 13, color: '#A0AEC0', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn: {
    width: '100%', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  retryBtnText: { color: '#4A5568', fontSize: 15, fontWeight: '600' },
  loginBtn: {
    width: '100%', backgroundColor: '#FFB81C', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  loginBtnText: { color: '#000080', fontSize: 15, fontWeight: '900' },
});
