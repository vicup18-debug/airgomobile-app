import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PaystackProvider, usePaystack } from 'react-native-paystack-webview';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_KEY || 'pk_live_e3f508dda06464163976ebde1d31f008ee8f524d';

function PaymentMethodsContent() {
    const router = useRouter();
    const { popup } = usePaystack();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        AsyncStorage.getItem('userEmail').then(email => {
            if (email) setUserEmail(email);
        });
    }, []);

    const handleAddPaymentMethod = () => {
        popup.checkout({
            email: userEmail || 'user@example.com',
            amount: 5000,
            reference: `token_${new Date().getTime()}`,
            onCancel: () => Toast.show({ type: 'error', text1: 'Cancelled', text2: 'Payment method addition cancelled.' }),
            onSuccess: () => Toast.show({ type: 'success', text1: 'Success', text2: 'Payment method added successfully!' }),
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Saved Cards</Text>
                
                <View style={styles.cardItem}>
                    <View style={styles.cardLeft}>
                        <View style={styles.cardIconBox}>
                            <Ionicons name="card" size={24} color="#004A99" />
                        </View>
                        <View>
                            <Text style={styles.cardName}>Mastercard</Text>
                            <Text style={styles.cardNumber}>**** **** **** 4242</Text>
                        </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#38A169" />
                </View>

                <TouchableOpacity style={styles.addCardBtn} onPress={handleAddPaymentMethod}>
                    <Ionicons name="add-circle-outline" size={20} color="#004A99" style={{ marginRight: 8 }} />
                    <Text style={styles.addCardText}>Add New Payment Method</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={20} color="#4A5568" style={{ marginRight: 10 }} />
                    <Text style={styles.infoText}>Your payment information is stored securely with Paystack.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

export default function PaymentMethodsScreen() {
    return (
        <PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY}>
            <PaymentMethodsContent />
        </PaystackProvider>
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
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 15 },
    cardItem: {
        backgroundColor: '#FFF', borderRadius: 12, padding: 16, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: 15,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    cardIconBox: {
        width: 48, height: 48, borderRadius: 8, backgroundColor: '#EBF4FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    cardName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    cardNumber: { fontSize: 14, color: '#718096' },
    addCardBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#004A99', borderStyle: 'dashed',
        marginTop: 10
    },
    addCardText: { color: '#004A99', fontSize: 16, fontWeight: 'bold' },
    infoBox: {
        flexDirection: 'row', backgroundColor: '#EDF2F7', padding: 16, borderRadius: 12,
        marginTop: 30, alignItems: 'center'
    },
    infoText: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 20 }
});
