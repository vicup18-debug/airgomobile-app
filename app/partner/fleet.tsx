import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';

export default function FleetScreen() {
    const router = useRouter();

    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingCar, setEditingCar] = useState<any>(null);
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [driverEmail, setDriverEmail] = useState('');
    const [driverPassword, setDriverPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const partnerId = await AsyncStorage.getItem('userId');
            
            const response = await fetch(`${API_URL}/cars`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const partnerCars = data.filter((c: any) => c.partnerId === partnerId);
                setCars(partnerCars);
            }
        } catch (error) {
            console.error('Error fetching cars:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditDriver = (car: any) => {
        setEditingCar(car);
        setDriverName(car.driverName || '');
        setDriverPhone(car.driverPhone || '');
        setDriverEmail(car.driverEmail || '');
        setDriverPassword(''); // Leave blank to keep current
    };

    const handleSaveDriver = async () => {
        if (!editingCar) return;
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            const payload = {
                driverName,
                driverPhone,
                driverEmail,
                driverPassword
            };

            const response = await fetch(`${API_URL}/cars/${editingCar._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Driver Updated', text2: 'Driver details saved successfully.' });
                setEditingCar(null);
                fetchCars();
            } else {
                Toast.show({ type: 'error', text1: 'Update Failed', text2: 'Failed to update driver.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#004A99" />
                <Text style={{ marginTop: 10, color: '#718096' }}>Loading your fleet...</Text>
            </View>
        );
    }

    if (editingCar) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setEditingCar(null)} style={styles.backBtn}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Driver Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.formContainer}>
                        <Text style={styles.carTitle}>Assigned to: {editingCar.name}</Text>
                        
                        <Text style={styles.inputLabel}>Driver Name *</Text>
                        <TextInput style={styles.inputBox} value={driverName} onChangeText={setDriverName} placeholder="Driver Name" />

                        <Text style={styles.inputLabel}>Driver Phone *</Text>
                        <TextInput style={styles.inputBox} value={driverPhone} onChangeText={setDriverPhone} placeholder="Phone Number" keyboardType="phone-pad" />

                        <Text style={styles.inputLabel}>Driver Email (Username) *</Text>
                        <TextInput style={styles.inputBox} value={driverEmail} onChangeText={setDriverEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />

                        <Text style={styles.inputLabel}>Driver Login Password</Text>
                        <TextInput style={styles.inputBox} value={driverPassword} onChangeText={setDriverPassword} placeholder="Leave blank to keep current" secureTextEntry />

                        <TouchableOpacity style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]} onPress={handleSaveDriver} disabled={isSaving}>
                            <Text style={styles.submitBtnText}>{isSaving ? 'Saving...' : 'Save Driver Details'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Fleet & Drivers</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {cars.length === 0 ? (
                    <Text style={styles.emptyText}>You haven't added any cars yet.</Text>
                ) : (
                    cars.map(car => (
                        <View key={car._id} style={styles.carCard}>
                            <Image source={{ uri: car.image || 'https://via.placeholder.com/150' }} style={styles.carImage} />
                            <View style={styles.carInfo}>
                                <Text style={styles.carName}>{car.name}</Text>
                                <Text style={styles.driverText}>
                                    <Ionicons name="person-circle" size={14} /> {car.driverName || 'No Driver Assigned'}
                                </Text>
                                <TouchableOpacity style={styles.editBtn} onPress={() => handleEditDriver(car)}>
                                    <Text style={styles.editBtnText}>Edit Driver Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    emptyText: { textAlign: 'center', color: '#718096', marginTop: 40 },
    carCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    carImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15, backgroundColor: '#E2E8F0' },
    carInfo: { flex: 1, justifyContent: 'center' },
    carName: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
    driverText: { fontSize: 13, color: '#4A5568', marginBottom: 10 },
    editBtn: { backgroundColor: '#EBF8FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
    editBtnText: { color: '#004A99', fontSize: 12, fontWeight: 'bold' },
    formContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    carTitle: { fontSize: 16, fontWeight: 'bold', color: '#004A99', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10 },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#4A5568', marginBottom: 8 },
    inputBox: { borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, height: 50, borderRadius: 8, fontSize: 15, color: '#1A202C', marginBottom: 20, backgroundColor: '#F8F9FA' },
    submitBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#004A99', marginTop: 10 },
    submitBtnDisabled: { backgroundColor: '#CBD5E0' },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
