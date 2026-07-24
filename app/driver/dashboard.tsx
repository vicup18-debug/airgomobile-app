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
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';
import CustomAlertModal from '../../components/ui/CustomAlertModal';
import { io } from 'socket.io-client';

// ── STATUS ACTIVE CHECK ────────────────────────────────────────────────────
const ACTIVE_STATUSES = ['Trip Started', 'Paid - Escrow Secured', 'Escrow Active', 'Accepted'];
const COMPLETED_STATUSES = ['Completed', 'Disbursed', 'Payment Disbursed'];

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
      if (!COMPLETED_STATUSES.some(cs => s.includes(cs))) return false;
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
    .filter(b => COMPLETED_STATUSES.some(cs => (b.status || '').includes(cs)))
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
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as any, buttons: [] as any[] });

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
      if (!id) return;

      const [myRes, reqRes] = await Promise.allSettled([
        fetch(`${API_URL}/bookings/user/${id}`),
        fetch(`${API_URL}/bookings/available-requests`),
      ]);

      // My bookings (trips I've claimed)
      if (myRes.status === 'fulfilled' && myRes.value.ok) {
        const data: any[] = await myRes.value.json();
        setMyBookings(Array.isArray(data) ? data : []);
        const active = data.find(b =>
          ACTIVE_STATUSES.some(s => (b.status || '').includes(s)) && b.driverId === id
        );
        setActiveTrip(active || null);
      }

      // Platform-wide available pickup requests
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
      }
      socket.emit('join_drivers', {}); // Join general drivers room
    });

    socket.on('new_booking_request', (data) => {
      console.log('New ride request via WS:', data);
      fetchData(); // Refresh the list of available requests
      setAlertConfig({
        title: 'New Ride Request! 🚕',
        message: 'A new ride request is available in your area. Open your feed to claim it!',
        type: 'info',
        buttons: [{ text: 'View Requests', onPress: () => { setShowAlert(false); fetchData(); } }]
      });
      setShowAlert(true);
    });

    return () => {
      socket.off('new_booking_request');
      socket.disconnect();
    };
  }, [isAvailable, fetchData]);

  // ── Toggle availability ───────────────────────────────────────────────────
  const toggleAvailability = async (val: boolean) => {
    setIsAvailable(val);
    await AsyncStorage.setItem('driverAvailable', val ? 'true' : 'false');
  };

  // ── Claim a ride ──────────────────────────────────────────────────────────
  const handleClaim = (booking: any) => {
    if (!isAvailable) {
      Toast.show({ type: 'error', text1: 'You are Offline', text2: 'Switch to Available to accept rides.' });
      return;
    }
    setAlertConfig({
      title: 'Claim This Ride?',
      message: `${booking.itemName || 'This ride'}\nPickup: ${booking.deliveryAddress || '-'}\n\nAccept and begin this trip?`,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setShowAlert(false) },
        {
          text: 'Claim Ride 🚕',
          onPress: async () => {
            setShowAlert(false);
            setClaimingId(booking._id);
            try {
              const res = await fetch(`${API_URL}/bookings/${booking._id}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId: userId }),
              });
              if (res.ok) {
                Toast.show({ type: 'success', text1: '✅ Ride Claimed!', text2: 'Head to the pickup location. Safe journey!' });
                fetchData();
              } else {
                const err = await res.json().catch(() => ({}));
                Toast.show({ type: 'error', text1: 'Claim Failed', text2: err.message || 'This ride may have already been claimed.' });
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

  // ── Complete a trip ───────────────────────────────────────────────────────
  const handleComplete = (booking: any) => {
    setAlertConfig({
      title: 'Complete Trip?',
      message: 'Confirm that you have delivered the passenger to their destination.',
      type: 'success',
      buttons: [
        { text: 'Not Yet', style: 'cancel', onPress: () => setShowAlert(false) },
        {
          text: 'Complete Trip ✓',
          onPress: async () => {
            setShowAlert(false);
            setCompletingId(booking._id);
            try {
              const res = await fetch(`${API_URL}/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' }),
              });
              if (res.ok) {
                Toast.show({ type: 'success', text1: 'Trip Complete!', text2: 'Great work! Your earnings are being processed.' });
                setActiveTrip(null);
                fetchData();
              } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Could not mark as complete. Please try again.' });
              }
            } catch {
              Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
            } finally {
              setCompletingId(null);
            }
          }
        }
      ]
    });
    setShowAlert(true);
  };

  const monthly  = monthlyEarnings(myBookings);
  const allTime  = allTimeEarnings(myBookings);

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
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchData(); }}>
          <Ionicons name="refresh-outline" size={22} color="#FFB81C" />
        </TouchableOpacity>
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
          </View>
        </View>

        {/* ── ACTIVE TRIP ── */}
        <Text style={styles.sectionTitle}>Active Trip</Text>
        {activeTrip ? (
          <View style={styles.activeTripCard}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>IN PROGRESS</Text>
            </View>
            <Text style={styles.tripItemName}>{activeTrip.itemName || 'Active Ride'}</Text>
            <View style={styles.tripRow}>
              <Ionicons name="location" size={16} color="#000080" />
              <Text style={styles.tripDetail}>From: {activeTrip.deliveryAddress || '—'}</Text>
            </View>
            {activeTrip.dropoffAddress && (
              <View style={styles.tripRow}>
                <Ionicons name="flag" size={16} color="#38A169" />
                <Text style={styles.tripDetail}>To: {activeTrip.dropoffAddress}</Text>
              </View>
            )}
            <View style={styles.tripRow}>
              <Ionicons name="person-outline" size={16} color="#718096" />
              <Text style={styles.tripDetail}>Client: {activeTrip.clientName || '—'}</Text>
            </View>
            <View style={styles.tripRow}>
              <Ionicons name="cash-outline" size={16} color="#D97706" />
              <Text style={styles.tripDetail}>Fare: {formatPrice(activeTrip.totalPrice)}</Text>
            </View>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => handleComplete(activeTrip)}
              disabled={!!completingId}
            >
              {completingId === activeTrip._id
                ? <ActivityIndicator color="#000080" />
                : <Text style={styles.completeBtnText}>✅ Complete Trip</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="car-outline" size={40} color="#CBD5E0" />
            <Text style={styles.emptyCardText}>No active trip</Text>
          </View>
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
                <Text style={styles.requestFare}>{formatPrice(req.totalPrice)}</Text>
              </View>

              <View style={styles.requestRow}>
                <Ionicons name="location-outline" size={14} color="#718096" />
                <Text style={styles.requestDetail} numberOfLines={1}>
                  Pickup: {req.deliveryAddress || '—'}
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
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  availText: { fontSize: 15, fontWeight: '700', color: '#1A202C' },

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
