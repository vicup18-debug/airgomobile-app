import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/config';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    const load = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) setUserEmail(email);
    };
    load();
  }, []);

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to resend. Please try again.');
      }
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orb1} /><View style={styles.orb2} />
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark-outline" size={40} color="#FFB81C" />
        </View>
        <Text style={styles.headerTitle}>Verify Your Email</Text>
        <Text style={styles.headerSub}>
          Secure your account in one click
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          {/* Illustration */}
          <View style={styles.mailIllustration}>
            <Ionicons name="mail-unread-outline" size={56} color="#000080" />
          </View>

          <Text style={styles.cardTitle}>Check Your Inbox</Text>
          <Text style={styles.cardBody}>
            We sent a verification link to{'\n'}
            <Text style={styles.emailHighlight}>{userEmail || 'your email address'}</Text>
          </Text>
          <Text style={styles.cardNote}>
            Click the link in the email to verify your account. The link expires in 24 hours.
          </Text>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color="#E53E3E" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {sent ? (
            <View style={styles.sentBanner}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#38A169" />
              <Text style={styles.sentText}>Verification email resent!</Text>
            </View>
          ) : null}

          {/* Resend */}
          <TouchableOpacity
            style={[styles.resendBtn, loading && styles.resendBtnDisabled]}
            onPress={handleResend}
            disabled={loading || sent}
          >
            {loading
              ? <ActivityIndicator color="#000080" />
              : <Text style={styles.resendBtnText}>
                  {sent ? '✅ Email Sent' : 'Resend Verification Email'}
                </Text>
            }
          </TouchableOpacity>

          {/* Continue */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.replace('/(tabs)' as any)}
          >
            <Text style={styles.continueBtnText}>Continue to App</Text>
          </TouchableOpacity>

          {/* Help */}
          <Text style={styles.helpText}>
            Wrong email?{' '}
            <Text style={styles.helpLink} onPress={() => router.push('/auth/login' as any)}>
              Sign out and try again
            </Text>
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Not seeing the email?</Text>
          {[
            'Check your Spam or Junk folder',
            'Make sure the email is correct',
            'Wait a few minutes and try again',
            'Add Info@airgo.ng to your contacts',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#38A169" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
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
  shieldWrap:   { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  headerTitle:  { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  headerSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  content: { flex: 1, padding: 20, paddingTop: 24 },

  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000080', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6,
  },
  mailIllustration: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#EBF4FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  cardTitle:      { fontSize: 20, fontWeight: '900', color: '#1A202C', marginBottom: 10, textAlign: 'center' },
  cardBody:       { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  emailHighlight: { color: '#000080', fontWeight: '700' },
  cardNote:       { fontSize: 13, color: '#A0AEC0', textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, alignSelf: 'flex-start' },
  errorText: { color: '#E53E3E', fontSize: 13 },

  sentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FFF4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16, alignSelf: 'stretch',
  },
  sentText: { color: '#38A169', fontSize: 14, fontWeight: '600' },

  resendBtn: {
    width: '100%', borderWidth: 1.5, borderColor: '#000080', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  resendBtnDisabled: { borderColor: '#CBD5E0' },
  resendBtnText:     { color: '#000080', fontSize: 15, fontWeight: '700' },

  continueBtn: {
    width: '100%', backgroundColor: '#FFB81C', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 16,
    shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  continueBtnText: { color: '#000080', fontSize: 15, fontWeight: '900' },

  helpText: { fontSize: 13, color: '#A0AEC0', textAlign: 'center' },
  helpLink: { color: '#000080', fontWeight: '700' },

  // Tips
  tipsCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: '#1A202C', marginBottom: 12 },
  tipRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipText:   { fontSize: 13, color: '#4A5568', fontWeight: '500', flex: 1 },
});
