import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, ScrollView, TextInput, Modal,
  Keyboard, Dimensions, Animated, Easing, Platform, Alert
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';
import CustomAlertModal from '../../components/ui/CustomAlertModal';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// BRANDED SPLASH / LOADING SCREEN
// ─────────────────────────────────────────────
function BrandedLoadingScreen() {
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0.3)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const spinAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progressAnim, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ])
    ).start();

    // Floating logo animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -15, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    // Spinning ring animation
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeAnim }]}>
      <View style={splashStyles.bgLayer1} />
      <View style={splashStyles.bgLayer2} />

      {/* Rotating and Pulsing Glow Rings */}
      <Animated.View style={[splashStyles.glowRing, { opacity: glowAnim, transform: [{ scale: pulseAnim }, { rotate: spin }] }]} />
      <Animated.View style={[splashStyles.glowRingInner, { opacity: glowAnim, transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }] }]} />

      {/* Floating Logo */}
      <Animated.View style={[splashStyles.logoContainer, { transform: [{ translateY: floatAnim }] }]}>
        <Image
          source={require('../../assets/images/logo1.png')}
          style={splashStyles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={splashStyles.tagline}>Your journey starts here</Text>
      <Text style={splashStyles.subTagline}>Premium hotels · Escrow-protected</Text>

      <View style={splashStyles.pillRow}>
        {['Verified Hotels', 'Secure Escrow', '24/7 Support'].map((label, index) => (
          <Animated.View key={label} style={[splashStyles.pill, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [-15, 0], outputRange: [-2 * (index + 1), 0] }) }] }]}>
            <Text style={splashStyles.pillText}>{label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={splashStyles.progressTrack}>
        <Animated.View style={[splashStyles.progressFill, { width: progressWidth }]} />
      </View>
      <Animated.Text style={[splashStyles.loadingLabel, { opacity: glowAnim.interpolate({ inputRange: [0.3, 0.9], outputRange: [0.4, 1] }) }]}>Loading properties...</Animated.Text>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000080',
  },
  bgLayer1: {
    position: 'absolute', top: -120, right: -80,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(255,184,28,0.07)',
  },
  bgLayer2: {
    position: 'absolute', bottom: -80, left: -100,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  glowRing: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 2, borderColor: 'rgba(255,184,28,0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  glowRingInner: {
    position: 'absolute',
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: 'rgba(255,184,28,0.6)',
    backgroundColor: 'transparent',
  },
  logoContainer: {
    width: 180, height: 80, justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  logo: { width: '100%', height: '100%' },
  tagline: {
    color: '#FFFFFF', fontSize: 20, fontWeight: '800',
    letterSpacing: 0.3, marginBottom: 6, textAlign: 'center',
  },
  subTagline: {
    color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500',
    marginBottom: 28, textAlign: 'center', letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row', gap: 8, marginBottom: 48,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  pillText: { color: '#E2E8F0', fontSize: 11, fontWeight: '600' },
  progressTrack: {
    width: width * 0.55, height: 3, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, overflow: 'hidden', marginBottom: 12,
  },
  progressFill: {
    height: '100%', backgroundColor: '#FFB81C', borderRadius: 2,
  },
  loadingLabel: {
    color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

function isHotelAvailable(hotel: any, checkIn: string, checkOut: string): boolean {
  if (!hotel) return false;
  const allocated = hotel.totalAllocated !== undefined ? hotel.totalAllocated : 1;
  if (allocated <= 0) return false;
  if (!checkIn || !checkOut || !hotel.bookedDates) return true;

  let d = new Date(checkIn);
  const endD = new Date(checkOut);
  while (d < endD) {
    const dateStr = d.toISOString().split('T')[0];
    const dayMatch = hotel.bookedDates?.find((b: any) => b.date === dateStr);
    if (dayMatch && dayMatch.count >= allocated) return false;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return true;
}

export default function HomeScreen() {
  const [hotels, setHotels]           = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [userName, setUserName]       = useState('');
  const [activeTab, setActiveTab]     = useState<'stays' | 'taxi'>('stays');
  const [stayType, setStayType]       = useState<'any' | 'hotel' | 'apartment'>('any');

  const filteredHotels = hotels.filter((hotel: any) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = hotel.name?.toLowerCase().includes(query) || hotel.location?.city?.toLowerCase().includes(query);
    const hType = (hotel.partnerType || 'hotel').toLowerCase();
    const matchesType = stayType === 'any' || hType === stayType;
    return matchesQuery && matchesType;
  });

  const [guests, setGuests]             = useState({ rooms: 1, adults: 2, children: 0 });
  const [showGuestModal, setShowGuestModal]       = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  const [taxiFrom, setTaxiFrom]         = useState('');
  const [taxiTo, setTaxiTo]             = useState('');
  const [taxiDateTime, setTaxiDateTime] = useState('');
  const [showTaxiDateModal, setShowTaxiDateModal] = useState(false);
  const [hasActiveTripLock, setHasActiveTripLock] = useState(false);

  // Alert Modal State
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as any, buttons: [] as any[] });

  const isFocused = useIsFocused();
  const [placesSuggestions, setPlacesSuggestions] = useState<string[]>([]);
  const searchPlacesTimeout = useRef<any>(null);

  const handlePlaceSearch = (query: string, setter: (val: string) => void) => {
    setter(query);
    if (searchPlacesTimeout.current) clearTimeout(searchPlacesTimeout.current);
    
    if (!query || query.length < 3) {
      setPlacesSuggestions([]);
      return;
    }
    
    searchPlacesTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ng&limit=5`, {
          headers: {
            'User-Agent': 'AirgoHotelBookingApp/1.0',
            'Accept': 'application/json'
          }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          setPlacesSuggestions(data.map((d: any) => d.display_name));
        } else {
          setPlacesSuggestions([]);
        }
      } catch (e) {
        console.warn('Place search error', e);
        setPlacesSuggestions([]);
      }
    }, 300);
  };

  const [taxiDateObj, setTaxiDateObj] = useState(new Date());

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationType, setLocationType] = useState<'from' | 'to' | 'search' | ''>('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleUseCurrentLocation = async (target: 'stays' | 'taxi' = 'taxi') => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location permission denied. Please enable it in your device settings.' });
        return;
      }
      
      let location;
      try {
        location = await Location.getCurrentPositionAsync({});
      } catch (locError) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to detect location. Please try again.' });
        return;
      }
      
      if (target === 'stays') {
        setSearchQuery('Current Location');
      } else {
        setTaxiFrom('Current Location');
      }

      try {
        if (!location?.coords?.latitude || !location?.coords?.longitude) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to fetch valid GPS coordinates.' });
          return;
        }

        const reverse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const readableLocation = `${place.street || place.name || ''} ${place.city || place.subregion || ''}`.trim();
          
          if (target === 'stays') {
            setSearchQuery(place.city || place.subregion || readableLocation);
          } else {
            setTaxiFrom(readableLocation);
          }
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Could not resolve your city/street from coordinates. Please type it manually.' });
        }
      } catch (revError) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Could not resolve your city/street from coordinates. Please type it manually.' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to detect location. Please try again.' });
    }
  };

  // Calendar range selection states & helpers
  const onDayPress = (day: any) => {
    const dateStr = day.dateString;
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate('');
    } else {
      if (new Date(dateStr) < new Date(startDate)) {
        setStartDate(dateStr);
        setEndDate('');
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const markedDates = (() => {
    const marked: any = {};
    if (startDate) {
      marked[startDate] = { startingDay: true, color: '#000080', textColor: 'white', selected: true };
    }
    if (endDate) {
      marked[endDate] = { endingDay: true, color: '#000080', textColor: 'white', selected: true };
      
      let start = new Date(startDate);
      const end = new Date(endDate);
      start.setDate(start.getDate() + 1);
      while (start < end) {
        const dateString = start.toISOString().split('T')[0];
        marked[dateString] = { color: 'rgba(0, 0, 128, 0.1)', textColor: '#000080' };
        start.setDate(start.getDate() + 1);
      }
    }
    return marked;
  })();

  // Calculate dynamic max room inventory based on fetched hotels
  const maxRoomsInventory = hotels.length > 0 ? Math.max(...hotels.map((h: any) => h.totalAllocated !== undefined ? h.totalAllocated : 1)) : 4;

  // Guest counter updater
  const updateGuests = (key: 'rooms' | 'adults' | 'children', action: 'add' | 'subtract') => {
    setGuests(prev => {
      const minVal = key === 'children' ? 0 : 1;
      const maxVal = key === 'rooms' ? maxRoomsInventory : 10;
      const current = prev[key];
      const nextVal = action === 'add' ? Math.min(maxVal, current + 1) : Math.max(minVal, current - 1);
      return { ...prev, [key]: nextVal };
    });
  };



  const [lockCheckDone, setLockCheckDone]         = useState(false);

  const router       = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const HOTELS_API_URL = `${API_URL}/hotels`;

  const checkActiveTripLock = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setHasActiveTripLock(false); setLockCheckDone(true); return; }

      const res = await fetch(`${API_URL}/bookings/user/${userId}/active-lock`);
      if (!res.ok) { setLockCheckDone(true); return; }
      const data = await res.json();
      setHasActiveTripLock(!!data.hasActiveLock);
    } catch (e) {
      console.warn('Active-lock check failed:', e);
    } finally {
      setLockCheckDone(true);
    }
  };

  useEffect(() => {
    if (isFocused) {
      AsyncStorage.getItem('userId').then(id => setIsLoggedIn(!!id));
      AsyncStorage.getItem('userName').then(name => {
        if (name) setUserName(name);
      });
      AsyncStorage.getItem('userRole').then(role => {
        if (role === 'driver') {
          router.replace('/driver/dashboard' as any);
        } else if (role === 'partner') {
          router.replace('/partner/dashboard' as any);
        }
      });
      checkActiveTripLock();
    }

    fetch(HOTELS_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setHotels(data);
        setLoading(false);
      })
      .catch((err) => { console.warn('Fetch error:', err); setLoading(false); });
  }, [isFocused]);

  const getSafeImage = (item: any, index: number) => {
    const fallbacks = [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop',
    ];
    const imageArray = item?.images || (item?.image ? [item.image] : []);
    const rawUrl = imageArray?.[0];
    if (!rawUrl || rawUrl.includes('10.') || rawUrl.includes('192.') || rawUrl.includes('localhost') || !rawUrl.startsWith('http')) {
      return fallbacks[index % fallbacks.length];
    }
    return rawUrl;
  };

  const handleSearchPress = () => {
    Keyboard.dismiss();
    scrollViewRef.current?.scrollTo({ y: 360, animated: true });
  };

  const navigateToHotel = (hotelId: string) => {
    let calculatedNights = 2;
    if (startDate && endDate) {
      const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
      calculatedNights = Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
    }
    router.push(`/hotel/${hotelId}?nights=${calculatedNights}`);
  };

  const showActiveTripAlert = () => {
    setAlertConfig({
      title: 'Active Ride in Progress',
      message: 'You already have an active trip or pending escrow payment. Please complete or cancel it before requesting a new ride.',
      type: 'warning',
      buttons: [
        { text: 'Dismiss', style: 'cancel', onPress: () => setShowAlert(false) },
        { text: 'View My Trips', onPress: () => { setShowAlert(false); router.push('/(tabs)/bookings' as any); } }
      ]
    });
    setShowAlert(true);
  };

  const handleTaxiSearch = () => {
    if (hasActiveTripLock) {
      showActiveTripAlert();
      return;
    }
    router.push({
      pathname: '/taxi-escrow' as any,
      params: { from: taxiFrom, to: taxiTo, dateTime: taxiDateTime },
    });
  };

  const formatDateDisplay = () => {
    if (!startDate) return 'Select Dates';
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!endDate) return `${start} - Checkout`;
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  if (loading) return <BrandedLoadingScreen />;



  const trustItems = [
    { icon: 'shield-checkmark', label: 'Verified Partners', sub: 'Strictly vetted luxury properties' },
    { icon: 'lock-closed',       label: 'Escrow-Protected',  sub: 'Funds held until service delivered' },
    { icon: 'headset',           label: '24/7 Support',      sub: 'Always available VIP assistance' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.navyHeader}>
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          <View style={styles.headerTop}>
            <Text style={styles.homeLogoText}>Airgo<Text style={{color: '#FFB81C'}}>.ng</Text></Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isLoggedIn && userName ? (
                <View style={styles.userBadge}>
                  <Ionicons name="person-circle" size={16} color="#FFB81C" style={{ marginRight: 6 }} />
                  <Text style={styles.userBadgeText}>{userName.split(' ')[0]}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push('/auth/register' as any)}>
                    <Text style={styles.ghostBtnText}>Register</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.solidBtn} onPress={() => router.push('/auth/login' as any)}>
                    <Text style={styles.solidBtnText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.heroTitle}>Find Your{'\n'}Perfect Stay</Text>
          <Text style={styles.heroSub}>
            Secure luxury hotels & executive lodgings across Nigeria with{' '}
            <Text style={styles.heroEscrow}>Airgo Escrow Protection.</Text>
          </Text>

          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[styles.tabToggleBtn, activeTab === 'stays' && styles.tabToggleActive]}
              onPress={() => setActiveTab('stays')}
            >
              <Ionicons name="star" size={14} color={activeTab === 'stays' ? '#000080' : '#FFFFFF'} style={{ marginRight: 5 }} />
              <Text style={[styles.tabToggleText, activeTab === 'stays' && styles.tabToggleTextActive]}>Luxury Stay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabToggleBtn, activeTab === 'taxi' && styles.tabToggleActive]}
              onPress={() => setActiveTab('taxi')}
            >
              <Ionicons name="car" size={14} color={activeTab === 'taxi' ? '#000080' : '#FFFFFF'} style={{ marginRight: 5 }} />
              <Text style={[styles.tabToggleText, activeTab === 'taxi' && styles.tabToggleTextActive]}>Taxi</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchConsoleContainer}>
          <View style={styles.searchConsole}>
            {activeTab === 'stays' ? (
              <>
                <View style={{ zIndex: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000080', textTransform: 'uppercase' }}>Hotel, City or Region</Text>
                    <TouchableOpacity onPress={() => handleUseCurrentLocation('stays')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                      <Ionicons name="location" size={12} color="#000080" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000080' }}>Use Current Location</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.searchInputRow}>
                    <Ionicons name="search" size={22} color="#000080" style={styles.searchIcon} />
                    <TextInput
                      placeholder="Hotel, City or Region..."
                      placeholderTextColor="#A0AEC0"
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={(t) => { handlePlaceSearch(t, setSearchQuery); setLocationType('search'); }}
                      onFocus={() => setLocationType('search')}
                      returnKeyType="search"
                      onSubmitEditing={handleSearchPress}
                    />
                  </View>
                  {locationType === 'search' && searchQuery.length > 0 && (
                    <View style={styles.inlineSuggestions}>
                      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{maxHeight: 150}}>
                        {placesSuggestions.map((loc, idx) => (
                          <TouchableOpacity key={`${loc}-${idx}`} style={styles.suggestionItem} onPress={() => { setSearchQuery(loc); setPlacesSuggestions([]); handleSearchPress(); }}>
                            <Ionicons name="location-outline" size={16} color="#718096" style={{ marginRight: 10 }} />
                            <Text style={styles.suggestionText}>{loc}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <View style={styles.consoleDivider} />
                <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center'}}>
                    <Text style={{fontSize: 12, fontWeight: 'bold', color: '#000080'}}>STAY TYPE:</Text>
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <TouchableOpacity onPress={() => setStayType('any')} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: stayType === 'any' ? '#000080' : '#E2E8F0'}}>
                            <Text style={{fontSize: 12, fontWeight: 'bold', color: stayType === 'any' ? '#FFF' : '#4A5568'}}>Any</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStayType('hotel')} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: stayType === 'hotel' ? '#000080' : '#E2E8F0'}}>
                            <Text style={{fontSize: 12, fontWeight: 'bold', color: stayType === 'hotel' ? '#FFF' : '#4A5568'}}>Hotels</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStayType('apartment')} style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: stayType === 'apartment' ? '#000080' : '#E2E8F0'}}>
                            <Text style={{fontSize: 12, fontWeight: 'bold', color: stayType === 'apartment' ? '#FFF' : '#4A5568'}}>Apartments</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.consoleDivider} />
                <View style={styles.consoleActionsRow}>
                  <TouchableOpacity style={styles.consoleAction} onPress={() => setShowCalendarModal(true)}>
                    <Ionicons name="calendar-outline" size={19} color="#000080" />
                    <Text style={styles.consoleActionText} numberOfLines={1}>{formatDateDisplay()}</Text>
                  </TouchableOpacity>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity style={styles.consoleAction} onPress={() => setShowGuestModal(true)}>
                    <Ionicons name="people-outline" size={19} color="#000080" />
                    <Text style={styles.consoleActionText} numberOfLines={1}>
                      {guests.rooms} Room · {guests.adults} Adults
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
                  <Text style={styles.searchButtonText}>Search Hotels</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.taxiConsoleTitle}>WHERE DO YOU WANT TO GO?</Text>
                
                <View style={{ zIndex: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000080', textTransform: 'uppercase' }}>Pickup Location</Text>
                        <TouchableOpacity onPress={() => handleUseCurrentLocation('taxi')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                            <Ionicons name="location" size={12} color="#000080" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000080' }}>Use Current Location</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.taxiInputRow}>
                    <Ionicons name="location" size={18} color="#FFB81C" style={styles.taxiIcon} />
                    <TextInput 
                        style={styles.taxiInput}
                        placeholder="Pickup Location..."
                        placeholderTextColor="#A0AEC0"
                        value={taxiFrom}
                        onChangeText={(t) => { handlePlaceSearch(t, setTaxiFrom); setLocationType('from'); }}
                        onFocus={() => setLocationType('from')}
                        onSubmitEditing={() => setLocationType('')}
                        onBlur={() => setTimeout(() => setLocationType(''), 150)}
                    />
                    </View>
                    {locationType === 'from' && taxiFrom.length > 0 && (
                        <View style={styles.inlineSuggestions}>
                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{maxHeight: 150}}>
                            {placesSuggestions.map((loc, idx) => (
                            <TouchableOpacity key={`${loc}-${idx}`} style={styles.suggestionItem} onPress={() => { setTaxiFrom(loc); setLocationType(''); }}>
                                <Ionicons name="location-outline" size={16} color="#718096" style={{ marginRight: 10 }} />
                                <Text style={styles.suggestionText}>{loc}</Text>
                            </TouchableOpacity>
                            ))}
                        </ScrollView>
                        </View>
                    )}
                </View>

                <View style={styles.consoleDivider} />

                <View style={{ zIndex: 10 }}>
                    <View style={styles.taxiInputRow}>
                    <Ionicons name="navigate" size={18} color="#FFB81C" style={styles.taxiIcon} />
                    <TextInput 
                        style={styles.taxiInput}
                        placeholder="Destination..."
                        placeholderTextColor="#A0AEC0"
                        value={taxiTo}
                        onChangeText={(t) => { handlePlaceSearch(t, setTaxiTo); setLocationType('to'); }}
                        onFocus={() => setLocationType('to')}
                        onSubmitEditing={() => setLocationType('')}
                        onBlur={() => setTimeout(() => setLocationType(''), 150)}
                    />
                    </View>
                    {locationType === 'to' && taxiTo.length > 0 && (
                        <View style={styles.inlineSuggestions}>
                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{maxHeight: 150}}>
                            {placesSuggestions.map((loc, idx) => (
                            <TouchableOpacity key={`${loc}-${idx}`} style={styles.suggestionItem} onPress={() => { setTaxiTo(loc); setLocationType(''); }}>
                                <Ionicons name="location-outline" size={16} color="#718096" style={{ marginRight: 10 }} />
                                <Text style={styles.suggestionText}>{loc}</Text>
                            </TouchableOpacity>
                            ))}
                        </ScrollView>
                        </View>
                    )}
                </View>

                <View style={styles.consoleDivider} />
                <TouchableOpacity style={styles.taxiInputRow} onPress={() => {
                  if (Platform.OS === 'android') {
                    DateTimePickerAndroid.open({
                      value: taxiDateObj,
                      mode: 'date',
                      minimumDate: new Date(),
                      onChange: (event, selectedDate) => {
                        if (event.type === 'set' && selectedDate) {
                          // After date is picked, open time picker
                          DateTimePickerAndroid.open({
                            value: selectedDate,
                            mode: 'time',
                            onChange: (timeEvent, finalDate) => {
                              if (timeEvent.type === 'set' && finalDate) {
                                setTaxiDateObj(finalDate);
                                setTaxiDateTime(finalDate.toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                }));
                              }
                            }
                          });
                        }
                      }
                    });
                  } else {
                    setShowTaxiDateModal(true);
                  }
                }}>
                  <Ionicons name="time-outline" size={18} color="#000080" style={styles.taxiIcon} />
                  <Text style={[styles.taxiInput, { color: taxiDateTime ? '#1A202C' : '#A0AEC0', paddingVertical: 4 }]}>
                    {taxiDateTime || 'Select date & time...'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    hasActiveTripLock && styles.searchButtonLocked,
                  ]}
                  onPress={() => {
                    if (hasActiveTripLock) {
                      showActiveTripAlert();
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
                    if (!taxiDateTime) {
                      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please select a pickup date and time.' });
                      return;
                    }
                    router.push({
                      pathname: '/taxi-escrow' as any,
                      params: { from: taxiFrom, to: taxiTo, dateTime: taxiDateTime },
                    });
                  }}
                  disabled={!lockCheckDone}
                >
                  {hasActiveTripLock ? (
                    <>
                      <Ionicons name="lock-closed" size={15} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={[styles.searchButtonText, { color: '#FFF' }]}>Ride in Progress</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="car" size={16} color="#000080" style={{ marginRight: 8 }} />
                      <Text style={styles.searchButtonText}>Request Ride</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── TRUST BAR ── */}
        <View style={styles.trustBarSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustBarScroll}>
            {trustItems.map((item) => (
              <View key={item.label} style={styles.trustCard}>
                <View style={styles.trustIconCircle}>
                  <Ionicons name={item.icon as any} size={20} color="#FFB81C" />
                </View>
                <Text style={styles.trustLabel}>{item.label}</Text>
                <Text style={styles.trustSub}>{item.sub}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.mainCanvas}>

          {/* ── TAXI INFO PANEL (when Taxi tab is active) ── */}
          {activeTab === 'taxi' && (
            <View style={styles.taxiInfoPanel}>
              <View style={styles.taxiBadge}>
                <Ionicons name="car-sport" size={14} color="#000080" style={{ marginRight: 6 }} />
                <Text style={styles.taxiBadgeText}>VIP Taxi Concierge</Text>
              </View>
              <Text style={styles.taxiInfoTitle}>Request a Ride in Minutes</Text>
              <Text style={styles.taxiInfoSub}>
                Nearby verified chauffeurs will bid for your request, guaranteeing the best possible price under Airgo Escrow protection.
              </Text>
              <View style={styles.taxiStepsRow}>
                {[
                  { step: '1', title: 'Specify Route', desc: 'Enter pickup, destination & timing.' },
                  { step: '2', title: 'Get Bids',      desc: 'Chauffeurs submit live bids.' },
                  { step: '3', title: 'Travel Safe',   desc: 'Payment held in escrow until arrival.' },
                ].map(s => (
                  <View key={s.step} style={styles.taxiStepCard}>
                    <View style={styles.taxiStepNum}>
                      <Text style={styles.taxiStepNumText}>{s.step}</Text>
                    </View>
                    <Text style={styles.taxiStepTitle}>{s.title}</Text>
                    <Text style={styles.taxiStepDesc}>{s.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── SUGGESTED DESTINATIONS ── */}
          {activeTab === 'stays' && !searchQuery && hotels.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Suggested Destinations</Text>
<Text style={styles.sectionSub}>Most popular travel destinations in Nigeria</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {hotels.slice(0, 4).map((item, index) => (
                  <TouchableOpacity
                    key={`pop-${item._id}`}
                    style={styles.destCard}
                    activeOpacity={0.85}
                    onPress={() => navigateToHotel(item._id)}
                  >
                    <Image
                      source={{ uri: getSafeImage(item, index) }}
                      style={styles.destImage}
                      resizeMode="cover"
                    />
                    <View style={styles.destOverlay}>
                      <Text style={styles.destName} numberOfLines={1}>
                        Hotels in {item.location?.city}
                      </Text>
                      <Text style={styles.destCount}>2,642 hotels</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── FEATURED PROPERTIES (main grid) ── */}
          {activeTab === 'stays' && !searchQuery && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Properties</Text>
                <Text style={styles.sectionSub}>Discover handpicked luxury accommodations</Text>
              </View>

              {hotels.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="business" size={48} color="#CBD5E0" />
                  <Text style={{ marginTop: 12, fontSize: 16, color: '#4A5568', fontWeight: 'bold' }}>No properties available yet</Text>
                  <Text style={{ marginTop: 6, fontSize: 14, color: '#718096', textAlign: 'center' }}>Check back later once new hotels and apartments are added.</Text>
                </View>
              ) : (
                <View style={styles.dealsGrid}>
                  {hotels.slice(0, 6).map((item, index) => {
                    const available = isHotelAvailable(item, startDate, endDate);
                    return (
                      <TouchableOpacity
                        key={item._id}
                        style={[styles.propertyCard, !available && { opacity: 0.65 }]}
                        activeOpacity={available ? 0.88 : 1}
                        onPress={() => available ? navigateToHotel(item._id) : null}
                      >
                        <View style={styles.propertyImageWrap}>
                          <Image
                            source={{ uri: getSafeImage(item, index) }}
                            style={styles.propertyImage}
                            resizeMode="cover"
                          />
                          {/* Sold Out overlay — absolute, mirrors web's bg-black/50 + rotate badge */}
                          {!available && (
                            <View style={styles.soldOutOverlay}>
                              <View style={styles.soldOutBadge}>
                                <Text style={styles.soldOutText}>SOLD OUT</Text>
                              </View>
                            </View>
                          )}
                          {/* Discount badge — only shown when available */}
                          {available && item.discountPercentage > 0 && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
                            </View>
                          )}
                          <View style={styles.escrowBadge}>
                            <Ionicons name="shield-checkmark" size={10} color="#fff" />
                            <Text style={styles.escrowText}>Escrow</Text>
                          </View>
                        </View>
                        <View style={styles.propertyInfo}>
                          <Text style={styles.propertyType}>{item.partnerType || 'Hotel'}</Text>
                          <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.propertyLocation} numberOfLines={1}>
                            <Ionicons name="location-outline" size={11} color="#718096" /> {item.location?.city || 'Nigeria'}
                          </Text>
                          <View style={styles.propertyFooter}>
                            <Text style={styles.propertyPrice}>
                              ₦{item.pricePerNight ? item.pricePerNight.toLocaleString() : '85,000'}
                            </Text>
                            <View style={[styles.bookBadge, !available && styles.bookBadgeUnavailable]}>
                              <Text style={styles.bookBadgeText}>{available ? 'Book' : 'Full'}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── SEARCH RESULTS ── */}
          {activeTab === 'stays' && searchQuery && (
            <View style={[styles.section, { paddingHorizontal: 24 }]}>
              <Text style={styles.sectionTitle}>Results for &quot;{searchQuery}&quot;</Text>
              {filteredHotels.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="search-outline" size={32} color="#A0AEC0" />
                  </View>
                  <Text style={styles.emptyTitle}>No hotels found</Text>
                  <Text style={styles.emptySubTitle}>Try a different city or hotel name</Text>
                </View>
              ) : (
                filteredHotels.map((item, index) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.listCard}
                    activeOpacity={0.88}
                    onPress={() => navigateToHotel(item._id)}
                  >
                    <Image
                      source={{ uri: getSafeImage(item, index) }}
                      style={styles.listCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.listCardInfo}>
                      <View style={styles.listCardHeader}>
                        <Text style={styles.listCardName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.listCardPrice}>
                          ₦{item.pricePerNight ? item.pricePerNight.toLocaleString() : '85,000'}
                        </Text>
                      </View>
                      <Text style={styles.listCardLocation}>
                        <Ionicons name="location-outline" size={14} color="#718096" />{' '}
                        {item.location?.city || 'Nigeria'}
                      </Text>
                      <View style={styles.escrowRow}>
                        <Ionicons name="shield-checkmark" size={12} color="#000080" />
                        <Text style={styles.escrowRowText}>Escrow-protected booking</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* ── NEWSLETTER ── */}
          <View style={styles.newsletterSection}>
            <Ionicons name="mail-open" size={36} color="#FFB81C" style={{ marginBottom: 10 }} />
            <Text style={styles.newsTitle}>SPECIAL HOTEL DEALS & OFFERS</Text>
            <Text style={styles.newsSub}>Enter your email address to receive secret hotel deals</Text>
            <View style={styles.newsInputContainer}>
              <TextInput
                style={styles.newsInput}
                placeholder="Enter your email address"
                placeholderTextColor="#A0AEC0"
                value={newsletterEmail}
                onChangeText={setNewsletterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.newsBtn} onPress={async () => {
                if (!newsletterEmail) {
                  Toast.show({ type: 'error', text1: 'Wait!', text2: 'Please enter your email address.' });
                  return;
                }
                try {
                  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: newsletterEmail })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    Toast.show({ type: 'success', text1: 'Success!', text2: data.message || 'Subscribed successfully!' });
                    setNewsletterEmail('');
                  } else {
                    Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'Failed to subscribe.' });
                  }
                } catch (err) {
                  Toast.show({ type: 'error', text1: 'Error', text2: 'Network error. Try again later.' });
                }
              }}>
                <Text style={styles.newsBtnText}>Subscribe</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── FOOTER ── */}
          <View style={styles.footerSection}>
            <View style={styles.footerGrid}>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Company</Text>
                <TouchableOpacity onPress={() => router.push('/info/about' as any)}>
                  <Text style={styles.footerLink}>About Airgo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/how-we-work' as any)}>
                  <Text style={styles.footerLink}>How We Work</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/corporate' as any)}>
                  <Text style={styles.footerLink}>Corporate Solutions</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/sustainability' as any)}>
                  <Text style={styles.footerLink}>Sustainability</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Partners</Text>
                <TouchableOpacity onPress={() => router.push('/auth/partner-register' as any)}>
                  <Text style={[styles.footerLink, { color: '#FFB81C', fontWeight: 'bold' }]}>
                    List your property
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/affiliate' as any)}>
                  <Text style={styles.footerLink}>Affiliate Program</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Support</Text>
                <TouchableOpacity onPress={() => router.push('/info/support' as any)}>
                  <Text style={styles.footerLink}>Help Center</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/terms' as any)}>
                  <Text style={styles.footerLink}>Terms of Service</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/privacy' as any)}>
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Legal</Text>
                <TouchableOpacity onPress={() => router.push('/info/escrow-protection' as any)}>
                  <Text style={styles.footerLink}>Escrow Protection</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/partner-dispute' as any)}>
                  <Text style={styles.footerLink}>Partner Dispute</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/cookie-policy' as any)}>
                  <Text style={styles.footerLink}>Cookie Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.footerDivider} />
            <Text style={styles.copyrightText}>© {new Date().getFullYear()} Airgo.ng — All rights reserved.</Text>
            <Text style={{fontSize: 10, color: 'gray', textAlign: 'center', marginVertical: 10}}>v1.0.0-Sprint4</Text>
          </View>

        </View>
      </ScrollView>

      {/* ── MODALS ── */}
      <Modal visible={showCalendarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dates</Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close-circle" size={30} color="#CBD5E0" />
              </TouchableOpacity>
            </View>
            <Calendar
              minDate={new Date().toISOString().split('T')[0]}
              markingType="period"
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={{ todayTextColor: '#000080', arrowColor: '#000080', selectedDayBackgroundColor: '#000080' }}
            />
            <TouchableOpacity style={styles.modalApplyButton} onPress={() => setShowCalendarModal(false)}>
              <Text style={styles.modalApplyText}>Confirm Dates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGuestModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Who is coming?</Text>
              <TouchableOpacity onPress={() => setShowGuestModal(false)}>
                <Ionicons name="close-circle" size={30} color="#CBD5E0" />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Rooms',    key: 'rooms'    as const, max: maxRoomsInventory },
              { label: 'Adults',   key: 'adults'   as const, sub: 'Ages 13 or above', max: 10 },
              { label: 'Children', key: 'children' as const, sub: 'Ages 0-12', max: 10 },
            ].map(item => {
              const isMax = guests[item.key] >= item.max;
              return (
              <View key={item.key} style={styles.counterRow}>
                <View>
                  <Text style={styles.counterLabel}>{item.label}</Text>
                  {item.sub && <Text style={styles.counterSub}>{item.sub}</Text>}
                </View>
                <View style={styles.counterControls}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => updateGuests(item.key, 'subtract')}>
                    <Ionicons name="remove" size={20} color="#000080" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{guests[item.key]}</Text>
                  <TouchableOpacity 
                    style={[styles.counterBtn, isMax && { opacity: 0.5 }]} 
                    disabled={isMax}
                    onPress={() => updateGuests(item.key, 'add')}
                  >
                    <Ionicons name="add" size={20} color="#000080" />
                  </TouchableOpacity>
                </View>
              </View>
            )})}
            <TouchableOpacity style={styles.modalApplyButton} onPress={() => setShowGuestModal(false)}>
              <Text style={styles.modalApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ── TAXI MODALS ── */}
      {Platform.OS === 'ios' && showTaxiDateModal && (
        <DateTimePicker
          minimumDate={new Date()}
          value={taxiDateObj}
          mode="datetime"
          display="spinner"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' || event.type === 'dismissed') {
              setShowTaxiDateModal(false);
            }
            if (selectedDate) {
              setTaxiDateObj(selectedDate);
              const formatted = selectedDate.toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              });
              setTaxiDateTime(formatted);
            }
          }}
        />
      )}

      <CustomAlertModal
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── HERO HEADER ──
  navyHeader: {
    backgroundColor: '#000080',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  orb1: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,184,28,0.08)',
  },
  orb2: {
    position: 'absolute', bottom: 20, left: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  homeLogoText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  userBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  userBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  ghostBtnText: { color: '#E2E8F0', fontSize: 14, fontWeight: '700' },
  solidBtn: {
    backgroundColor: '#FFB81C',
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
  },
  solidBtnText: { color: '#000080', fontSize: 14, fontWeight: '900' },
  heroTitle: {
    color: '#FFFFFF', fontSize: 32, fontWeight: '900',
    lineHeight: 38, marginBottom: 10,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.7)', fontSize: 13,
    lineHeight: 20, marginBottom: 24,
  },
  heroEscrow: { color: '#FFB81C', fontWeight: '700' },

  // ── TAB TOGGLE ──
  tabToggleRow: { flexDirection: 'row', gap: 10 },
  tabToggleBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  tabToggleActive: { backgroundColor: '#FFB81C', borderColor: '#FFB81C' },
  tabToggleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  tabToggleTextActive: { color: '#000080' },

  // ── SEARCH CONSOLE ──
  searchConsoleContainer: {
    paddingHorizontal: 20, marginTop: -55, zIndex: 10,
  },
  searchConsole: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 24,
    shadowColor: '#000080', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
  },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A202C', fontWeight: '600' },
  consoleDivider: { height: 1, backgroundColor: '#EDF2F7', marginVertical: 10, marginHorizontal: 10 },
  consoleActionsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 10, marginBottom: 14, alignItems: 'center',
  },
  consoleAction: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 7 },
  consoleActionText: { color: '#4A5568', fontSize: 13, fontWeight: '600' },
  verticalDivider: { width: 1, height: 28, backgroundColor: '#EDF2F7', marginHorizontal: 10 },
  searchButton: {
    backgroundColor: '#FFB81C', justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', padding: 16, borderRadius: 16,
  },
  searchButtonText: { color: '#000080', fontSize: 16, fontWeight: '900' },

  // Taxi search console fields
  taxiConsoleTitle: { fontSize: 14, fontWeight: '800', color: '#1A202C', marginBottom: 10, paddingHorizontal: 8 },
  taxiInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  taxiIcon: { marginRight: 10 },
  taxiInput: { flex: 1, fontSize: 14, color: '#1A202C', fontWeight: '500' },
  inlineSuggestions: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 100, borderWidth: 1, borderColor: '#EDF2F7', marginTop: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  suggestionText: { fontSize: 14, color: '#2D3748' },

  // ── TRUST BAR ──
  trustBarSection: { marginTop: 20, paddingBottom: 4 },
  trustBarScroll: { paddingHorizontal: 20, gap: 12 },
  trustCard: {
    width: 140, backgroundColor: '#FFF', borderRadius: 18,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  trustIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  trustLabel: { fontSize: 12, fontWeight: '800', color: '#1A202C', textAlign: 'center', marginBottom: 4 },
  trustSub: { fontSize: 10, color: '#718096', textAlign: 'center', lineHeight: 14 },

  // ── MAIN CANVAS ──
  mainCanvas: { backgroundColor: '#F8F9FA', minHeight: 400, paddingTop: 24 },

  // ── TAXI INFO PANEL ──
  taxiInfoPanel: { marginHorizontal: 20, marginBottom: 28, backgroundColor: '#FFF', borderRadius: 24, padding: 22, shadowColor: '#000', shadowOpacity: 0.06, elevation: 4 },
  taxiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 14 },
  taxiBadgeText: { fontSize: 11, fontWeight: '800', color: '#000080', textTransform: 'uppercase', letterSpacing: 0.5 },
  taxiInfoTitle: { fontSize: 20, fontWeight: '900', color: '#1A202C', marginBottom: 8 },
  taxiInfoSub: { fontSize: 13, color: '#718096', lineHeight: 20, marginBottom: 20 },
  taxiStepsRow: { flexDirection: 'row', gap: 10 },
  taxiStepCard: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 14, padding: 12 },
  taxiStepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  taxiStepNumText: { fontSize: 13, fontWeight: '900', color: '#000080' },
  taxiStepTitle: { fontSize: 12, fontWeight: '800', color: '#1A202C', marginBottom: 4 },
  taxiStepDesc: { fontSize: 11, color: '#718096', lineHeight: 15 },

  // ── SECTIONS ──
  section: { marginBottom: 32 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A202C' },
  sectionSub: { fontSize: 12, color: '#718096', marginTop: 3 },
  horizontalScroll: { paddingLeft: 24, paddingRight: 10 },

  // ── DESTINATION CARDS ──
  destCard: {
    width: 150, height: 140, marginRight: 14, borderRadius: 20,
    overflow: 'hidden', position: 'relative',
  },
  destImage: { width: '100%', height: '100%' },
  destOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', padding: 10,
  },
  destName: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  destCount: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },

  // ── PROPERTY GRID CARDS ──
  dealsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, gap: 14 },
  propertyCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 20,
    overflow: 'hidden', shadowColor: '#000080',
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },
  propertyImageWrap: { height: 120, position: 'relative' },
  propertyImage: { width: '100%', height: '100%' },

  // ── SOLD OUT overlay ── mirrors web bg-black/50 + rotate-12 badge
  soldOutOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center', alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: '#C53030', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, transform: [{ rotate: '-12deg' }],
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  soldOutText: {
    color: '#FFF', fontSize: 10, fontWeight: '900',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },

  discountBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#E53E3E', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 8,
    shadowColor: '#E53E3E', shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
  },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  escrowBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,128,0.75)', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 8, gap: 4,
  },
  escrowText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  propertyInfo: { padding: 12 },
  propertyType: { fontSize: 9, color: '#718096', textTransform: 'uppercase', fontWeight: '700', marginBottom: 2 },
  propertyName: { fontSize: 13, fontWeight: '800', color: '#1A202C', marginBottom: 3 },
  propertyLocation: { fontSize: 11, color: '#718096', marginBottom: 8 },
  propertyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propertyPrice: { fontSize: 14, fontWeight: '900', color: '#000080' },
  bookBadge: { backgroundColor: '#000080', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  bookBadgeUnavailable: { backgroundColor: '#A0AEC0' },
  bookBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // ── LOCKED REQUEST RIDE button ──
  searchButtonLocked: { backgroundColor: '#4A5568' },

  // ── LIST CARD (search results) ──
  listCard: {
    backgroundColor: '#FFF', borderRadius: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.07, elevation: 4, overflow: 'hidden',
  },
  listCardImage: { width: '100%', height: 180, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  listCardInfo: { padding: 16 },
  listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listCardName: { fontSize: 17, fontWeight: '800', color: '#1A202C', flex: 1 },
  listCardPrice: { fontSize: 17, fontWeight: '900', color: '#000080' },
  listCardLocation: { color: '#718096', fontSize: 13, marginBottom: 8 },
  escrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  escrowRowText: { fontSize: 12, color: '#000080', fontWeight: '600' },

  // ── EMPTY STATE ──
  emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0F4F8',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#2D3748', marginBottom: 6 },
  emptySubTitle: { fontSize: 13, color: '#A0AEC0' },

  // ── NEWSLETTER ──
  newsletterSection: {
    backgroundColor: '#000080', padding: 30, alignItems: 'center', marginTop: 10,
  },
  newsTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  newsSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 18 },
  newsInputContainer: {
    flexDirection: 'row', width: '100%', backgroundColor: '#FFF',
    borderRadius: 14, overflow: 'hidden',
  },
  newsInput: { flex: 1, paddingHorizontal: 15, height: 50, color: '#1A202C', fontSize: 13 },
  newsBtn: { backgroundColor: '#FFB81C', justifyContent: 'center', paddingHorizontal: 18 },
  newsBtnText: { color: '#000080', fontWeight: '900', fontSize: 13 },

  // ── FOOTER ──
  footerSection: { backgroundColor: '#0D1117', padding: 28, paddingBottom: 50 },
  footerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  footerCol: { width: '45%', marginBottom: 22 },
  footerHeader: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  footerLink: { color: '#718096', fontSize: 12, marginBottom: 7 },
  footerDivider: { height: 1, backgroundColor: '#1E2530', marginVertical: 18 },
  copyrightText: { color: '#4A5568', fontSize: 11, textAlign: 'center' },

  // ── MODALS ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 25, paddingBottom: 44,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A202C' },
  counterRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  counterLabel: { fontSize: 17, color: '#2D3748', fontWeight: '700' },
  counterSub: { fontSize: 12, color: '#A0AEC0', marginTop: 3 },
  counterControls: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA',
  },
  counterValue: {
    fontSize: 18, fontWeight: '800', color: '#1A202C',
    width: 45, textAlign: 'center',
  },
  modalApplyButton: {
    backgroundColor: '#000080', padding: 18, borderRadius: 16,
    alignItems: 'center', marginTop: 14,
  },
  modalApplyText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});