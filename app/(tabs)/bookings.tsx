import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';

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
  if (tab === 'Cancelled') return s.includes('cancelled') || s.includes('rejected');
  return true;
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function BookingsScreen() {
  const router   = useRouter();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab]   = useState<TabKey>('All');
  const [bookings, setBookings]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchBookings = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }
      const res  = await fetch(`${API_URL}/bookings/user/${userId}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch Bookings Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (isFocused) { setLoading(true); fetchBookings(); } }, [isFocused]);
  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let active = 0, totalSpent = 0;
    bookings.forEach(b => {
      const s = (b.status || '').toLowerCase();
      if (s.includes('pending') || s.includes('escrow') || s.includes('paid') || s.includes('started')) active++;
      const price = typeof b.totalPrice === 'string'
        ? parseInt(b.totalPrice.replace(/\D/g, ''), 10)
        : Number(b.totalPrice || 0);
      if (!isNaN(price)) totalSpent += price;
    });
    return { total: bookings.length, active, totalSpent };
  }, [bookings]);

  const filtered = useMemo(
    () => bookings.filter(b => matchesTab(b, activeTab)),
    [bookings, activeTab]
  );

  // ── Cancel booking ───────────────────────────────────────────────────────
  const handleCancel = (booking: any) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel booking for "${booking.itemName}"? This will release your escrow hold.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel It',
          style: 'destructive',
          onPress: async () => {
            setCancelling(booking._id);
            try {
              const res = await fetch(`${API_URL}/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Cancelled' }),
              });
              if (res.ok) {
                setBookings(prev =>
                  prev.map(b => b._id === booking._id ? { ...b, status: 'Cancelled' } : b)
                );
                Alert.alert('Cancelled', 'Your booking has been cancelled and escrow released.');
              } else {
                Alert.alert('Error', 'Could not cancel. Please try again.');
              }
            } catch {
              Alert.alert('Network Error', 'Please check your connection and try again.');
            } finally {
              setCancelling(null);
            }
          }
        }
      ]
    );
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
          filtered.map(booking => {
            const statusColor = getStatusColor(booking.status);
            const statusBg    = getStatusBg(booking.status);
            const canCancel   = (booking.status || '').toLowerCase().includes('pending') && cancelling !== booking._id;

            return (
              <View key={booking._id} style={styles.card}>

                {/* Card top row */}
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {booking.status || 'Confirmed'}
                    </Text>
                  </View>
                  <Text style={styles.refText}>#{(booking._id || '').slice(-6).toUpperCase()}</Text>
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

                {/* Cancel button */}
                {canCancel && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking)}>
                    {cancelling === booking._id
                      ? <ActivityIndicator size="small" color="#E53E3E" />
                      : <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
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

  cancelBtn: {
    marginTop: 14, borderWidth: 1.5, borderColor: '#FEB2B2', borderRadius: 12,
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
});
