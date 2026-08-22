import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { PaystackProvider, usePaystack } from 'react-native-paystack-webview';
import { API_URL } from '../../constants/config';

const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_KEY || 'pk_live_61cbd3f05babdb54ab6c8f95ce8144fc8f786eeb';

function CheckoutContent() {
    // 🟢 ALL HOOKS MUST BE AT THE TOP
    const { id, roomId, nights = "2", startDate, endDate, guests: paramGuests } = useLocalSearchParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const { popup } = usePaystack();

    const selectedRoom = (hotel?.rooms && Array.isArray(hotel.rooms) && roomId && roomId !== 'apartment-base-room')
        ? hotel.rooms.find((r: any) => r._id === roomId)
        : (hotel?.rooms && Array.isArray(hotel.rooms) && hotel.rooms.length > 0 ? hotel.rooms[0] : null);

    // The Math Logic
    const stayNights = parseInt(nights as string) || 1;
    const basePrice = selectedRoom?.pricePerNight || hotel?.pricePerNight || 85000;
    const subtotal = basePrice * stayNights;

    // CLIENT REQUEST: 11% for 1-2 days, 15% for 3 or more days
    const feeRate = stayNights >= 3 ? 0.15 : 0.11;
    const fee = subtotal * feeRate;
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
            const userRole = await AsyncStorage.getItem('userRole');
            const userEmail = await AsyncStorage.getItem('userEmail');

            if (!userId) {
                Toast.show({ type: 'error', text1: 'Wait!', text2: 'You must be signed in to book a room.' });
                router.push('/auth/login' as any);
                setIsProcessing(false);
                return;
            }

            if (userRole === 'driver' || userRole === 'partner' || userRole === 'admin') {
                Toast.show({ type: 'error', text1: 'Action Not Allowed', text2: 'Partners and Drivers cannot make reservations.' });
                setIsProcessing(false);
                return;
            }

            const checkInDate = startDate ? new Date(startDate as string) : new Date();
            const checkOutDate = endDate ? new Date(endDate as string) : new Date();
            if (!endDate) {
                checkOutDate.setDate(checkOutDate.getDate() + stayNights);
            }

            const guestsCount = paramGuests ? parseInt(paramGuests as string, 10) : 1;

            const itemIdToSend = (selectedRoom?._id && selectedRoom._id !== 'apartment-base-room')
                ? selectedRoom._id
                : (hotel?._id || id);
            const itemNameToSend = selectedRoom
                ? `${hotel?.name || 'Hotel'} - ${selectedRoom.name}`
                : (hotel?.name || 'Hotel Stay');

            // Create booking with Pending Escrow status first
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    itemId: itemIdToSend,
                    itemName: itemNameToSend,
                    itemType: 'hotel',
                    partnerId: hotel?.partnerId || 'airgo_direct',
                    checkIn: checkInDate.toISOString(),
                    checkOut: checkOutDate.toISOString(),
                    guests: guestsCount,
                    totalPrice: totalDue,
                    status: 'Pending Escrow',
                    city: hotel?.location?.city || hotel?.city || ''
                })
            });

            if (!response.ok) {
                let errorMsg = "Failed to initialize booking.";
                try {
                    const errData = await response.json();
                    if (errData.message) errorMsg = errData.message;
                } catch (e) {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            const bookingId = data.bookingId || data.booking?._id || data._id;
            const uniqueRef = `${bookingId}-${Date.now()}`;

            // Trigger Paystack Popup
            popup.checkout({
                email: userEmail || 'guest@airgo.ng',
                amount: Math.round(totalDue), // Paystack expects Naira in react-native-paystack-webview
                reference: uniqueRef,
                metadata: {
                    custom_fields: [
                        { display_name: 'Booking ID', variable_name: 'bookingId', value: bookingId },
                        { display_name: 'Service', variable_name: 'service', value: 'Hotel Booking' }
                    ],
                },
                onCancel: async () => {
                    Toast.show({ type: 'info', text1: 'Payment Cancelled', text2: 'You cancelled the payment process.' });
                    if (bookingId) {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            await fetch(`${API_URL}/bookings/${bookingId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                        } catch (e) { console.warn('Cancel booking cleanup error:', e); }
                    }
                    setIsProcessing(false);
                },
                onSuccess: async (res: any) => {
                    // Update Booking to Paid
                    try {
                        const token = await AsyncStorage.getItem('authToken');
                        const updateRes = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                                status: 'Paid',
                                paymentReference: res?.transactionRef || res?.reference || uniqueRef
                            })
                        });

                        if (updateRes.ok) {
                            Toast.show({ type: 'success', text1: 'Payment Successful!', text2: 'Your room is officially booked.' });
                            router.replace('/(tabs)/bookings' as any);
                        } else {
                            const errData = await updateRes.json();
                            Toast.show({ type: 'error', text1: 'Verification Failed', text2: errData.message || 'Please contact support.' });
                            setIsProcessing(false);
                        }
                    } catch (e) {
                        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to verify payment.' });
                        setIsProcessing(false);
                    }
                },
            });
        } catch (error: any) {
            const errorMsg = error?.message || 'Could not process booking. Try again.';
            Toast.show({ type: 'error', text1: 'Booking Failed', text2: errorMsg });
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
                <Text style={styles.hotelName}>
                    {hotel ? (selectedRoom ? `${hotel.name} - ${selectedRoom.name}` : hotel.name) : "Room Details Unavailable"}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={styles.statusText}>Status: Available</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: (selectedRoom?.isRefundable !== false && hotel?.isRefundable !== false) ? '#276749' : '#C53030' }}>
                        {(selectedRoom?.isRefundable !== false && hotel?.isRefundable !== false) ? '🛡️ 70% Refundable' : '⚠️ Non-Refundable'}
                    </Text>
                </View>

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

export default function CheckoutScreen() {
    return (
        <PaystackProvider 
            publicKey={PAYSTACK_PUBLIC_KEY} 
            defaultChannels={['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']}
        >
            <CheckoutContent />
        </PaystackProvider>
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