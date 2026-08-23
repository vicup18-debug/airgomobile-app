import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useIsFocused } from '@react-navigation/native';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../constants/config';
import { Audio } from 'expo-av';
import DriverChatModal from '../../components/ui/DriverChatModal';

// ── STATUS HELPERS ─────────────────────────────────────────────────────────
function getStatusColor(status: string): string {
  if (!status) return '#718096';
  const s = status.toLowerCase();
  if (s.includes('escrow') || s.includes('paid') || s.includes('pending')) return '#D97706';
  if (s.includes('completed') || s.includes('disbursed'))                  return '#38A169';
  if (s.includes('cancelled') || s.includes('rejected'))                   return '#E53E3E';
  if (s.includes('started'))                                                return '#3182CE';
  if (s.includes('accepted'))                                               return '#6B46C1';
  return '#718096';
}

function getStatusBg(status: string): string {
  const color = getStatusColor(status);
  return color + '18'; // 10% opacity tint
}

function formatPrice(raw: any): string {
  if (!raw) return '₦0';
  const num = typeof raw === 'string' ? parseInt(raw.replace(/\D/g, ''), 10) : Number(raw);
  return isNaN(num) ? '₦0' : `₦${num.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

// ── FILTER TABS ────────────────────────────────────────────────────────────
const TABS = ['All', 'Active', 'Completed', 'Cancelled'] as const;
type TabKey = typeof TABS[number];

function matchesTab(booking: any, tab: TabKey): boolean {
  if (tab === 'All') return true;
  const s = (booking.status || '').toLowerCase();
  if (tab === 'Active')    return s.includes('pending') || s.includes('escrow') || s.includes('paid') || s.includes('started') || s.includes('accepted');
  if (tab === 'Completed') return s.includes('completed') || s.includes('disbursed');
  if (tab === 'Cancelled') return s.includes('cancelled') || s.includes('rejected') || s.includes('archived');
  return true;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const router   = useRouter();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab]   = useState<TabKey>('All');
  const [bookings, setBookings]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  
  // Chat Modal State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatBookingId, setChatBookingId] = useState('');
  const [chatBookingName, setChatBookingName] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');

  const isChatOpenRef = useRef(false);
  const chatBookingIdRef = useRef('');
  const currentUserIdRef = useRef('');

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    chatBookingIdRef.current = chatBookingId;
    currentUserIdRef.current = currentUserId;
  }, [isChatOpen, chatBookingId, currentUserId]);
  
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any>(null);
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // ── Pagination ───────────────────────────────────────────────────────────
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName');
      
      if (userId) {
        setCurrentUserId(userId);
        currentUserIdRef.current = userId;
      }
      if (userName) setCurrentUserName(userName);
      
      if (!userId || !token) { setLoading(false); return; }
      const res  = await fetch(`${API_URL}/bookings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch Bookings Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (isFocused) { setLoading(true); fetchBookings(); } }, [isFocused]);
  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  useEffect(() => {
    if (isFocused) {
       const SOCKET_URL = API_URL.replace('/api', '');
       const socketInstance = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
       setSocket(socketInstance);
       socketInstance.on('booking_updated', (updatedBooking: any) => {
          setBookings(prev => prev.map(b => b._id === updatedBooking._id ? updatedBooking : b));
          if (updatedBooking.offerStatus === 'Pending Client') {
             Toast.show({ type: 'info', text1: 'Counter Offer', text2: 'The driver countered your bid.' });
          }
       });
       socketInstance.on('booking_cancelled', (data: any) => {
          console.log('Booking cancelled via socket on bookings tab:', data);
          setBookings(prev => prev.filter(b => b._id !== data.bookingId));
          Toast.show({ type: 'error', text1: 'Ride Cancelled', text2: 'A booking was cancelled by the driver.' });
          fetchBookings();
       });
       socketInstance.on('new_driver_bid', (data: any) => {
          setBookings(prev => prev.map(b => b._id === data.bookingId ? { ...b, driverOffers: data.driverOffers } : b));
          Toast.show({ type: 'info', text1: 'New Bid Received', text2: 'A driver has placed a new bid on your ride request.' });
       });
       socketInstance.on('incoming_chat_notification', async (data: any) => {
          console.log('Incoming chat notification on bookings tab:', data);
          if (data.senderId === currentUserIdRef.current || data.senderRole === 'client') return;

          // Play sound
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
            console.log('Chat sound error:', e);
          }

          // Show Toast notification popup
          if (!isChatOpenRef.current || chatBookingIdRef.current !== data.bookingId) {
            Toast.show({
              type: 'info',
              text1: `💬 Message from ${data.senderName || 'Driver'}`,
              text2: data.text,
              visibilityTime: 7000,
              onPress: () => {
                setChatBookingId(data.bookingId);
                setChatBookingName(data.bookingName || 'Ride Chat');
                setIsChatOpen(true);
              }
            });
          }
       });
       socketInstance.on('connect', () => {
          if (currentUserIdRef.current) {
             socketInstance.emit('join_user', { userId: currentUserIdRef.current });
          }
          setBookings(currentBookings => {
             currentBookings.forEach(b => socketInstance.emit('join_booking', { bookingId: b._id }));
             return currentBookings;
          });
       });

       return () => {
         socketInstance.off('booking_updated');
         socketInstance.off('new_driver_bid');
         socketInstance.off('incoming_chat_notification');
         socketInstance.disconnect();
       };
    }
  }, [isFocused]);

  useEffect(() => {
    if (socket && bookings.length > 0) {
      if (currentUserId) {
        socket.emit('join_user', { userId: currentUserId });
      }
      bookings.forEach(b => {
        socket.emit('join_booking', { bookingId: b._id });
      });
    }
  }, [socket, bookings, currentUserId]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let active = 0, totalSpent = 0;
    const paidStatuses = [
      'paid',
      'paid - escrow secured',
      'escrow active',
      'approved for disbursement',
      'paid out',
      'completed',
      'completed & disbursed',
      'trip started',
      'trip start pending',
      'trip end pending',
      'confirmed'
    ];
    const activeStatuses = [
      'paid - escrow secured',
      'paid',
      'escrow active',
      'trip started',
      'trip start pending',
      'trip end pending',
      'accepted',
      'approved for disbursement'
    ];

    bookings.forEach(b => {
      const s = (b.status || '').toLowerCase().trim();
      if (activeStatuses.includes(s)) active++;
      if (paidStatuses.includes(s)) {
        const price = typeof b.totalPrice === 'string'
          ? parseInt(b.totalPrice.replace(/\D/g, ''), 10)
          : Number(b.totalPrice || 0);
        if (!isNaN(price) && price > 0) totalSpent += price;
      }
    });

    const validBookings = bookings.filter(b => (b.status || '').toLowerCase() !== 'archived');
    return { total: validBookings.length, active, totalSpent };
  }, [bookings]);

  const filtered = useMemo(
    () => bookings.filter(b => matchesTab(b, activeTab)),
    [bookings, activeTab]
  );

  // Reset to page 1 whenever the tab or bookings change
  useEffect(() => { setCurrentPage(1); }, [activeTab, bookings.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedBookings = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── Handle Counter Offer Actions ─────────────────────────────────────────
  const handleOfferAction = async (bookingId: string, action: 'Accept' | 'Decline') => {
    setRespondingOfferId(bookingId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const payload: any = {
        offerStatus: action === 'Accept' ? 'Accepted' : 'Rejected'
      };
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        Toast.show({ 
           type: 'success', 
           text1: action === 'Accept' ? 'Offer Accepted' : 'Offer Declined', 
           text2: action === 'Accept' ? 'Proceeding to checkout...' : 'The booking was cancelled.' 
        });
        if (action === 'Accept') {
           const b = bookings.find(x => x._id === bookingId);
           if (b) {
             router.push(`/taxi-escrow?bookingId=${b._id}&from=${encodeURIComponent(b.deliveryAddress || '')}&to=${encodeURIComponent(b.deliveryAddress || '')}&dateTime=${encodeURIComponent(b.checkIn || '')}`);
           }
        }
        fetchBookings();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to process offer.' });
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Network error occurred.' });
    } finally {
      setRespondingOfferId(null);
    }
  };

  // ── Cancel booking ───────────────────────────────────────────────────────
  const handleCancel = (booking: any) => {
    setBookingToCancel(booking);
    setCancelModalVisible(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelModalVisible(false);
    setCancelling(bookingToCancel._id);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/bookings/${bookingToCancel._id}`, {
        method: 'DELETE',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setBookings(prev =>
          prev.map(b => b._id === bookingToCancel._id ? { ...b, status: 'Cancelled' } : b)
        );
        Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Your booking has been cancelled and escrow released.' });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Could not cancel. Please try again.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please check your connection and try again.' });
    } finally {
      setCancelling(null);
      setBookingToCancel(null);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.loadingText}>Loading your itinerary...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── NAVY HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerOrb1} /><View style={styles.headerOrb2} />
        <Text style={styles.headerTitle}>My Itinerary</Text>
        <Text style={styles.headerSub}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''} total</Text>
      </View>

      {/* ── STATS BAR ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardMid]}>
          <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#000080', fontSize: 14 }]}>
            ₦{stats.totalSpent > 999999
              ? (stats.totalSpent / 1000000).toFixed(1) + 'M'
              : stats.totalSpent.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      {/* ── FILTER TABS ── */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── BOOKING LIST ── */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000080" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={70} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'All' ? 'No bookings yet.' : `No ${activeTab.toLowerCase()} bookings.`}
            </Text>
            {activeTab === 'All' && (
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.replace('/(tabs)' as any)}>
                <Text style={styles.exploreBtnText}>Explore Stays</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          paginatedBookings.map(booking => {
            const statusColor = getStatusColor(booking.status);
            const statusBg    = getStatusBg(booking.status);
            const canCancel   = (booking.status || '').toLowerCase().includes('pending') && cancelling !== booking._id;
            const inactiveStatuses = ['completed', 'completed & disbursed', 'archived', 'cancelled', 'paid out', 'refunded'];
            const isChatActive = !inactiveStatuses.includes((booking.status || '').toLowerCase().trim());

            return (
              <View key={booking._id} style={styles.card}>

                {/* Card top row */}
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg, flexShrink: 1, marginRight: 8 }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
                      {booking.status || 'Confirmed'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {isChatActive && (
                      <TouchableOpacity
                        style={styles.chatIconBtn}
                        onPress={() => {
                          setChatBookingId(booking._id);
                          setChatBookingName(booking.itemName || 'Chat with Driver');
                          setIsChatOpen(true);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="chatbubble-ellipses" size={16} color="#000080" />
                      </TouchableOpacity>
                    )}
                    <Text style={styles.refText}>#{(booking._id || '').slice(-6).toUpperCase()}</Text>
                  </View>
                </View>

                {/* Item name */}
                <Text style={styles.itemName} numberOfLines={2}>
                  {booking.itemName || 'Airgo Booking'}
                </Text>

                {/* Type pill */}
                <View style={styles.typePill}>
                  <Ionicons
                    name={booking.itemType === 'car' ? 'car-outline' : 'bed-outline'}
                    size={12} color="#718096"
                  />
                  <Text style={styles.typePillText}>
                    {booking.itemType === 'car' ? 'Taxi / Ride' : 'Hotel Stay'}
                  </Text>
                </View>

                {/* Dates + price */}
                <View style={styles.detailRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>
                      {booking.itemType === 'car' ? 'Pickup' : 'Check-In'}
                    </Text>
                    <Text style={styles.detailValue}>{formatDate(booking.checkIn)}</Text>
                  </View>
                  <View style={styles.dividerV} />
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Total Paid</Text>
                    <Text style={[styles.detailValue, { color: '#000080', fontWeight: '900' }]}>
                      {formatPrice(booking.totalPrice)}
                    </Text>
                  </View>
                </View>

                {/* Counter Offer UI */}
                {booking.isOffer && booking.offerStatus === 'Pending Client' && (
                  <View style={{ marginTop: 16, backgroundColor: '#EBF8FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BEE3F8' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2B6CB0', marginBottom: 8 }}>
                      Driver countered with <Text style={{ fontWeight: '900', fontSize: 16 }}>{formatPrice(booking.counterPrice || booking.totalPrice)}</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }} 
                        onPress={() => handleOfferAction(booking._id, 'Decline')}
                        disabled={respondingOfferId === booking._id}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#4A5568' }}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#000080', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }} 
                        onPress={() => handleOfferAction(booking._id, 'Accept')}
                        disabled={respondingOfferId === booking._id}
                      >
                        {respondingOfferId === booking._id 
                          ? <ActivityIndicator size="small" color="#FFF" /> 
                          : <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>Accept</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Pay Button for Accepted Bids */}
                {booking.status === 'Pending Escrow' && (!booking.isOffer || booking.offerStatus === 'Accepted') && (
                  <TouchableOpacity 
                    style={{ marginTop: 14, backgroundColor: '#000080', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                    onPress={() => router.push(`/taxi-escrow?bookingId=${booking._id}&from=${encodeURIComponent(booking.deliveryAddress || '')}&to=${encodeURIComponent(booking.deliveryAddress || '')}&dateTime=${encodeURIComponent(booking.checkIn || '')}`)}
                  >
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Complete Payment</Text>
                  </TouchableOpacity>
                )}

                {/* Chat with Driver Button */}
                {isChatActive && booking.itemType === 'car' && (
                  <TouchableOpacity 
                    style={styles.chatActionBtn}
                    onPress={() => {
                      setChatBookingId(booking._id);
                      setChatBookingName(booking.itemName || 'Chat with Driver');
                      setIsChatOpen(true);
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={16} color="#000080" style={{ marginRight: 6 }} />
                    <Text style={styles.chatActionBtnText}>Chat with Driver</Text>
                  </TouchableOpacity>
                )}

                {/* Cancel button */}
                {canCancel && (
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking)}>
                      {cancelling === booking._id
                        ? <ActivityIndicator size="small" color="#E53E3E" />
                        : <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        {/* ── PAGINATION CONTROLS ── */}
        {totalPages > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 8, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
                backgroundColor: currentPage === 1 ? '#F1F5F9' : '#000080',
              }}
            >
              <Text style={{ color: currentPage === 1 ? '#A0AEC0' : '#FFF', fontWeight: '700', fontSize: 14 }}>← Prev</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#4A5568' }}>
              {currentPage} / {totalPages}
            </Text>

            <TouchableOpacity
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
                backgroundColor: currentPage === totalPages ? '#F1F5F9' : '#000080',
              }}
            >
              <Text style={{ color: currentPage === totalPages ? '#A0AEC0' : '#FFF', fontWeight: '700', fontSize: 14 }}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── CANCEL MODAL ── */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel the booking for "{bookingToCancel?.itemName || 'this stay'}"? This will release your escrow hold.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setCancelModalVisible(false); setBookingToCancel(null); }}>
                <Text style={styles.modalBtnCancelText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmCancel}>
                <Text style={styles.modalBtnConfirmText}>Cancel It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── CHAT MODAL ── */}
      <DriverChatModal
        visible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        bookingId={chatBookingId}
        bookingName={chatBookingName}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </View>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', gap: 12 },
  loadingText: { color: '#718096', fontSize: 14, fontWeight: '500' },

  // Header
  header: {
    backgroundColor: '#000080', paddingTop: 60, paddingBottom: 30,
    paddingHorizontal: 24, overflow: 'hidden', position: 'relative',
  },
  headerOrb1: {
    position: 'absolute', top: -40, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,184,28,0.08)',
  },
  headerOrb2: {
    position: 'absolute', bottom: -20, left: -50, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },

  // Stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: -20,
    backgroundColor: '#FFF', borderRadius: 20, elevation: 8,
    shadowColor: '#000080', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, marginBottom: 16,
  },
  statCard:    { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statCardMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' },
  statValue:   { fontSize: 20, fontWeight: '900', color: '#1A202C', marginBottom: 2 },
  statLabel:   { fontSize: 11, color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Tabs
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  tabActive: { backgroundColor: '#000080', borderColor: '#000080' },
  tabText:       { fontSize: 13, fontWeight: '700', color: '#718096' },
  tabTextActive: { color: '#FFF' },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 4, flexGrow: 1 },

  // Card
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 12, fontWeight: '700' },
  refText:     { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
  chatIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  itemName: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 8, lineHeight: 22 },

  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 14,
  },
  typePillText: { fontSize: 11, color: '#718096', fontWeight: '600' },

  detailRow:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 },
  detailBox:  { flex: 1 },
  dividerV:   { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 12 },
  detailLabel: { fontSize: 11, color: '#A0AEC0', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4, letterSpacing: 0.4 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#1A202C' },

  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F6',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  chatActionBtnText: {
    color: '#000080',
    fontSize: 14,
    fontWeight: '800',
  },

  cancelBtn: {
    borderWidth: 1.5, borderColor: '#FEB2B2', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { color: '#E53E3E', fontSize: 14, fontWeight: '700' },

  // Empty state
  emptyState:  { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyTitle:  { fontSize: 17, color: '#718096', marginTop: 20, marginBottom: 28, fontWeight: '500', textAlign: 'center' },
  exploreBtn:  {
    backgroundColor: '#FFB81C', paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 16, shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  exploreBtnText: { color: '#000080', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A202C', marginBottom: 12 },
  modalText: { fontSize: 15, color: '#4A5568', lineHeight: 22, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#EDF2F7' },
  modalBtnCancelText: { color: '#4A5568', fontWeight: '700', fontSize: 14 },
  modalBtnConfirm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#E53E3E' },
  modalBtnConfirmText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
