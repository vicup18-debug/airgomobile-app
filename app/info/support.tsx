import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/config';

export default function SupportScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async () => {
        if (!name || !email || !message) {
            Alert.alert('Error', 'Please fill in all fields before sending.');
            return;
        }
        
        setIsSending(true);
        try {
            const response = await fetch(`${API_URL}/auth/support`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject: 'Inquiry', message })
            });

            const data = await response.json();
            
            if (response.ok) {
                Alert.alert('Message Sent', 'Our 24/7 support team will get back to you shortly!');
                setName('');
                setEmail('');
                setMessage('');
            } else {
                Alert.alert('Error', data.message || 'Failed to send message.');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Please check your connection and try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            {/* 🟢 PREMIUM HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customer Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>How can we help?</Text>
                <Text style={styles.paragraph}>
                    Airgo.ng stands out with its commitment to customer satisfaction. With a dedicated 24/7 customer support team, users receive prompt assistance for bookings, inquiries, and travel-related concerns anytime, anywhere.
                </Text>

                {/* 🟢 CONTACT CARDS */}
                <View style={styles.contactGrid}>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('tel:+2347078344409')}>
                        <View style={styles.iconBox}><Ionicons name="call" size={24} color="#004A99" /></View>
                        <Text style={styles.contactLabel}>Call Us 24/7</Text>
                        <Text style={styles.contactValue}>+234 707 834 4409</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:info@airgo.ng')}>
                        <View style={styles.iconBox}><Ionicons name="mail" size={24} color="#004A99" /></View>
                        <Text style={styles.contactLabel}>Email Support</Text>
                        <Text style={styles.contactValue}>info@airgo.ng</Text>
                    </TouchableOpacity>
                </View>

                {/* 🟢 DIRECT MESSAGE FORM */}
                <Text style={styles.sectionTitle}>Send a Direct Message</Text>
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Your Full Name"
                        placeholderTextColor="#A0AEC0"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Your Email Address"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={[styles.inputBox, styles.textArea]}
                        placeholder="How can we assist you today? Please include any relevant booking reference numbers."
                        placeholderTextColor="#A0AEC0"
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        value={message}
                        onChangeText={setMessage}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={isSending}>
                        <Text style={styles.sendButtonText}>{isSending ? 'Sending...' : 'Send Message'}</Text>
                        <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                    Secondary Email: airgotravelandtour@gmail.com
                </Text>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    content: { padding: 24, paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: '900', color: '#1A202C', marginBottom: 10 },
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 25 },

    contactGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
    contactCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
    iconBox: { width: 50, height: 50, backgroundColor: '#F0F7FF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    contactLabel: { fontSize: 13, fontWeight: 'bold', color: '#718096', marginBottom: 4 },
    contactValue: { fontSize: 14, fontWeight: '900', color: '#1A202C', textAlign: 'center' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#004A99', marginBottom: 15 },
    formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
    inputBox: { borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, height: 55, borderRadius: 8, fontSize: 15, color: '#1A202C', marginBottom: 15, backgroundColor: '#F8F9FA' },
    textArea: { height: 120, paddingTop: 15 },

    sendButton: { flexDirection: 'row', backgroundColor: '#004A99', paddingVertical: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    sendButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    footerText: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginTop: 25 }
});