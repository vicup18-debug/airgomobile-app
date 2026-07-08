import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { usePushNotifications, checkColdStartNotification } from '../hooks/usePushNotifications';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

export default function RootLayout() {
  // Register FCM device token and notification listeners for the full app session
  // Temporarily disabled for Expo Go SDK 53
  // usePushNotifications();

  // Handle cold-start deep links: when the app was dead and the user tapped
  // a lock-screen notification, the response is only available after mount.
  useEffect(() => {
    // Temporarily disabled for Expo Go SDK 53
    // checkColdStartNotification();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tell the root app that (tabs) is the main entry point */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}