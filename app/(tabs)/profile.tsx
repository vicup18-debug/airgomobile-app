import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

export default function ProfileScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const [userName, setUserName] = useState('Airgo Traveler');
    const [userRole, setUserRole] = useState('user');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Fetch the actual user data whenever the screen is focused
    useEffect(() => {
        const fetchUserData = async () => {
            const name = await AsyncStorage.getItem('userName');
            const role = await AsyncStorage.getItem('userRole');
            if (name) setUserName(name);
            if (role) setUserRole(role);
        };
        if (isFocused) {
            fetchUserData();
        }
    }, [isFocused]);

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.clear();
                    router.replace('/auth/login' as any);
                }
            }
        ]);
    };

    const MenuItem = ({ icon, title, subtitle, onPress, isSwitch, switchValue, onSwitchToggle, color = "#1A202C" }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={isSwitch}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color }]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            {isSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchToggle}
                    trackColor={{ false: "#CBD5E0", true: "#004A99" }}
                    thumbColor={"#FFF"}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* 🟢 PREMIUM DEEP BLUE HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* 🟢 USER IDENTITY CARD */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.userName}>{userName}</Text>
                    <Text style={styles.userSubtitle}>Manage your account & settings</Text>
                </View>

                {/* 🟢 ACCOUNT SETTINGS */}
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <View style={styles.cardGroup}>
                    <MenuItem icon="person-outline" title="Personal Information" color="#004A99" />
                    <View style={styles.divider} />
                    <MenuItem icon="card-outline" title="Payment Methods" color="#004A99" />
                    <View style={styles.divider} />
                    <MenuItem
                        icon="notifications-outline"
                        title="Notifications"
                        color="#004A99"
                        isSwitch={true}
                        switchValue={notificationsEnabled}
                        onSwitchToggle={() => setNotificationsEnabled(!notificationsEnabled)}
                    />
                </View>

                {/* 🟢 HOSTING / PARTNER BRIDGE */}
                <Text style={styles.sectionTitle}>Hosting</Text>
                <View style={styles.cardGroup}>
                    {userRole === 'partner' || userRole === 'superadmin' ? (
                        <MenuItem
                            icon="briefcase"
                            title="Partner Dashboard"
                            subtitle="Manage your properties and revenue"
                            color="#D97706"
                            onPress={() => router.push('/partner/dashboard' as any)}
                        />
                    ) : (
                        <MenuItem
                            icon="home"
                            title="List your property"
                            subtitle="Earn money by hosting on Airgo"
                            color="#D97706"
                            onPress={() => router.push('/partner/select-type' as any)}
                        />
                    )}
                </View>

                {/* 🟢 SUPPORT & LEGAL */}
                <Text style={styles.sectionTitle}>Support & About</Text>
                <View style={styles.cardGroup}>
                    <MenuItem icon="help-buoy-outline" title="Help Center" color="#4A5568" />
                    <View style={styles.divider} />
                    <MenuItem icon="shield-checkmark-outline" title="Terms & Privacy" color="#4A5568" />
                </View>

                {/* 🟢 SIGN OUT BUTTON */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={22} color="#E53E3E" style={{ marginRight: 10 }} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Airgo v1.0.0</Text>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    header: { backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 80, paddingHorizontal: 24, alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    content: { paddingHorizontal: 20, paddingBottom: 40, marginTop: -50 },

    profileCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, marginBottom: 30 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#004A99' },
    avatarText: { fontSize: 36, fontWeight: '900', color: '#004A99' },
    userName: { fontSize: 24, fontWeight: '900', color: '#1A202C', marginBottom: 5 },
    userSubtitle: { fontSize: 14, color: '#718096' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 12, marginLeft: 10 },

    cardGroup: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 30 },

    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '600' },
    menuSubtitle: { fontSize: 12, color: '#718096', marginTop: 2 },

    divider: { height: 1, backgroundColor: '#E2E8F0', marginLeft: 55 },

    signOutButton: { flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FEB2B2', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    signOutText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' },

    versionText: { textAlign: 'center', color: '#A0AEC0', fontSize: 13 }
});