import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CorporateScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Corporate Contract</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Corporate Travel Solutions</Text>

                <Text style={styles.paragraph}>
                    At Airgo.ng, we understand that corporate travel requires efficiency, cost control, flexibility, and reliable support. Our Corporate Contract Service is designed to help businesses streamline their travel operations while enjoying exclusive benefits, negotiated rates, and dedicated account management.
                </Text>

                <Text style={styles.sectionTitle}>What is a Corporate Contract?</Text>
                <Text style={styles.paragraph}>
                    A corporate contract is a customized travel management agreement between Airgo.ng and your organization. It enables your company to access special travel rates, structured booking processes, and dedicated support for all your travel needs.
                </Text>

                <Text style={styles.sectionTitle}>Our Corporate Services</Text>
                <Text style={styles.bullet}>• Flight Booking: Discounted corporate flight rates and priority booking.</Text>
                <Text style={styles.bullet}>• Hotel Booking: Strategic hotel partnerships, long-stay and group options.</Text>
                <Text style={styles.bullet}>• Ground Transportation: Airport transfers, chauffeur services, and executive rentals.</Text>

                <Text style={styles.sectionTitle}>Key Benefits of Partnering with Us</Text>
                <Text style={styles.bullet}>✔ Cost Optimization: Reduce expenses through negotiated deals.</Text>
                <Text style={styles.bullet}>✔ Dedicated Account Management: A dedicated manager for your business.</Text>
                <Text style={styles.bullet}>✔ 24/7 Priority Support: Round-the-clock support for travel emergencies.</Text>
                <Text style={styles.bullet}>✔ Detailed Reporting & Analytics: Track expenses and optimize budgets.</Text>
                <Text style={styles.bullet}>✔ Flexible Payment Options: Invoicing and credit arrangements.</Text>

                <Text style={styles.sectionTitle}>How It Works</Text>
                <Text style={styles.paragraph}>
                    1. Consultation & Needs Assessment{'\n'}
                    2. Tailored Proposal{'\n'}
                    3. Agreement & Onboarding{'\n'}
                    4. Implementation{'\n'}
                    5. Ongoing Support & Optimization
                </Text>

                <Text style={styles.sectionTitle}>Get Started Today</Text>
                <Text style={styles.paragraph}>
                    Partner with Airgo.ng and transform the way your organization manages travel. Contact our corporate team today to discuss your needs and discover how our tailored corporate contract solutions can support your business growth. Airgo.ng – Simplifying Corporate Travel, Empowering Your Business.
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