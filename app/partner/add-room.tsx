import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/config';

export default function AddRoomScreen() {
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [price, setPrice] = useState('');
    const [totalAllocated, setTotalAllocated] = useState('1');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [agreedToQA, setAgreedToQA] = useState(false);

    // 🟢 QA RULE ENFORCEMENT: Image Picker Logic
    const handlePickImage = async () => {
        // Request gallery permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Toast.show({ type: 'error', text1: 'Permission Required', text2: 'You need to allow access to your photos to upload room images.' });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Let them crop it to look perfect
            quality: 1, // Max quality
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setImages(prev => [...prev, asset.uri]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // 🟢 VALIDATION
    const isFormValid = roomName && price && description && totalAllocated && images.length >= 5 && agreedToQA;

    const handleUploadToCloudinary = async (imageUri: string) => {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('file', { uri: imageUri, name: filename, type } as any);
        formData.append('upload_preset', 'airgo_fleet');

        const res = await fetch('https://api.cloudinary.com/v1_1/drdosbrru/image/upload', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        const data = await res.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error('Cloudinary upload failed');
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid || isSubmitting) return;
        setIsSubmitting(true);
        Toast.show({ type: 'info', text1: 'Uploading...', text2: 'Please wait while we upload your images and data.' });

        try {
            const token = await AsyncStorage.getItem('userToken');
            const partnerId = await AsyncStorage.getItem('userId');
            
            // Get user data for hotel name if possible
            const userDataStr = await AsyncStorage.getItem('userData');
            let hotelName = 'My Premium Hotel';
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                hotelName = userData.businessName || userData.name || 'My Premium Hotel';
            }

            // Upload all images to Cloudinary
            const uploadedImageUrls = await Promise.all(images.map(uri => handleUploadToCloudinary(uri)));
            
            const payload = {
                partnerId: partnerId,
                hotelName: hotelName,
                name: roomName,
                netPrice: Number(price),
                totalAllocated: Number(totalAllocated),
                description: description,
                image: uploadedImageUrls[0],
                images: uploadedImageUrls,
                previewImage: uploadedImageUrls[0]
            };

            const response = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Room Submitted', text2: 'Your room has been submitted and is pending Superadmin QA approval.' });
                setTimeout(() => router.back(), 2000);
            } else {
                const data = await response.json();
                Toast.show({ type: 'error', text1: 'Submission Failed', text2: data.error || data.message || 'Something went wrong.' });
            }
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload and submit.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {/* 🟢 PREMIUM HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Premium Room</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* 🟢 STRICT QA GUIDELINES BANNER */}
                <View style={styles.qaBanner}>
                    <View style={styles.qaHeader}>
                        <Ionicons name="shield-checkmark" size={20} color="#975A16" />
                        <Text style={styles.qaTitle}>Airgo Image Quality Rules</Text>
                    </View>
                    <Text style={styles.qaRule}>1. <Text style={styles.qaBold}>Quality:</Text> Must be clear and visible.</Text>
                    <Text style={styles.qaRule}>2. <Text style={styles.qaBold}>Composition:</Text> No text overlays or watermarks.</Text>
                    <Text style={styles.qaRule}>3. <Text style={styles.qaBold}>Lighting:</Text> Must be professionally lit; no dark or blurred photos.</Text>
                    <Text style={styles.qaRule}>4. <Text style={styles.qaBold}>Quantity:</Text> Minimum of 5 high-quality images per room.</Text>
                </View>

                {/* 🟢 IMAGE UPLOAD SECTION */}
                <Text style={styles.sectionTitle}>Room Gallery ({images.length}/5 Min)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imagePreviewContainer}>
                            <Image source={{ uri }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                                <Ionicons name="close-circle" size={24} color="#E53E3E" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                        <Ionicons name="camera-outline" size={32} color="#004A99" />
                        <Text style={styles.uploadText}>Upload HD Photo</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* 🟢 ROOM DETAILS FORM */}
                <Text style={styles.sectionTitle}>Room Information</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Room Name / Type</Text>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="e.g. Executive Presidential Suite"
                        placeholderTextColor="#A0AEC0"
                        value={roomName}
                        onChangeText={setRoomName}
                    />

                    <Text style={styles.inputLabel}>Price per Night (₦)</Text>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="e.g. 150000"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                    />

                    <Text style={styles.inputLabel}>Airgo Room Pools (Allocated to platform)</Text>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="e.g. 2"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="numeric"
                        value={totalAllocated}
                        onChangeText={setTotalAllocated}
                    />

                    <Text style={styles.inputLabel}>Premium Features & Description</Text>
                    <TextInput
                        style={[styles.inputBox, styles.textArea]}
                        placeholder="Describe the luxury amenities..."
                        placeholderTextColor="#A0AEC0"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* 🟢 QA COMPLIANCE CHECKBOX */}
                <TouchableOpacity
                    style={[styles.checkboxContainer, agreedToQA && styles.checkboxActive]}
                    onPress={() => setAgreedToQA(!agreedToQA)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={agreedToQA ? "checkbox" : "square-outline"}
                        size={24}
                        color={agreedToQA ? "#004A99" : "#A0AEC0"}
                    />
                    <Text style={styles.checkboxText}>
                        I confirm that these images meet Airgo&apos;s strict QA standards. I understand my property will be suspended if low-quality images or watermarks are detected by the Superadmin.
                    </Text>
                </TouchableOpacity>

                {/* 🟢 SUBMIT BUTTON */}
                <TouchableOpacity
                    style={[styles.submitBtn, isFormValid ? styles.submitBtnActive : styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!isFormValid}
                >
                    <Text style={styles.submitBtnText}>Submit for QA Review</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    content: { padding: 20, paddingBottom: 60 },

    qaBanner: { backgroundColor: '#FEFCBF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#F6E05E', marginBottom: 25 },
    qaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    qaTitle: { color: '#975A16', fontSize: 16, fontWeight: '900', marginLeft: 8 },
    qaRule: { color: '#744210', fontSize: 13, marginBottom: 5, lineHeight: 20 },
    qaBold: { fontWeight: 'bold' },

    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1A202C', marginBottom: 15 },

    imageScroll: { flexDirection: 'row', marginBottom: 30 },
    imagePreviewContainer: { marginRight: 15, position: 'relative' },
    imagePreview: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#E2E8F0' },
    removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 12 },

    uploadBtn: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#EBF8FF', borderWidth: 2, borderColor: '#004A99', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    uploadText: { color: '#004A99', fontSize: 12, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },

    formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 25 },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#4A5568', marginBottom: 8 },
    inputBox: { borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, height: 50, borderRadius: 8, fontSize: 15, color: '#1A202C', marginBottom: 20, backgroundColor: '#F8F9FA' },
    textArea: { height: 100, paddingTop: 15 },

    checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 25 },
    checkboxActive: { borderColor: '#004A99', backgroundColor: '#F0F7FF' },
    checkboxText: { flex: 1, fontSize: 13, color: '#4A5568', lineHeight: 20, marginLeft: 12 },

    submitBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnActive: { backgroundColor: '#004A99', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    submitBtnDisabled: { backgroundColor: '#CBD5E0' },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});