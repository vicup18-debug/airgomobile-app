/**
 * usePushNotifications.ts
 *
 * Central Expo push notification hook for Airgo mobile app.
 *
 * Responsibilities:
 *  1. Request OS notification permission on first mount.
 *  2. Obtain a native FCM/APNs device token and register it with the
 *     Airgo backend so the server can reach this device when asleep.
 *  3. Set up foreground notification listeners (in-app banners).
 *  4. Route tap events to the correct screen via expo-router.
 *  5. Handle cold-start deep links (app launched from a dead state by
 *     tapping a lock-screen notification).
 *
 * Tap routing table (matches backend data.type values):
 *   'chat'             → /hotel/:roomId   (bidding chat room)
 *   'bid_accepted'     → /taxi-escrow     (pay now for accepted bid)
 *   'driver_accepted'  → /taxi-escrow     (alias — driver accepted offer)
 *   'payment_confirmed'→ /(tabs)/bookings
 *   'trip_started'     → /(tabs)/bookings
 *   'trip_completed'   → /(tabs)/bookings
 *   'booking_update'   → /(tabs)/bookings
 *   'payment_secured'  → /partner/dashboard (driver-side)
 *   'bid_received'     → /partner/dashboard (driver-side)
 *   default            → /(tabs)/bookings
 *
 * Usage:
 *   Call usePushNotifications() once in _layout.tsx.
 *   Call checkColdStartNotification() in _layout.tsx useEffect for
 *   dead-state launches.
 */

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Audio } from 'expo-av';
import * as TaskManager from 'expo-task-manager';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

async function playForegroundSound() {
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/notification.wav')
        );
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) sound.unloadAsync();
        });
    } catch (e) {
        console.warn('Failed to play foreground sound', e);
    }
}

// ─────────────────────────────────────────────
// BACKGROUND NOTIFICATION HANDLER
// ─────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error('Airgo FCM: Background task error', error);
        return;
    }
    if (data) {
        console.log('Background notification received:', data);
        const payloadData = data.notification?.request?.content?.data || data.notification?.data || data;
        if (payloadData?.type === 'ride_request') {
            await playForegroundSound();

            try {
                // Wake the screen using Notifee Full-Screen Intent
                // Note: We cannot request permissions in the background. It must be done in the foreground.
                const channelId = await notifee.createChannel({
                  id: 'airgo-wake-alerts',
                  name: 'Airgo Urgent Wake Alerts',
                  vibration: true,
                  vibrationPattern: [0, 500, 200, 500],
                  importance: AndroidImportance.HIGH,
                  visibility: AndroidVisibility.PUBLIC,
                });

                await notifee.displayNotification({
                  title: payloadData?.title || 'New Ride Request!',
                  body: payloadData?.body || 'A client is requesting a ride nearby.',
                  data: payloadData,
                  android: {
                    channelId,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility.PUBLIC,
                    fullScreenAction: {
                      id: 'default',
                      mainComponent: 'airgo', // Try to bring the app to foreground
                    },
                    pressAction: {
                      id: 'default',
                      launchActivity: 'default',
                    },
                  },
                });
            } catch (notifeeErr) {
                console.warn('Notifee failed to wake screen:', notifeeErr);
            }
        }
    }
});

// ─────────────────────────────────────────────
// FOREGROUND NOTIFICATION HANDLER
// ─────────────────────────────────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ─────────────────────────────────────────────
// REGISTER TOKEN WITH BACKEND
// ─────────────────────────────────────────────
async function registerTokenWithServer(devicePushToken: string): Promise<void> {
    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        const baseUrl = API_URL.replace('/api', '');
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

// ─────────────────────────────────────────────
// PERMISSION + TOKEN RETRIEVAL
// ─────────────────────────────────────────────
async function registerForPushNotificationsAsync(): Promise<string | null> {
    const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo) {
        console.log('📡 Airgo FCM: Skipping push token registration on Expo Go (not supported).');
        return null;
    }

    if (!Device.isDevice) {
        console.log('📡 Airgo FCM: Skipping — running in simulator/emulator.');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('airgo-urgent-alerts', {
            name: 'Airgo Urgent Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 500, 500],
            lightColor: '#000080',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
        });
        await Notifications.setNotificationChannelAsync('airgo-ride-requests', {
            name: 'Airgo Ride Requests',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500],
            lightColor: '#FFB81C',
            sound: 'notification.wav',
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
        });
    }

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

    try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        console.log('📡 Airgo FCM: Native device token obtained:', tokenData.type);
        return tokenData.data;
    } catch (e: any) {
        console.warn('📡 Airgo FCM: Could not get native device token —', e.message);
        return null;
    }
}

