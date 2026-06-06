import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Modal, Keyboard, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { API_URL } from '../../constants/config';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const [guests, setGuests] = useState({ rooms: 1, adults: 2, children: 0 });
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const router = useRouter();
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);

  const HOTELS_API_URL = `${API_URL}/hotels`;

  useEffect(() => {
    if (isFocused) {
      AsyncStorage.getItem('userId').then(id => setIsLoggedIn(!!id));
      AsyncStorage.getItem('userName').then(name => {
        if (name) setUserName(name);
      });
    }

    fetch(HOTELS_API_URL)
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [isFocused]);

  const getSafeImage = (imageArray: any, index: number) => {
    const fallbacks = [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop'
    ];

    const rawUrl = imageArray?.[0];

    // 🟢 NEW: If it's empty, a local IP, OR doesn't start with 'http', use the fallback
    if (!rawUrl || rawUrl.includes('10.') || rawUrl.includes('192.') || rawUrl.includes('localhost') || !rawUrl.startsWith('http')) {
      return fallbacks[index % fallbacks.length];
    }

    return rawUrl;
  };

  const filteredHotels = hotels.filter((hotel) => {
    const cityMatch = hotel?.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return cityMatch || nameMatch;
  });

  const handleSearchPress = () => {
    Keyboard.dismiss();
    scrollViewRef.current?.scrollTo({ y: 340, animated: true });
  };

  const updateGuests = (type: 'rooms' | 'adults' | 'children', operation: 'add' | 'subtract') => {
    setGuests(prev => {
      const newValue = operation === 'add' ? prev[type] + 1 : prev[type] - 1;
      if (newValue < 0) return prev;
      if (type === 'rooms' && newValue < 1) return prev;
      if (type === 'adults' && newValue < 1) return prev;
      return { ...prev, [type]: newValue };
    });
  };

  const onDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate('');
    } else if (startDate && !endDate) {
      if (day.dateString > startDate) {
        setEndDate(day.dateString);
      } else {
        setStartDate(day.dateString);
      }
    }
  };

  const formatDateDisplay = () => {
    if (!startDate) return 'Select Dates';
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!endDate) return `${start} - Checkout`;
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const markedDates: any = {};
  if (startDate) markedDates[startDate] = { startingDay: true, color: '#004A99', textColor: 'white' };
  if (endDate) markedDates[endDate] = { endingDay: true, color: '#004A99', textColor: 'white' };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#004A99" />
      </View>
    );
  }

  // Mock data for the Deals section based on the PDF template
  const topDeals = [
    { id: '1', type: 'Hotel', name: 'The Blowfish Hotel', price: '95,000', discount: 'Up to 20% off', imgIndex: 0 },
    { id: '2', type: 'Apartment', name: 'The Blowfish Hotel', price: '95,000', discount: 'Up to 20% off', imgIndex: 1 },
    { id: '3', type: 'Hotel', name: 'The Blowfish Hotel', price: '95,000', discount: 'Up to 20% off', imgIndex: 2 },
    { id: '4', type: 'Apartment', name: 'The Blowfish Hotel', price: '95,000', discount: 'Up to 20% off', imgIndex: 3 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* 🟢 PREMIUM BLUE HEADER WITH TABS */}
        <View style={styles.blueHeader}>
          <View style={styles.headerTop}>
            {/* 🟢 PREMIUM HOMEPAGE LOGO */}
            <Image
              source={require('../../assets/images/logo1.png')}
              style={styles.homeLogo}
              resizeMode="contain"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isLoggedIn && userName ? (
                <View style={styles.userBadge}>
                  <Text style={styles.navLink}>{userName.split(' ')[0]}</Text>
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

          {/* Template Tabs Navigation */}
          <View style={styles.topTabs}>
            <TouchableOpacity style={[styles.tabBtn, styles.activeTab]}><Text style={styles.activeTabText}>Stay</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tabBtn}><Text style={styles.tabText}>Flights</Text></TouchableOpacity>
            <TouchableOpacity style={styles.tabBtn}><Text style={styles.tabText}>Car rental</Text></TouchableOpacity>
          </View>

          <Text style={styles.headerTagline}>Find your next Hotel & Apartment</Text>
          <Text style={styles.headerSub}>Search low prices on hotels, homes and much more...</Text>
        </View>

        {/* 🟢 SEARCH CONSOLE */}
        <View style={styles.searchConsoleContainer}>
          <View style={styles.searchConsole}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={24} color="#004A99" style={styles.searchIcon} />
              <TextInput placeholder="Search for hotel, Apartments" placeholderTextColor="#A0AEC0" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" onSubmitEditing={handleSearchPress} />
            </View>
            <View style={styles.consoleDivider} />
            <View style={styles.consoleActionsRow}>
              <TouchableOpacity style={styles.consoleAction} onPress={() => setShowCalendarModal(true)}>
                <Ionicons name="calendar-outline" size={20} color="#004A99" />
                <Text style={styles.consoleActionText} numberOfLines={1}>{formatDateDisplay()}</Text>
              </TouchableOpacity>
              <View style={styles.verticalDivider} />
              <TouchableOpacity style={styles.consoleAction} onPress={() => setShowGuestModal(true)}>
                <Ionicons name="people-outline" size={20} color="#004A99" />
                <Text style={styles.consoleActionText} numberOfLines={1}>{guests.rooms} Room • {guests.adults} Adults</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.executeButton} onPress={handleSearchPress}>
              <Text style={styles.executeButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainCanvas}>

          {/* 🟢 SUGGESTED DESTINATIONS */}
          {!searchQuery && hotels.length > 0 && (
            <View style={styles.popularSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Suggested Destinations</Text>
                <Text style={styles.sectionSub}>Below are the most popular travel destinations in Nigeria</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {hotels.slice(0, 4).map((item, index) => (
                  <TouchableOpacity key={`pop-${item._id}`} style={styles.popularCard} onPress={() => router.push(`/hotel/${item._id}`)}>
                    <View style={styles.popImageContainer}>
                      <Image source={{ uri: getSafeImage(item.images, index) }} style={styles.popularImage} resizeMode="cover" />
                    </View>
                    <View style={styles.popularInfo}>
                      <Text style={styles.popularName} numberOfLines={1}>Hotels in {item.location?.city}</Text>
                      <Text style={styles.popularLocation}>2,642 hotels</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 🟢 NEW: TOP HOTEL DEALS */}
          {!searchQuery && (
            <View style={styles.dealsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Hotel Deals</Text>
                <Text style={styles.sectionSub}>A selection of the best hotel deals, only available today</Text>
              </View>
              <View style={styles.dealsGrid}>
                {topDeals.map((deal) => (
                  <View key={deal.id} style={styles.dealCard}>
                    <View style={styles.dealImageContainer}>
                      <Image source={{ uri: getSafeImage([], deal.imgIndex) }} style={styles.dealImage} resizeMode="cover" />
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{deal.discount}</Text>
                      </View>
                    </View>
                    <View style={styles.dealInfo}>
                      <Text style={styles.dealType}>{deal.type}</Text>
                      <Text style={styles.dealName} numberOfLines={1}>{deal.name}</Text>
                      <Text style={styles.dealPrice}>NGN {deal.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 🟢 MAIN RESULTS FEED */}
          {searchQuery && (
            <View style={styles.feedSection}>
              <Text style={styles.sectionTitle}>Results for &quot;{searchQuery}&quot;</Text>
              {filteredHotels.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={50} color="#CBD5E0" />
                  <Text style={styles.noResultsText}>No hotels found in this area.</Text>
                </View>
              ) : (
                filteredHotels.map((item, index) => (
                  <TouchableOpacity key={item._id} style={styles.hotelCard} activeOpacity={0.9} onPress={() => router.push(`/hotel/${item._id}`)}>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: getSafeImage(item.images, index) }} style={styles.hotelImage} resizeMode="cover" />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.hotelPrice}>NGN {item.pricePerNight ? item.pricePerNight.toLocaleString() : '85,000'}</Text>
                      </View>
                      <Text style={styles.hotelLocation}><Ionicons name="location-outline" size={16} color="#718096" /> {item.location?.city || 'Nigeria'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* 🟢 NEW: NEWSLETTER SUBSCRIPTION */}
          <View style={styles.newsletterSection}>
            <Ionicons name="mail-open" size={40} color="#FFB81C" style={{ marginBottom: 10 }} />
            <Text style={styles.newsTitle}>SPECIAL HOTEL DEALS AND OFFERS</Text>
            <Text style={styles.newsSub}>Enter your email address to receive secret hotels deals</Text>
            <View style={styles.newsInputContainer}>
              <TextInput
                style={styles.newsInput}
                placeholder="Enter your email Address"
                placeholderTextColor="#A0AEC0"
                value={newsletterEmail}
                onChangeText={setNewsletterEmail}
              />
              <TouchableOpacity style={styles.newsBtn}>
                <Text style={styles.newsBtnText}>Subscribe</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🟢 NEW: FOOTER */}
          <View style={styles.footerSection}>
            <View style={styles.footerGrid}>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Support</Text>
                <Text style={styles.footerLink}>Contact Customer Service</Text>
                <Text style={styles.footerLink}>Airgo.ng for Travel Agents</Text>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Terms and settings</Text>
                <Text style={styles.footerLink}>Privacy Notice</Text>
                <Text style={styles.footerLink}>Terms of Service</Text>
                <Text style={styles.footerLink}>Partner dispute</Text>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Partners</Text>
                <TouchableOpacity onPress={() => router.push('/partner/select-type' as any)}>
                  <Text style={[styles.footerLink, { color: '#FFB81C', fontWeight: 'bold' }]}>List your property</Text>
                </TouchableOpacity>
                <Text style={styles.footerLink}>Become an affiliate</Text>
              </View>
              {/* Footer Links Column 1 */}
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Company</Text>
                <TouchableOpacity onPress={() => router.push('/info/about' as any)}><Text style={styles.footerLink}>About Airgo</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/how-we-work' as any)}><Text style={styles.footerLink}>How We Work</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/sustainability' as any)}><Text style={styles.footerLink}>Sustainability</Text></TouchableOpacity>
              </View>

              {/* Footer Links Column 2 */}
              <View style={styles.footerCol}>
                <Text style={styles.footerHeader}>Support</Text>
                <TouchableOpacity><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/terms' as any)}><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/info/privacy' as any)}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.footerDivider} />
            <Text style={styles.copyrightText}>Copyright © 2026 Airgo.ng All rights reserved.</Text>
          </View>

        </View>
      </ScrollView>

      {/* MODALS REMAIN THE SAME... */}
      <Modal visible={showCalendarModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dates</Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}><Ionicons name="close-circle" size={30} color="#E2E8F0" /></TouchableOpacity>
            </View>
            <Calendar markingType={'period'} markedDates={markedDates} onDayPress={onDayPress} theme={{ todayTextColor: '#004A99', arrowColor: '#004A99' }} />
            <TouchableOpacity style={styles.modalApplyButton} onPress={() => setShowCalendarModal(false)}><Text style={styles.modalApplyText}>Confirm Dates</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGuestModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Who is coming?</Text>
              <TouchableOpacity onPress={() => setShowGuestModal(false)}><Ionicons name="close-circle" size={30} color="#E2E8F0" /></TouchableOpacity>
            </View>
            {[
              { label: 'Rooms', key: 'rooms' as const },
              { label: 'Adults', key: 'adults' as const, sub: 'Ages 13 or above' },
              { label: 'Children', key: 'children' as const, sub: 'Ages 0-12' }
            ].map(item => (
              <View key={item.key} style={styles.counterRow}>
                <View><Text style={styles.counterLabel}>{item.label}</Text>{item.sub && <Text style={styles.counterSub}>{item.sub}</Text>}</View>
                <View style={styles.counterControls}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => updateGuests(item.key, 'subtract')}><Ionicons name="remove" size={20} color="#004A99" /></TouchableOpacity>
                  <Text style={styles.counterValue}>{guests[item.key]}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => updateGuests(item.key, 'add')}><Ionicons name="add" size={20} color="#004A99" /></TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.modalApplyButton} onPress={() => setShowGuestModal(false)}><Text style={styles.modalApplyText}>Apply</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },

  blueHeader: { backgroundColor: '#004A99', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 90 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  // 🟢 HOMEPAGE LOGO STYLE
  homeLogo: {
    width: 140,
    height: 45,
    marginBottom: 5,
    // tintColor: '#FFF' // Uncomment this ONLY if your logo text is dark and you need it to turn pure white against the blue header!
  },

  userBadge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  navLink: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  ghostBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  ghostBtnText: { color: '#E2E8F0', fontSize: 15, fontWeight: 'bold' },
  solidBtn: { backgroundColor: '#FFB81C', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  solidBtnText: { color: '#004A99', fontSize: 15, fontWeight: 'bold' },

  topTabs: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  activeTab: { backgroundColor: '#FFF', borderColor: '#FFF' },
  tabText: { color: '#FFF', fontWeight: '600' },
  activeTabText: { color: '#004A99', fontWeight: 'bold' },

  headerTagline: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  headerSub: { color: '#E2E8F0', fontSize: 14, opacity: 0.9 },

  searchConsoleContainer: { paddingHorizontal: 20, marginTop: -50, zIndex: 10 },
  searchConsole: { backgroundColor: '#FFF', padding: 15, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  searchIcon: { marginRight: 15 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A202C', fontWeight: '500' },
  consoleDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10, marginHorizontal: 15 },
  consoleActionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 15, alignItems: 'center' },
  consoleAction: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  consoleActionText: { color: '#4A5568', fontSize: 14, fontWeight: '600' },
  verticalDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  executeButton: { backgroundColor: '#FFB81C', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16 },
  executeButtonText: { color: '#004A99', fontSize: 18, fontWeight: '900' },

  mainCanvas: { backgroundColor: '#F8F9FA', minHeight: '100%', paddingTop: 20 },

  popularSection: { marginBottom: 30 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1A202C' },
  sectionSub: { fontSize: 13, color: '#718096', marginTop: 4 },
  horizontalScroll: { paddingLeft: 24, paddingRight: 10 },

  popularCard: { width: 160, marginRight: 16, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 10 },
  popImageContainer: { height: 120 },
  popularImage: { width: '100%', height: '100%' },
  popularInfo: { padding: 12 },
  popularName: { fontSize: 14, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  popularLocation: { color: '#718096', fontSize: 12 },

  dealsSection: { paddingHorizontal: 24, marginBottom: 30 },
  dealsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dealCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
  dealImageContainer: { height: 110, position: 'relative' },
  dealImage: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#E53E3E', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dealInfo: { padding: 12 },
  dealType: { fontSize: 10, color: '#718096', textTransform: 'uppercase', marginBottom: 2 },
  dealName: { fontSize: 14, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  dealPrice: { fontSize: 14, fontWeight: '900', color: '#004A99' },

  feedSection: { paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  noResultsText: { fontSize: 16, color: '#718096', marginTop: 10 },
  hotelCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.08, elevation: 4 },
  imageContainer: { position: 'relative' },
  hotelImage: { width: '100%', height: 200, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cardInfo: { padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  hotelName: { fontSize: 18, fontWeight: '800', color: '#1A202C', flex: 1 },
  hotelPrice: { fontSize: 18, fontWeight: '900', color: '#004A99' },
  hotelLocation: { color: '#718096', fontSize: 14 },

  newsletterSection: { backgroundColor: '#004A99', padding: 30, alignItems: 'center', marginTop: 20 },
  newsTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  newsSub: { color: '#E2E8F0', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  newsInputContainer: { flexDirection: 'row', width: '100%', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  newsInput: { flex: 1, paddingHorizontal: 15, height: 50, color: '#1A202C' },
  newsBtn: { backgroundColor: '#FFB81C', justifyContent: 'center', paddingHorizontal: 20 },
  newsBtnText: { color: '#004A99', fontWeight: 'bold' },

  footerSection: { backgroundColor: '#1A202C', padding: 30, paddingBottom: 50 },
  footerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  footerCol: { width: '45%', marginBottom: 25 },
  footerHeader: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  footerLink: { color: '#A0AEC0', fontSize: 13, marginBottom: 8 },
  footerDivider: { height: 1, backgroundColor: '#2D3748', marginVertical: 20 },
  copyrightText: { color: '#718096', fontSize: 12, textAlign: 'center' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A202C' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  counterLabel: { fontSize: 18, color: '#2D3748', fontWeight: '700' },
  counterSub: { fontSize: 13, color: '#A0AEC0', marginTop: 4 },
  counterControls: { flexDirection: 'row', alignItems: 'center' },
  counterBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  counterValue: { fontSize: 18, fontWeight: '800', color: '#1A202C', width: 45, textAlign: 'center' },
  modalApplyButton: { backgroundColor: '#004A99', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 15 },
  modalApplyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});