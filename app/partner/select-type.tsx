import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SelectPropertyTypeScreen() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.brandTitle}>Airgo.ng</Text>
            </View>

            <Text style={styles.mainHeading}>List your property on Airgo.ng and start welcoming guests in no time!</Text>
            <Text style={styles.subHeading}>To get started, choose the type of property you want to list on Airgo.ng</Text>

            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/partner/add-hotel' as any)}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="business" size={40} color="#004A99" />
                </View>
                <Text style={styles.cardTitle}>Hotel</Text>
                <Text style={styles.cardDesc}>Properties like hotels, guest houses, hostels, Aparthotels, etc.</Text>
                <View style={styles.buttonPlaceholder}>
                    <Text style={styles.buttonText}>List Property</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push('/partner/add-hotel' as any)}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="home" size={40} color="#004A99" />
                </View>
                <Text style={styles.cardTitle}>Apartment</Text>
                <Text style={styles.cardDesc}>Testily Furnished and self-catering accommodation, where guests rent the entire place.</Text>
                <View style={styles.buttonPlaceholder}>
                    <Text style={styles.buttonText}>List Property</Text>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    content: { padding: 20, paddingTop: 50, paddingBottom: 50 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    backButton: { marginRight: 15 },
    brandTitle: { fontSize: 24, fontWeight: 'bold', color: '#004A99' },
    mainHeading: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10, lineHeight: 30 },
    subHeading: { fontSize: 16, color: '#666', marginBottom: 30, lineHeight: 24 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 25, alignItems: 'center', marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    cardDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    buttonPlaceholder: { backgroundColor: '#E0E0E0', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 6, width: '100%', alignItems: 'center' },
    buttonText: { fontSize: 16, color: '#333', fontWeight: '600' }
});