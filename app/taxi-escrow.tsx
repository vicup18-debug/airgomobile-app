/**
 * taxi-escrow.tsx — Dedicated Paystack escrow screen for the taxi ride request flow.
 *
 * Refactored to use PaystackProvider & usePaystack hook from version 5+
 */

import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaystackProvider, usePaystack } from 'react-native-paystack-webview';
import { API_URL } from '../constants/config';

const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_KEY || 'pk_live_e3f508dda06464163976ebde1d31f008ee8f524d';
const AIRGO_PLATFORM_EMAIL = 'escrow@airgo.ng';
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 10;

const ESCROW_SECURED_STATUSES = [
  'Paid - Escrow Secured',
  'Paid',
  'Escrow Active',
  'Trip Started',
];

function priceToKobo(priceStr: string): number {
  const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
  const ngn = parseFloat(cleaned) || 0;
  return Math.round(ngn * 100);
}

function extractCity(address: string): string {
  const known = ['Abuja', 'Lagos', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu', 'Kaduna', 'Benin City'];
  const lower = address.toLowerCase();
  for (const city of known) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return address.split(',')[0].trim();
}

function TaxiEscrowContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from: string; to: string; dateTime: string }>();
  const { popup } = usePaystack();

  const [phase, setPhase] = useState<'creating' | 'payment' | 'verifying' | 'success' | 'error'>('creating');
  const [booking, setBooking]           = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollCount, setPollCount]       = useState(0);
  const [userEmail, setUserEmail]       = useState('');

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initBooking();
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, []);

  // Automatically trigger Paystack checkout when booking is ready
  useEffect(() => {
    if (phase === 'payment' && booking) {
      triggerPayment();
    }
  }, [phase, booking]);

  const triggerPayment = () => {
    if (!booking) return;
    const amountKobo = priceToKobo(booking.totalPrice || '15000');
    popup.checkout({
      email: userEmail || AIRGO_PLATFORM_EMAIL,
      amount: amountKobo,
      reference: booking._id,
      metadata: {
        custom_fields: [
          { display_name: 'Booking ID',  variable_name: 'bookingId', value: booking._id },
          { display_name: 'Service',     variable_name: 'service',   value: 'Taxi Escrow' },
          { display_name: 'Pickup',      variable_name: 'from',      value: params.from },
          { display_name: 'Destination', variable_name: 'to',        value: params.to },
        ],
      },
      onCancel: () => handleCancel(),
      onSuccess: () => { if (booking?._id) startPolling(booking._id); },
    });
  };

  const initBooking = async () => {
    try {
      const userId    = await AsyncStorage.getItem('userId');
      const userName  = await AsyncStorage.getItem('userName');
      const email     = await AsyncStorage.getItem('userEmail');
      const userPhone = await AsyncStorage.getItem('userPhone');

      if (!userId || !email) {
        setErrorMessage('You must be logged in to request a ride.');
        setPhase('error');
        return;
      }

      setUserEmail(email);

      const payload = {
        userId,
        itemId:          'airgo_direct',
        itemName:        `Taxi: ${params.from} -> ${params.to}`,
        itemType:        'car',
        partnerId:       'airgo_direct',
        checkIn:         params.dateTime,
        checkOut:        params.dateTime,
        guests:          1,
        totalPrice:      '15000',
        status:          'Pending Escrow',
        clientName:      userName  || 'Airgo Client',
        clientEmail:     email,
        clientPhone:     userPhone || '',
        deliveryAddress: params.from,
        city:            extractCity(params.from),
        dropoffAddress:  params.to,
      };

      const res  = await fetch(`${API_URL}/bookings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create booking');

      setBooking(data.booking || data);
      setPhase('payment');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const startPolling = (bookingId: string) => {
    setPhase('verifying');
    let attempts = 0;

    const poll = async () => {
      attempts++;
      setPollCount(attempts);
      try {
        const res = await fetch(`${API_URL}/bookings/${bookingId}`);
        if (res.ok) {
          const b = await res.json();
          if (ESCROW_SECURED_STATUSES.includes(b.status)) {
            setPhase('success');
            setBooking(b);
            return;
          }
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }

      if (attempts < MAX_POLL_ATTEMPTS) {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        Alert.alert(
          'Payment Submitted',
          'Your payment was submitted. We are confirming your escrow. Check My Trips for the live status.',
          [{ text: 'View My Trips', onPress: () => router.replace('/(tabs)/bookings' as any) }]
        );
      }
    };

    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  };

  const handleCancel = async () => {
    if (booking?._id) {
      try {
        await fetch(`${API_URL}/bookings/${booking._id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'Cancelled' }),
        });
      } catch (e) { console.warn('Failed to cancel booking:', e); }
    }
    router.back();
  };

  if (phase === 'creating') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.statusText}>Securing your escrow reservation...</Text>
        <Text style={styles.statusSub}>Please wait while we prepare your booking.</Text>
      </SafeAreaView>
    );
  }

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="close-circle" size={56} color="#E53E3E" />
        <Text style={styles.errorTitle}>Booking Failed</Text>
        <Text style={styles.errorMsg}>{errorMessage}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (phase === 'verifying') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000080" />
        <Text style={styles.statusText}>Verifying your payment...</Text>
        <Text style={styles.statusSub}>Confirming escrow with Airgo ({pollCount}/{MAX_POLL_ATTEMPTS})</Text>
      </SafeAreaView>
    );
  }

  if (phase === 'success') {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="shield-checkmark" size={64} color="#38A169" />
        <Text style={styles.successTitle}>Escrow Secured!</Text>
        <Text style={styles.successSub}>
          Your payment is safely held in Airgo Escrow. Nearby verified drivers are
          being notified and will bid for your ride. You will receive a push
          notification when a driver accepts.
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => router.replace('/(tabs)/bookings' as any)}
        >
          <Ionicons name="list" size={18} color="#000080" style={{ marginRight: 8 }} />
          <Text style={styles.successBtnText}>View My Trips</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Escrow Payment</Text>
        <View style={styles.escrowPill}>
          <Ionicons name="shield-checkmark" size={12} color="#38A169" />
          <Text style={styles.escrowPillText}>Protected</Text>
        </View>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={styles.routeDot} />
          <Text style={styles.routeText} numberOfLines={1}>{params.from}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <Ionicons name="navigate" size={14} color="#FFB81C" />
          <Text style={styles.routeText} numberOfLines={1}>{params.to}</Text>
        </View>
        <Text style={styles.routeDateTime}>{params.dateTime}</Text>
      </View>

      {phase === 'payment' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000080" />
          <Text style={styles.statusText}>Waiting for payment to complete...</Text>
          <Text style={styles.statusSub}>If checkout closed, you can retry using the button below.</Text>
          <TouchableOpacity
            style={[styles.successBtn, { marginTop: 24, backgroundColor: '#000080' }]}
            onPress={triggerPayment}
          >
            <Ionicons name="card-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={[styles.successBtnText, { color: '#FFF' }]}>Pay with Paystack</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function TaxiEscrowScreen() {
  return (
    <PaystackProvider publicKey={PAYSTACK_PUBLIC_KEY}>
      <TaxiEscrowContent />
    </PaystackProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F8F9FA', paddingHorizontal: 32,
  },
  statusText:   { fontSize: 18, fontWeight: '800', color: '#1A202C', marginTop: 20, textAlign: 'center' },
  statusSub:    { fontSize: 13, color: '#718096', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  errorTitle:   { fontSize: 22, fontWeight: '900', color: '#C53030', marginTop: 16, marginBottom: 8 },
  errorMsg:     { fontSize: 14, color: '#4A5568', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  backBtn:      { backgroundColor: '#000080', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  backBtnText:  { color: '#FFF', fontWeight: '900', fontSize: 15 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#1A202C', marginTop: 16, marginBottom: 10 },
  successSub:   { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successBtn:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFB81C', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  successBtnText: { color: '#000080', fontWeight: '900', fontSize: 15 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  escrowPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FFF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#9AE6B4' },
  escrowPillText: { fontSize: 11, fontWeight: '700', color: '#38A169' },
  routeCard:    { marginHorizontal: 20, marginVertical: 14, backgroundColor: '#FFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot:     { width: 14, height: 14, borderRadius: 7, backgroundColor: '#000080' },
  routeText:    { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A202C' },
  routeLine:    { width: 2, height: 18, backgroundColor: '#E2E8F0', marginLeft: 6, marginVertical: 5 },
  routeDateTime: { fontSize: 12, color: '#718096', fontWeight: '600', marginTop: 10, marginLeft: 24 },
});
