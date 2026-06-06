import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/config';

export default function BookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    // 🟢 FETCH FUNCTION: Get bookings for THIS specific user
    const fetchMyBookings = async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem('userId');
            const name = await AsyncStorage.getItem('userName');
            setUserName(name || 'Guest');

            if (!userId) {
                setLoading(false);
                return;
            }

            // NOTE: Replace this URL with your /api/bookings endpoint once ready!
            // For now, we are setting it up to handle the logic.
            const response = await fetch(`${API_URL}/bookings/user/${userId}`);
            const data = await response.json();

            setBookings(data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh whenever the user opens this tab
    useFocusEffect(
        useCallback(() => {
            fetchMyBookings();
        }, [])
    );

    const handleLogout = async () => {
        await AsyncStorage.clear();
        Alert.alert("Logged Out", "You have been securely signed out.");
        router.replace('/(tabs)');
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Itinerary</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={28} color="#FF4444" />
                </TouchableOpacity>
            </View>

            {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={80} color="#333" />
                    <Text style={styles.emptyText}>No bookings found yet.</Text>
                    <TouchableOpacity
                        style={styles.exploreButton}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Text style={styles.exploreButtonText}>Explore Stays</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View style={styles.bookingCard}>
                            <Image source={{ uri: item.hotelId.images[0] }} style={styles.hotelThumb} />
                            <View style={styles.info}>
                                <Text style={styles.hotelName}>{item.hotelId.name}</Text>
                                <Text style={styles.dateText}>
                                    <Ionicons name="time-outline" size={14} /> {item.checkIn} - {item.checkOut}
                                </Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Confirmed</Text>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20, paddingTop: 60 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    headerTitle: { color: '#FFD700', fontSize: 24, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#A0A0A0', fontSize: 18, marginTop: 20 },
    exploreButton: { marginTop: 20, backgroundColor: '#FFD700', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    exploreButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
    bookingCard: { backgroundColor: '#1E1E1E', borderRadius: 15, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
    hotelThumb: { width: 80, height: 80, borderRadius: 10 },
    info: { marginLeft: 15, flex: 1 },
    hotelName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    dateText: { color: '#A0A0A0', fontSize: 14, marginTop: 5 },
    statusBadge: { backgroundColor: '#2E7D32', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, marginTop: 8 },
    statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }
});