import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/config';

export default function PartnerDashboard() {
    const router = useRouter();

    const [isApproved, setIsApproved] = useState(false);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ activeItems: 0, bookingsToday: 0, totalRevenue: 0 });
    const [partnerType, setPartnerType] = useState('hotel');

    useEffect(() => {
        const fetchDashboardData = async () => {
            const val = await AsyncStorage.getItem('isApproved');
            if (val === 'true') {
                setIsApproved(true);
            }
            
            const userId = await AsyncStorage.getItem('userId');
            if (userId) {
                try {
                    const response = await fetch(`${API_URL}/user/partner/stats/${userId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setStats({
                            activeItems: data.activeItems || 0,
                            bookingsToday: data.bookingsToday || 0,
                            totalRevenue: data.totalRevenue || 0
                        });
                        setPartnerType(data.partnerType || 'hotel');
                    }
                } catch (err) {
                    console.error('Error fetching partner stats:', err);
                }
            }
            setLoading(false);
        };
        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/auth/login' as any);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#004A99" />
                <Text style={{ marginTop: 10, color: '#718096' }}>Loading dashboard...</Text>
            </View>
        );
    }

    // 🟢 NEW: THE "UNDER REVIEW" SCREEN
    if (!isApproved) {
        return (
            <View style={styles.reviewContainer}>
                <Ionicons name="shield-checkmark" size={80} color="#FFB81C" />
                <Text style={styles.reviewTitle}>Account Under Review</Text>
                <Text style={styles.reviewSub}>
                    Airgo&apos;s Quality Assurance team is currently reviewing your property details and images.
                    You will receive an email notification once your account is live and ready to receive bookings.
                </Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={() => alert("Still under review. Please check back later.")}>
                    <Text style={styles.btnText}>Check Status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 15 }]} onPress={handleLogout}>
                    <Text style={[styles.btnText, { color: '#E53E3E' }]}>Logout</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // 🟢 EXISTING DASHBOARD (Renders only if isApproved is true)
    return (
        <View style={styles.container}>
            {/* 🟢 PREMIUM AIRGO HEADER WITH LOGO */}
            <View style={styles.header}>
                <View>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.dashboardLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.hotelName}>Partner Portal</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#004A99" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 🟢 ANALYTICS CARDS (Light Theme) */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 74, 153, 0.1)' }]}>
                            <Ionicons name={partnerType === 'hotel' ? 'bed' : 'car'} size={24} color="#004A99" />
                        </View>
                        <Text style={styles.statValue}>{stats.activeItems}</Text>
                        <Text style={styles.statLabel}>{partnerType === 'hotel' ? 'Active Rooms' : 'Active Cars'}</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 161, 105, 0.1)' }]}><Ionicons name="calendar" size={24} color="#38A169" /></View>
                        <Text style={styles.statValue}>{stats.bookingsToday}</Text>
                        <Text style={styles.statLabel}>Bookings Today</Text>
                    </View>

                    <View style={[styles.statCard, styles.fullWidthCard]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 184, 28, 0.2)', marginBottom: 0, marginRight: 15 }]}><Ionicons name="wallet" size={24} color="#D97706" /></View>
                            <View>
                                <Text style={styles.statLabel}>Revenue (Last 7 Days)</Text>
                                <Text style={styles.statValueRevenue}>₦{stats.totalRevenue.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 🟢 QUICK ACTIONS */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity 
                        style={styles.actionButton} 
                        onPress={() => router.push((partnerType === 'car' || partnerType === 'shuttle' || partnerType === 'airport-shuttle') ? '/partner/add-car' as any : '/partner/add-room' as any)}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="add" size={28} color="#004A99" />
                        </View>
                        <Text style={styles.actionText}>{(partnerType === 'car' || partnerType === 'shuttle' || partnerType === 'airport-shuttle') ? 'Add New Car' : 'Add New Room'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="images" size={24} color="#004A99" />
                        </View>
                        <Text style={styles.actionText}>Manage Photos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="list" size={24} color="#004A99" />
                        </View>
                        <Text style={styles.actionText}>All Bookings</Text>
                    </TouchableOpacity>
                </View>

                {/* 🟢 RECENT ACTIVITY */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                    <View style={styles.activityRow}>
                        <View style={styles.activityDot} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.activityText}>New booking: {(partnerType === 'car' || partnerType === 'shuttle' || partnerType === 'airport-shuttle') ? 'Executive SUV' : 'Deluxe Suite'}</Text>
                            <Text style={styles.activityTime}>10 mins ago • Ref: #A89F2</Text>
                        </View>
                        <Text style={styles.activityPrice}>+₦120,000</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.activityRow}>
                        <View style={[styles.activityDot, { backgroundColor: '#FFB81C' }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.activityText}>{(partnerType === 'car' || partnerType === 'shuttle' || partnerType === 'airport-shuttle') ? 'Car status updated: Toyota Camry' : 'Room status updated: Presidential'}</Text>
                            <Text style={styles.activityTime}>2 hours ago • Marked as Maintenance</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 25, backgroundColor: '#004A99' },
    dashboardLogo: { width: 120, height: 40, marginBottom: 5, tintColor: '#FFB81C' },
    hotelName: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    logoutBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },

    content: { padding: 20, paddingBottom: 60 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30, marginTop: 10 },
    statCard: { width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    fullWidthCard: { width: '100%', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    statValue: { color: '#1A202C', fontSize: 28, fontWeight: '900' },
    statValueRevenue: { color: '#004A99', fontSize: 28, fontWeight: '900', marginTop: 4 },
    statLabel: { color: '#718096', fontSize: 13, fontWeight: '600' },

    sectionTitle: { color: '#1A202C', fontSize: 18, fontWeight: '800', marginBottom: 15, letterSpacing: 0.5 },

    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    actionButton: { width: '30%', backgroundColor: '#FFF', paddingVertical: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    actionIconContainer: { backgroundColor: '#F0F7FF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionText: { color: '#4A5568', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },

    activityCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    activityRow: { flexDirection: 'row', alignItems: 'center' },
    activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#38A169', marginRight: 15 },
    activityText: { color: '#1A202C', fontSize: 15, fontWeight: '700' },
    activityTime: { color: '#718096', fontSize: 12, marginTop: 4 },
    activityPrice: { color: '#38A169', fontWeight: '900', fontSize: 16 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },

    // 🟢 NEW STYLES: REVIEW SCREEN
    reviewContainer: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', padding: 40 },
    reviewTitle: { fontSize: 24, fontWeight: '900', color: '#1A202C', marginTop: 25, textAlign: 'center' },
    reviewSub: { fontSize: 15, color: '#4A5568', textAlign: 'center', marginTop: 15, lineHeight: 24 },
    refreshBtn: { width: '100%', marginTop: 30, backgroundColor: '#004A99', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});