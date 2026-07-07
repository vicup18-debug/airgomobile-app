import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/config';

export default function HotelDetailsScreen() {
    const { id, nights = "2" } = useLocalSearchParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

    useEffect(() => {
        if (!id) return;
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

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#004A99" /></View>;
    }

    // 🟢 MOCK ROOMS IF NONE IN DB (For the Demo)
    const availableRooms = hotel?.rooms || [
        { id: 1, name: "Standard Room", price: 85000, capacity: "2 Adults", available: 5, amenities: ["Free WiFi", "AC"] },
        { id: 2, name: "Deluxe Suite", price: 120000, capacity: "2 Adults, 1 Child", available: 2, amenities: ["Free WiFi", "AC", "Balcony"] },
        { id: 3, name: "Presidential Villa", price: 350000, capacity: "4 Adults", available: 0, amenities: ["Pool", "Butler", "Ocean View"] }
    ];

    // 🟢 NEW: Calculate selected room details for the Escrow Policy
    const selectedRoomDetails = availableRooms.find((r: any) => r.id === selectedRoom);
    const refundAmount = selectedRoomDetails ? selectedRoomDetails.price * 0.7 : 0;

    const handleContinue = () => {
        if (selectedRoom === null) {
            alert("Please select a room to continue.");
            return;
        }
        // Proceed to checkout page, passing the room info
        router.push(`/hotel/checkout?id=${id}&roomId=${selectedRoom}&nights=${nights}`);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Header */}
                <View style={styles.imageHeader}>
                    <Image source={{ uri: hotel?.images?.[0] || 'https://images.unsplash.com/photo-1542314831-c6a4d27ce66f' }} style={styles.mainImage} />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Hotel Info */}
                <View style={styles.infoSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.hotelName}>{hotel?.name || "Airgo Premium Stay"}</Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#FFF" />
                            <Text style={styles.ratingText}>4.8</Text>
                        </View>
                    </View>
                    <Text style={styles.locationText}><Ionicons name="location" size={14} /> {hotel?.location?.city || "Nigeria"}, {hotel?.location?.state}</Text>
                    <Text style={styles.descriptionText} numberOfLines={3}>
                        {hotel?.description || "Experience luxury and comfort in the heart of the city. Enjoy premium amenities and world-class service tailored to your every need."}
                    </Text>
                </View>

                {/* 🟢 ROOM AVAILABILITY LIST */}
                <View style={styles.roomsSection}>
                    <Text style={styles.sectionTitle}>Select a Room</Text>

                    {availableRooms.map((room: any) => {
                        const isSoldOut = room.available === 0;
                        const isSelected = selectedRoom === room.id;

                        return (
                            <TouchableOpacity
                                key={room.id}
                                style={[styles.roomCard, isSelected && styles.roomCardSelected, isSoldOut && styles.roomCardSoldOut]}
                                disabled={isSoldOut}
                                onPress={() => setSelectedRoom(room.id)}
                            >
                                <View style={styles.roomHeader}>
                                    <Text style={styles.roomName}>{room.name}</Text>
                                    <Text style={styles.roomPrice}>₦{room.price.toLocaleString()}<Text style={styles.priceSub}>/night</Text></Text>
                                </View>

                                <Text style={styles.roomCapacity}><Ionicons name="people" size={14} /> {room.capacity}</Text>

                                <View style={styles.roomFooter}>
                                    <Text style={styles.amenities}>{room.amenities.join(' • ')}</Text>
                                    {isSoldOut ? (
                                        <Text style={styles.soldOutText}>Sold Out</Text>
                                    ) : (
                                        <Text style={room.available <= 2 ? styles.scarceText : styles.availableText}>
                                            {room.available} left
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                {/* Extra padding so scroll doesn't hide behind the taller bottom bar */}
                <View style={{ height: selectedRoom ? 180 : 100 }} />
            </ScrollView>

            {/* Bottom Floating Bar */}
            <View style={styles.bottomBar}>

                {/* 🟢 NEW: AIRGO ESCROW POLICY BANNER */}
                {selectedRoomDetails && (
                    <View style={styles.protectionBanner}>
                        <View style={styles.protectionHeader}>
                            <Ionicons name="shield-checkmark" size={16} color="#975A16" />
                            <Text style={styles.protectionTitle}>Airgo Escrow Protection</Text>
                        </View>
                        <Text style={styles.protectionText}>
                            You are paying <Text style={{ fontWeight: 'bold' }}>Airgo.ng</Text>. Valid cancellations are eligible for a <Text style={{ fontWeight: 'bold', color: '#276749' }}>70% refund (₦{refundAmount.toLocaleString()})</Text>.
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={[styles.continueButton, selectedRoom === null && { opacity: 0.5 }]} onPress={handleContinue}>
                    <Text style={styles.continueText}>Continue to Payment</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    imageHeader: { position: 'relative', width: '100%', height: 300 },
    mainImage: { width: '100%', height: '100%' },
    backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },

    infoSection: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    hotelName: { fontSize: 24, fontWeight: '900', color: '#1A202C', flex: 1 },
    ratingBadge: { backgroundColor: '#FFB81C', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    ratingText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4 },
    locationText: { color: '#718096', fontSize: 15, marginBottom: 15 },
    descriptionText: { color: '#4A5568', fontSize: 14, lineHeight: 22 },

    roomsSection: { padding: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A202C', marginBottom: 15 },

    roomCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 2, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    roomCardSelected: { borderColor: '#004A99', backgroundColor: '#F0F7FF' },
    roomCardSoldOut: { opacity: 0.6, backgroundColor: '#F7FAFC' },
    roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    roomName: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
    roomPrice: { fontSize: 18, fontWeight: '900', color: '#004A99' },
    priceSub: { fontSize: 12, fontWeight: 'normal', color: '#718096' },
    roomCapacity: { color: '#4A5568', marginBottom: 12, fontSize: 14 },
    roomFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 },
    amenities: { color: '#A0AEC0', fontSize: 12, flex: 1 },
    availableText: { color: '#38A169', fontWeight: 'bold', fontSize: 12 },
    scarceText: { color: '#E53E3E', fontWeight: 'bold', fontSize: 12, backgroundColor: '#FFF5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    soldOutText: { color: '#A0AEC0', fontWeight: 'bold', fontSize: 12 },

    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', elevation: 15 },

    // 🟢 NEW STYLES: Escrow Protection Banner
    protectionBanner: { backgroundColor: '#FEFCBF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F6E05E', marginBottom: 15 },
    protectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    protectionTitle: { color: '#975A16', fontSize: 13, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase' },
    protectionText: { color: '#744210', fontSize: 12, lineHeight: 18 },

    continueButton: { backgroundColor: '#FFB81C', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
    continueText: { color: '#004A99', fontSize: 18, fontWeight: '900' }
});