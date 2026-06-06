import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HowWeWorkScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>How We Work</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>How We Work</Text>

                <Text style={styles.paragraph}>
                    At Airgo.ng, we’ve built our platform around one simple goal: to make travel planning effortless, transparent, and reliable. From the moment you start searching for a trip to the time you complete your journey, our system is designed to guide you every step of the way.
                </Text>

                <Text style={styles.sectionTitle}>1. Smart Search & Discovery</Text>
                <Text style={styles.paragraph}>
                    Airgo.ng scans multiple global travel providers in real-time to present you with the best available options. Compare airlines, browse accommodations based on guest ratings, and find reliable vehicles suited for your budget.
                </Text>

                <Text style={styles.sectionTitle}>2. Transparent Comparison & Selection</Text>
                <Text style={styles.paragraph}>
                    We believe in complete transparency. Airgo.ng displays clear pricing with no hidden charges, clear cancellation policies, and detailed service descriptions.
                </Text>

                <Text style={styles.sectionTitle}>3. Seamless Booking Process</Text>
                <Text style={styles.paragraph}>
                    Our streamlined booking system allows you to confirm your reservation in just a few steps with simple checkout, multiple payment options, and instant automated e-tickets.
                </Text>

                <Text style={styles.sectionTitle}>4. Secure Payment System</Text>
                <Text style={styles.paragraph}>
                    Security is at the core of our operations. Airgo.ng uses trusted and encrypted payment gateways to protect your personal and financial information.
                </Text>

                <Text style={styles.sectionTitle}>5. Real-Time Updates</Text>
                <Text style={styles.paragraph}>
                    Travel plans can change, and we make sure you stay informed with flight schedule updates, travel reminders, and important notifications via email or SMS.
                </Text>

                <Text style={styles.sectionTitle}>6. Dedicated Customer Support</Text>
                <Text style={styles.paragraph}>
                    Our relationship with you doesn’t end after booking. Airgo.ng provides round-the-clock customer support to assist you with modifications, cancellations, and issue resolution.
                </Text>

                <Text style={styles.sectionTitle}>Why Our Process Works for You</Text>
                <Text style={styles.paragraph}>
                    Airgo.ng combines technology, transparency, and customer-focused service to simplify travel planning. With Airgo.ng, you don’t just book travel, you experience a smarter, easier way to explore the world.
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
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 10 }
});