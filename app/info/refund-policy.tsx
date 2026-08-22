import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RefundPolicyScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Refund Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                
                {/* Title Badge */}
                <View style={styles.badgeRow}>
                    <Text style={styles.badgeText}>OFFICIAL POLICY</Text>
                </View>
                
                <Text style={styles.mainTitle}>Refund &amp; Cancellation Policy</Text>
                <Text style={styles.subtitle}>Airgo Travel &amp; Tour &bull; Applicable to Clients, Hotels, Apartments &amp; Partners</Text>
                <Text style={styles.effectiveDate}>Effective Date: August 2026</Text>

                <View style={styles.divider} />

                {/* Section 1 */}
                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    This Refund and Cancellation Policy sets out the terms and conditions governing cancellations, refunds and related charges for hotel and apartment bookings made through Airgo Travel &amp; Tour (&quot;Airgo&quot;).
                </Text>
                <Text style={styles.paragraph}>
                    The policy applies to both clients/customers who make accommodation bookings through Airgo and hotel, apartment and accommodation partners (&quot;Partners&quot;) who list or provide accommodation through Airgo.
                </Text>
                <Text style={styles.paragraph}>
                    By making, accepting or processing a booking through Airgo, the client and/or partner agrees to be bound by this policy.
                </Text>
                <View style={styles.highlightBox}>
                    <Text style={styles.highlightText}>
                        Airgo acts as a booking and travel service platform/agent connecting clients with accommodation providers. Airgo does not independently determine the cancellation or refund terms of every hotel or apartment. The applicable hotel or apartment cancellation and refund policy shall be the primary basis for determining whether a refund is available.
                    </Text>
                </View>

                {/* Section 2 */}
                <Text style={styles.sectionTitle}>2. Important Notice to Clients</Text>
                <Text style={styles.paragraph}>Before completing a hotel or apartment booking, clients are strongly advised to:</Text>
                <Text style={styles.bullet}>• Carefully review the hotel&apos;s or apartment&apos;s cancellation policy.</Text>
                <Text style={styles.bullet}>• Confirm the check-in and check-out dates.</Text>
                <Text style={styles.bullet}>• Confirm the number of guests.</Text>
                <Text style={styles.bullet}>• Verify the room or apartment type.</Text>
                <Text style={styles.bullet}>• Confirm the location and facilities.</Text>
                <Text style={styles.bullet}>• Confirm the hotel&apos;s rules and restrictions.</Text>
                <Text style={styles.bullet}>• Ensure that the selected accommodation meets their requirements before making payment.</Text>
                <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                        Clients are advised to verify their stay and all booking details before payment because cancellation may result in partial or no refund. Once a booking has been confirmed, cancellation is subject to the cancellation and refund conditions applicable to that particular hotel or apartment.
                    </Text>
                </View>

                {/* Section 3 */}
                <Text style={styles.sectionTitle}>3. Hotel/Apartment Cancellation Policy Takes Priority</Text>
                <Text style={styles.paragraph}>
                    The cancellation policy of the hotel or apartment booked by the client shall determine whether the booking is refundable, partially refundable or non-refundable.
                </Text>
                <Text style={styles.paragraph}>Cancellation policies may vary between accommodation providers and may depend on date of cancellation, rate, peak-season, room type, no-show status, early departure, and agreed partner terms.</Text>
                <Text style={[styles.paragraph, { fontWeight: 'bold', color: '#1A202C' }]}>
                    Therefore, Airgo cannot guarantee a refund simply because a client requests cancellation.
                </Text>

                {/* Section 4 */}
                <Text style={styles.sectionTitle}>4. When a Refund May Be Granted</Text>
                <Text style={styles.paragraph}>A refund may only be considered where:</Text>
                <Text style={styles.bullet}>1. The hotel or apartment&apos;s cancellation policy permits a refund; or</Text>
                <Text style={styles.bullet}>2. The hotel/apartment owner/management voluntarily agrees to provide a refund; or</Text>
                <Text style={styles.bullet}>3. Airgo determines that a refund is appropriate based on circumstances and partner agreements.</Text>

                {/* Section 5 */}
                <Text style={styles.sectionTitle}>5. Airgo&apos;s Suggested Default Refund Percentage</Text>
                <Text style={styles.paragraph}>
                    Where a hotel or apartment accepts a refund but does not specify a different refund percentage or where Airgo&apos;s applicable partner agreement permits the use of Airgo&apos;s default refund framework, <Text style={{ fontWeight: 'bold' }}>Airgo recommends a default refund of 70% of the eligible booking amount</Text>.
                </Text>
                <Text style={styles.paragraph}>
                    The remaining <Text style={{ fontWeight: 'bold' }}>30%</Text> may be retained or applied towards applicable cancellation, administrative, processing, service or other permitted charges.
                </Text>
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Important Note:</Text>
                    <Text style={styles.infoCardText}>
                        The 70% figure is a suggested Airgo default refund framework and is not a guarantee of a 70% refund. The actual amount refundable depends on the property policy, agreed provider percentage, and processing fees.
                    </Text>
                </View>

                {/* Section 6 */}
                <Text style={styles.sectionTitle}>6. Cancellation Percentage Is Determined at Time of Cancellation</Text>
                <Text style={styles.paragraph}>
                    There is no universal cancellation percentage applicable to all Airgo accommodation bookings. The refundable percentage can only be properly determined after a cancellation request has been made and reviewed.
                </Text>

                {/* Section 7 */}
                <Text style={styles.sectionTitle}>7. Non-Refundable Bookings</Text>
                <Text style={styles.paragraph}>
                    Some hotels, apartments or promotional rates may be designated as non-refundable (promotional rates, discounted rates, special offers, last-minute rates, advance purchase, or peak season bookings).
                </Text>

                {/* Section 8 */}
                <Text style={styles.sectionTitle}>8. Cancellation Request Procedure for Clients</Text>
                <Text style={styles.paragraph}>
                    Clients wishing to cancel a booking should contact Airgo as soon as possible with their full name, reference number, hotel name, check-in/out dates, and reason for cancellation.
                </Text>

                {/* Section 9 */}
                <Text style={styles.sectionTitle}>9. Refund Processing</Text>
                <Text style={styles.paragraph}>
                    Where a refund is approved, Airgo will initiate processing subject to hotel approval, processor/bank timelines, transaction fees, and administrative charges.
                </Text>

                {/* Section 10 */}
                <Text style={styles.sectionTitle}>10. Partner Cancellations</Text>
                <Text style={styles.paragraph}>
                    Where a partner cancels a confirmed booking, Airgo will attempt to find comparable alternative accommodation, transfer the booking with client consent, or process a refund.
                </Text>

                {/* Section 11 & 12 */}
                <Text style={styles.sectionTitle}>11 &amp; 12. Partner Obligations &amp; Refund Percentages</Text>
                <Text style={styles.paragraph}>
                    Partners must comply with agreed terms and not misrepresent policies. Where a partner confirms a specific refund percentage (e.g. 80%), that agreed percentage applies.
                </Text>

                {/* Section 13 */}
                <Text style={styles.sectionTitle}>13. Airgo Fees and Charges</Text>
                <Text style={styles.paragraph}>
                    Refunds may be subject to applicable Airgo service fees, admin charges, payment processing fees, bank charges, and non-refundable third-party costs already incurred.
                </Text>

                {/* Section 14 & 15 */}
                <Text style={styles.sectionTitle}>14 &amp; 15. No-Show &amp; Early Check-Out</Text>
                <Text style={styles.paragraph}>
                    Failure to check in or early check-outs do not automatically entitle a client to a refund and are subject strictly to property policies.
                </Text>

                {/* Section 16 & 17 */}
                <Text style={styles.sectionTitle}>16 &amp; 17. Booking Changes &amp; Force Majeure</Text>
                <Text style={styles.paragraph}>
                    Requests to change dates or room types may be treated as cancellations if the provider doesn&apos;t permit amendments. Exceptional events beyond reasonable control are evaluated per property policy.
                </Text>

                {/* Section 18 & 19 */}
                <Text style={styles.sectionTitle}>18 &amp; 19. Payment Errors &amp; Disputes</Text>
                <Text style={styles.paragraph}>
                    Duplicate charges will be refunded upon verification. Disputed refund decisions can be submitted to Airgo support for full evidence review.
                </Text>

                {/* Section 20 & 21 */}
                <Text style={styles.sectionTitle}>20 &amp; 21. Responsibilities of Clients &amp; Partners</Text>
                <Text style={styles.paragraph}>
                    Clients must review cancellation terms before payment. Partners are obligated to state conditions clearly and honor confirmed reservations and agreed refund percentages.
                </Text>

                {/* Section 22 & 23 */}
                <View style={styles.acceptanceCard}>
                    <Text style={styles.acceptanceTitle}>22 &amp; 23. Disclaimer &amp; Policy Acceptance</Text>
                    <Text style={styles.acceptanceText}>
                        Airgo acts as a booking platform and does not guarantee that every hotel or apartment will approve a refund. By completing a booking or listing accommodation on Airgo, clients and partners agree to this policy.
                    </Text>
                    <View style={styles.contactRow}>
                        <TouchableOpacity onPress={() => Linking.openURL('tel:07078344409')} style={styles.contactBtn}>
                            <Ionicons name="call" size={16} color="#004A99" />
                            <Text style={styles.contactBtnText}>07078344409</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL('mailto:info@airgo.ng')} style={styles.contactBtn}>
                            <Ionicons name="mail" size={16} color="#004A99" />
                            <Text style={styles.contactBtnText}>info@airgo.ng</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 24, paddingBottom: 60 },
    
    badgeRow: { alignSelf: 'flex-start', backgroundColor: '#EBF4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
    badgeText: { color: '#004A99', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    
    mainTitle: { fontSize: 24, fontWeight: '900', color: '#1A202C', marginBottom: 6 },
    subtitle: { fontSize: 13, fontWeight: '600', color: '#718096', lineHeight: 18 },
    effectiveDate: { fontSize: 11, color: '#A0AEC0', marginTop: 4, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
    
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#004A99', marginTop: 18, marginBottom: 8 },
    paragraph: { fontSize: 14, color: '#4A5568', lineHeight: 22, marginBottom: 10 },
    bullet: { fontSize: 13, color: '#4A5568', lineHeight: 20, marginLeft: 8, marginBottom: 6 },
    
    highlightBox: { backgroundColor: '#F7FAFC', borderLeftWidth: 4, borderLeftColor: '#004A99', padding: 14, borderRadius: 8, marginVertical: 12 },
    highlightText: { fontSize: 13, color: '#2D3748', lineHeight: 20, fontWeight: '500' },
    
    warningBox: { backgroundColor: '#FFF5F5', borderLeftWidth: 4, borderLeftColor: '#E53E3E', padding: 14, borderRadius: 8, marginVertical: 12 },
    warningText: { fontSize: 13, color: '#9B2C2C', lineHeight: 20, fontWeight: '600' },
    
    infoCard: { backgroundColor: '#EDF2F7', padding: 14, borderRadius: 12, marginVertical: 10 },
    infoCardTitle: { fontSize: 12, fontWeight: '800', color: '#2D3748', textTransform: 'uppercase', marginBottom: 4 },
    infoCardText: { fontSize: 12, color: '#4A5568', lineHeight: 18 },
    
    acceptanceCard: { backgroundColor: '#EBF4FF', padding: 18, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: '#C3DAFE' },
    acceptanceTitle: { fontSize: 16, fontWeight: '800', color: '#004A99', marginBottom: 8 },
    acceptanceText: { fontSize: 13, color: '#2C5282', lineHeight: 20 },
    contactRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BEE3F8' },
    contactBtnText: { fontSize: 12, fontWeight: '700', color: '#004A99' }
});
