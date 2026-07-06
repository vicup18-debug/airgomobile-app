/**
 * Affiliate Dashboard — Airgo Mobile
 * Referral link, commission stats, recent referrals, payout request.
 */
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Share, Clipboard
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  return `${local.slice(0, 3)}***@${domain}`;
}

function formatPrice(raw: any): string {
  if (!raw) return '₦0';
  const num = typeof raw === 'string' ? parseInt(raw.replace(/\D/g, ''), 10) : Number(raw);
  return isNaN(num) ? '₦0' : `₦${num.toLocaleString()}`;
}

export default function AffiliateDashboard() {
  const router    = useRouter();
  const isFocused = useIsFocused();

  const [userEmail, setUserEmail]     = useState('');
  const [userId, setUserId]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [stats, setStats]             = useState({ totalCommission: 0, totalReferrals: 0, monthlyCommission: 0 });
  const [referrals, setReferrals]     = useState<any[]>([]);
  const [copied, setCopied]           = useState(false);

  const referralLink = `https://airgo.ng/register?ref=${encodeURIComponent(userEmail)}`;

  useEffect(() => {
    const loadSession = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const id    = await AsyncStorage.getItem('userId');
      if (email) setUserEmail(email);
      if (id)    setUserId(id);
    };
    loadSession();
  }, []);

  const fetchData = async () => {
    try {
      const id = userId || await AsyncStorage.getItem('userId');
      if (!id) return;

      const res = await fetch(`${API_URL}/affiliates?userId=${id}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const refs  = Array.isArray(data.referrals) ? data.referrals : [];
        const now   = new Date();
        const monthlyComm = refs
          .filter((r: any) => {
            const d = new Date(r.createdAt || r.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })
          .reduce((s: number, r: any) => s + (Number(r.commission) || 0), 0);
        const totalComm = refs.reduce((s: number, r: any) => s + (Number(r.commission) || 0), 0);

        setStats({ totalCommission: totalComm, totalReferrals: refs.length, monthlyCommission: monthlyComm });
        setReferrals(refs);
      }
    } catch (err) {
      console.error('Affiliate fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (isFocused && userId) fetchData(); }, [isFocused, userId]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleCopy = () => {
    Clipboard.setString(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Your referral link has been copied to clipboard.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Airgo — Nigeria's premium escrow booking platform!\n\nSign up using my link and get started:\n${referralLink}`,
        title: 'Join Airgo via My Referral Link',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.loadingText}>Loading affiliate hub...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.orb1} /><View style={styles.orb2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Affiliate Hub 💰</Text>
          <Text style={styles.headerSub}>Earn 5% on every referral booking</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000080" />}
      >

        {/* ── REFERRAL LINK CARD ── */}
        <View style={styles.referralCard}>
          <Text style={styles.referralCardTitle}>Your Referral Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2}>{referralLink}</Text>
          </View>
          <View style={styles.linkActions}>
            <TouchableOpacity
              style={[styles.linkBtn, copied && styles.linkBtnCopied]}
              onPress={handleCopy}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? '#38A169' : '#000080'} />
              <Text style={[styles.linkBtnText, copied && { color: '#38A169' }]}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={16} color="#FFF" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.totalCommission > 999999
                ? `₦${(stats.totalCommission / 1000000).toFixed(1)}M`
                : `₦${stats.totalCommission.toLocaleString()}`}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMid]}>
            <Text style={[styles.statValue, { color: '#000080' }]}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#D97706', fontSize: 14 }]}>
              {stats.monthlyCommission > 0
                ? `₦${stats.monthlyCommission.toLocaleString()}`
                : '₦0'}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* ── HOW IT WORKS ── */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How It Works</Text>
          {[
            { icon: 'link-outline',   text: 'Share your unique referral link' },
            { icon: 'person-add-outline', text: 'Friend signs up & makes a booking' },
            { icon: 'cash-outline',   text: 'You earn 5% commission automatically' },
          ].map((item, i) => (
            <View key={i} style={styles.howRow}>
              <View style={styles.howIcon}>
                <Ionicons name={item.icon as any} size={18} color="#000080" />
              </View>
              <Text style={styles.howText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* ── RECENT REFERRALS ── */}
        <Text style={styles.sectionTitle}>Recent Referrals</Text>
        {referrals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={44} color="#CBD5E0" />
            <Text style={styles.emptyText}>No referrals yet</Text>
            <Text style={styles.emptySub}>Share your link to start earning</Text>
          </View>
        ) : (
          referrals.slice(0, 10).map((ref: any, i: number) => (
            <View key={i} style={styles.referralRow}>
              <View style={styles.referralAvatar}>
                <Text style={styles.referralAvatarText}>
                  {(ref.email || ref.referredEmail || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.referralInfo}>
                <Text style={styles.referralEmail}>
                  {maskEmail(ref.email || ref.referredEmail || '—')}
                </Text>
                <Text style={styles.referralDate}>
                  {new Date(ref.createdAt || ref.date || '').toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.referralRight}>
                {ref.bookingAmount && (
                  <Text style={styles.referralBooking}>{formatPrice(ref.bookingAmount)}</Text>
                )}
                <Text style={styles.referralCommission}>
                  +{formatPrice(ref.commission || (ref.bookingAmount ? ref.bookingAmount * 0.05 : 0))}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* ── PAYOUT REQUEST ── */}
        <TouchableOpacity
          style={styles.payoutBtn}
          onPress={() => Alert.alert('Payout Request', 'Payouts are processed on the 1st of every month. Your next payout will be automatically sent to your registered bank account.')}
        >
          <Ionicons name="wallet-outline" size={20} color="#000080" />
          <Text style={styles.payoutBtnText}>Request Payout</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  orb2: { position: 'absolute', bottom: -30, left: -50, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  backBtn:      { padding: 8, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle:  { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerSub:    { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  content: { padding: 20, paddingTop: 24 },

  // Referral link
  referralCard: {
    backgroundColor: '#000080', borderRadius: 20, padding: 20, marginBottom: 20,
  },
  referralCardTitle: { color: '#FFB81C', fontSize: 13, fontWeight: '800', marginBottom: 12, letterSpacing: 0.3 },
  linkBox: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  linkText: { color: '#FFF', fontSize: 13, fontWeight: '500', lineHeight: 20 },
  linkActions: { flexDirection: 'row', gap: 10 },
  linkBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 12,
  },
  linkBtnCopied: { backgroundColor: '#F0FFF4' },
  linkBtnText:   { color: '#000080', fontSize: 14, fontWeight: '700' },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#FFB81C', borderRadius: 12, paddingVertical: 12,
  },
  shareBtnText: { color: '#000080', fontSize: 14, fontWeight: '900' },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20,
    shadowColor: '#000080', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
  },
  statCard:    { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statCardMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' },
  statValue:   { fontSize: 18, fontWeight: '900', color: '#38A169', marginBottom: 4 },
  statLabel:   { fontSize: 11, color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  // How it works
  howCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  howTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginBottom: 14 },
  howRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  howIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center' },
  howText:  { fontSize: 14, color: '#4A5568', fontWeight: '500', flex: 1 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 12 },

  // Empty
  emptyCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 32, alignItems: 'center',
    marginBottom: 20, gap: 8,
  },
  emptyText: { color: '#A0AEC0', fontSize: 16, fontWeight: '600' },
  emptySub:  { color: '#CBD5E0', fontSize: 13 },

  // Referral rows
  referralRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  referralAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF4FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  referralAvatarText: { color: '#000080', fontWeight: '900', fontSize: 16 },
  referralInfo:  { flex: 1 },
  referralEmail: { fontSize: 14, fontWeight: '600', color: '#1A202C' },
  referralDate:  { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  referralRight: { alignItems: 'flex-end' },
  referralBooking:    { fontSize: 12, color: '#718096', marginBottom: 2 },
  referralCommission: { fontSize: 14, fontWeight: '900', color: '#38A169' },

  // Payout
  payoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FFB81C', borderRadius: 16, paddingVertical: 16, marginTop: 8,
    shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  payoutBtnText: { color: '#000080', fontSize: 15, fontWeight: '900' },
});
