import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Dimensions, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';

const getHotelState = (hotel: any) => {
  if (!hotel) return 'Nigeria';
  
  let city = hotel.city || '';
  let state = hotel.state || '';
  let location = '';

  if (hotel.location && typeof hotel.location === 'object') {
    if (!city) city = hotel.location.city || '';
    if (!state) state = hotel.location.state || '';
    location = hotel.location.address || hotel.location.street || '';
  } else if (typeof hotel.location === 'string') {
    location = hotel.location;
  } else if (typeof hotel.hotelAddress === 'string') {
    location = hotel.hotelAddress;
  } else if (typeof hotel.address === 'string') {
    location = hotel.address;
  }
  
  city = city.trim();
  state = state.trim();
  location = location.trim();
  
  let formatted = '';
  
  if (city) {
    formatted += `(${city})`;
  }
  
  if (state) {
    if (formatted) formatted += ' ';
    formatted += state;
  }
  
  if (location) {
    const isDuplicate = 
        location.toLowerCase() === city.toLowerCase() || 
        location.toLowerCase() === state.toLowerCase() ||
        location.toLowerCase() === `${city}, ${state}`.toLowerCase() ||
        location.toLowerCase() === `${city}, ${state}, nigeria`.toLowerCase();
        
    if (!isDuplicate) {
        if (formatted) {
          formatted += ` - ${location}`;
        } else {
          formatted = location;
        }
    }
  }
  
  return formatted || 'Nigeria';
};

