import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SustainabilityScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sustainability</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Sustainability at Airgo.ng</Text>

                <Text style={styles.paragraph}>
                    At Airgo.ng, sustainability is not just a trend—it’s a responsibility. As a leading Online Travel Agency (OTA), we recognize the impact the travel industry has on the environment, communities, and future generations. Our goal is to make travel smarter, more efficient, and more sustainable for everyone.
                </Text>

                <Text style={styles.sectionTitle}>Sustainable Flight Booking</Text>
                <Text style={styles.paragraph}>
                    Air travel is a major contributor to carbon emissions. We are actively working to address this by partnering with airlines that prioritize fuel efficiency, encouraging direct flights to reduce emissions, and promoting awareness of carbon offset programs.
                </Text>

                <Text style={styles.sectionTitle}>Eco-Friendly Hotel Choices</Text>
                <Text style={styles.paragraph}>
                    We collaborate with hotels that implement sustainable practices such as energy and water conservation systems, waste reduction and recycling programs, and the use of eco-friendly products and materials.
                </Text>

                <Text style={styles.sectionTitle}>Smarter Car Hire Services</Text>
                <Text style={styles.paragraph}>
                    Through our car hire services, we promote fuel-efficient and low-emission vehicles, encourage shared mobility, and work with partners who maintain environmentally responsible fleets.
                </Text>

                <Text style={styles.sectionTitle}>Digital-First Approach</Text>
                <Text style={styles.paragraph}>
                    As a fully digital OTA, Airgo.ng minimizes paper use and reduces operational waste by offering e-tickets, digital booking confirmations, and paperless transactions across all services.
                </Text>

                <Text style={styles.sectionTitle}>Supporting Communities</Text>
                <Text style={styles.paragraph}>
                    Sustainability goes beyond the environment—it includes people. We aim to support local businesses through our hotel partnerships, encourage tourism that respects local cultures, and create opportunities within the travel ecosystem.
                </Text>

                <Text style={styles.sectionTitle}>Travel Better with Airgo.ng</Text>
                <Text style={styles.paragraph}>
                    Sustainability is a journey, and we invite you to be part of it. Every booking you make with Airgo.ng is a step toward a more responsible and eco-friendly travel experience. Choose smart. Travel responsibly.
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