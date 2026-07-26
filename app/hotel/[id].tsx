import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { API_URL } from '../../constants/config';

function getHotelState(hotel: any): string {
  if (hotel?.location && typeof hotel.location === 'string') {
    const parts = hotel.location.split(',');
    return parts[parts.length - 1].trim();
  }
  if (hotel?.location?.state) return hotel.location.state;
  if (hotel?.location?.city) return hotel.location.city;
  return hotel?.hotelAddress || 'Nigeria';
}

export default function HotelDetailsScreen() {
    const { id, startDate, endDate, guests } = useLocalSearchParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (activeImageIndex !== roundIndex) {
            setActiveImageIndex(roundIndex);
        }
    };

    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [localStartDate, setLocalStartDate] = useState(startDate as string || '');
    const [localEndDate, setLocalEndDate] = useState(endDate as string || '');

    const onDayPress = (day: any) => {
        const dateStr = day.dateString;
        if (!localStartDate || (localStartDate && localEndDate)) {
            setLocalStartDate(dateStr);
            setLocalEndDate('');
        } else {
            if (new Date(dateStr) < new Date(localStartDate)) {
                setLocalStartDate(dateStr);
                setLocalEndDate('');
            } else {
                setLocalEndDate(dateStr);
            }
        }
    };

    const markedDates = (() => {
        const marked: any = {};
        if (localStartDate) {
            marked[localStartDate] = { startingDay: true, color: '#000080', textColor: 'white', selected: true };
        }
        if (localEndDate) {
            marked[localEndDate] = { endingDay: true, color: '#000080', textColor: 'white', selected: true };
            if (localStartDate) {
                const start = new Date(localStartDate);
                const end = new Date(localEndDate);
                let current = new Date(start);
                current.setDate(current.getDate() + 1);
                while (current < end) {
                    const dateStr = current.toISOString().split('T')[0];
                    marked[dateStr] = { color: '#EBF4FF', textColor: '#000080', selected: true };
                    current.setDate(current.getDate() + 1);
                }
            }
        }
        return marked;
    })();

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

    // 🟢 DYNAMIC ROOM AVAILABILITY LOGIC
    const getAvailableRoomsCount = (room: any) => {
        if (!room.totalAllocated) return 0;
        if (!localStartDate || !localEndDate || !Array.isArray(room.bookedDates)) return room.totalAllocated;
        
        let maxBooked = 0;
        room.bookedDates.forEach((bd: any) => {
            if (bd.date >= localStartDate && bd.date < localEndDate) {
                if (bd.count > maxBooked) maxBooked = bd.count;
            }
        });
        
        return Math.max(0, room.totalAllocated - maxBooked);
    };

    const availableRooms = Array.isArray(hotel?.rooms) && hotel.rooms.length > 0 ? hotel.rooms.map((r: any) => ({
        id: r._id,
        name: r.name,
        price: r.pricePerNight || r.netPrice || 0,
        capacity: r.description || "2 Adults",
        available: getAvailableRoomsCount(r),
        amenities: typeof r.amenities === 'string' ? r.amenities.split(',').map((a: string) => a.trim()) : (r.amenities || ["Free WiFi"])
    })) : [];

    // 🟢 NEW: Calculate selected room details for the Escrow Policy
    const selectedRoomDetails = availableRooms.find((r: any) => r.id === selectedRoom);
    const refundAmount = selectedRoomDetails ? selectedRoomDetails.price * 0.7 : 0;

    const handleContinue = () => {
        if (selectedRoom === null) {
            alert("Please select a room to continue.");
            return;
        }
        if (!localStartDate || !localEndDate) {
            setShowCalendarModal(true);
            return;
        }
        const diff = new Date(localEndDate).getTime() - new Date(localStartDate).getTime();
        const calculatedNights = Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
        // Proceed to checkout page, passing the room info and dates
        router.push(`/hotel/checkout?id=${id}&roomId=${selectedRoom}&nights=${calculatedNights}&startDate=${localStartDate}&endDate=${localEndDate}&guests=${guests || 1}`);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Header */}
                <View style={styles.imageHeader}>
                    {hotel?.images && hotel.images.length > 0 ? (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            style={{ flex: 1 }}
                        >
                            {hotel.images.map((img: string, idx: number) => (
                                <Image
                                    key={idx}
                                    source={{ uri: img }}
                                    style={{ width: Dimensions.get('window').width, height: 300 }}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <Image source={{ uri: hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' }} style={styles.mainImage} />
                    )}

                    {hotel?.images && hotel.images.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {hotel.images.map((_: any, i: number) => (
                                <View key={i} style={[styles.paginationDot, activeImageIndex === i && styles.paginationDotActive]} />
                            ))}
                        </View>
                    )}

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
                    <Text style={styles.locationText}><Ionicons name="location" size={14} /> {getHotelState(hotel)}</Text>
                    <Text style={styles.descriptionText} numberOfLines={3}>
                        {hotel?.description || "Experience luxury and comfort in the heart of the city. Enjoy premium amenities and world-class service tailored to your every need."}
                    </Text>
                </View>

                {/* 🟢 ROOM AVAILABILITY LIST */}
                <View style={styles.roomsSection}>
                    <Text style={styles.sectionTitle}>Select a Room</Text>
                    
                    {availableRooms.length === 0 && (
                        <Text style={{ color: '#718096', fontSize: 16, marginTop: 10 }}>No rooms available at this hotel currently.</Text>
                    )}

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
                    <Text style={styles.continueText}>
                        {(!localStartDate || !localEndDate) ? "Select Dates to Continue" : "Continue to Payment"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Calendar Modal */}
            <Modal visible={showCalendarModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Dates</Text>
                            <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                                <Ionicons name="close-circle" size={30} color="#CBD5E0" />
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            minDate={new Date().toISOString().split('T')[0]}
                            markingType="period"
                            markedDates={markedDates}
                            onDayPress={onDayPress}
                            theme={{ todayTextColor: '#000080', arrowColor: '#000080', selectedDayBackgroundColor: '#000080' }}
                        />
                        <TouchableOpacity style={styles.modalApplyButton} onPress={() => setShowCalendarModal(false)}>
                            <Text style={styles.modalApplyText}>Confirm Dates</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    imageHeader: { position: 'relative', width: '100%', height: 300 },
    mainImage: { width: '100%', height: '100%' },
    backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },
    paginationContainer: { position: 'absolute', bottom: 45, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
    paginationDotActive: { backgroundColor: '#FFF', width: 10, height: 10, borderRadius: 5 },

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
    continueText: { color: '#004A99', fontSize: 18, fontWeight: '900' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: 44 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A202C' },
    modalApplyButton: { backgroundColor: '#000080', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 14 },
    modalApplyText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});