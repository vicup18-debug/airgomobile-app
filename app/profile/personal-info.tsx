import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function PersonalInfoScreen() {
    const router = useRouter();
    const [name, setName] = useState('ThankGod Gabriel');
    const [email, setEmail] = useState('vicup18@gmail.com');
    const [phone, setPhone] = useState('+234 812 345 6789');

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
                        <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                        <TouchableOpacity style={styles.editAvatarBtn}>
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

                <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
                    <Text style={styles.saveBtnText}>Save Changes</Text>
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
