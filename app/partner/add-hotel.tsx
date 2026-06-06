import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddHotelScreen() {
    const router = useRouter();

    // Hotel Form State
    const [hotelName, setHotelName] = useState('');
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('');
    const [state, setStateName] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [website, setWebsite] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = () => {
        // Validation check
        if (!hotelName || !email || !city) {
            Alert.alert("Missing Fields", "Please fill in the required hotel details.");
            return;
        }

        Alert.alert(
            "Registration Submitted",
            "Note: after submitting, email needs to be verified before proceeding to next steps.",
            [{ text: "OK", onPress: () => router.push('/partner/dashboard' as any) }]
        );
        // Next step: we will hook this up to your 10.47.238.149 backend!
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add your hotel</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.introText}>
                    We will make you available to millions of customers in and outside Nigeria.
                </Text>

                {/* HOTEL INFORMATION SECTION */}
                <Text style={styles.sectionTitle}>Hotel Information</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Hotel Name:</Text>
                    <TextInput style={styles.input} value={hotelName} onChangeText={setHotelName} placeholder="e.g. The Blowfish Hotel" />

                    <Text style={styles.label}>Email Address:</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="hotel@example.com" keyboardType="email-address" />

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Country Code:</Text>
                            <TextInput style={styles.input} placeholder="+234" />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Location:</Text>
                            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Nigeria" />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>State:</Text>
                            <TextInput style={styles.input} value={state} onChangeText={setStateName} placeholder="e.g. Lagos" />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>City:</Text>
                            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Ikeja" />
                        </View>
                    </View>

                    <Text style={styles.label}>Address:</Text>
                    <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Full street address" />

                    <Text style={styles.label}>Website:</Text>
                    <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="www.yourhotel.com" />

                    <Text style={styles.label}>Phone Number:</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="0800 000 0000" keyboardType="phone-pad" />
                </View>

                {/* PERSONNEL DETAILS SECTION */}
                <Text style={styles.sectionTitle}>Personnel Details</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>First Name:</Text>
                    <TextInput style={styles.input} placeholder="Manager First Name" />

                    <Text style={styles.label}>Last Name:</Text>
                    <TextInput style={styles.input} placeholder="Manager Last Name" />

                    <Text style={styles.label}>Email Address:</Text>
                    <TextInput style={styles.input} placeholder="Personal Email" keyboardType="email-address" />

                    <Text style={styles.label}>Phone Number:</Text>
                    <TextInput style={styles.input} placeholder="Personal Phone" keyboardType="phone-pad" />
                </View>

                {/* AGREEMENT & SUBMIT */}
                <View style={styles.agreementRow}>
                    <Ionicons name="checkbox" size={24} color="#004A99" />
                    <Text style={styles.agreementText}>I agree to Airgo.ng Terms of Use</Text>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    Note: after submitting, email needs to be verified before proceeding to next steps.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    introText: { fontSize: 16, color: '#333', marginBottom: 25, lineHeight: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#004A99', marginBottom: 10 },
    card: { backgroundColor: '#FFF', borderRadius: 8, padding: 15, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 12, fontSize: 16, backgroundColor: '#FAFAFA', marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    agreementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    agreementText: { fontSize: 15, color: '#333', marginLeft: 10 },
    submitButton: { backgroundColor: '#FFB81C', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    submitButtonText: { color: '#333', fontSize: 18, fontWeight: 'bold' },
    footerNote: { fontSize: 13, color: '#666', textAlign: 'center', fontStyle: 'italic', lineHeight: 20 }
});