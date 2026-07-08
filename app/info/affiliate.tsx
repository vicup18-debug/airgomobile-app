import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AffiliateProgramScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Affiliate Program</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Join the Airgo Affiliate Program</Text>

                <Text style={styles.paragraph}>
                    Monetize your network and influence with the Airgo Affiliate Program. We offer a lucrative partnership model for content creators, travel agents, influencers, and businesses who want to earn commissions by referring customers to Airgo.ng.
                </Text>

                <Text style={styles.sectionTitle}>How It Works</Text>
                <Text style={styles.paragraph}>
                    1. Sign up for our affiliate program and receive a unique referral link.
                </Text>
                <Text style={styles.paragraph}>
                    2. Share your link with your audience across your website, blog, social media, or directly with clients.
                </Text>
                <Text style={styles.paragraph}>
                    3. Earn a generous commission on every successful, completed booking made through your referral link.
                </Text>

                <Text style={styles.sectionTitle}>Benefits of Joining</Text>
                <Text style={styles.paragraph}>
                    • High conversion rates with premium, verified properties.
                </Text>
                <Text style={styles.paragraph}>
                    • Transparent, real-time tracking of your referrals and earnings via our dedicated Affiliate Hub.
                </Text>
                <Text style={styles.paragraph}>
                    • Fast and reliable payouts directly to your preferred bank account.
                </Text>

                <TouchableOpacity 
                    style={styles.ctaButton} 
                    onPress={() => Linking.openURL('https://airgo.ng/affiliate')}
                >
                    <Text style={styles.ctaText}>Become an Affiliate Today</Text>
                </TouchableOpacity>

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
    ctaButton: { backgroundColor: '#FFB81C', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    ctaText: { color: '#000080', fontSize: 16, fontWeight: 'bold' }
});
