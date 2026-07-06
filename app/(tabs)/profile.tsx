import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';

export default function ProfileScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const [userName, setUserName] = useState('Airgo Traveler');
    const [userRole, setUserRole] = useState('user');
    const [userEmail, setUserEmail] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Delete account modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Fetch the actual user data whenever the screen is focused
    useEffect(() => {
        const fetchUserData = async () => {
            const name  = await AsyncStorage.getItem('userName');
            const role  = await AsyncStorage.getItem('userRole');
            const email = await AsyncStorage.getItem('userEmail');
            if (name)  setUserName(name);
            if (role)  setUserRole(role);
            if (email) setUserEmail(email);
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

    // Step 1: Show initial warning alert
    const handleDeleteAccountPress = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'This will permanently delete your Airgo account and all associated data. This action cannot be undone.\n\nAre you sure you want to continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => {
                        setDeletePassword('');
                        setDeleteError('');
                        setDeleteModalVisible(true);
                    }
                }
            ]
        );
    };

    // Step 2: Confirm with password and call API
    const handleConfirmDelete = async () => {
        if (!deletePassword.trim()) {
            setDeleteError('Please enter your password to confirm.');
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) throw new Error('Session not found. Please log in again.');

            const response = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password: deletePassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setDeleteError(data.message || 'Deletion failed. Please try again.');
                setDeleteLoading(false);
                return;
            }

            // Success — clear session and redirect
            setDeleteModalVisible(false);
            await AsyncStorage.clear();
            Alert.alert(
                'Account Deleted',
                'Your account and all associated data have been permanently deleted. We\'re sorry to see you go.',
                [{ text: 'OK', onPress: () => router.replace('/auth/login' as any) }]
            );
        } catch (err: any) {
            setDeleteError(err.message || 'A network error occurred. Please check your connection.');
            setDeleteLoading(false);
        }
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
                    <MenuItem icon="person-outline" title="Personal Information" color="#004A99" onPress={() => router.push('/profile/personal-info' as any)} />
                    <View style={styles.divider} />
                    <MenuItem icon="card-outline" title="Payment Methods" color="#004A99" onPress={() => router.push('/profile/payment-methods' as any)} />
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

                {/* 🟢 ROLE-BASED WORKSPACE */}
                <Text style={styles.sectionTitle}>My Workspace</Text>
                <View style={styles.cardGroup}>
                    {(userRole === 'admin' || userRole === 'superadmin') ? (
                        <>
                            <MenuItem
                                icon="shield-checkmark"
                                title="Admin Console"
                                subtitle="Platform management &amp; oversight"
                                color="#E53E3E"
                                onPress={() => router.push('/superadmin/dashboard' as any)}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="briefcase"
                                title="Partner Dashboard"
                                subtitle="Properties, bookings &amp; revenue"
                                color="#D97706"
                                onPress={() => router.push('/partner/dashboard' as any)}
                            />
                        </>
                    ) : userRole === 'driver' ? (
                        <>
                            <MenuItem
                                icon="car"
                                title="Driver Dashboard"
                                subtitle="Rides, bids &amp; active trips"
                                color="#3182CE"
                                onPress={() => router.push('/driver/dashboard' as any)}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="cash-outline"
                                title="My Earnings"
                                subtitle="Commission &amp; payout history"
                                color="#38A169"
                                onPress={() => router.push('/driver/dashboard' as any)}
                            />
                        </>
                    ) : userRole === 'affiliate' ? (
                        <MenuItem
                            icon="people"
                            title="Affiliate Hub"
                            subtitle="Referrals, commissions &amp; payouts"
                            color="#D97706"
                            onPress={() => router.push('/affiliate/dashboard' as any)}
                        />
                    ) : userRole === 'partner' ? (
                        <MenuItem
                            icon="briefcase"
                            title="Partner Dashboard"
                            subtitle="Manage your properties and revenue"
                            color="#D97706"
                            onPress={() => router.push('/partner/dashboard' as any)}
                        />
                    ) : (
                        <>
                            <MenuItem
                                icon="home"
                                title="List Your Property"
                                subtitle="Earn money by hosting on Airgo"
                                color="#D97706"
                                onPress={() => router.push('/partner/select-type' as any)}
                            />
                            <View style={styles.divider} />
                            <MenuItem
                                icon="car-outline"
                                title="Become a Driver"
                                subtitle="Join Airgo's driver network"
                                color="#3182CE"
                                onPress={() => router.push('/info/how-we-work' as any)}
                            />
                        </>
                    )}
                </View>

                {/* 🟢 SUPPORT & LEGAL */}
                <Text style={styles.sectionTitle}>Support & About</Text>
                <View style={styles.cardGroup}>
                    <MenuItem icon="help-buoy-outline" title="Help Center" color="#4A5568" onPress={() => router.push('/profile/help-center' as any)} />
                    <View style={styles.divider} />
                    <MenuItem icon="shield-checkmark-outline" title="Terms & Privacy" color="#4A5568" onPress={() => router.push('/profile/terms' as any)} />
                </View>

                {/* 🟢 SIGN OUT BUTTON */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={22} color="#E53E3E" style={{ marginRight: 10 }} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* 🗑️ DELETE ACCOUNT BUTTON */}
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccountPress}>
                    <Ionicons name="trash-outline" size={20} color="#718096" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Airgo v1.0.0</Text>

            </ScrollView>

            {/* 🗑️ DELETE ACCOUNT CONFIRMATION MODAL */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => !deleteLoading && setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="warning" size={32} color="#E53E3E" />
                        </View>
                        <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
                        <Text style={styles.modalBody}>
                            Enter your password below to permanently delete your account. All bookings, data, and history will be erased.
                        </Text>

                        <TextInput
                            style={[styles.passwordInput, deleteError ? styles.passwordInputError : null]}
                            placeholder="Enter your password"
                            placeholderTextColor="#A0AEC0"
                            secureTextEntry
                            value={deletePassword}
                            onChangeText={(t) => { setDeletePassword(t); setDeleteError(''); }}
                            editable={!deleteLoading}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />

                        {deleteError ? (
                            <Text style={styles.errorText}>{deleteError}</Text>
                        ) : null}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={deleteLoading}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, deleteLoading && styles.modalConfirmBtnDisabled]}
                                onPress={handleConfirmDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Delete Forever</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    header: { backgroundColor: '#000080', paddingTop: 90, paddingBottom: 80, paddingHorizontal: 24, alignItems: 'center' },
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

    signOutButton: { flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FEB2B2', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    signOutText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' },

    deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, marginBottom: 24 },
    deleteButtonText: { color: '#A0AEC0', fontSize: 14, textDecorationLine: 'underline' },

    versionText: { textAlign: 'center', color: '#A0AEC0', fontSize: 13 },

    // Delete account modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400 },
    modalIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1A202C', textAlign: 'center', marginBottom: 10 },
    modalBody: { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    passwordInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A202C', backgroundColor: '#F8F9FA', marginBottom: 8 },
    passwordInputError: { borderColor: '#E53E3E' },
    errorText: { color: '#E53E3E', fontSize: 13, marginBottom: 12, paddingHorizontal: 4 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    modalCancelText: { color: '#4A5568', fontSize: 15, fontWeight: '600' },
    modalConfirmBtn: { flex: 1, backgroundColor: '#E53E3E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    modalConfirmBtnDisabled: { backgroundColor: '#FC8181' },
    modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});