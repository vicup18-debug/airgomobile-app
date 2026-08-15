import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    const enforceRoleRouting = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        if (role === 'driver') {
          router.replace('/driver/dashboard' as any);
        } else if (role === 'partner') {
          router.replace('/partner/dashboard' as any);
        } else if (role === 'superadmin' || role === 'admin') {
          router.replace('/superadmin/dashboard' as any);
        }
      } catch (e) {
        // ignore
      }
    };
    enforceRoleRouting();
  }, []);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFB81C',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: '#000080',
          borderTopWidth: 1,
          borderTopColor: '#000080'
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      {/* Hidden from tab bar — kept for router compatibility */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}