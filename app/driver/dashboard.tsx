/**
 * Driver Dashboard — Airgo Mobile
 *
 * Full native screen (no WebView) built for speed and real-time responsiveness.
 * Sections: Active Trip, Availability Toggle, Available Requests Feed, Earnings Panel.
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Switch, Linking, AppState
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';
import CustomAlertModal from '../../components/ui/CustomAlertModal';
import { io } from 'socket.io-client';
import { Audio } from 'expo-av';

// ── STATUS ACTIVE CHECK ────────────────────────────────────────────────────
const ACTIVE_STATUSES = ['Trip Started', 'Paid - Escrow Secured', 'Escrow Active', 'Accepted', 'Paid', 'Confirmed', 'Approved for Disbursement', 'Trip Start Pending'];
const TRIP_PENDING_START = ['Accepted', 'Paid', 'Paid - Escrow Secured', 'Confirmed', 'Approved for Disbursement', 'Trip Start Pending'];
const COMPLETED_STATUSES = ['Completed', 'Completed & Disbursed', 'Disbursed', 'Payment Disbursed', 'Paid Out'];

function formatPrice(raw: any): string {
  if (!raw) return '₦0';
  const num = typeof raw === 'string' ? parseInt(raw.replace(/\D/g, ''), 10) : Number(raw);
  return isNaN(num) ? '₦0' : `₦${num.toLocaleString()}`;
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-NG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateStr; }
}

function monthlyEarnings(bookings: any[]): number {
  const now = new Date();
  return bookings
    .filter(b => {
      const s = b.status || '';
      if (!COMPLETED_STATUSES.includes(s)) return false;
      const d = new Date(b.createdAt || b.checkIn);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => {
      const p = typeof b.totalPrice === 'string'
        ? parseInt(b.totalPrice.replace(/\D/g, ''), 10) : Number(b.totalPrice || 0);
      return sum + (isNaN(p) ? 0 : p);
    }, 0);
}

function allTimeEarnings(bookings: any[]): number {
  return bookings
    .filter(b => COMPLETED_STATUSES.includes(b.status || ''))
    .reduce((sum, b) => {
      const p = typeof b.totalPrice === 'string'
        ? parseInt(b.totalPrice.replace(/\D/g, ''), 10) : Number(b.totalPrice || 0);
      return sum + (isNaN(p) ? 0 : p);
    }, 0);
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const router    = useRouter();
  const isFocused = useIsFocused();

  const [driverName, setDriverName]               = useState('Driver');
  const [userId, setUserId]                       = useState('');
  const [isAvailable, setIsAvailable]             = useState(true);
  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [claimingId, setClaimingId]               = useState<string | null>(null);
  const [completingId, setCompletingId]           = useState<string | null>(null);

  const [activeTrip, setActiveTrip]               = useState<any>(null);
  const [myBookings, setMyBookings]               = useState<any[]>([]);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);

  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({ title: '', message: '', type: 'info', buttons: [] });
  const [bidAmount, setBidAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'dispatches' | 'trips'>('dispatches');
  
  // Track modal visibility without triggering re-renders to safely debounce socket events
  const isModalVisibleRef = useRef(false);
  const handleRespondToOfferRef = useRef<any>(null);
  
  useEffect(() => {
    isModalVisibleRef.current = showAlert;
  }, [showAlert]);

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      const name      = await AsyncStorage.getItem('userName');
      const id        = await AsyncStorage.getItem('userId');
      const avail     = await AsyncStorage.getItem('driverAvailable');
      if (name) setDriverName(name.split(' ')[0]);
      if (id)   setUserId(id);
      if (avail !== null) setIsAvailable(avail !== 'false');
    };
    loadSession();
  }, []);

  // ── Fetch all data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const id = userId || await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('authToken');
      if (!id || !token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      const [myRes, reqRes] = await Promise.allSettled([
        fetch(`${API_URL}/bookings/user/${id}`, { headers }),
        fetch(`${API_URL}/ride-requests/available`, { headers }),
      ]);

      // My bookings (trips I've claimed)
      if (myRes.status === 'fulfilled' && myRes.value.ok) {
        const data: any[] = await myRes.value.json();
        const isArr = Array.isArray(data);
        setMyBookings(isArr ? data : []);
        const active = isArr ? data.find(b =>
          ACTIVE_STATUSES.some(s => (b.status || '').includes(s)) && b.driverId === id
        ) : null;
        setActiveTrip(active || null);
      }

      // Platform-wide available ride requests (RideRequest documents)
      if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
        const reqData: any[] = await reqRes.value.json();
        setAvailableRequests(Array.isArray(reqData) ? reqData : []);
      }
    } catch (err) {
      console.error('Driver data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { if (isFocused && userId) fetchData(); }, [isFocused, userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && userId) {
        fetchData();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [userId, fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  // ── WebSocket Listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAvailable) return;

    const socketUrl = API_URL.replace('/api', '');
    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Driver connected to WebSocket:', socket.id);
      if (userId) {
        socket.emit('join_driver', { driverId: userId });
        socket.emit('join_partner', { partnerId: userId });
      }
      socket.emit('join_drivers', {}); // Join general drivers room
    });

    socket.on('new_booking_request', async (data) => {
      console.log('New ride request via WS:', data);
      
      // Add the new request directly to the feed (handles simultaneous requests)
      setAvailableRequests(prev => {
        if (prev.some(r => r._id === data._id)) return prev; // deduplicate
        return [data, ...prev];
      });
      
      // Only show alert if the driver isn't already looking at a modal
      if (!isModalVisibleRef.current) {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          });
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sounds/notification.wav')
          );
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
          await sound.playAsync();
        } catch (e) {
          console.log('Audio play error:', e);
        }

        setAlertConfig({
            title: 'New Ride Request! 🚕 ',
            message: `Pickup: ${data.fromAddress || '—'}\nDrop-off: ${data.toAddress || '—'}\n\nA new ride request is available in your area. Open your feed to claim it!`,
            type: 'info',
          buttons: [{ text: 'View Details', onPress: () => { 
            setShowAlert(false); 
            setTimeout(() => handleClaim(data), 350); 
          } }]
        });
        setShowAlert(true);
      }
    });

    socket.on('booking_updated', (data) => {
      console.log('Booking updated via WS:', data);
      
      if (data.isOffer && data.offerStatus === 'Pending Partner' && data.driverId === userId) {
        // Client sent a counter-offer — alert the driver
        try {
          Audio.Sound.createAsync(require('../../assets/sounds/notification.wav'))
            .then(({ sound }) => sound.playAsync());
        } catch(e){}
        Toast.show({ type: 'info', text1: 'Counter Offer Received! 🚕', text2: `Client countered your bid!` });
        
        if (!isModalVisibleRef.current) {
           handleRespondToOfferRef.current?.(data);
        }
      } else if (
        (data.isOffer && data.offerStatus === 'Accepted' && data.driverId === userId) ||
        (data.driverId === userId && data.status === 'Pending Escrow')
      ) {
        // Client accepted the driver's bid — switch to My Trips and refresh
        try {
          Audio.Sound.createAsync(require('../../assets/sounds/notification.wav'))
            .then(({ sound }) => sound.playAsync());
        } catch(e){}
        Toast.show({ type: 'success', text1: '🎉 Bid Accepted!', text2: `Client accepted your fare! Check My Trips.` });
        setActiveTab('trips');
        fetchData();
      } else {
        fetchData();
      }
    });

    socket.on('booking_claimed', (data) => {
      console.log('Booking claimed via WS:', data);
      setAvailableRequests(prev => prev.filter(r => r._id !== data.bookingId));
    });

    socket.on('booking_cancelled', (data) => {
      console.log('Booking cancelled via WS:', data);
      setAvailableRequests(prev => prev.filter(r => r._id !== data.bookingId));
      fetchData();
    });

    return () => {
      socket.off('new_booking_request');
      socket.off('booking_updated');
      socket.off('booking_claimed');
      socket.off('booking_cancelled');
      socket.disconnect();
    };
  }, [isAvailable, fetchData, userId]);

  // ── Toggle availability ───────────────────────────────────────────────────
  const toggleAvailability = async (val: boolean) => {
    setIsAvailable(val);
    await AsyncStorage.setItem('driverAvailable', val ? 'true' : 'false');
  };

  // ── Claim a ride (with bid-lock guard) ───────────────────────────────────
  const handleClaim = (booking: any) => {
    if (!isAvailable) {
      Toast.show({ type: 'error', text1: 'You are Offline', text2: 'Switch to Available to accept rides.' });
      return;
    }

    // Bid lock: prevent bidding if driver already has an active trip
    const hasActiveTrip = myBookings.some(b =>
      ['Trip Started', 'Trip Start Pending', 'Accepted', 'Paid', 'Paid - Escrow Secured', 'Confirmed'].includes(b.status || '')
    );
    if (hasActiveTrip) {
      Toast.show({ type: 'error', text1: 'Active Trip In Progress', text2: 'Finish your current trip before claiming a new ride.' });
      return;
    }
    
    // A ride request allows bidding; a direct booking is just accepted.
    // In our new flow, client submitted RideRequests do not have offeredPrice, so we check existence of fromAddress.
    const isRideReq = !!booking.fromAddress && booking.status === 'pending';
    
    setBidAmount(''); // Clear previous bid
    
    setAlertConfig({
      title: isRideReq ? 'Submit a Bid' : 'Claim This Ride?',
      message: isRideReq 
        ? `${booking.itemName || 'This ride'}\nPickup: ${booking.deliveryAddress || booking.fromAddress || '-'}\n\nEnter your proposed fare for this trip (₦):`
        : `${booking.itemName || 'This ride'}\nPickup: ${booking.deliveryAddress || booking.fromAddress || '-'}\n\nAccept and begin this trip?`,
      type: 'warning',
      showInput: isRideReq,
      keyboardType: 'numeric',
      inputPlaceholder: 'e.g. 5000',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setShowAlert(false) },
        {
          text: isRideReq ? 'Submit Bid 🚕' : 'Claim Ride 🚕',
          onPress: async (inputValue?: string) => {
            if (isRideReq && (!inputValue || isNaN(Number(inputValue)))) {
              Toast.show({ type: 'error', text1: 'Fare Required', text2: 'Please enter a valid numeric fare.' });
              return;
            }
            
            setShowAlert(false);
            setClaimingId(booking._id);
            try {
              const token = await AsyncStorage.getItem('authToken');
              const endpoint = isRideReq 
                ? `${API_URL}/ride-requests/${booking._id}/driver-offers`
                : `${API_URL}/bookings/${booking._id}/claim`;

              const payload = isRideReq 
                ? JSON.stringify({ fare: Number(inputValue) }) 
                : JSON.stringify({ driverId: userId });

              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: payload,
              });
              if (res.ok) {
                Toast.show({ type: 'success', text1: isRideReq ? 'Bid Submitted!' : '✅ Ride Claimed!', text2: isRideReq ? 'Waiting for client to accept your bid.' : 'Head to the pickup location. Safe journey!' });
                fetchData();
              } else {
                const err = await res.json().catch(() => ({}));
                Toast.show({ type: 'error', text1: 'Action Failed', text2: err.message || 'Could not complete the action.' });
              }
            } catch {
              Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please check your connection.' });
            } finally {
              setClaimingId(null);
            }
          }
        }
      ]
    });
    setShowAlert(true);
  };

  // ── Start trip ────────────────────────────────────────────────────────────
  const handleStartTrip = async (bookingId: string) => {
    setIsUpdatingTripId(bookingId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/bookings/${bookingId}/start-trip`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: '🚗 Trip Started!', text2: 'Drive safe. Head to the pickup location.' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        Toast.show({ type: 'error', text1: 'Could not start trip', text2: err.message || 'Please try again.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
    } finally {
      setIsUpdatingTripId(null);
    }
  };

  // ── End trip ──────────────────────────────────────────────────────────────
  const handleEndTrip = async (bookingId: string) => {
    setIsUpdatingTripId(bookingId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/bookings/${bookingId}/end-trip`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        Toast.show({ type: 'success', text1: '✅ Trip Complete!', text2: 'Great work! Your earnings are being processed.' });
        setActiveTrip(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        Toast.show({ type: 'error', text1: 'Could not end trip', text2: err.message || 'Please try again.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
    } finally {
      setIsUpdatingTripId(null);
    }
  };

  const submitOfferResponse = async (bookingId: string, status: string, newPrice?: string) => {
    setShowAlert(false);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const payload: any = { isOffer: true, offerStatus: status };
      if (status === 'Accepted' && newPrice) payload.totalPrice = newPrice;
      if (status === 'Pending Client' && newPrice) payload.counterPrice = newPrice;
      
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify(payload)
      });
      if (res.ok) {
         Toast.show({ type: 'success', text1: 'Success', text2: 'Response sent to client.' });
         fetchData();
      } else {
         Toast.show({ type: 'error', text1: 'Error', text2: 'Could not send response.' });
      }
    } catch {
       Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
    }
  };

  useEffect(() => {
    handleRespondToOfferRef.current = handleRespondToOffer;
  });

  const handleRespondToOffer = (booking: any) => {
    setBidAmount('');
    setAlertConfig({
      title: 'Counter Offer Received',
      message: `Client countered with ${formatPrice(booking.totalPrice)}.\nAccept this price or propose a new one (₦):`,
      type: 'info',
      showInput: true,
      keyboardType: 'numeric',
      inputPlaceholder: 'e.g. 6000',
      buttons: [
        { text: 'Decline', style: 'cancel', onPress: () => submitOfferResponse(booking._id, 'Rejected') },
        {
          text: 'Accept 🤝',
          onPress: () => submitOfferResponse(booking._id, 'Accepted', booking.totalPrice)
        },
        {
          text: 'Counter 🚕',
          onPress: (inputValue?: string) => {
            if (!inputValue || isNaN(Number(inputValue))) {
               Toast.show({ type: 'error', text1: 'Fare Required', text2: 'Please enter a valid numeric fare.' });
               return;
            }
            submitOfferResponse(booking._id, 'Pending Client', inputValue);
          }
        }
      ]
    });
    setShowAlert(true);
  };

  const [isUpdatingTripId, setIsUpdatingTripId] = useState<string | null>(null);
  const monthly  = monthlyEarnings(myBookings);
  const allTime  = allTimeEarnings(myBookings);
  const pendingOffers = myBookings.filter(b => b.isOffer && b.offerStatus === 'Pending Partner' && b.driverId === userId);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to securely sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          Toast.show({ type: 'success', text1: 'Logged out successfully' });
          router.replace('/auth/login' as any);
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.loadingText}>Loading driver console...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── NAVY HEADER ── */}
      <View style={styles.header}>
        <View style={styles.orb1} /><View style={styles.orb2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Driver Console</Text>
          <Text style={styles.headerSub}>Welcome back, {driverName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchData(); }}>
            <Ionicons name="refresh-outline" size={22} color="#FFB81C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => router.push('/profile')}>
            <Ionicons name="person-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#FF5A5F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── AVAILABILITY TOGGLE ── */}
      <View style={styles.availabilityBar}>
        <View style={styles.availRow}>
          <View style={[styles.availDot, { backgroundColor: isAvailable ? '#38A169' : '#E53E3E' }]} />
          <Text style={styles.availText}>{isAvailable ? '🟢 Available for Rides' : '🔴 Offline'}</Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={toggleAvailability}
          trackColor={{ false: '#FEB2B2', true: '#C6F6D5' }}
          thumbColor={isAvailable ? '#38A169' : '#E53E3E'}
        />
      </View>

      {/* ── TABS ── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dispatches' && styles.activeTabButton]}
          onPress={() => setActiveTab('dispatches')}
        >
          <Text style={[styles.tabText, activeTab === 'dispatches' && styles.activeTabText]}>
            Dispatches {availableRequests.length > 0 ? `(${availableRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'trips' && styles.activeTabButton]}
          onPress={() => setActiveTab('trips')}
        >
          <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>
            Active Trips
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000080" />}
      >

        {/* ── EARNINGS PANEL ── */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>💰 Your Earnings</Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningBox}>
              <Text style={styles.earningAmount}>
                {monthly > 999999
                  ? `₦${(monthly / 1000000).toFixed(1)}M`
                  : `₦${monthly.toLocaleString()}`}
              </Text>
              <Text style={styles.earningLabel}>This Month</Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningBox}>
              <Text style={styles.earningAmount}>
                {allTime > 999999
                  ? `₦${(allTime / 1000000).toFixed(1)}M`
                  : `₦${allTime.toLocaleString()}`}
              </Text>
              <Text style={styles.earningLabel}>All Time</Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningBox}>
              <Text style={styles.earningAmount}>
                {myBookings.filter(b => COMPLETED_STATUSES.includes(b.status || '')).length}
              </Text>
              <Text style={styles.earningLabel}>Trips</Text>
            </View>
          </View>
        </View>
        {/* ── TAB CONTENT ── */}
        {activeTab === 'trips' ? (
          <>
            {/* ── MY TRIPS TAB ── */}
            {myBookings.filter(b => {
              if (b.isOffer && (b.offerStatus === 'Pending Partner' || b.offerStatus === 'Pending Client')) return false;
              return ACTIVE_STATUSES.includes(b.status || '') || COMPLETED_STATUSES.includes(b.status || '');
            }).length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="car-outline" size={40} color="#CBD5E0" />
                <Text style={styles.emptyCardText}>No active trips yet</Text>
                <Text style={styles.emptyCardSub}>Claim a ride from the Dispatches tab</Text>
              </View>
            ) : (
              myBookings
                .filter(b => {
                  if (b.isOffer && (b.offerStatus === 'Pending Partner' || b.offerStatus === 'Pending Client')) return false;
                  return ACTIVE_STATUSES.includes(b.status || '') || COMPLETED_STATUSES.includes(b.status || '');
                })
                .map(booking => {
                  const isTripActive = booking.status === 'Trip Started';
                  const isTripPendingStart = TRIP_PENDING_START.includes(booking.status || '');
                  const isCompleted = COMPLETED_STATUSES.includes(booking.status || '');
                  const pickup = booking.fromAddress || booking.deliveryAddress || '—';
                  const dropoff = booking.toAddress || booking.dropoffAddress || '—';
                  return (
                    <View key={booking._id} style={styles.activeTripCard}>
                      {/* Status Badge */}
                      <View style={[styles.activeBadge, isTripActive && { backgroundColor: '#C6F6D5' }, isCompleted && { backgroundColor: '#E2E8F0' }]}>
                        <Text style={[styles.activeBadgeText, isTripActive && { color: '#22543D' }, isCompleted && { color: '#4A5568' }]}>
                          {booking.status?.toUpperCase() || 'PENDING'}
                        </Text>
                      </View>
                      <Text style={styles.tripItemName}>{booking.itemName || 'Ride'}</Text>

                      <View style={styles.tripRow}>
                        <Ionicons name="person-outline" size={16} color="#718096" />
                        <Text style={styles.tripDetail}>Client: {booking.clientName || '—'}</Text>
                      </View>
                      <View style={styles.tripRow}>
                        <Ionicons name="location" size={16} color="#000080" />
                        <Text style={styles.tripDetail} numberOfLines={2}>Pickup: {pickup}</Text>
                      </View>
                      <View style={styles.tripRow}>
                        <Ionicons name="flag" size={16} color="#38A169" />
                        <Text style={styles.tripDetail} numberOfLines={2}>Drop-off: {dropoff}</Text>
                      </View>
                      <View style={styles.tripRow}>
                        <Ionicons name="cash-outline" size={16} color="#D97706" />
                        <Text style={styles.tripDetail}>Fare: {formatPrice(booking.totalPrice)}</Text>
                      </View>

                      {/* Action Buttons */}
                      {!isCompleted && (
                        <View style={styles.tripActions}>
                          {/* Navigate */}
                          <TouchableOpacity
                            style={styles.navigateBtn}
                            onPress={() => {
                              const dest = isTripActive ? dropoff : pickup;
                              const url = `https://maps.google.com/?q=${encodeURIComponent(dest)}`;
                              Linking.openURL(url);
                            }}
                          >
                            <Ionicons name="navigate-outline" size={16} color="#000080" />
                            <Text style={styles.navigateBtnText}>{isTripActive ? 'Navigate to Drop-off' : 'Navigate to Pickup'}</Text>
                          </TouchableOpacity>

                          {/* Start Trip */}
                          {isTripPendingStart && (
                            <TouchableOpacity
                              style={styles.startTripBtn}
                              onPress={() => handleStartTrip(booking._id)}
                              disabled={isUpdatingTripId === booking._id}
                            >
                              {isUpdatingTripId === booking._id
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={styles.startTripBtnText}>🚀 Start Trip</Text>
                              }
                            </TouchableOpacity>
                          )}

                          {/* End Trip */}
                          {isTripActive && (
                            <TouchableOpacity
                              style={styles.endTripBtn}
                              onPress={() => handleEndTrip(booking._id)}
                              disabled={isUpdatingTripId === booking._id}
                            >
                              {isUpdatingTripId === booking._id
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <Text style={styles.endTripBtnText}>🏁 End Trip</Text>
                              }
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
            )}
          </>
        ) : (
          <>
            {/* ── PENDING OFFERS ── */}
            {pendingOffers.length > 0 && (
               <>
                 <Text style={styles.sectionTitle}>Pending Counter Offers ({pendingOffers.length})</Text>
                 {pendingOffers.map(req => (
                    <View key={req._id} style={[styles.requestCard, { borderColor: '#D6BCFA', borderWidth: 1 }]}>
                      <View style={styles.requestTop}>
                        <Text style={styles.requestName} numberOfLines={2}>
                          {req.itemName || 'Ride Request'}
                        </Text>
                        <Text style={styles.requestFare}>{formatPrice(req.totalPrice)}</Text>
                      </View>
                      <View style={styles.requestRow}>
                        <Ionicons name="location-outline" size={14} color="#718096" />
                        <Text style={styles.requestDetail} numberOfLines={1}>
                          Pickup: {req.fromAddress || (req.deliveryAddress?.includes('From:') ? req.deliveryAddress.split('|')[0].replace('From:', '').trim() : req.deliveryAddress) || '—'}
                        </Text>
                      </View>
                      <View style={styles.requestRow}>
                        <Ionicons name="flag-outline" size={14} color="#38A169" />
                        <Text style={styles.requestDetail} numberOfLines={1}>
                          Drop-off: {req.toAddress || req.dropoffAddress || (req.deliveryAddress?.includes('To:') ? req.deliveryAddress.split('|')[1]?.replace('To:', '')?.trim() : '—') || '—'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.claimBtn}
                        onPress={() => handleRespondToOffer(req)}
                      >
                        <Text style={styles.claimBtnText}>Respond to Offer</Text>
                      </TouchableOpacity>
                    </View>
                 ))}
               </>
            )}

            {/* ── AVAILABLE REQUESTS ── */}
            <Text style={styles.sectionTitle}>
              Available Requests ({availableRequests.length})
            </Text>
            {availableRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="hourglass-outline" size={40} color="#CBD5E0" />
                <Text style={styles.emptyCardText}>No pickup requests right now</Text>
                <Text style={styles.emptyCardSub}>Pull down to refresh</Text>
              </View>
            ) : (
              availableRequests.map(req => (
                <View key={req._id} style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <Text style={styles.requestName} numberOfLines={2}>
                      {req.itemName || 'Ride Request'}
                    </Text>
                    <Text style={styles.requestFare}>
                      {(!!req.fromAddress && req.status === 'pending') ? 'Awaiting Bid' : formatPrice(req.totalPrice)}
                    </Text>
                  </View>

                  <View style={styles.requestRow}>
                    <Ionicons name="location-outline" size={14} color="#718096" />
                    <Text style={styles.requestDetail} numberOfLines={1}>
                      Pickup: {req.fromAddress || (req.deliveryAddress?.includes('From:') ? req.deliveryAddress.split('|')[0].replace('From:', '').trim() : req.deliveryAddress) || '—'}
                    </Text>
                  </View>

                  <View style={styles.requestRow}>
                    <Ionicons name="flag-outline" size={14} color="#38A169" />
                    <Text style={styles.requestDetail} numberOfLines={1}>
                      Drop-off: {req.toAddress || req.dropoffAddress || (req.deliveryAddress?.includes('To:') ? req.deliveryAddress.split('|')[1]?.replace('To:', '')?.trim() : '—') || '—'}
                    </Text>
                  </View>

                  <View style={styles.requestRow}>
                    <Ionicons name="time-outline" size={14} color="#718096" />
                    <Text style={styles.requestDetail}>
                      {formatDateTime(req.checkIn)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.claimBtn, !isAvailable && styles.claimBtnDisabled]}
                    onPress={() => handleClaim(req)}
                    disabled={claimingId === req._id || !isAvailable}
                  >
                    {claimingId === req._id
                      ? <ActivityIndicator size="small" color="#000080" />
                      : <Text style={styles.claimBtnText}>
                          {isAvailable ? 'Claim This Ride 🚗' : 'Go Online to Claim'}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* ── WEB FALLBACK ── */}
        <TouchableOpacity
          style={styles.webLink}
          onPress={() => Linking.openURL('https://airgo.ng/driver')}
        >
          <Ionicons name="open-outline" size={16} color="#000080" />
          <Text style={styles.webLinkText}>Open Full Driver Panel in Browser</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
      <CustomAlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        showInput={alertConfig.showInput}
        inputValue={bidAmount}
        onInputChange={setBidAmount}
        inputPlaceholder={alertConfig.inputPlaceholder}
        keyboardType={alertConfig.keyboardType}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#718096', fontSize: 14 },

  header: {
    backgroundColor: '#000080', paddingTop: 60, paddingBottom: 24,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', position: 'relative',
  },
  orb1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,184,28,0.08)' },
  orb2: { position: 'absolute', bottom: -30, left: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)' },
  backBtn:      { padding: 8, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle:  { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  refreshBtn:   { padding: 8 },

  availabilityBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 14,
  },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  availText: { fontSize: 15, fontWeight: '700', color: '#1A202C' },

  tabsContainer: {
    flexDirection: 'row', backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    flex: 1, paddingVertical: 16, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  activeTabButton: { borderBottomColor: '#FFB81C' },
  tabText: { fontSize: 15, fontWeight: '700', color: '#718096' },
  activeTabText: { color: '#000080' },

  content: { padding: 20, paddingTop: 24 },

  // Earnings
  earningsCard: {
    backgroundColor: '#000080', borderRadius: 20, padding: 20, marginBottom: 24,
    overflow: 'hidden',
  },
  earningsTitle:  { color: '#FFB81C', fontSize: 14, fontWeight: '800', marginBottom: 16, letterSpacing: 0.3 },
  earningsRow:    { flexDirection: 'row' },
  earningBox:     { flex: 1, alignItems: 'center' },
  earningAmount:  { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  earningLabel:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  earningDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 12 },

  // Active Trip
  activeTripCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24,
    borderLeftWidth: 4, borderLeftColor: '#000080',
    shadowColor: '#000080', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  activeBadge:     { backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
  activeBadgeText: { color: '#000080', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tripItemName:    { fontSize: 17, fontWeight: '800', color: '#1A202C', marginBottom: 12 },
  tripRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tripDetail:      { fontSize: 14, color: '#4A5568', fontWeight: '500', flex: 1 },
  completeBtn: {
    marginTop: 16, backgroundColor: '#FFB81C', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  completeBtnText: { color: '#000080', fontSize: 15, fontWeight: '900' },

  // Trip action buttons
  tripActions: { marginTop: 16, gap: 10 },
  navigateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#000080', borderRadius: 14,
    paddingVertical: 12, backgroundColor: '#EBF4FF',
  },
  navigateBtnText: { color: '#000080', fontSize: 14, fontWeight: '700' },
  startTripBtn: {
    backgroundColor: '#000080', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  startTripBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  endTripBtn: {
    backgroundColor: '#E53E3E', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  endTripBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  // Empty card
  emptyCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 32, alignItems: 'center',
    marginBottom: 24, gap: 10,
  },
  emptyCardText: { color: '#A0AEC0', fontSize: 15, fontWeight: '600' },
  emptyCardSub:  { color: '#CBD5E0', fontSize: 13 },

  // Request cards
  requestCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  requestTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  requestName:  { fontSize: 15, fontWeight: '800', color: '#1A202C', flex: 1, marginRight: 10 },
  requestFare:  { fontSize: 16, fontWeight: '900', color: '#000080' },
  requestRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  requestDetail:{ fontSize: 13, color: '#718096', fontWeight: '500', flex: 1 },
  claimBtn: {
    marginTop: 14, backgroundColor: '#FFB81C', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  claimBtnDisabled: { backgroundColor: '#E2E8F0' },
  claimBtnText: { color: '#000080', fontSize: 14, fontWeight: '900' },

  // Web link
  webLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, marginTop: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, backgroundColor: '#FFF',
  },
  webLinkText: { color: '#000080', fontSize: 14, fontWeight: '700' },
});

