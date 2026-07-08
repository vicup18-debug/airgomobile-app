import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EscrowProtectionScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Escrow Protection</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Escrow Protection Agreement</Text>

                <Text style={styles.paragraph}>
                    Your financial security is our top priority. Airgo.ng utilizes an industry-leading escrow protection system to safeguard every transaction made on our platform, giving both guests and partners complete peace of mind.
                </Text>

                <Text style={styles.sectionTitle}>How It Works</Text>
                <Text style={styles.paragraph}>
                    When a guest books a property or service on Airgo.ng, the payment is securely held in our escrow account. It is NOT immediately sent to the partner. The funds remain locked in escrow until the guest successfully checks in or receives the service.
                </Text>

                <Text style={styles.sectionTitle}>24-Hour Hold</Text>
                <Text style={styles.paragraph}>
                    Even after check-in, Airgo holds the funds for an additional 24 hours. This grace period allows the guest to verify that the accommodation or service matches what was promised in the listing. If there is a major discrepancy, the guest can raise a dispute, and the funds remain safe.
                </Text>

                <Text style={styles.sectionTitle}>Guaranteed Payouts</Text>
                <Text style={styles.paragraph}>
                    For our partners, the escrow system guarantees that the guest has already paid in full. Once the 24-hour verification period passes without a dispute, the funds are automatically cleared for payout, ensuring reliable and secure revenue.
                </Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000080', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 24, paddingBottom: 60 },
    title: { fontSize: 28, fontWeight: '900', color: '#1A202C', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000080', marginTop: 25, marginBottom: 10 },
    paragraph: { fontSize: 15, color: '#4A5568', lineHeight: 24, marginBottom: 10 },
});
