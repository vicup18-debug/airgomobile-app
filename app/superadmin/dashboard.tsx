import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';

const { width } = Dimensions.get('window');

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    const TABS = [
        { id: 'overview', label: 'Global Overview' },
        { id: 'bookings', label: 'Bookings Manager' },
        { id: 'escrow', label: 'Escrow Ledger' },
        { id: 'approvals', label: 'Partner Approvals' },
        { id: 'fleet', label: 'Manage Fleet' },
        { id: 'rooms', label: 'Room Matrix' },
        { id: 'affiliates', label: 'Affiliates Hub' },
        { id: 'chats', label: 'Chat Monitor' }
    ];

    // 🟢 LIVE STATS from staging backend
    const [liveStats, setLiveStats] = useState({ total: 0, activeEscrow: 0, totalRevenue: 0, loading: true });

    useEffect(() => {
        const fetchLiveStats = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const headers = { 'Authorization': `Bearer ${token}` };
                const res = await fetch(`${API_URL}/bookings`, { headers });
                if (res.ok) {
                    const data: any[] = await res.json();
                    const bookings = Array.isArray(data) ? data : [];
                    const activeEscrow = bookings.filter(b =>
                        ['Pending Escrow','Paid - Escrow Secured','Escrow Active','Trip Started']
                            .some(s => (b.status || '').includes(s))
                    ).length;
                    const totalRevenue = bookings.reduce((sum, b) => {
                        const p = typeof b.totalPrice === 'string'
                            ? parseInt(b.totalPrice.replace(/\D/g,''), 10)
                            : Number(b.totalPrice || 0);
                        return sum + (isNaN(p) ? 0 : p);
                    }, 0);
                    setLiveStats({ total: bookings.length, activeEscrow, totalRevenue, loading: false });
                } else {
                    setLiveStats(prev => ({ ...prev, loading: false }));
                }
            } catch {
                setLiveStats(prev => ({ ...prev, loading: false }));
            }
        };
        fetchLiveStats();
    }, []);

    // 🟢 MOCK PLATFORM DATA (NOW LIVE)
    const [platformStats, setPlatformStats] = useState({
        totalRevenue: 0,
        totalUsers: 0,
        totalPartners: 0,
        activeBookings: 0,
        growth: "+0%"
    });

    useEffect(() => {
        const fetchPlatformStats = async () => {
            try {
                const res = await fetch(`${API_URL}/user/superadmin/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setPlatformStats({
                        totalRevenue: data.totalRevenue || 0,
                        totalUsers: data.totalUsers || 0,
                        totalPartners: data.totalPartners || 0,
                        activeBookings: data.activeBookings || 0,
                        growth: data.growth || "+0%"
                    });
                }
            } catch (err) {
                console.error("Error fetching platform stats:", err);
            }
        };
        fetchPlatformStats();
    }, []);

    // 🟢 NEW: LIVE QUEUES FOR QA & DISBURSEMENTS
    const [pendingPartners, setPendingPartners] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [cars, setCars] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [chats, setChats] = useState<any[]>([]);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/partners`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setPendingPartners(data.filter(p => !p.isApproved));
                    }
                }
            } catch (err) {
                console.error("Error fetching partners:", err);
            }
        };

        const fetchAdditionalData = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [bRes, cRes, rRes, aRes, chRes] = await Promise.all([
                    fetch(`${API_URL}/bookings`, { headers }).catch(() => ({ ok: false, json: () => [] })),
                    fetch(`${API_URL}/cars`, { headers }).catch(() => ({ ok: false, json: () => [] })),
                    fetch(`${API_URL}/rooms`, { headers }).catch(() => ({ ok: false, json: () => [] })),
                    fetch(`${API_URL}/affiliates`, { headers }).catch(() => ({ ok: false, json: () => [] })),
                    fetch(`${API_URL}/chats/active`, { headers }).catch(() => ({ ok: false, json: () => [] }))
                ]);
                
                if (bRes.ok) setBookings(await bRes.json());
                if (cRes.ok) setCars(await cRes.json());
                if (rRes.ok) setRooms(await rRes.json());
                if (aRes.ok) setAffiliates(await aRes.json());
                if (chRes.ok) setChats(await chRes.json());
            } catch (err) {
                console.error("Error fetching admin data:", err);
            }
        };

        fetchPartners();
        fetchAdditionalData();
    }, []);

    const [pendingDisbursements, setPendingDisbursements] = useState([
        { id: 'D1', hotel: 'Eko Hotels', amount: '₦450,000', bookingRef: '#BK990', status: 'Awaiting Authorization' }
    ]);

    // 🟢 NEW: ACTIONS
    const approvePartner = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/approve-partner/${id}`, { method: 'PUT' });
            if (res.ok) {
                setPendingPartners(prev => prev.filter(p => p._id !== id));
                Toast.show({ type: 'success', text1: 'Success', text2: 'Partner/Driver has been approved and is now live.' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to approve.' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network error.' });
        }
    };

    const declinePartner = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/delete-partner/${id}`, { method: 'PUT' });
            if (res.ok) {
                setPendingPartners(prev => prev.filter(p => p._id !== id));
                Toast.show({ type: 'error', text1: 'Declined', text2: 'Application rejected.' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to decline.' });
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Network error.' });
        }
    };

    const authorizePayout = (id: string) => {
        setPendingDisbursements(prev => prev.filter(p => p.id !== id));
        Toast.show({ type: 'success', text1: 'Payout Authorized', text2: 'Funds have been disbursed.' });
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/auth/login' as any);
    };

    return (
        <View style={styles.container}>
            {/* 🟢 PREMIUM ADMIN HEADER */}
            <View style={styles.header}>
                <View>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.dashboardLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.adminTag}>Platform Owner Portal</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
                </TouchableOpacity>
            </View>

            {/* 🟢 HORIZONTAL TAB MENU */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                    {TABS.map(tab => (
                        <TouchableOpacity 
                            key={tab.id} 
                            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ========================================= */}
                {/* 🟢 1. OVERVIEW TAB */}
                {/* ========================================= */}
                {activeTab === 'overview' && (
                    <View>
                        {/* 🟢 LIVE STATS BAR */}
                        <Text style={styles.sectionLabel}>Live Platform Stats</Text>
                {liveStats.loading ? (
                    <ActivityIndicator color="#FFB81C" style={{ marginBottom: 20 }} />
                ) : (
                    <View style={styles.liveStatsRow}>
                        <View style={styles.liveStatCard}>
                            <Text style={styles.liveStatVal}>{liveStats.total}</Text>
                            <Text style={styles.liveStatLabel}>Total Bookings</Text>
                        </View>
                        <View style={[styles.liveStatCard, styles.liveStatMid]}>
                            <Text style={[styles.liveStatVal, { color: '#FFB81C' }]}>{liveStats.activeEscrow}</Text>
                            <Text style={styles.liveStatLabel}>Active Escrow</Text>
                        </View>
                        <View style={styles.liveStatCard}>
                            <Text style={[styles.liveStatVal, { fontSize: 14 }]}>
                                {liveStats.totalRevenue > 999999
                                    ? `₦${(liveStats.totalRevenue/1000000).toFixed(1)}M`
                                    : `₦${liveStats.totalRevenue.toLocaleString()}`}
                            </Text>
                            <Text style={styles.liveStatLabel}>Revenue</Text>
                        </View>
                    </View>
                )}

                {/* 🌐 OPEN FULL WEB ADMIN */}
                <TouchableOpacity
                    style={styles.webAdminBtn}
                    onPress={() => Linking.openURL('https://airgo.ng/admin')}
                >
                    <Ionicons name="open-outline" size={18} color="#000080" />
                    <Text style={styles.webAdminBtnText}>Open Full Admin Panel in Browser</Text>
                </TouchableOpacity>

                {/* 🟢 MASTER REVENUE CARD */}
                <View style={styles.masterCard}>
                    <Text style={styles.masterCardTitle}>Total Platform Revenue</Text>
                    <Text style={styles.masterCardValue}>₦{platformStats.totalRevenue.toLocaleString()}</Text>
                    <View style={styles.growthBadge}>
                        <Ionicons name="trending-up" size={16} color="#38A169" />
                        <Text style={styles.growthText}>{platformStats.growth} this month</Text>
                    </View>
                </View>

                {/* 🟢 KPI METRICS GRID */}
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 74, 153, 0.1)' }]}>
                            <Ionicons name="people" size={24} color="#004A99" />
                        </View>
                        <Text style={styles.kpiValue}>{platformStats.totalUsers.toLocaleString()}</Text>
                        <Text style={styles.kpiLabel}>Total Users</Text>
                    </View>

                    <View style={styles.kpiCard}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                            <Ionicons name="briefcase" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.kpiValue}>{platformStats.totalPartners}</Text>
                        <Text style={styles.kpiLabel}>Active Partners</Text>
                    </View>

                    <View style={[styles.kpiCard, { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }]}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 161, 105, 0.1)', marginBottom: 0, marginRight: 15 }]}>
                            <Ionicons name="calendar" size={24} color="#38A169" />
                        </View>
                        <View>
                            <Text style={styles.kpiLabel}>Platform Bookings (30 Days)</Text>
                            <Text style={[styles.kpiValue, { fontSize: 24 }]}>{platformStats.activeBookings.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* 🟢 ANALYTICAL GROWTH CHART (CSS Built) */}
                <Text style={styles.sectionTitle}>Revenue Analytics</Text>
                <View style={styles.chartContainer}>
                    <View style={styles.chartBars}>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '40%' }]} /><Text style={styles.barLabel}>Mon</Text></View>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '60%' }]} /><Text style={styles.barLabel}>Tue</Text></View>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '50%' }]} /><Text style={styles.barLabel}>Wed</Text></View>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '80%' }]} /><Text style={styles.barLabel}>Thu</Text></View>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '70%' }]} /><Text style={styles.barLabel}>Fri</Text></View>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '95%', backgroundColor: '#FFB81C' }]} /><Text style={styles.barLabel}>Sat</Text></View>
                        <View style={styles.barWrapper}><View style={[styles.bar, { height: '85%' }]} /><Text style={styles.barLabel}>Sun</Text></View>
                    </View>
                </View>
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 4. APPROVALS TAB */}
                {/* ========================================= */}
                {activeTab === 'approvals' && (
                    <View>
                        {/* 🟢 PARTNER VERIFICATION QA QUEUE */}
                        {pendingPartners.length > 0 ? (
                    <>
                        <Text style={styles.sectionTitle}>Partner Verification Queue</Text>
                        {pendingPartners.map(partner => (
                            <View key={partner._id} style={styles.reviewCard}>
                                <View>
                                    <Text style={styles.hotelName}>{partner.businessName || partner.name}</Text>
                                    <Text style={styles.hotelLoc}>{partner.role === 'driver' ? 'Driver' : 'Partner'} • Docs: {partner.idDocumentUrl ? 'Uploaded' : 'Pending'}</Text>
                                </View>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity onPress={() => approvePartner(partner._id)} style={styles.approveBtn}>
                                        <Text style={styles.actionBtnText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => declinePartner(partner._id)} style={styles.declineBtn}>
                                        <Text style={styles.actionBtnText}>Decline</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                ) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No pending approvals.</Text>}
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 3. ESCROW LEDGER TAB */}
                {/* ========================================= */}
                {activeTab === 'escrow' && (
                    <View>
                        {/* 🟢 DISBURSEMENT AUTHORIZATIONS */}
                        {pendingDisbursements.length > 0 ? (
                    <>
                        <Text style={styles.sectionTitle}>Payout Disbursements</Text>
                        {pendingDisbursements.map(payout => (
                            <View key={payout.id} style={styles.payoutCard}>
                                <View>
                                    <Text style={styles.payoutAmount}>{payout.amount}</Text>
                                    <Text style={styles.payoutSub}>{payout.hotel} • {payout.bookingRef}</Text>
                                    <Text style={styles.payoutSubStatus}>{payout.status}</Text>
                                </View>
                                <TouchableOpacity onPress={() => authorizePayout(payout.id)} style={styles.disburseBtn}>
                                    <Text style={styles.actionBtnText}>Authorize</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                ) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No pending disbursements.</Text>}
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 5. BOOKINGS TAB */}
                {/* ========================================= */}
                {activeTab === 'bookings' && (
                    <View>
                        <Text style={styles.sectionTitle}>Bookings Manager</Text>
                        {bookings.length > 0 ? bookings.map((b: any, i) => (
                            <View key={i} style={styles.reviewCard}>
                                <Text style={styles.hotelName}>{b.bookingId || `#BK-${b._id?.substring(0,6)}`}</Text>
                                <Text style={styles.hotelLoc}>{b.hotelName || b.carModel} • {b.status}</Text>
                            </View>
                        )) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No bookings found.</Text>}
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 6. FLEET TAB */}
                {/* ========================================= */}
                {activeTab === 'fleet' && (
                    <View>
                        <Text style={styles.sectionTitle}>Manage Fleet</Text>
                        {cars.length > 0 ? cars.map((c: any, i) => (
                            <View key={i} style={styles.reviewCard}>
                                <Text style={styles.hotelName}>{c.make} {c.model} ({c.year})</Text>
                                <Text style={styles.hotelLoc}>Type: {c.type} • Status: {c.isApproved ? 'Live' : 'Pending'}</Text>
                            </View>
                        )) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No cars found.</Text>}
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 7. ROOMS TAB */}
                {/* ========================================= */}
                {activeTab === 'rooms' && (
                    <View>
                        <Text style={styles.sectionTitle}>Manage Room Matrix</Text>
                        {rooms.length > 0 ? rooms.map((r: any, i) => (
                            <View key={i} style={styles.reviewCard}>
                                <Text style={styles.hotelName}>{r.roomType || r.name}</Text>
                                <Text style={styles.hotelLoc}>Capacity: {r.guests} • Status: {r.isApproved ? 'Live' : 'Pending'}</Text>
                            </View>
                        )) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No rooms found.</Text>}
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 8. AFFILIATES TAB */}
                {/* ========================================= */}
                {activeTab === 'affiliates' && (
                    <View>
                        <Text style={styles.sectionTitle}>Affiliates Hub</Text>
                        {affiliates.length > 0 ? affiliates.map((a: any, i) => (
                            <View key={i} style={styles.reviewCard}>
                                <Text style={styles.hotelName}>{a.name}</Text>
                                <Text style={styles.hotelLoc}>Referrals: {a.referrals || 0} • Status: {a.status}</Text>
                            </View>
                        )) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No affiliates found.</Text>}
                    </View>
                )}

                {/* ========================================= */}
                {/* 🟢 9. CHATS TAB */}
                {/* ========================================= */}
                {activeTab === 'chats' && (
                    <View>
                        <Text style={styles.sectionTitle}>Chat Monitor</Text>
                        {chats.length > 0 ? chats.map((c: any, i) => (
                            <View key={i} style={styles.reviewCard}>
                                <Text style={styles.hotelName}>Chat #{c._id?.substring(0,8)}</Text>
                                <Text style={styles.hotelLoc}>Messages: {c.messages?.length || 0}</Text>
                            </View>
                        )) : <Text style={{textAlign: 'center', marginTop: 20, color: '#718096'}}>No active chats.</Text>}
                    </View>
                )}

                {/* 🟢 PLATFORM CONTROLS */}
                {activeTab === 'overview' && (
                    <>
                        <Text style={styles.sectionTitle}>Platform Management</Text>
                        <View style={styles.managementGrid}>
                            <TouchableOpacity style={styles.manageButton} onPress={() => setActiveTab('approvals')}>
                                <View style={[styles.manageIcon, { backgroundColor: '#EBF8FF' }]}><Ionicons name="checkmark-circle" size={24} color="#3182CE" /></View>
                                <Text style={styles.manageText}>Verify Partners</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.manageButton} onPress={() => setActiveTab('escrow')}>
                                <View style={[styles.manageIcon, { backgroundColor: '#FEFCBF' }]}><Ionicons name="cash" size={24} color="#D69E2E" /></View>
                                <Text style={styles.manageText}>Payouts</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.manageButton} onPress={() => Toast.show({ type: 'info', text1: 'Disputes', text2: 'Please use the Web Admin Panel for dispute resolution.' })}>
                                <View style={[styles.manageIcon, { backgroundColor: '#FED7D7' }]}><Ionicons name="alert-circle" size={24} color="#E53E3E" /></View>
                                <Text style={styles.manageText}>Disputes</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.manageButton} onPress={() => Toast.show({ type: 'info', text1: 'Settings', text2: 'Global settings are managed in the Web Admin Panel.' })}>
                                <View style={[styles.manageIcon, { backgroundColor: '#E2E8F0' }]}><Ionicons name="settings" size={24} color="#4A5568" /></View>
                                <Text style={styles.manageText}>Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15, backgroundColor: '#000080' },
    dashboardLogo: { width: 120, height: 40, marginBottom: 5 },
    adminTag: { color: '#FFB81C', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    logoutBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    
    // Tabs
    tabContainer: { backgroundColor: '#000080', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tabScroll: { paddingHorizontal: 15, paddingBottom: 10 },
    tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
    activeTabButton: { backgroundColor: '#FFB81C' },
    tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
    activeTabText: { color: '#000080', fontWeight: 'bold' },

    placeholderContainer: { padding: 50, alignItems: 'center', justifyContent: 'center' },
    placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginTop: 15 },
    placeholderSub: { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 5 },

    content: { padding: 20, paddingBottom: 100 },

    masterCard: { backgroundColor: '#1A202C', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, elevation: 8, marginBottom: 25 },
    masterCardTitle: { color: '#A0AEC0', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
    masterCardValue: { color: '#FFF', fontSize: 36, fontWeight: '900', marginBottom: 15 },
    growthBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56, 161, 105, 0.2)', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    growthText: { color: '#38A169', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
    kpiCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    kpiValue: { color: '#1A202C', fontSize: 26, fontWeight: '900', marginBottom: 2 },
    kpiLabel: { color: '#718096', fontSize: 13, fontWeight: '600' },

    sectionLabel: { color: '#FFB81C', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

    liveStatsRow: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
        marginBottom: 16, overflow: 'hidden',
    },
    liveStatCard:  { flex: 1, alignItems: 'center', paddingVertical: 16 },
    liveStatMid:   { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    liveStatVal:   { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
    liveStatLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

    webAdminBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#FFB81C', borderRadius: 14, paddingVertical: 14, marginBottom: 24,
        shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
    },
    webAdminBtnText: { color: '#000080', fontSize: 14, fontWeight: '900' },

    sectionTitle: { color: '#1A202C', fontSize: 18, fontWeight: '800', marginBottom: 15, letterSpacing: 0.5 },


    chartContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, marginBottom: 30, height: 220 },
    chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, marginTop: 10, paddingHorizontal: 10 },
    barWrapper: { alignItems: 'center', width: 30 },
    bar: { width: 14, backgroundColor: '#004A99', borderRadius: 8 },
    barLabel: { color: '#A0AEC0', fontSize: 12, marginTop: 10, fontWeight: 'bold' },

    // 🟢 NEW REVIEW CARDS STYLES
    reviewCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#FFB81C', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
    hotelName: { fontSize: 16, fontWeight: 'bold', color: '#004A99' },
    hotelLoc: { fontSize: 13, color: '#718096', marginTop: 4 },
    actionRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
    approveBtn: { backgroundColor: '#38A169', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    declineBtn: { backgroundColor: '#E53E3E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

    // 🟢 NEW PAYOUT CARDS STYLES
    payoutCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderLeftWidth: 5, borderLeftColor: '#38A169', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
    payoutAmount: { fontSize: 20, fontWeight: '900', color: '#1A202C' },
    payoutSub: { fontSize: 12, color: '#718096', marginTop: 2 },
    payoutSubStatus: { fontSize: 11, color: '#D97706', fontWeight: 'bold', marginTop: 4 },
    disburseBtn: { backgroundColor: '#004A99', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8 },

    managementGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    manageButton: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    manageIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    manageText: { color: '#1A202C', fontSize: 14, fontWeight: 'bold', flex: 1 }
});