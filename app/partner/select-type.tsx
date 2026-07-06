import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SelectPropertyTypeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#004A99" />
                    </TouchableOpacity>
                    <Text style={styles.brandTitle}>Airgo.ng</Text>
                    <View style={{ width: 28 }} />
                </View>

                <Text style={styles.mainHeading}>List your property on Airgo.ng and start welcoming guests in no time!</Text>
                <Text style={styles.subHeading}>To get started, choose the type of property you want to list on Airgo.ng</Text>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/partner/add-hotel' as any)}
                    activeOpacity={0.9}
                >
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="business" size={36} color="#004A99" />
                        </View>
                    </View>
                    <Text style={styles.cardTitle}>Hotel</Text>
                    <Text style={styles.cardDesc}>Properties like hotels, guest houses, hostels, aparthotels, etc.</Text>
                    <View style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>List Property</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/partner/add-hotel' as any)}
                    activeOpacity={0.9}
                >
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="home" size={36} color="#004A99" />
                        </View>
                    </View>
                    <Text style={styles.cardTitle}>Apartment</Text>
                    <Text style={styles.cardDesc}>Tastefully furnished and self-catering accommodation, where guests rent the entire place.</Text>
                    <View style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>List Property</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    content: { padding: 24, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingTop: 10 },
    backButton: { padding: 4 },
    brandTitle: { fontSize: 22, fontWeight: '800', color: '#004A99', letterSpacing: -0.5 },
    mainHeading: { fontSize: 24, fontWeight: '800', color: '#1A202C', marginBottom: 12, lineHeight: 32 },
    subHeading: { fontSize: 16, color: '#4A5568', marginBottom: 30, lineHeight: 24 },
    
    card: { 
        backgroundColor: '#FFF', 
        borderRadius: 20, 
        padding: 24, 
        alignItems: 'center', 
        marginBottom: 24, 
        elevation: 4, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#EDF2F7'
    },
    iconWrapper: { alignItems: 'center', marginBottom: 16 },
    iconCircle: { 
        width: 80, height: 80, borderRadius: 40, 
        backgroundColor: '#F0F5FA',
        borderWidth: 1, borderColor: '#D1E0F0', 
        justifyContent: 'center', alignItems: 'center'
    },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
    cardDesc: { fontSize: 15, color: '#4A5568', textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 10 },
    primaryButton: { 
        backgroundColor: '#004A99', 
        paddingVertical: 14, 
        paddingHorizontal: 30, 
        borderRadius: 12, 
        width: '100%', 
        alignItems: 'center' 
    },
    primaryButtonText: { fontSize: 16, color: '#FFF', fontWeight: 'bold' }
});