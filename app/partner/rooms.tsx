import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';

export default function RoomsScreen() {
    const router = useRouter();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const partnerId = await AsyncStorage.getItem('userId');
            if (!partnerId) return;
            
            const response = await fetch(`${API_URL}/rooms/partner/${partnerId}`);
            if (response.ok) {
                const data = await response.json();
                setRooms(data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRoomVisibility = async (roomId: string, currentStatus: boolean) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/rooms/${roomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                setRooms(prev => prev.map(r => r._id === roomId ? { ...r, isActive: !currentStatus } : r));
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update visibility status' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'An error occurred while updating.' });
        }
    };


    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#004A99" />
                <Text style={{ marginTop: 10, color: '#718096' }}>Loading your rooms...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Rooms</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {rooms.length === 0 ? (
                    <Text style={styles.emptyText}>You haven't added any rooms yet.</Text>
                ) : (
                    rooms.map(room => (
                        <TouchableOpacity 
                            key={room._id} 
                            style={styles.roomCard}
                            onPress={() => router.push(`/partner/edit-room?id=${room._id}` as any)}
                        >
                            <Image source={{ uri: room.previewImage || room.image || 'https://via.placeholder.com/150' }} style={styles.roomImage} />
                            <View style={styles.roomInfo}>
                                <Text style={styles.roomName}>{room.name}</Text>
                                <Text style={styles.hotelText}>
                                    <Ionicons name="business" size={14} /> {room.hotelName}
                                </Text>
                                <Text style={styles.priceText}>₦{Number(room.netPrice || 0).toLocaleString()} / night</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <View style={[styles.statusBadge, { backgroundColor: room.isApproved ? (room.isActive === false ? '#FEFCBF' : '#EBF8FF') : '#FFF5F5' }]}>
                                        <Text style={[styles.statusText, { color: room.isApproved ? (room.isActive === false ? '#975A16' : '#004A99') : '#C53030' }]}>
                                            {room.isApproved ? (room.isActive === false ? 'Paused' : 'Active') : 'Pending Review'}
                                        </Text>
                                    </View>
                                    {room.isApproved && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 10, color: '#718096', marginRight: 4 }}>Visible</Text>
                                            <Switch 
                                                value={room.isActive !== false} 
                                                onValueChange={() => toggleRoomVisibility(room._id, room.isActive !== false)} 
                                                trackColor={{ false: '#CBD5E0', true: '#48BB78' }}
                                                thumbColor={'#FFF'}
                                                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
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
    roomCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    roomImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15, backgroundColor: '#E2E8F0' },
    roomInfo: { flex: 1, justifyContent: 'center' },
    roomName: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
    hotelText: { fontSize: 13, color: '#4A5568', marginBottom: 4 },
    priceText: { fontSize: 14, fontWeight: '900', color: '#38A169', marginBottom: 8 },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
    statusText: { fontSize: 11, fontWeight: 'bold' }
});
