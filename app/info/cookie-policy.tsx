import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CookiePolicyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cookie Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Cookie Policy</Text>

                <Text style={styles.paragraph}>
                    Airgo.ng uses cookies and similar tracking technologies to enhance your experience on our platform, analyze site usage, and assist in our marketing efforts. This policy outlines how and why we use cookies.
                </Text>

                <Text style={styles.sectionTitle}>What Are Cookies?</Text>
                <Text style={styles.paragraph}>
                    Cookies are small text files placed on your device by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide reporting information and personalize content.
                </Text>

                <Text style={styles.sectionTitle}>How We Use Cookies</Text>
                <Text style={styles.paragraph}>
                    We use cookies to ensure that our app and website function correctly. This includes authenticating your secure login, retaining your booking preferences, and measuring performance metrics to help us deliver a premium, seamless travel experience.
                </Text>

                <Text style={styles.sectionTitle}>Your Choices</Text>
                <Text style={styles.paragraph}>
                    You can instruct your browser or device to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
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
