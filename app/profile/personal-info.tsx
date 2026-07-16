import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const uid = await AsyncStorage.getItem('userId');
            if (uid) {
                setUserId(uid);
                const userName = await AsyncStorage.getItem('userName');
                const userEmail = await AsyncStorage.getItem('userEmail');
                const userPhone = await AsyncStorage.getItem('userPhone') || '';
                const userImage = await AsyncStorage.getItem('profileImageUrl');
                
                setName(userName || '');
                setEmail(userEmail || '');
                setPhone(userPhone);
                if (userImage) {
                    setProfileImage(`${API_URL.replace('/api', '')}${userImage}`);
                }
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setProfileImage(base64Image); // show preview immediately
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            const payload: any = { name, email, phoneNumber: phone };
            if (profileImage && profileImage.startsWith('data:image/')) {
                payload.profileImage = profileImage;
            }

            const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('userName', name);
                await AsyncStorage.setItem('userEmail', email);
                await AsyncStorage.setItem('userPhone', phone);
                if (data.user?.profileImageUrl) {
                    await AsyncStorage.setItem('profileImageUrl', data.user.profileImageUrl);
                }
                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully!' });
                router.back();
            } else {
                Toast.show({ type: 'error', text1: 'Update Failed', text2: data.message || 'Something went wrong.' });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please check your connection.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#004A99" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Information</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                        )}
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage}>
                            <Ionicons name="camera" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20
    },
    backButton: { padding: 5 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    content: { padding: 20 },
    avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    avatarCircle: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0',
        justifyContent: 'center', alignItems: 'center', position: 'relative'
    },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarText: { fontSize: 40, fontWeight: 'bold', color: '#004A99' },
    editAvatarBtn: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFB81C',
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#F8F9FA'
    },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#4A5568', marginBottom: 8, fontWeight: '600' },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 12, padding: 16, fontSize: 16, color: '#2D3748'
    },
    saveBtn: {
        backgroundColor: '#004A99', borderRadius: 12, padding: 18,
        alignItems: 'center', marginTop: 30
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
