import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Privacy Notice for Airgo.ng</Text>

                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    Welcome to Airgo.ng (“Airgo.ng,” “we,” “our,” or “us”). We are an Online Travel Agency (OTA) providing services including flight bookings and reservations, hotel bookings, and car rental services. We are committed to protecting your personal data and ensuring transparency in how we collect, use, store, and share your information. This Privacy Notice is issued in accordance with applicable data protection laws, including the Nigeria Data Protection Act (NDPA) 2023. By accessing or using our Services, you confirm that you have read, understood, and agreed to this Privacy Notice.
                </Text>

                <Text style={styles.sectionTitle}>2. Definitions</Text>
                <Text style={styles.bullet}>• Personal Data: Any information that identifies or can identify an individual.</Text>
                <Text style={styles.bullet}>• Processing: Any operation performed on personal data.</Text>
                <Text style={styles.bullet}>• Data Subject: The individual whose personal data is processed.</Text>
                <Text style={styles.bullet}>• Controller: Airgo.ng, which determines how and why personal data is processed.</Text>

                <Text style={styles.sectionTitle}>3. Categories of Personal Data We Collect</Text>
                <Text style={styles.paragraph}>
                    We collect personal data directly from you, automatically through your use of our Services, and from third parties. This includes your full name, email address, phone number, payment information (processed via secure third-party gateways), booking & travel information, and automatically collected data like your IP address and device type.
                </Text>

                <Text style={styles.sectionTitle}>4. How We Use Your Personal Data</Text>
                <Text style={styles.paragraph}>
                    We use your data for Service Delivery (processing flights, hotels, and cars), Customer Support, Communication (booking updates), Payment Processing, Personalization, Marketing (with consent), and Legal Compliance.
                </Text>

                <Text style={styles.sectionTitle}>5. Sharing and Disclosure</Text>
                <Text style={styles.paragraph}>
                    We may share your personal data with Travel Service Providers (Airlines, Hotels, Car rental companies) who require your data to fulfill your bookings, as well as Technology Providers and Legal Authorities when required by law.
                </Text>

                <Text style={styles.sectionTitle}>6. Data Security & Retention</Text>
                <Text style={styles.paragraph}>
                    We implement robust security measures, including SSL encryption, secure servers, and access controls. We retain personal data only as long as necessary to fulfill contractual obligations, comply with legal requirements, and resolve disputes. Once no longer needed, data is securely deleted or anonymized.
                </Text>

                <Text style={styles.sectionTitle}>7. Your Data Protection Rights</Text>
                <Text style={styles.paragraph}>
                    Under applicable laws, you have the right to access your personal data, correct inaccurate data, request deletion, restrict processing, and withdraw consent.
                </Text>

                <Text style={styles.sectionTitle}>8. Contact Information</Text>
                <Text style={styles.paragraph}>
                    For questions, complaints, or requests regarding this Privacy Notice or your personal data, please contact the Airgo.ng Data Protection Officer:
                    Email: info@airgo.ng, airgotravelandtour@gmail.com
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#004A99', marginTop: 20, marginBottom: 8 },
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 10 },
    bullet: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 5, paddingLeft: 10 }
});