export default function HotelDetailsScreen() {
    const { id, startDate, endDate, guests } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
    const [datesUnavailableModalVisible, setDatesUnavailableModalVisible] = useState(false);
    const [suggestedDates, setSuggestedDates] = useState<{ checkIn: string, checkOut: string } | null>(null);
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

    const isApartment = (hotel?.partnerType === 'apartment') || 
                        (hotel?.type === 'apartment') || 
                        (hotel?.category === 'apartment') || 
                        (hotel?.hotelName || hotel?.name || '').toLowerCase().includes('apartment') ||
                        (hotel?.hotelName || hotel?.name || '').toLowerCase().includes('homes') ||
                        (hotel?.hotelName || hotel?.name || '').toLowerCase().includes('shortlet');

    useEffect(() => {
        if (!id) return;
        fetch(`${API_URL}/hotels/${id}`)
            .then(res => res.json())
            .then(data => {
                setHotel(data);
                setLoading(false);
                const isApt = (data?.partnerType === 'apartment') || 
                              (data?.type === 'apartment') || 
                              (data?.category === 'apartment') || 
                              (data?.hotelName || data?.name || '').toLowerCase().includes('apartment') ||
                              (data?.hotelName || data?.name || '').toLowerCase().includes('homes') ||
                              (data?.hotelName || data?.name || '').toLowerCase().includes('shortlet');
                // 🟢 Auto-select room for apartments so the user doesn't have to
                if (isApt) {
                    if (data.rooms && data.rooms.length > 0) {
                        setSelectedRoom(data.rooms[0]._id);
                    } else {
                        setSelectedRoom('apartment-base-room' as any);
                    }
                }
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

    const availableRooms = isApartment ? [{
        id: (hotel.rooms && hotel.rooms.length > 0) ? hotel.rooms[0]._id : 'apartment-base-room',
        name: hotel.hotelName || hotel.name,
        price: hotel.pricePerNight || (hotel.rooms && hotel.rooms.length > 0 ? (hotel.rooms[0].pricePerNight || hotel.rooms[0].netPrice) : 0),
        capacity: hotel.rooms && hotel.rooms.length > 0 && hotel.rooms[0].description ? hotel.rooms[0].description : "Entire Property",
        available: 1,
        amenities: typeof hotel.amenities === 'string' ? hotel.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : (Array.isArray(hotel.amenities) ? hotel.amenities : []),
        isRefundable: hotel.isRefundable !== false
    }] : (Array.isArray(hotel?.rooms) && hotel.rooms.length > 0 ? hotel.rooms.map((r: any) => {
        const rawAmenities = typeof r.amenities === 'string' ? r.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : (Array.isArray(r.amenities) ? r.amenities : ["Free WiFi"]);
        return {
            id: r._id,
            name: r.name,
            price: r.pricePerNight || r.netPrice || 0,
            capacity: r.description || "2 Adults",
            available: getAvailableRoomsCount(r),
            amenities: rawAmenities,
            isRefundable: r.isRefundable !== false && hotel?.isRefundable !== false
        };
    }) : []);

    // 🟢 NEW: Calculate selected room details for the Escrow Policy
    const selectedRoomDetails = availableRooms.find((r: any) => r.id === selectedRoom);
    const refundAmount = selectedRoomDetails ? selectedRoomDetails.price * 0.7 : 0;

    const findNextAvailableDates = (room: any, startSearchDate: string, currentDurationDays: number) => {
        if (!startSearchDate) return null;
        let currentStart = new Date(startSearchDate.includes('T') ? startSearchDate : `${startSearchDate}T00:00:00Z`);
        currentStart.setUTCDate(currentStart.getUTCDate() + 1); // Start checking from the day after the search date
        
        for (let i = 0; i < 30; i++) {
            const checkInStr = currentStart.toISOString().split('T')[0];
            let currentEnd = new Date(currentStart);
            currentEnd.setUTCDate(currentEnd.getUTCDate() + (currentDurationDays > 0 ? currentDurationDays : 1));
            const checkOutStr = currentEnd.toISOString().split('T')[0];
            
            let maxBooked = 0;
            if (Array.isArray(room.bookedDates)) {
                room.bookedDates.forEach((bd: any) => {
                    if (bd.date >= checkInStr && bd.date < checkOutStr) {
                        if (bd.count > maxBooked) maxBooked = bd.count;
                    }
                });
            }
            const avail = Math.max(0, (room.totalAllocated || 1) - maxBooked);
            if (avail > 0) {
                return { checkIn: checkInStr, checkOut: checkOutStr };
            }
            currentStart.setUTCDate(currentStart.getUTCDate() + 1);
        }
        return null;
    };

    const handleContinue = () => {
        if (selectedRoom === null) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a room to continue.' });
            return;
        }
        if (!localStartDate || !localEndDate) {
            if (localStartDate && !localEndDate) {
                Toast.show({ type: 'error', text1: 'Checkout Date Required', text2: 'Please select a checkout date.' });
            }
            setShowCalendarModal(true);
            return;
        }

        const isSelectedRoomSoldOut = selectedRoomDetails?.available === 0;
        if (isSelectedRoomSoldOut) {
            const fullRoomData = hotel?.rooms?.find((r: any) => r._id === selectedRoom) || hotel;
            const diff = new Date(localEndDate).getTime() - new Date(localStartDate).getTime();
            const duration = Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
            const nextDates = fullRoomData ? findNextAvailableDates(fullRoomData, localStartDate, duration) : null;
            
            if (nextDates) {
                setSuggestedDates(nextDates);
                setDatesUnavailableModalVisible(true);
            } else {
                Toast.show({ type: 'error', text1: 'Sold Out', text2: 'This room is sold out for the selected dates. Please change your dates.' });
                setShowCalendarModal(true);
            }
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
                {!isApartment && (
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
                                    style={[styles.roomCard, isSelected && styles.roomCardSelected]}
                                    onPress={() => setSelectedRoom(room.id)}
                                >
                                    <View style={styles.roomHeader}>
                                        <Text style={styles.roomName}>{room.name}</Text>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.roomPrice}>₦{room.price.toLocaleString()}<Text style={styles.priceSub}>/night</Text></Text>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: room.isRefundable !== false ? '#276749' : '#C53030', marginTop: 2 }}>
                                                {room.isRefundable !== false ? '70% Refundable' : 'Non-Refundable'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.roomCapacity}><Ionicons name="people" size={14} /> {room.capacity}</Text>

                                    <View style={styles.roomFooter}>
                                        <Text style={styles.amenities}>{room.amenities.join(' • ')}</Text>
                                        {isSoldOut ? (
                                            <Text style={styles.soldOutText}>Sold Out For Selected Dates</Text>
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
                )}
                {/* Extra padding so scroll doesn't hide behind the bottom bar */}
                <View style={{ height: selectedRoom ? 220 : 120 }} />
            </ScrollView>

            {/* Bottom Floating Bar */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, Platform.OS === 'android' ? 24 : 16) }]}>

                {/* 🟢 NEW: AIRGO ESCROW POLICY BANNER */}
                {selectedRoomDetails && (
                    <View style={selectedRoomDetails.isRefundable ? styles.protectionBanner : [styles.protectionBanner, { backgroundColor: '#FFF5F5', borderColor: '#FC8181' }]}>
                        <View style={styles.protectionHeader}>
                            <Ionicons name={selectedRoomDetails.isRefundable ? "shield-checkmark" : "warning"} size={16} color={selectedRoomDetails.isRefundable ? "#975A16" : "#C53030"} />
                            <Text style={[styles.protectionTitle, { color: selectedRoomDetails.isRefundable ? "#975A16" : "#C53030" }]}>
                                {selectedRoomDetails.isRefundable ? "Airgo Escrow Protection" : "Non-Refundable Booking"}
                            </Text>
                        </View>
                        <Text style={styles.protectionText}>
                            You are paying <Text style={{ fontWeight: 'bold' }}>Airgo.ng</Text>. 
                            {selectedRoomDetails.isRefundable 
                              ? ` Valid cancellations are eligible for a `
                              : ` This property does `}
                            {selectedRoomDetails.isRefundable && <Text style={{ fontWeight: 'bold', color: '#276749' }}>70% refund (₦{refundAmount.toLocaleString()})</Text>}
                            {!selectedRoomDetails.isRefundable && <Text style={{ fontWeight: 'bold', color: '#C53030' }}>NOT offer refunds</Text>}
                            {selectedRoomDetails.isRefundable ? "." : " for cancellations."}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/info/refund-policy' as any)}>
                            <Text style={{ fontSize: 10, color: '#004A99', fontWeight: '700', textDecorationLine: 'underline', marginTop: 4 }}>
                                Read Airgo Refund &amp; Cancellation Policy
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity 
                    style={[styles.continueButton, (selectedRoom === null) && { opacity: 0.5 }]} 
                    onPress={handleContinue}
                >
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
                        <TouchableOpacity style={styles.modalApplyButton} onPress={() => {
                            if (localStartDate && !localEndDate) {
                                Toast.show({ type: 'error', text1: 'Checkout Date Required', text2: 'Please select a checkout date.' });
                                return;
                            }
                            setShowCalendarModal(false);
                        }}>
                            <Text style={styles.modalApplyText}>Confirm Dates</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Dates Unavailable Modal */}
            <Modal visible={datesUnavailableModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Dates Unavailable</Text>
                            <TouchableOpacity onPress={() => setDatesUnavailableModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#CBD5E0" />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 15, color: '#4A5568', lineHeight: 22, marginBottom: 20 }}>
                            This room is sold out for your selected dates.{"\n\n"}
                            The next available opening is:{"\n"}
                            <Text style={{ fontWeight: '800', color: '#1A202C' }}>
                                {suggestedDates ? `${new Date(suggestedDates.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} to ${new Date(suggestedDates.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                            </Text>
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#EDF2F7' }} onPress={() => { setDatesUnavailableModalVisible(false); setShowCalendarModal(true); }}>
                                <Text style={{ color: '#4A5568', fontWeight: '700', fontSize: 14 }}>Change Dates</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#000080' }} onPress={() => {
                                if (suggestedDates) {
                                    setLocalStartDate(suggestedDates.checkIn);
                                    setLocalEndDate(suggestedDates.checkOut);
                                }
                                setDatesUnavailableModalVisible(false);
                            }}>
                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Use Suggestion</Text>
                            </TouchableOpacity>
                        </View>
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

    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        paddingHorizontal: 16, 
        paddingTop: 10, 
        backgroundColor: '#FFF', 
        borderTopWidth: 1, 
        borderTopColor: '#E2E8F0', 
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8
    },

    // 🟢 Escrow Protection Banner
    protectionBanner: { backgroundColor: '#FEFCBF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F6E05E', marginBottom: 10 },
    protectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    protectionTitle: { color: '#975A16', fontSize: 12, fontWeight: '900', marginLeft: 6, textTransform: 'uppercase' },
    protectionText: { color: '#744210', fontSize: 11, lineHeight: 16 },

    continueButton: { backgroundColor: '#FFB81C', paddingVertical: 13, borderRadius: 12, alignItems: 'center', shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
    continueText: { color: '#004A99', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: 44 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A202C' },
    modalApplyButton: { backgroundColor: '#000080', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 14 },
    modalApplyText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});