import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Image
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/config';
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
  
  const [licenseUri, setLicenseUri] = useState<string | null>(null);
  const [passportUri, setPassportUri] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  const pickImage = async (type: 'license' | 'passport', useCamera: boolean) => {
    try {
      setErrorMsg('');
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setErrorMsg("Camera permission is required to snap a photo.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: type === 'passport' ? [1, 1] : [4, 3],
          quality: 0.7,
          cameraType: type === 'passport' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setErrorMsg("Photo library permission is required to choose an image.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: type === 'passport' ? [1, 1] : [4, 3],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        if (type === 'license') {
          setLicenseUri(result.assets[0].uri);
        } else {
          setPassportUri(result.assets[0].uri);
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Failed to capture image: " + (e.message || 'Unknown error'));
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image/jpeg`;
    if (type === 'image/jpg') type = 'image/jpeg';

    formData.append('file', { uri, name: filename, type } as any);
    formData.append('upload_preset', 'airgo_fleet');

    const uploadRes = await fetch('https://api.cloudinary.com/v1_1/drdosbrru/image/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (uploadData.secure_url) {
      return uploadData.secure_url;
    }
    throw new Error('Failed to upload image to server.');
  };

  const handleRegister = async () => {
    if (!agreed) return setErrorMsg("You must agree to the Terms & Conditions.");
    if (!phone) return setErrorMsg("Phone number is required.");
    if (!licenseUri) return setErrorMsg("Driver's License photo is required.");
    if (!passportUri) return setErrorMsg("Passport photograph / headshot is required.");
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");
    if (password.length < 6) return setErrorMsg("Password must be at least 6 characters.");

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setUploadingDoc(true);
      const [uploadedLicenseUrl, uploadedPassportUrl] = await Promise.all([
        uploadToCloudinary(licenseUri),
        uploadToCloudinary(passportUri)
      ]);
      setUploadingDoc(false);

      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role: 'driver',
          partnerId,
          driversLicenseUrl: uploadedLicenseUrl,
          profileImageUrl: uploadedPassportUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMsg("Driver account submitted successfully! Pending superadmin verification.");

      setTimeout(() => {
        router.replace('/auth/login' as any);
      }, 3000);

    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
      setUploadingDoc(false);
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

            <Text style={styles.label}>Select Your Fleet Partner (Optional)</Text>
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

            {/* PASSPORT PHOTOGRAPH / HEADSHOT */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>Passport Photograph / Headshot *</Text>
              <Text style={styles.uploadSubtitle}>Clear headshot for rider trust and verification.</Text>
              
              {passportUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: passportUri }} style={styles.passportPreview} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => setPassportUri(null)}>
                    <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                    <Text style={styles.removeBtnText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.snapBtn} onPress={() => pickImage('passport', true)}>
                    <Ionicons name="camera" size={18} color="#FFF" />
                    <Text style={styles.snapBtnText}>Snap Selfie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage('passport', false)}>
                    <Ionicons name="image-outline" size={18} color="#000080" />
                    <Text style={styles.galleryBtnText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* DRIVER'S LICENSE */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>Driver's License *</Text>
              <Text style={styles.uploadSubtitle}>Front view of your valid Nigerian Driver's License.</Text>
              
              {licenseUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: licenseUri }} style={styles.docPreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => setLicenseUri(null)}>
                    <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                    <Text style={styles.removeBtnText}>Change Document</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.snapBtn} onPress={() => pickImage('license', true)}>
                    <Ionicons name="camera" size={18} color="#FFF" />
                    <Text style={styles.snapBtnText}>Snap License</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage('license', false)}>
                    <Ionicons name="document-text-outline" size={18} color="#000080" />
                    <Text style={styles.galleryBtnText}>Choose File</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

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
                style={[styles.submitBtn, (loading || uploadingDoc || !agreed) && styles.submitBtnDisabled]} 
                onPress={handleRegister} 
                disabled={loading || uploadingDoc || !agreed}
            >
                {loading || uploadingDoc ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <ActivityIndicator color="#FFF" />
                    <Text style={styles.submitBtnText}>{uploadingDoc ? "Uploading Photos..." : "Creating Account..."}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>Create Account</Text>
                )}
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
  
  uploadSection: { backgroundColor: '#F8F9FA', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  uploadTitle: { fontSize: 12, fontWeight: '800', color: '#1A202C', textTransform: 'uppercase', letterSpacing: 0.5 },
  uploadSubtitle: { fontSize: 11, color: '#718096', marginTop: 2, marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  snapBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#000080', paddingVertical: 12, borderRadius: 10 },
  snapBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  galleryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#000080', paddingVertical: 12, borderRadius: 10 },
  galleryBtnText: { color: '#000080', fontSize: 12, fontWeight: '700' },
  previewContainer: { alignItems: 'center', gap: 8, paddingVertical: 6 },
  passportPreview: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#000080' },
  docPreview: { width: '100%', height: 130, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E0' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#FFF5F5', borderRadius: 6, borderWidth: 1, borderColor: '#FED7D7' },
  removeBtnText: { fontSize: 11, color: '#E53E3E', fontWeight: 'bold' },

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