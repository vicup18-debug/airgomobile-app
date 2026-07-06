import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { usePushNotifications, checkColdStartNotification } from '../hooks/usePushNotifications';

export default function RootLayout() {
  // Register FCM device token and notification listeners for the full app session
  usePushNotifications();

  // Handle cold-start deep links: when the app was dead and the user tapped
  // a lock-screen notification, the response is only available after mount.
  useEffect(() => {
    checkColdStartNotification();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tell the root app that (tabs) is the main entry point */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}