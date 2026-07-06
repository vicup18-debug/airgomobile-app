import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Privacy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Airgo.ng Terms of Service</Text>
                <Text style={styles.date}>Last Updated: October 2023</Text>

                <Text style={styles.heading}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    Welcome to Airgo.ng. By accessing our app, you agree to these Terms of Service. Airgo.ng is a platform connecting travelers with hotels and verified taxi drivers in Nigeria.
                </Text>

                <Text style={styles.heading}>2. Airgo Escrow Service</Text>
                <Text style={styles.paragraph}>
                    For your protection, all payments for taxis and accommodations are held in the Airgo Escrow. Funds are only released to the service provider when the service has been successfully delivered and confirmed by both parties.
                </Text>

                <Text style={styles.heading}>3. User Responsibilities</Text>
                <Text style={styles.paragraph}>
                    Users must provide accurate information during registration. Any fraudulent activity will result in immediate account suspension and forfeiture of escrowed funds.
                </Text>

                <Text style={styles.heading}>4. Privacy Policy</Text>
                <Text style={styles.paragraph}>
                    Your privacy is critically important to us. We do not share your personal information with third parties except as necessary to provide our services (e.g., sharing your pickup location with a driver). All payment data is encrypted and handled by Paystack.
                </Text>

                <Text style={styles.heading}>5. Contact Us</Text>
                <Text style={styles.paragraph}>
                    If you have questions about these Terms, please contact us at legal@airgo.ng.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20
    },
    backButton: { padding: 5 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    content: { padding: 25 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#004A99', marginBottom: 5 },
    date: { fontSize: 14, color: '#718096', marginBottom: 30 },
    heading: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginTop: 20, marginBottom: 10 },
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24 }
});
