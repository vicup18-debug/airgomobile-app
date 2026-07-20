import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../constants/config';

export default function TaxiBiddingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from: string; to: string; dateTime: string }>();

  const [phase, setPhase] = useState<'creating' | 'bidding' | 'error'>('creating');
  const [errorMessage, setErrorMessage] = useState('');
  const [rideRequestId, setRideRequestId] = useState<string | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // counter UI state
  const [counterActiveId, setCounterActiveId] = useState<string | null>(null);
  const [counterFare, setCounterFare] = useState<string>('');

  useEffect(() => {
    initRideRequest();
  }, []);

  useEffect(() => {
    if (phase === 'bidding' && rideRequestId) {
       const SOCKET_URL = API_URL.replace('/api', '');
       const socketInstance = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
       setSocket(socketInstance);

       socketInstance.on('connect', () => {
         socketInstance.emit('join_booking', { bookingId: rideRequestId });
       });

       socketInstance.on('new_driver_bid', (data: any) => {
         if (data && data.driverOffers) {
            setBids(data.driverOffers);
            Toast.show({ type: 'info', text1: 'New Driver Bid!', text2: 'A new driver has offered a fare.' });
         }
       });

       socketInstance.on('booking_updated', (booking: any) => {
         if (booking.offerStatus === 'Accepted') {
            Toast.show({ type: 'success', text1: 'Fare Accepted!', text2: 'Redirecting to checkout.' });
            socketInstance.disconnect();
            router.push(`/taxi-escrow?bookingId=${booking._id}&from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}&dateTime=${encodeURIComponent(params.dateTime)}`);
         } else if (booking.offerStatus === 'Pending Partner') {
            Toast.show({ type: 'info', text1: 'Counter-offer sent', text2: 'Awaiting driver response.' });
            socketInstance.disconnect();
            router.push('/(tabs)/bookings');
         }
       });

       return () => {
         socketInstance.disconnect();
       };
    }
  }, [phase, rideRequestId]);

  const initRideRequest = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      const userPhone = await AsyncStorage.getItem('userPhone');
      const token = await AsyncStorage.getItem('authToken');

      if (!userId || !token) {
        setErrorMessage('You must be logged in to request a ride.');
        setPhase('error');
        return;
      }

      // Geocoding pickup to get coordinates and city
      let pickupCoords: { type: string, coordinates: [number, number] } | null = null;
      let city = '';
      let distance = 0;
      let finalPrice = 15000;

      try {
        const safeFrom = params?.from || '';
        const safeTo = params?.to || '';

        const resFrom = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(safeFrom)}&countrycodes=ng&limit=1`, {
          headers: { 'User-Agent': 'AirgoHotelBookingApp/1.0', 'Accept': 'application/json' }
        });
        const dataFrom = await resFrom.json();
        
        const resTo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(safeTo)}&countrycodes=ng&limit=1`, {
          headers: { 'User-Agent': 'AirgoHotelBookingApp/1.0', 'Accept': 'application/json' }
        });
        const dataTo = await resTo.json();

        if (dataFrom && dataFrom.length > 0 && dataTo && dataTo.length > 0) {
          pickupCoords = { type: 'Point', coordinates: [parseFloat(dataFrom[0].lon), parseFloat(dataFrom[0].lat)] };
          city = dataFrom[0].address?.city || dataFrom[0].address?.state || '';

          const start = [parseFloat(dataFrom[0].lat), parseFloat(dataFrom[0].lon)];
          const end = [parseFloat(dataTo[0].lat), parseFloat(dataTo[0].lon)];

          const resRoute = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=false`);
          const dataRoute = await resRoute.json();

          if (dataRoute && dataRoute.routes && dataRoute.routes.length > 0) {
            distance = parseFloat((dataRoute.routes[0].distance / 1000).toFixed(1));
            finalPrice = 1000 + (distance * 500);
            finalPrice = Math.round(finalPrice / 100) * 100;
          }
        }
      } catch (e) {
        console.warn('Geocoding/Distance calculation failed', e);
      }

      const payload = {
         userId,
         clientName: userName || 'Airgo Client',
         clientEmail: email,
         clientPhone: userPhone || '',
         fromAddress: params.from,
         toAddress: params.to,
         checkIn: params.dateTime,
         checkOut: params.dateTime,
         distance: distance,
         offeredPrice: finalPrice.toString(),
         travelScope: 'Intra-City',
         city: city,
         pickupCoords: pickupCoords
      };

      const res = await fetch(`${API_URL}/ride-requests`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ride request');

      setRideRequestId(data.rideRequestId || data.rideRequest?._id);
      setPhase('bidding');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const handleSelectDriver = async (driverId: string, isCounter: boolean) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const payload: any = { driverId };
      if (isCounter) {
         const sanitized = Number(counterFare.replace(/[^0-9]/g, ''));
         if (isNaN(sanitized) || sanitized <= 0) {
            Toast.show({ type: 'error', text1: 'Invalid Counter Fare', text2: 'Please enter a valid amount.' });
            return;
         }
         payload.counterFare = sanitized;
      }

      const res = await fetch(`${API_URL}/ride-requests/${rideRequestId}/select-driver`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
      });
      if (res.ok) {
         if (!isCounter) {
             Toast.show({ type: 'success', text1: 'Driver Selected!', text2: 'Processing payment...' });
             // Wait for booking_updated socket event to redirect to escrow
         } else {
             Toast.show({ type: 'info', text1: 'Counter Sent!', text2: 'Waiting for driver...' });
         }
      } else {
         const errData = await res.json();
         Toast.show({ type: 'error', text1: 'Error', text2: errData.message || 'Failed to select driver' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred.' });
    }
  };

  const handleCancelRequest = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!rideRequestId || !token) return;
      const res = await fetch(`${API_URL}/ride-requests/${rideRequestId}/cancel`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
         Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Ride request cancelled.' });
         if (socket) socket.disconnect();
         router.replace('/(tabs)');
      } else {
         Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to cancel request.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred.' });
    }
  };

  if (phase === 'creating') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.statusText}>Locating drivers nearby...</Text>
        <Text style={styles.statusSub}>Broadcasting your ride request to the network.</Text>
      </SafeAreaView>
    );
  }

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="close-circle" size={56} color="#E53E3E" />
        <Text style={styles.errorTitle}>Request Failed</Text>
        <Text style={styles.errorMsg}>{errorMessage}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pulse Radar</Text>
        <View style={styles.escrowPill}>
           <Ionicons name="wifi" size={12} color="#000080" />
           <Text style={[styles.escrowPillText, { color: '#000080' }]}>Matching</Text>
        </View>
      </View>

      <View style={styles.radarContainer}>
         <View style={styles.radarCircle}>
            <ActivityIndicator size="large" color="#000080" />
         </View>
         <Text style={styles.radarText}>Waiting for driver bids...</Text>
         <TouchableOpacity style={styles.cancelRequestBtn} onPress={handleCancelRequest}>
            <Text style={styles.cancelRequestBtnText}>Cancel Request</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.bidsContainer}>
        {bids.map((bid, index) => (
           <View key={index} style={styles.bidCard}>
              <View style={styles.bidHeader}>
                 <Text style={styles.driverName}>{bid.driverName}</Text>
                 <Text style={styles.fare}>₦{Number(bid.fare).toLocaleString()}</Text>
              </View>
              <Text style={styles.vehicle}>{bid.vehicleDetails || 'Standard Vehicle'}</Text>

              {counterActiveId === bid.driverId ? (
                 <View style={styles.counterBox}>
                    <TextInput
                       style={styles.counterInput}
                       placeholder="Enter your offer"
                       keyboardType="numeric"
                       value={counterFare}
                       onChangeText={setCounterFare}
                    />
                    <View style={styles.counterActions}>
                       <TouchableOpacity style={styles.btnSecondary} onPress={() => setCounterActiveId(null)}>
                          <Text style={styles.btnSecondaryText}>Cancel</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={styles.btnPrimary} onPress={() => handleSelectDriver(bid.driverId, true)}>
                          <Text style={styles.btnPrimaryText}>Send</Text>
                       </TouchableOpacity>
                    </View>
                 </View>
              ) : (
                 <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.btnSecondary} onPress={() => { setCounterActiveId(bid.driverId); setCounterFare(''); }}>
                       <Text style={styles.btnSecondaryText}>Counter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => handleSelectDriver(bid.driverId, false)}>
                       <Text style={styles.btnPrimaryText}>Accept</Text>
                    </TouchableOpacity>
                 </View>
              )}
           </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 32,
  },
  statusText: { fontSize: 18, fontWeight: '800', color: '#1A202C', marginTop: 20, textAlign: 'center' },
  statusSub: { fontSize: 13, color: '#718096', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  errorTitle: { fontSize: 22, fontWeight: '900', color: '#C53030', marginTop: 16, marginBottom: 8 },
  errorMsg: { fontSize: 14, color: '#4A5568', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  backBtn: { backgroundColor: '#000080', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  backBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  escrowPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EBF8FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#BEE3F8' },
  escrowPillText: { fontSize: 11, fontWeight: '700' },
  radarContainer: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  radarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BEE3F8' },
  radarText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#4A5568' },
  bidsContainer: { padding: 20 },
  bidCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  bidHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  driverName: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  fare: { fontSize: 18, fontWeight: '900', color: '#000080' },
  vehicle: { fontSize: 13, color: '#718096', marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnSecondaryText: { fontSize: 14, fontWeight: '700', color: '#4A5568' },
  btnPrimary: { flex: 1, backgroundColor: '#000080', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  counterBox: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 10, marginTop: 8 },
  counterInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  counterActions: { flexDirection: 'row', gap: 10 },
  cancelRequestBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#FFF0F0', borderRadius: 8, borderWidth: 1, borderColor: '#FEB2B2' },
  cancelRequestBtnText: { color: '#E53E3E', fontWeight: 'bold', fontSize: 14 }
});
