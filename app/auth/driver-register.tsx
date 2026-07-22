import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/config';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPushTokenAfterLogin } from '../../hooks/usePushNotifications';

export default function DriverRegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const REGISTER_API_URL = `${API_URL}/auth/register`;
  const PARTNERS_API_URL = `${API_URL}/auth/partners`;

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch(PARTNERS_API_URL);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // Filter to only Fleet/Shuttle partners (car or shuttle)
          const validPartners = data.filter((p: any) => 
            p.role === 'partner' && (p.partnerType === 'car' || p.partnerType === 'shuttle') && p.isApproved
          );
          setPartners(validPartners);
        }
      } catch (err) {
        console.error("Error fetching partners", err);
      }
    };
    fetchPartners();
  }, []);

  const handleRegister = async () => {
    if (!agreed) return setErrorMsg("You must agree to the Terms & Conditions.");
    if (!partnerId) return setErrorMsg("You must select a Fleet Partner.");
    if (!phone) return setErrorMsg("Phone number is required.");
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");
    if (password.length < 6) return setErrorMsg("Password must be at least 6 characters.");

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, phone, role: 'driver', partnerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMsg("✅ Driver account created successfully! Please check your email to verify your account, and wait for your Fleet Manager to approve you.");

      setTimeout(() => {
        router.replace('/auth/login?verifyEmail=true' as any);
      }, 5000);

    } catch (err: any) {
      setErrorMsg(`⚠️ ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/(tabs)' as any)}>
                <Text style={styles.logoText}>Airgo<Text style={styles.logoDot}>.ng</Text></Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>Driver Registration</Text>
        </View>

        <View style={styles.card}>
            {errorMsg ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
            ) : null}

            {successMsg ? (
                <View style={styles.successBanner}>
                    <Text style={styles.successBannerText}>{successMsg}</Text>
                </View>
            ) : null}

            <Text style={styles.label}>Select Your Fleet Partner *</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16}}>
                {partners.length === 0 ? (
                    <Text style={{fontSize: 13, color: '#A0AEC0', fontStyle: 'italic'}}>Loading partners...</Text>
                ) : (
                    partners.map(p => (
                        <TouchableOpacity
                            key={p._id}
                            style={[
                                styles.partnerChip,
                                partnerId === p._id && styles.partnerChipActive
                            ]}
                            onPress={() => setPartnerId(p._id)}
                        >
                            <Text style={[
                                styles.partnerChipText,
                                partnerId === p._id && styles.partnerChipTextActive
                            ]}>
                                {p.businessName || p.name}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. John Doe" />

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

            <View style={{position: 'relative'}}>
                <Text style={styles.label}>Password</Text>
                <TextInput style={[styles.input, {paddingRight: 50}]} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
            </View>

            <View style={{position: 'relative'}}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput style={[styles.input, {paddingRight: 50}]} secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.eyeText}>{showConfirmPassword ? 'HIDE' : 'SHOW'}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.termsBox} onPress={() => setAgreed(!agreed)}>
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={styles.termsText}>
                    I agree to Airgo's <Text style={styles.linkText} onPress={() => router.push('/info/terms' as any)}>Terms of Service</Text> and <Text style={styles.linkText} onPress={() => router.push('/info/privacy' as any)}>Privacy Policy</Text>. I also accept the <Text style={{color: '#FFB81C', fontWeight: 'bold'}} onPress={() => router.push('/info/terms' as any)}>Airgo Escrow Protection Agreement</Text>.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.submitBtn, (loading || !agreed) && styles.submitBtnDisabled]} 
                onPress={handleRegister} 
                disabled={loading || !agreed}
            >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
                <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink} onPress={() => router.replace('/auth/login' as any)}>Sign in</Text></Text>
                <Text style={[styles.footerText, {marginTop: 10}]}>Want to list your fleet? <Text style={[styles.footerLink, {color: '#FFB81C'}]} onPress={() => router.replace('/auth/partner-register' as any)}>Become a Partner</Text></Text>
                <Text style={[styles.footerText, {marginTop: 10}]}>Want to drive for a fleet? <Text style={[styles.footerLink, {color: '#000080'}]} onPress={() => router.replace('/auth/driver-register' as any)}>Sign up as Driver</Text></Text>
            </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingVertical: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#000080', letterSpacing: -1 },
  logoDot: { color: '#FFB81C' },
  subtitle: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginTop: 10 },
  
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: {width:0, height:10}, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: '#EDF2F7' },
  
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 14, marginBottom: 20, backgroundColor: '#FAFAFA' },
  googleButtonText: { color: '#1A202C', fontSize: 14, fontWeight: '700' },
  
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#A0AEC0', fontSize: 12, fontWeight: '500', marginHorizontal: 10 },
  
  errorBanner: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FED7D7', marginBottom: 15 },
  errorBannerText: { color: '#E53E3E', fontSize: 13, fontWeight: 'bold' },
  
  successBanner: { backgroundColor: '#F0FFF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#C6F6D5', marginBottom: 15 },
  successBannerText: { color: '#2F855A', fontSize: 13, fontWeight: 'bold' },
  
  label: { fontSize: 11, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, color: '#1A202C', marginBottom: 16 },
  
  eyeBtn: { position: 'absolute', right: 16, top: 34 },
  eyeText: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0' },
  
  termsBox: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 20, alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#CBD5E0', marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  checkboxChecked: { backgroundColor: '#000080', borderColor: '#000080' },
  termsText: { flex: 1, fontSize: 12, color: '#4A5568', lineHeight: 18 },
  linkText: { color: '#000080', fontWeight: 'bold' },
  
  partnerChip: {
    backgroundColor: '#EDF2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  partnerChipActive: {
    backgroundColor: '#000080',
    borderColor: '#000080'
  },
  partnerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568'
  },
  partnerChipTextActive: {
    color: '#FFF'
  },
  
  submitBtn: { backgroundColor: '#000080', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000080', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  submitBtnDisabled: { backgroundColor: '#A0AEC0', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  
  footerLinks: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 24, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#4A5568' },
  footerLink: { color: '#000080', fontWeight: 'bold' }
});