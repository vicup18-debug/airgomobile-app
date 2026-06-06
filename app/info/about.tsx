import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About Us</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>About Airgo.ng</Text>

                <Text style={styles.paragraph}>
                    Airgo.ng is a fast-growing Online Travel Agency (OTA) dedicated to making travel simple, affordable, and stress-free for individuals, families, and businesses. Whether you’re planning a quick domestic trip or an international journey, Airgo.ng provides a seamless platform for all your travel needs—from flight bookings to hotel reservations and reliable car rental services.
                </Text>

                <Text style={styles.sectionTitle}>Flight Bookings & Reservations</Text>
                <Text style={styles.paragraph}>
                    At Airgo.ng, finding the best flight deals is quick and easy. The platform allows users to search, compare, and book flights across multiple airlines, ensuring competitive prices and flexible travel options. With real-time availability and instant confirmation, customers can plan their trips with confidence.
                </Text>

                <Text style={styles.sectionTitle}>Hotel Bookings & Reservations</Text>
                <Text style={styles.paragraph}>
                    Airgo.ng connects travelers to a wide range of hotels worldwide, from budget-friendly accommodations to luxury stays. Users can explore different options, compare prices, and secure reservations that suit their preferences and budget. With verified listings and detailed descriptions, customers are guaranteed comfort, convenience, and value wherever they go.
                </Text>

                <Text style={styles.sectionTitle}>Car Rental Services</Text>
                <Text style={styles.paragraph}>
                    To make travel even more convenient, Airgo.ng offers dependable car rental services. Whether you need airport pickup, city transportation, or long-term vehicle hire, the platform provides access to well-maintained vehicles and trusted partners. This ensures travelers can move around easily and comfortably at their destination.
                </Text>

                <Text style={styles.sectionTitle}>24/7 Customer Support</Text>
                <Text style={styles.paragraph}>
                    Airgo.ng stands out with its commitment to customer satisfaction. With a dedicated 24/7 customer support team, users receive prompt assistance for bookings, inquiries, and travel-related concerns anytime, anywhere.
                </Text>

                <View style={styles.highlightBox}>
                    <Text style={styles.highlightTitle}>Why Choose Airgo.ng?</Text>
                    <Text style={styles.bullet}>• Easy-to-use booking platform</Text>
                    <Text style={styles.bullet}>• Competitive pricing on flights and hotels</Text>
                    <Text style={styles.bullet}>• Wide range of travel options</Text>
                    <Text style={styles.bullet}>• Reliable car hire services</Text>
                    <Text style={styles.bullet}>• 24/7 customer support</Text>
                    <Text style={styles.bullet}>• Secure and convenient payment system</Text>
                </View>

                <Text style={styles.footerText}>
                    At Airgo.ng, travel is not just about getting from one place to another—it’s about creating memorable experiences with ease and confidence.
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#004A99', marginTop: 25, marginBottom: 10 },
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 10 },
    highlightBox: { backgroundColor: '#F0F7FF', padding: 20, borderRadius: 12, marginTop: 30, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    highlightTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 15 },
    bullet: { fontSize: 15, color: '#4A5568', marginBottom: 8, paddingLeft: 5 },
    footerText: { fontSize: 15, color: '#1A202C', fontWeight: '600', fontStyle: 'italic', textAlign: 'center', marginTop: 20, lineHeight: 24 }
});