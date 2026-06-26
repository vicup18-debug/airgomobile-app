import { Stack } from 'expo-router';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function RootLayout() {
  // Register FCM device token and notification listeners for the full app session
  usePushNotifications();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Tell the root app that (tabs) is the main entry point */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}