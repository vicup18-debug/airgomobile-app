import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { API_URL } from '../../constants/config';
import CustomAlertModal from '../../components/ui/CustomAlertModal';
import { useIsFocused } from '@react-navigation/native';

export default function TaxiScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();

  const [taxiFrom, setTaxiFrom] = useState('');
  const [taxiTo, setTaxiTo] = useState('');
  const [locationType, setLocationType] = useState<'from' | 'to' | ''>('');
  const [placesSuggestions, setPlacesSuggestions] = useState<string[]>([]);
  const [hasActiveTripLock, setHasActiveTripLock] = useState(false);
  const [lockCheckDone, setLockCheckDone] = useState(false);
  const [globalCity, setGlobalCity] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as any, buttons: [] as any[] });
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (isFocused) {
      checkActiveTripLock();
      Location.getForegroundPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(loc => {
            Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }).then(rev => {
              if (rev && rev.length > 0) {
                const city = rev[0].city || rev[0].subregion || rev[0].region;
                if (city) setGlobalCity(city);
              }
            }).catch(() => {});
          }).catch(() => {});
        }
      });
    }
  }, [isFocused]);

  const checkActiveTripLock = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setLockCheckDone(true); return; }
      const res = await fetch(`${API_URL}/bookings/user/${userId}/active-lock`);
      if (res.ok) {
        const data = await res.json();
        setHasActiveTripLock(!!data.hasActiveLock);
      }
    } catch (e) { /* ignore */ } finally {
      setLockCheckDone(true);
    }
  };

  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const handlePlaceSearch = (query: string, setter: (v: string) => void) => {
    setter(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query || query.length < 3) { setPlacesSuggestions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const finalQuery = globalCity && !query.toLowerCase().includes(globalCity.toLowerCase())
          ? `${query}, ${globalCity}` : query;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&countrycodes=ng&limit=5`, {
          headers: { 'User-Agent': 'AirgoHotelBookingApp/1.0', 'Accept': 'application/json' }
        });
        const data = await res.json();
        setPlacesSuggestions(data?.length > 0 ? data.map((d: any) => ({ name: d.display_name, lat: parseFloat(d.lat), lon: parseFloat(d.lon) })) : []);
      } catch { setPlacesSuggestions([]); }
    }, 300);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Enable location in device settings.' });
        return;
      }
      setTaxiFrom('Fetching location...');
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPickupCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const readable = `${place.street || place.name || ''} ${place.city || place.subregion || ''}`.trim();
          if (readable.length > 3) { setTaxiFrom(readable); return; }
        }
      } catch { /* fallback */ }
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`, {
        headers: { 'User-Agent': 'AirgoHotelBookingApp/1.0' }
      });
      const data = await res.json();
      if (data?.address) {
        const { road, suburb, neighbourhood, city, town, state } = data.address;
        setTaxiFrom(`${road || neighbourhood || suburb || ''} ${city || town || state || ''}`.trim() || 'Current Location');
      } else {
        setTaxiFrom('Current Location');
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to access location.' });
    }
  };

  const showActiveTripAlert = () => {
    setAlertConfig({
      title: 'Active Ride in Progress',
      message: 'You already have an active trip or pending payment. Please complete or cancel it first.',
      type: 'warning',
      buttons: [
        { text: 'Dismiss', style: 'cancel', onPress: () => setShowAlert(false) },
        { text: 'View My Trips', onPress: () => { setShowAlert(false); router.push('/(tabs)/bookings' as any); } }
      ]
    });
    setShowAlert(true);
  };

  const handleSearch = async () => {
    if (hasActiveTripLock) { showActiveTripAlert(); return; }
    const role = await AsyncStorage.getItem('userRole');
    if (role === 'driver' || role === 'partner' || role === 'admin') {
      Toast.show({ type: 'error', text1: 'Not Allowed', text2: 'Drivers and partners cannot request rides.' });
      return;
    }
    if (!taxiFrom.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please enter a pickup location.' });
      return;
    }
    if (!taxiTo.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please enter a destination.' });
      return;
    }

    // Attempt to get device GPS coordinates if not already captured
    let finalCoords = pickupCoords;
    if (!finalCoords) {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          finalCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch (e) { /* ignore */ }
    }

    router.push({
      pathname: '/taxi-bidding' as any,
      params: {
        from: taxiFrom,
        to: taxiTo,
        dateTime: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        pickupLat: finalCoords ? finalCoords.latitude.toString() : '',
        pickupLon: finalCoords ? finalCoords.longitude.toString() : '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="car" size={26} color="#FFB81C" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Book a Taxi</Text>
              <Text style={styles.headerSub}>Fast · Reliable · Escrow-Protected</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>WHERE DO YOU WANT TO GO?</Text>

            {/* Pickup */}
            <View style={{ zIndex: 20 }}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Pickup Location</Text>
                <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.locationBtn}>
                  <Ionicons name="locate" size={12} color="#000080" style={{ marginRight: 4 }} />
                  <Text style={styles.locationBtnText}>Use Current Location</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="location" size={18} color="#FFB81C" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ikeja, Lagos"
                  placeholderTextColor="#A0AEC0"
                  value={taxiFrom}
                  onChangeText={t => { handlePlaceSearch(t, setTaxiFrom); setLocationType('from'); }}
                  onFocus={() => setLocationType('from')}
                  onBlur={() => setTimeout(() => setLocationType(''), 150)}
                />
              </View>
              {locationType === 'from' && taxiFrom.length > 0 && placesSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 150 }}>
                    {placesSuggestions.map((loc: any, i) => {
                      const locName = typeof loc === 'string' ? loc : loc.name;
                      return (
                        <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => {
                          setTaxiFrom(locName);
                          if (typeof loc === 'object' && loc.lat && loc.lon) {
                            setPickupCoords({ latitude: loc.lat, longitude: loc.lon });
                          }
                          setLocationType('');
                          setPlacesSuggestions([]);
                        }}>
                          <Ionicons name="location-outline" size={14} color="#718096" style={{ marginRight: 8 }} />
                          <Text style={styles.suggestionText} numberOfLines={1}>{locName}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Divider with car icon */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerCar}>
                <Ionicons name="car" size={14} color="#000080" />
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Destination */}
            <View style={{ zIndex: 10 }}>
              <View style={styles.inputRow}>
                <Ionicons name="navigate" size={18} color="#000080" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Victoria Island, Lagos"
                  placeholderTextColor="#A0AEC0"
                  value={taxiTo}
                  onChangeText={t => { handlePlaceSearch(t, setTaxiTo); setLocationType('to'); }}
                  onFocus={() => setLocationType('to')}
                  onBlur={() => setTimeout(() => setLocationType(''), 150)}
                />
              </View>
              {locationType === 'to' && taxiTo.length > 0 && placesSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 150 }}>
                    {placesSuggestions.map((loc, i) => (
                      <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => { setTaxiTo(loc); setLocationType(''); setPlacesSuggestions([]); }}>
                        <Ionicons name="location-outline" size={14} color="#718096" style={{ marginRight: 8 }} />
                        <Text style={styles.suggestionText} numberOfLines={1}>{loc}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={[styles.searchBtn, hasActiveTripLock && styles.searchBtnLocked]}
              onPress={handleSearch}
              disabled={!lockCheckDone}
            >
              {hasActiveTripLock ? (
                <>
                  <Ionicons name="lock-closed" size={15} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.searchBtnText}>Ride in Progress</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={16} color="#000080" style={{ marginRight: 8 }} />
                  <Text style={[styles.searchBtnText, { color: '#000080' }]}>Find a Driver</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Badges */}
          <View style={styles.badges}>
            {[
              { icon: 'shield-checkmark', label: 'Escrow Protection' },
              { icon: 'time', label: 'Real-Time Matching' },
              { icon: 'star', label: 'Verified Drivers' },
            ].map((b, i) => (
              <View key={i} style={styles.badge}>
                <Ionicons name={b.icon as any} size={18} color="#000080" />
                <Text style={styles.badgeText}>{b.label}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { padding: 20, paddingTop: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#000080', borderRadius: 20, padding: 18, marginBottom: 20,
  },
  headerIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5, marginBottom: 20,
  },
  cardLabel: { fontSize: 10, fontWeight: '800', color: '#000080', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#4A5568', textTransform: 'uppercase' },
  locationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  locationBtnText: { fontSize: 10, fontWeight: '700', color: '#000080' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F9FC',
    borderRadius: 12, paddingHorizontal: 12, marginBottom: 4,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 46, fontSize: 14, color: '#1A202C' },
  suggestions: {
    backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
    shadowRadius: 8, elevation: 3, marginBottom: 6,
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  suggestionText: { fontSize: 13, color: '#2D3748', flex: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerCar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EEF2F6', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10,
  },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFB81C', borderRadius: 14, paddingVertical: 14, marginTop: 16,
  },
  searchBtnLocked: { backgroundColor: '#718096' },
  searchBtnText: { fontSize: 15, fontWeight: '800' },
  badges: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  badge: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#4A5568', textAlign: 'center' },
});


