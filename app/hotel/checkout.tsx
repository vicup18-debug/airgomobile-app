import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '../../constants/config';

export default function CheckoutScreen() {
    // 🟢 ALL HOOKS MUST BE AT THE TOP
    const { id, nights = "2" } = useLocalSearchParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); // Moved up!

    // The Math Logic
    const stayNights = parseInt(nights as string);
    const basePrice = hotel?.pricePerNight || 85000; // Use database price if available
    const subtotal = basePrice * stayNights;

    // CLIENT REQUEST: "Fees" at 10%
    const fee = subtotal * 0.10;
    const totalDue = subtotal + fee;

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        // Fetching from Render
        fetch(`${API_URL}/hotels/${id}`)
            .then(res => res.json())
            .then(data => {
                setHotel(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    // 🛑 THE BORDER: NO MORE HOOKS PAST THIS POINT 🛑

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                Alert.alert("Wait!", "You must be signed in to book a room.");
                router.push('/auth/login' as any);
                return;
            }

            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    hotel: {
                        name: hotel.name,
                        location: { city: hotel.location?.city },
                        images: hotel.images
                    },
                    checkIn: new Date(),
                    totalPrice: totalDue,
                    status: 'Confirmed'
                })
            });

            if (response.ok) {
                Alert.alert("Payment Successful!", "Your room is officially booked.");
                router.replace('/(tabs)/bookings' as any);
            }
        } catch (error) {
            Alert.alert("Error", "Could not process booking. Try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#004A99" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A202C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardHeader}>ORDER SUMMARY</Text>
                <Text style={styles.hotelName}>{hotel ? hotel.name : "Room Details Unavailable"}</Text>
                <Text style={styles.statusText}>Status: Available</Text>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.rowText}>{stayNights} Night Stay</Text>
                    <Text style={styles.rowPrice}>₦{subtotal.toLocaleString()}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.rowText}>Fees</Text>
                    <Text style={styles.rowPrice}>₦{fee.toLocaleString()}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Due</Text>
                    <Text style={styles.totalValue}>₦{totalDue.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={isProcessing}>
                    {isProcessing ? <ActivityIndicator color="#004A99" /> : <Text style={styles.payButtonText}>Confirm & Pay</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A202C' },

    card: { backgroundColor: '#FFF', margin: 20, borderRadius: 24, padding: 25, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
    cardHeader: { fontSize: 13, fontWeight: 'bold', color: '#004A99', letterSpacing: 1, marginBottom: 15 },
    hotelName: { fontSize: 22, fontWeight: '900', color: '#1A202C', marginBottom: 5 },
    statusText: { fontSize: 15, color: '#38A169', fontWeight: '600' },

    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    rowText: { fontSize: 16, color: '#4A5568', fontWeight: '500' },
    rowPrice: { fontSize: 16, color: '#1A202C', fontWeight: '700' },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 18, color: '#1A202C', fontWeight: '800' },
    totalValue: { fontSize: 24, color: '#004A99', fontWeight: '900' },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 },
    payButton: { backgroundColor: '#FFB81C', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    payButtonText: { color: '#004A99', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 }
});