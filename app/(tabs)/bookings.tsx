import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';

export default function BookingsScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 🟢 FETCH REAL BOOKINGS FROM MONGODB VIA RENDER
    const fetchBookings = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/bookings/user/${userId}`);
            const data = await response.json();
            setBookings(data);
        } catch (error) {
            console.error("Fetch Bookings Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Auto-refresh when the user navigates to this tab
    useEffect(() => {
        if (isFocused) {
            fetchBookings();
        }
    }, [isFocused]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
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
            {/* 🟢 LIGHT THEME HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.navigate('/(tabs)' as any)}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#1A202C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Itinerary</Text>
            </View>

            {/* TOP TABS */}
            <View style={styles.tabContainer}>
                {['upcoming', 'past'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#004A99" />}
            >
                {bookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={70} color="#CBD5E0" />
                        <Text style={styles.emptyTitle}>No bookings found yet.</Text>
                        <TouchableOpacity
                            style={styles.exploreButton}
                            onPress={() => router.replace('/(tabs)' as any)}
                        >
                            <Text style={styles.exploreButtonText}>Explore Stays</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    bookings.map((booking) => (
                        <View key={booking._id} style={styles.bookingCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{booking.status || 'Confirmed'}</Text>
                                </View>
                                <Text style={styles.bookingRef}>Ref: #{booking._id.slice(-6).toUpperCase()}</Text>
                            </View>

                            <View style={styles.hotelInfoRow}>
                                <Image
                                    source={{ uri: booking.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop' }}
                                    style={styles.thumbnail}
                                />
                                <View style={styles.hotelDetails}>
                                    <Text style={styles.hotelName}>{booking.hotel?.name || 'Airgo Stay'}</Text>
                                    <Text style={styles.hotelLocation}>
                                        <Ionicons name="location-outline" size={12} color="#718096" /> {booking.hotel?.location?.city || 'Nigeria'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.dateRow}>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateLabel}>Check-in</Text>
                                    <Text style={styles.dateText}>{new Date(booking.checkIn).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateLabel}>Total Paid</Text>
                                    <Text style={styles.amountText}>₦{booking.totalPrice?.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },

    header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { position: 'absolute', left: 20, bottom: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A202C' },

    tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
    tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: '#004A99' },
    tabText: { fontSize: 15, color: '#718096', fontWeight: '600' },
    activeTabText: { color: '#004A99', fontWeight: 'bold' },

    content: { padding: 20, flexGrow: 1 },

    bookingCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    badge: { backgroundColor: '#E6FFFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeText: { color: '#319795', fontWeight: 'bold', fontSize: 12 },
    bookingRef: { color: '#A0AEC0', fontSize: 12, fontWeight: '600' },

    hotelInfoRow: { flexDirection: 'row', marginBottom: 20 },
    thumbnail: { width: 60, height: 60, borderRadius: 12, marginRight: 15, backgroundColor: '#E2E8F0' },
    hotelDetails: { flex: 1, justifyContent: 'center' },
    hotelName: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
    hotelLocation: { color: '#718096', fontSize: 14, fontWeight: '500' },

    dateRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 15 },
    dateBox: { flex: 1 },
    dateLabel: { fontSize: 12, color: '#A0AEC0', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
    dateText: { fontSize: 16, fontWeight: 'bold', color: '#1A202C' },
    amountText: { fontSize: 18, fontWeight: '900', color: '#004A99' },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, color: '#718096', marginTop: 20, marginBottom: 30, fontWeight: '500' },
    exploreButton: { backgroundColor: '#FFB81C', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    exploreButtonText: { color: '#004A99', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }
});