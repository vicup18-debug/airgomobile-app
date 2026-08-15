import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        
        // Small delay to ensure router is fully mounted
        setTimeout(() => {
          if (role === 'driver') {
            router.replace('/driver/dashboard' as any);
          } else if (role === 'partner') {
            router.replace('/partner/dashboard' as any);
          } else if (role === 'superadmin' || role === 'admin') {
            router.replace('/superadmin/dashboard' as any);
          } else {
            router.replace('/(tabs)' as any);
          }
        }, 100);
      } catch (e) {
        setTimeout(() => router.replace('/(tabs)' as any), 100);
      }
    };
    
    checkRoleAndRedirect();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000080', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FFB81C" />
    </View>
  );
}
