import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PartnerDisputeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Partner Dispute</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Partner Dispute Resolution</Text>

                <Text style={styles.paragraph}>
                    At Airgo.ng, we are committed to maintaining a fair and transparent ecosystem for both our guests and our partners. If a dispute arises between a guest and a partner regarding a booking, our dispute resolution process ensures that issues are handled efficiently and justly.
                </Text>

                <Text style={styles.sectionTitle}>Escrow Protection</Text>
                <Text style={styles.paragraph}>
                    Airgo holds all booking funds in secure escrow. Funds are only released to the partner 24 hours after the guest successfully checks in. This ensures that the guest receives the expected quality of service and the partner is guaranteed payment upon fulfilling their obligations.
                </Text>

                <Text style={styles.sectionTitle}>Filing a Dispute</Text>
                <Text style={styles.paragraph}>
                    If a service is not delivered as described, or if a partner faces an issue with a guest, a dispute must be filed within the 24-hour check-in window. Our dedicated compliance team will review the evidence provided by both parties.
                </Text>

                <Text style={styles.sectionTitle}>Resolution Process</Text>
                <Text style={styles.paragraph}>
                    Once a dispute is raised, the escrow funds are temporarily frozen. Our team investigates the matter thoroughly, aiming for an amicable resolution within 48 hours. Depending on the outcome, funds may be refunded to the guest or released to the partner.
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
