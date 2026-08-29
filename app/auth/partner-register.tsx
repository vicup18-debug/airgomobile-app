import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, Image
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/config';

export default function PartnerRegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const [partnerType, setPartnerType] = useState(params.type || 'hotel');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [passportUri, setPassportUri] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const REGISTER_API_URL = `${API_URL}/auth/register`;

  const pickImage = async (type: 'doc' | 'passport', useCamera: boolean) => {
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
        if (type === 'doc') {
          setDocumentUri(result.assets[0].uri);
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
    if (password !== confirmPassword) return setErrorMsg("Passwords do not match.");
    if (password.length < 6) return setErrorMsg("Password must be at least 6 characters.");
    if ((partnerType === 'hotel' || partnerType === 'apartment') && !cacNumber) return setErrorMsg("CAC Number is required.");
    if (!documentUri) return setErrorMsg("Please upload your required verification document.");
    if ((partnerType === 'car' || partnerType === 'shuttle') && !passportUri) {
      return setErrorMsg("Passport photograph / driver headshot is required.");
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setUploadingDoc(true);
      let uploadedDocUrl = '';
      let uploadedPassportUrl = '';

      if (documentUri) {
        uploadedDocUrl = await uploadToCloudinary(documentUri);
      }
      if (passportUri) {
        uploadedPassportUrl = await uploadToCloudinary(passportUri);
      }
      setUploadingDoc(false);

      const isHotel = partnerType === 'hotel' || partnerType === 'apartment';
      const payload = {
        name, businessName, email, password, phone, role: 'partner', businessAddress, partnerType, cacNumber,
        cacCertificateUrl: isHotel ? uploadedDocUrl : undefined,
        driversLicenseUrl: !isHotel ? uploadedDocUrl : undefined,
        profileImageUrl: uploadedPassportUrl || undefined
      };

      const response = await fetch(REGISTER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMsg("Partner Account created successfully! Please check your email for verification. Redirecting...");

      setTimeout(() => {
        router.replace('/auth/login?verifyEmail=true' as any);
      }, 5000);

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
            <Text style={styles.subtitle}>Create a Partner Account</Text>
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

            <Text style={styles.label}>Partner Type</Text>
            <View style={[styles.segmentedControl, { flexWrap: 'wrap' }]}>
                <TouchableOpacity 
                    style={[styles.segmentBtn, partnerType === 'hotel' && styles.segmentBtnActive, { minWidth: '48%', marginBottom: 4 }]} 
                    onPress={() => setPartnerType('hotel')}
                >
                    <Text style={[styles.segmentText, partnerType === 'hotel' && styles.segmentTextActive]}>Hotel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.segmentBtn, partnerType === 'apartment' && styles.segmentBtnActive, { minWidth: '48%', marginBottom: 4 }]} 
                    onPress={() => setPartnerType('apartment')}
                >
                    <Text style={[styles.segmentText, partnerType === 'apartment' && styles.segmentTextActive]}>Apartment</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.segmentBtn, partnerType === 'car' && styles.segmentBtnActive, { minWidth: '48%' }]} 
                    onPress={() => setPartnerType('car')}
                >
                    <Text style={[styles.segmentText, partnerType === 'car' && styles.segmentTextActive]}>Car Rental</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.segmentBtn, partnerType === 'shuttle' && styles.segmentBtnActive, { minWidth: '48%' }]} 
                    onPress={() => setPartnerType('shuttle')}
                >
                    <Text style={[styles.segmentText, partnerType === 'shuttle' && styles.segmentTextActive]}>Taxi / Escort</Text>
                </TouchableOpacity>
            </View>

            {(partnerType === 'hotel' || partnerType === 'apartment') && (
                <>
                    <View style={styles.cacBanner}>
                        <Ionicons name="information-circle" size={16} color="#B7791F" style={{marginRight: 6}} />
                        <Text style={styles.cacBannerText}>CAC Registration is required to list properties.</Text>
                    </View>
                    <Text style={styles.label}>CAC Number</Text>
                    <TextInput style={styles.input} value={cacNumber} onChangeText={setCacNumber} placeholder="e.g. RC123456" />
                </>
            )}

            {/* VERIFICATION DOCUMENT */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>
                {partnerType === 'hotel' || partnerType === 'apartment' ? 'CAC / Ownership Document *' : "Driver's License *"}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {partnerType === 'hotel' || partnerType === 'apartment' ? 'Certificate or ownership proof' : "Front view of valid Driver's License"}
              </Text>
              
              {documentUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: documentUri }} style={styles.docPreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => setDocumentUri(null)}>
                    <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                    <Text style={styles.removeBtnText}>Change Document</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.snapBtn} onPress={() => pickImage('doc', true)}>
                    <Ionicons name="camera" size={18} color="#FFF" />
                    <Text style={styles.snapBtnText}>Snap Document</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage('doc', false)}>
                    <Ionicons name="document-text-outline" size={18} color="#000080" />
                    <Text style={styles.galleryBtnText}>Choose File</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* PASSPORT PHOTOGRAPH / HEADSHOT */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadTitle}>
                {partnerType === 'car' || partnerType === 'shuttle' ? 'Passport Photograph / Driver Headshot *' : 'Representative Photo (Optional)'}
              </Text>
              <Text style={styles.uploadSubtitle}>Clear headshot for rider trust & superadmin verification.</Text>
              
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

            <Text style={styles.label}>Partner's Full Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. John Doe" />

            <Text style={styles.label}>Business Name *</Text>
            <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="e.g. Airgo Travels" />

            <Text style={styles.label}>Business Email Address</Text>
            <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Business Address</Text>
            <TextInput style={styles.input} value={businessAddress} onChangeText={setBusinessAddress} />

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
                style={[styles.submitBtn, (loading || uploadingDoc || !agreed) && styles.submitBtnDisabled]} 
                onPress={handleRegister} 
                disabled={loading || uploadingDoc || !agreed}
            >
                {loading || uploadingDoc ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <ActivityIndicator color="#000080" />
                    <Text style={styles.submitBtnText}>{uploadingDoc ? "Uploading..." : "Processing..."}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>Create Partner Account</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
                <Text style={styles.footerText}>Already have a partner account? <Text style={styles.footerLink} onPress={() => router.replace('/auth/login' as any)}>Sign in</Text></Text>
                <Text style={[styles.footerText, {marginTop: 10}]}>Looking for a ride or stay? <Text style={[styles.footerLink, {color: '#000080'}]} onPress={() => router.replace('/auth/register' as any)}>Sign up as Client</Text></Text>
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
  
  errorBanner: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FED7D7', marginBottom: 15 },
  errorBannerText: { color: '#E53E3E', fontSize: 13, fontWeight: 'bold' },
  
  successBanner: { backgroundColor: '#F0FFF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#C6F6D5', marginBottom: 15 },
  successBannerText: { color: '#2F855A', fontSize: 13, fontWeight: 'bold' },
  
  cacBanner: { flexDirection: 'row', backgroundColor: '#FEFCBF', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F6E05E' },
  cacBannerText: { color: '#975A16', fontSize: 12, fontWeight: 'bold', flex: 1 },

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

  uploadBtn: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, paddingHorizontal: 16, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  uploadBtnText: { fontSize: 14, fontWeight: 'bold', color: '#000080' },
  
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#EDF2F7' },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentBtnActive: { backgroundColor: '#000080', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: 'bold', color: '#718096' },
  segmentTextActive: { color: '#FFF' },
  
  eyeBtn: { position: 'absolute', right: 16, top: 34 },
  eyeText: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0' },
  
  termsBox: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 20, alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#CBD5E0', marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  checkboxChecked: { backgroundColor: '#000080', borderColor: '#000080' },
  termsText: { flex: 1, fontSize: 12, color: '#4A5568', lineHeight: 18 },
  linkText: { color: '#000080', fontWeight: 'bold' },
  
  submitBtn: { backgroundColor: '#FFB81C', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#FFB81C', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  submitBtnDisabled: { backgroundColor: '#A0AEC0', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#000080', fontSize: 16, fontWeight: '900' },
  
  footerLinks: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 24, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#4A5568' },
  footerLink: { color: '#000080', fontWeight: 'bold' }
});
