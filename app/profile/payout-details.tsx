import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';
import { SafeAreaView } from 'react-native-safe-area-context';

const NIGERIAN_BANKS = [
    { name: "Access Bank", code: "044" },
    { name: "Access Bank (Diamond)", code: "063" },
    { name: "Citibank Nigeria", code: "023" },
    { name: "Ecobank Nigeria", code: "050" },
    { name: "Fidelity Bank", code: "070" },
    { name: "First Bank of Nigeria", code: "011" },
    { name: "First City Monument Bank - FCMB", code: "214" },
    { name: "Guaranty Trust Bank - GTB", code: "058" },
    { name: "Heritage Bank", code: "030" },
    { name: "Jaiz Bank", code: "301" },
    { name: "Keystone Bank", code: "082" },
    { name: "Kuda Bank", code: "50211" },
    { name: "Moniepoint MFB", code: "50515" },
    { name: "Opay (Paycom)", code: "999992" },
    { name: "Palmpay", code: "999991" },
    { name: "Polaris Bank", code: "076" },
    { name: "Providus Bank", code: "101" },
    { name: "Stanbic IBTC Bank", code: "221" },
    { name: "Standard Chartered Bank", code: "068" },
    { name: "Sterling Bank", code: "232" },
    { name: "Union Bank of Nigeria", code: "032" },
    { name: "United Bank for Africa - UBA", code: "033" },
    { name: "Unity Bank", code: "215" },
    { name: "Wema Bank", code: "035" },
    { name: "Zenith Bank", code: "057" }
].sort((a, b) => a.name.localeCompare(b.name));

export default function PayoutDetailsScreen() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [bankCode, setBankCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    
    const [isResolving, setIsResolving] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const uid = await AsyncStorage.getItem('userId');
            if (uid) {
                setUserId(uid);
                // Fetch the latest profile to get current bank details
                const response = await fetch(`${API_URL}/auth/profile/${uid}`);
                const data = await response.json();
                
                if (response.ok && data.user) {
                    setBankCode(data.user.bankCode || '');
                    setBankName(data.user.bankName || '');
                    setAccountNumber(data.user.accountNumber || '');
                    setAccountName(data.user.accountName || '');
                }
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load payout details.' });
        } finally {
            setLoading(false);
        }
    };

    const handleBankSelect = (code: string, name: string) => {
        setBankCode(code);
        setBankName(name);
        setAccountName('');
        setModalVisible(false);
        if (accountNumber.length === 10) {
            resolveBankAccount(accountNumber, code);
        }
    };

    const handleAccountNumberChange = (text: string) => {
        const cleanText = text.replace(/[^0-9]/g, '').slice(0, 10);
        setAccountNumber(cleanText);
        setAccountName('');
        
        if (cleanText.length === 10 && bankCode) {
            resolveBankAccount(cleanText, bankCode);
        }
    };

    const resolveBankAccount = async (accNum: string, bCode: string) => {
        setIsResolving(true);
        setAccountName('');
        try {
            const res = await fetch(`${API_URL}/auth/resolve-bank-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountNumber: accNum, bankCode: bCode })
            });
            const data = await res.json();
            
            if (res.ok && data.account_name) {
                setAccountName(data.account_name);
                Toast.show({ type: 'success', text1: 'Account Verified', text2: `Name: ${data.account_name}` });
            } else {
                Toast.show({ type: 'error', text1: 'Verification Failed', text2: data.error || 'Could not verify account.' });
            }
        } catch (error) {
            console.error('Error resolving bank:', error);
            Toast.show({ type: 'error', text1: 'Network Error', text2: 'Could not connect to verification service.' });
        } finally {
            setIsResolving(false);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        if (!bankCode || !accountNumber || !accountName) {
            Toast.show({ type: 'error', text1: 'Missing Details', text2: 'Please verify a valid bank account first.' });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bankCode, bankName, accountNumber, accountName })
            });

            const data = await response.json();
            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Payout details saved successfully!' });
                router.back();
            } else {
                Toast.show({ type: 'error', text1: 'Save Failed', text2: data.message || 'Something went wrong.' });
            }
        } catch (error) {
            console.error('Save error:', error);
            Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please check your connection.' });
        } finally {
            setIsSaving(false);
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#004A99" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payout Bank Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={24} color="#004A99" />
                        <Text style={styles.infoText}>
                            Add a verified bank account to receive disbursements and payouts. Your account details are securely verified via Paystack.
                        </Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Select Bank</Text>
                        <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
                            <Text style={[styles.dropdownText, !bankName && { color: '#A0AEC0' }]}>
                                {bankName || 'Select your bank'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#4A5568" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Account Number</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. 0123456789"
                            placeholderTextColor="#A0AEC0"
                            value={accountNumber} 
                            onChangeText={handleAccountNumberChange} 
                            keyboardType="numeric" 
                            maxLength={10}
                        />
                    </View>

                    {isResolving ? (
                        <View style={styles.resolvingContainer}>
                            <ActivityIndicator size="small" color="#004A99" />
                            <Text style={styles.resolvingText}>Verifying account...</Text>
                        </View>
                    ) : accountName ? (
                        <View style={styles.verifiedCard}>
                            <Ionicons name="checkmark-circle" size={20} color="#38A169" />
                            <View style={{ marginLeft: 10, flex: 1 }}>
                                <Text style={styles.verifiedLabel}>Verified Account Name</Text>
                                <Text style={styles.verifiedName}>{accountName}</Text>
                            </View>
                        </View>
                    ) : null}

                    <TouchableOpacity 
                        style={[styles.saveBtn, (!bankCode || !accountNumber || !accountName) && styles.saveBtnDisabled]} 
                        onPress={handleSave} 
                        disabled={isSaving || !bankCode || !accountNumber || !accountName}
                    >
                        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Bank Details</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bank Selection Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Bank</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#A0AEC0" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={NIGERIAN_BANKS}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.bankItem} onPress={() => handleBankSelect(item.code, item.name)}>
                                    <Text style={styles.bankItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
    },
    backButton: { padding: 5 },
    headerTitle: { color: '#1A202C', fontSize: 18, fontWeight: '700' },
    content: { padding: 20 },
    infoCard: {
        flexDirection: 'row', backgroundColor: '#EBF8FF', padding: 15, borderRadius: 12,
        alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#BEE3F8'
    },
    infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#2C5282', lineHeight: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#4A5568', marginBottom: 8, fontWeight: '600' },
    input: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 12, padding: 16, fontSize: 16, color: '#2D3748'
    },
    dropdownButton: {
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    dropdownText: { fontSize: 16, color: '#2D3748' },
    resolvingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 15 },
    resolvingText: { marginLeft: 10, fontSize: 14, color: '#4A5568' },
    verifiedCard: {
        flexDirection: 'row', backgroundColor: '#F0FFF4', padding: 15, borderRadius: 12,
        alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#C6F6D5'
    },
    verifiedLabel: { fontSize: 12, color: '#2F855A', fontWeight: 'bold' },
    verifiedName: { fontSize: 16, color: '#276749', fontWeight: '900', marginTop: 2 },
    saveBtn: {
        backgroundColor: '#004A99', borderRadius: 12, padding: 18,
        alignItems: 'center', marginTop: 10
    },
    saveBtnDisabled: { backgroundColor: '#A0AEC0' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
    bankItem: { paddingVertical: 15 },
    bankItemText: { fontSize: 16, color: '#2D3748' },
    separator: { height: 1, backgroundColor: '#E2E8F0' }
});
