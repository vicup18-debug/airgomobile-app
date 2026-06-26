/**
 * usePushNotifications.ts
 *
 * Central Expo push notification hook for Airgo mobile app.
 *
 * Responsibilities:
 *  1. Request OS notification permission on first mount.
 *  2. Obtain an Expo Push Token (used for Expo's own push service) AND
 *     a native FCM/APNs device token — the latter is what the Airgo
 *     backend's sendPushNotification() targets via firebase-admin.
 *  3. Register both tokens with the backend so the server can reach this
 *     device even when the app is fully backgrounded or the screen is locked.
 *  4. Set up foreground notification listeners so arriving pushes show an
 *     in-app alert while the user has the app open.
 *
 * Usage:
 *   Call usePushNotifications() once in the root layout (_layout.tsx) so
 *   it runs for the entire app lifetime regardless of which tab is active.
 */

import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,   // Show banner even when app is open
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register device tokens with the Airgo backend.
 * Uses the mobile-friendly PUT /api/user/fcm-token route which accepts
 * userId in the body (no Bearer JWT required).
 */
async function registerTokenWithServer(devicePushToken: string): Promise<void> {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return; // User not logged in yet — will register after login

        const baseUrl = API_URL.replace('/api', ''); // strip /api suffix
        const res = await fetch(`${baseUrl}/api/user/fcm-token`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, fcmToken: devicePushToken }),
        });

        if (res.ok) {
            console.log('📡 Airgo FCM: Device push token synced with server.');
        } else {
            const err = await res.json().catch(() => ({}));
            console.warn('📡 Airgo FCM: Token sync failed —', err.error || res.status);
        }
    } catch (e: any) {
        console.warn('📡 Airgo FCM: Token sync network error —', e.message);
    }
}

/**
 * Request notification permissions and retrieve the native device token.
 * Returns the FCM/APNs device token string, or null if unavailable.
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('📡 Airgo FCM: Skipping — running in simulator/emulator.');
        return null;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('airgo-alerts', {
            name: 'Airgo Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#000080',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
        });
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('📡 Airgo FCM: Notification permission denied by user.');
        return null;
    }

    // Get the native device push token (FCM on Android, APNs on iOS).
    // This is the token firebase-admin targets — NOT the Expo push token.
    try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        console.log('📡 Airgo FCM: Native device token obtained:', tokenData.type);
        return tokenData.data; // raw FCM registration token string
    } catch (e: any) {
        console.warn('📡 Airgo FCM: Could not get native device token —', e.message);
        return null;
    }
}

export function usePushNotifications() {
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        let mounted = true;

        const setup = async () => {
            const token = await registerForPushNotificationsAsync();
            if (!mounted || !token) return;

            // Sync with Airgo backend
            await registerTokenWithServer(token);

            // Listen for notifications arriving while app is in the foreground
            notificationListener.current = Notifications.addNotificationReceivedListener(
                (notification) => {
                    const { title, body } = notification.request.content;
                    const data = notification.request.content.data as any;
                    console.log('🔔 Foreground notification:', title, body, data);
                    // The handler set above (setNotificationHandler) will display
                    // the system banner automatically — no manual Alert needed.
                }
            );

            // Listen for user tapping a notification
            responseListener.current = Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const data = response.notification.request.content.data as any;
                    console.log('🔔 Notification tapped. Data:', data);
                    // Navigation on tap is handled by the app's top-level
                    // notification response handler if needed.
                }
            );
        };

        setup();

        return () => {
            mounted = false;
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);
}

/**
 * Call this after a successful login to immediately register the device token
 * now that a userId is available in AsyncStorage.
 */
export async function syncPushTokenAfterLogin(): Promise<void> {
    const token = await registerForPushNotificationsAsync();
    if (token) {
        await registerTokenWithServer(token);
    }
}
