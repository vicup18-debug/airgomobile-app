import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Terms of Service</Text>

                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    Welcome to Airgo.ng. These Terms of Service govern your access to and use of our website, mobile platforms, and services. By accessing or using Airgo.ng, you agree to be legally bound by these Terms.
                </Text>

                <Text style={styles.sectionTitle}>2. Scope of Services</Text>
                <Text style={styles.paragraph}>
                    Airgo.ng acts as an intermediary between users and third-party service providers, including Airlines, Hotels, and Car rental providers. We do not own, operate, or control these third-party services. Your booking constitutes a direct agreement between you and the relevant service provider.
                </Text>

                <Text style={styles.sectionTitle}>3. Pricing and Payments</Text>
                <Text style={styles.paragraph}>
                    Prices displayed include applicable taxes unless stated otherwise. Full payment is required at the time of booking. Payments are processed through secure third-party gateways. Airgo.ng reserves the right to cancel bookings suspected of fraud or unauthorized transactions.
                </Text>

                <Text style={styles.sectionTitle}>4. Cancellations & Refunds</Text>
                <Text style={styles.paragraph}>
                    Cancellation and modification policies vary depending on the service provider (airline, hotel, or car rental company). Refunds are processed in accordance with provider policies, and Airgo.ng may charge a service fee for processing changes or cancellations.
                </Text>

                <Text style={styles.sectionTitle}>5. Contact Information</Text>
                <Text style={styles.paragraph}>
                    For inquiries regarding these Terms, please contact Airgo.ng Customer Support:
                    Email: info@airgo.ng / airgotravelandtour@gmail.com
                    Phone: +2347078344409
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 24, paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: '900', color: '#1A202C', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginTop: 20, marginBottom: 8 },
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 10 }
});