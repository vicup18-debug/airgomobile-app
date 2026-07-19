import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { usePushNotifications, checkColdStartNotification } from '../hooks/usePushNotifications';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../utils/toastConfig';
import * as SplashScreen from 'expo-splash-screen';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

// Prevent the native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {
  // Catch in case this is called multiple times or on web
});

import AnimatedSplash from '../components/AnimatedSplash';

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  useEffect(() => {
    // Simulate any required asset loading or initial API calls here
    const prepareApp = async () => {
      try {
        // e.g. await Font.loadAsync(...)
        // await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
        // Hide the native splash immediately, which reveals our AnimatedSplashScreen underneath!
        await SplashScreen.hideAsync().catch(() => {});
      }
    };
    prepareApp();
  }, []);

  return (
    <>
      {!splashAnimationComplete && (
        <AnimatedSplash onComplete={() => setSplashAnimationComplete(true)} />
      )}
      
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tell the root app that (tabs) is the main entry point */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      
      <Toast config={toastConfig} topOffset={60} />
    </>
  );
}