// ─────────────────────────────────────────────
// NOTIFICATION TAP ROUTER
//
// IMPORTANT: When the app launches from a dead state via
// getLastNotificationResponseAsync(), the data payload can be nested
// one level deeper than a foreground push, e.g.:
//   foreground:  response.notification.request.content.data
//   cold-start:  response.notification.request.content.data.data  (some FCM configs)
// This function normalises both cases by checking both levels.
// ─────────────────────────────────────────────
export async function handleNotificationTap(rawData: any): Promise<void> {
    if (!rawData) return;

    // Normalise: some FCM configs nest payload under a nested .data key
    const data: any = rawData?.data ?? rawData;

    const type: string       = data?.type        || '';
    const bookingId: string  = data?.bookingId   || '';
    const roomId: string     = data?.roomId      || bookingId;

    console.log('🔔 Routing notification tap:', { type, bookingId, roomId });

    let userRole = 'client';
    try {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) userRole = storedRole;
    } catch (e) {
        console.warn('Failed to get userRole for notification tap', e);
    }

    const fallbackRoute = userRole === 'driver' ? '/driver/dashboard' 
                        : userRole === 'partner' ? '/partner/dashboard' 
                        : '/(tabs)/bookings';

    switch (type) {
        // ── Chat / bidding room ──────────────────────────────────────────
        case 'chat':
            if (roomId) {
                router.push(`/hotel/${roomId}` as any);
            } else {
                router.push(fallbackRoute as any);
            }
            break;

        // ── Bid accepted — client must now pay into escrow ───────────────
        case 'bid_accepted':
        case 'driver_accepted':
        case 'client_counter':
            // Navigate to the taxi escrow screen passing the bookingId so
            // the screen can resume the existing booking rather than creating
            // a new one. The screen detects a pre-existing bookingId param.
            if (bookingId) {
                router.push({
                    pathname: '/taxi-escrow' as any,
                    params: { existingBookingId: bookingId },
                });
            } else {
                router.push(fallbackRoute as any);
            }
            break;

        // ── Driver-side: new bid or payment secured ──────────────────────
        case 'payment_secured':
        case 'bid_received':
            router.push('/partner/dashboard' as any);
            break;
            
        case 'ride_request':
            router.push('/driver/dashboard' as any);
            break;

        // ── General booking status updates ───────────────────────────────
        case 'payment_confirmed':
        case 'trip_started':
        case 'trip_completed':
        case 'booking_update':
        case 'booking_cancelled':
        case 'booking_expired':
            router.push(fallbackRoute as any);
            break;

        // ── Default fallback ─────────────────────────────────────────────
        default:
            console.log('🔔 Unknown notification type, routing to default for role:', type);
            router.push(fallbackRoute as any);
            break;
    }
}

// ─────────────────────────────────────────────
// MAIN HOOK — call once in _layout.tsx
// ─────────────────────────────────────────────
export function usePushNotifications() {
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener     = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        let mounted = true;

        const setup = async () => {
            const token = await registerForPushNotificationsAsync();
            if (!mounted || !token) return;

            await registerTokenWithServer(token);
            
            try {
                await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
            } catch (err) {
                console.warn('Airgo FCM: Failed to register background task', err);
            }

            // Foreground: notification arrives while app is open
            notificationListener.current = Notifications.addNotificationReceivedListener(
                (notification) => {
                    const { title, body } = notification.request.content;
                    const data = notification.request.content.data as any;
                    console.log('🔔 Foreground notification received:', title, body, data);
                    
                    if (data?.type === 'ride_request') {
                        playForegroundSound();
                    }
                }
            );

            // Background / foreground tap: user taps a notification while app is open or backgrounded
            responseListener.current = Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const data = response.notification.request.content.data as any;
                    console.log('🔔 Notification tapped (foreground/background). Data:', data);
                    handleNotificationTap(data);
                }
            );
        };

        setup();

        return () => {
            mounted = false;
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);
}

// ─────────────────────────────────────────────
// COLD-START CHECK — call once in _layout.tsx useEffect
//
// When the app is in a dead state and the user taps a lock-screen
// notification, Expo does NOT fire addNotificationResponseReceivedListener.
// Instead, the response is stored and must be retrieved via
// getLastNotificationResponseAsync() after the app fully mounts.
// ─────────────────────────────────────────────
export async function checkColdStartNotification(): Promise<void> {
    try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (!response) return;

        const data = response.notification.request.content.data as any;
        console.log('🔔 Cold-start notification detected. Data:', data);

        // Small delay ensures the navigator is fully mounted before pushing
        setTimeout(() => {
            handleNotificationTap(data);
        }, 500);
    } catch (e: any) {
        console.warn('📡 Airgo FCM: Cold-start check error —', e.message);
    }
}

// ─────────────────────────────────────────────
// POST-LOGIN SYNC — call after successful login
// ─────────────────────────────────────────────
export async function syncPushTokenAfterLogin(): Promise<void> {
    const token = await registerForPushNotificationsAsync();
    if (token) {
        await registerTokenWithServer(token);
    }
}
