import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpCenterScreen() {
    const router = useRouter();

    const faqs = [
        { q: 'How do I book a hotel?', a: 'Search for your destination, choose dates, and select a property that fits your needs.' },
        { q: 'What is Airgo Escrow?', a: 'Airgo Escrow protects your funds by holding them securely until the service is fully delivered.' },
        { q: 'How do I cancel a booking?', a: 'Go to your Bookings tab, select the active trip, and tap Cancel Booking. Cancellation policies apply.' },
        { q: 'How do I become a driver?', a: 'Go to your Profile tab and click "Become a Driver" to submit your application and documents.' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                
                {faqs.map((faq, index) => (
                    <View key={index} style={styles.faqCard}>
                        <Text style={styles.faqQ}>{faq.q}</Text>
                        <Text style={styles.faqA}>{faq.a}</Text>
                    </View>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Contact Support</Text>
                <TouchableOpacity style={styles.contactCard}>
                    <View style={styles.contactIcon}>
                        <Ionicons name="mail" size={20} color="#004A99" />
                    </View>
                    <View>
                        <Text style={styles.contactTitle}>Email Us</Text>
                        <Text style={styles.contactSub}>support@airgo.ng</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactCard}>
                    <View style={styles.contactIcon}>
                        <Ionicons name="call" size={20} color="#004A99" />
                    </View>
                    <View>
                        <Text style={styles.contactTitle}>Call Us</Text>
                        <Text style={styles.contactSub}>+234 800 AIRGO NG</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 15 },
    faqCard: {
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 15,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    faqQ: { fontSize: 16, fontWeight: 'bold', color: '#004A99', marginBottom: 8 },
    faqA: { fontSize: 14, color: '#4A5568', lineHeight: 22 },
    contactCard: {
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 15,
        borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center'
    },
    contactIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF4FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    contactSub: { fontSize: 14, color: '#718096' }
});
