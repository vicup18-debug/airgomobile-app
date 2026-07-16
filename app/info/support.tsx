import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking, Image } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/config';

interface FAQ {
    question: string;
    answer: string;
}

const FAQS: FAQ[] = [
    { question: "How does the Airgo Escrow system work?", answer: "When you book a stay or a car, your payment is held securely in the Airgo Escrow ledger. The funds are only disbursed to the partner after your check-in or booking starts successfully, ensuring 100% protection against scams and overbookings." },
    { question: "What is your cancellation and refund policy?", answer: "Reservations covered under our Escrow framework are eligible for a 70% refund of the total booking price directly back to your payout account, provided cancellation is requested within the standard policy window." },
    { question: "How do I check in or pick up my car?", answer: "Once payment is verified, your official VAT invoice and secure itinerary PDF are sent to your email. This document contains exact instructions, pick-up points, and the verified partner's direct hotline for check-in." },
    { question: "Can I modify my booking dates?", answer: "Yes, you can request changes to check-in/out dates from your Client Dashboard. Any adjustments are subject to availability and will automatically recalculate the pricing based on seasonal rates." },
    { question: "How do I list my hotel or vehicle fleet?", answer: "Sign up via the Partner portal. Once our compliance team reviews your business documentation and approves your profile, you will be able to list items directly on the live matrix pool." },
    { question: "When are payouts disbursed to partners?", answer: "Once a booking commences, the escrow funds are authorized by our super admin team. Partner disbursements are initiated via direct bank transfer to your registered payout credentials." }
];

export default function SupportScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'chat' | 'faqs' | 'message'>('chat');
    
    // Contact Form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('Inquiry');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // FAQ
    const [faqSearch, setFaqSearch] = useState('');
    const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

    // Chat
    const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
        { sender: 'bot', text: "Hello! I'm the Airgo Concierge Assistant. Ask me anything about our Stays, Car Rentals, Escrow ledger, or Partner protocols!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSendMessage = async () => {
        if (!name || !email || !message) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all fields before sending.' });
            return;
        }
        setIsSending(true);
        try {
            const response = await fetch(`${API_URL}/auth/support`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });
            const data = await response.json();
            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Support message sent successfully! Our concierge team will get back to you shortly.' });
                setName(''); setEmail(''); setMessage('');
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'Failed to send message.' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Network Error', text2: 'Please check your connection and try again.' });
        } finally {
            setIsSending(false);
        }
    };

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeString }]);
        setChatInput('');
        setIsBotTyping(true);
        
        setTimeout(() => {
            let reply = "I'm sorry, I couldn't fully capture that. Feel free to contact our support lines or submit a direct message in the 'Contact' tab above!";
            const q = userMsg.toLowerCase();
            if (q.includes('escrow') || q.includes('safe') || q.includes('money') || q.includes('secure')) {
                reply = "All payments are secured in the Airgo Escrow ledger. Funds are only disbursed to the service partner after you check-in or start your booking successfully.";
            } else if (q.includes('refund') || q.includes('cancel') || q.includes('return')) {
                reply = "Cancellations inside the policy window qualify for a 70% refund directly to your payout account. You can request a cancellation from your dashboard.";
            } else if (q.includes('book') || q.includes('invoice') || q.includes('reserve')) {
                reply = "Choose an item from Stays or Cars, click book, and complete the Pay Escrow process. You'll instantly receive a VAT Invoice PDF in your inbox.";
            } else if (q.includes('partner') || q.includes('join') || q.includes('host') || q.includes('list')) {
                reply = "To list your hotel or fleet, sign up under the Partner tab. Once verified by compliance, you will get access to list your properties.";
            } else if (q.includes('payout') || q.includes('payouts') || q.includes('disburse')) {
                reply = "Partner payouts are processed securely after a client checks in or booking commences. Funds are sent via bank transfer.";
            } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
                reply = "Hello! How can I help you today? Ask me about escrow, refunds, bookings, or joining as a partner.";
            }
            setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            setIsBotTyping(false);
        }, 800);
    };

    const filteredFaqs = FAQS.filter(faq => {
        const query = faqSearch.toLowerCase();
        return faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
    });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                
                {/* 🌟 HERO HEADER */}
                <View style={styles.heroHeader}>
                    <View style={styles.orb1} />
                    <View style={styles.orb2} />
                    
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.heroContent}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Concierge Assistance</Text>
                        </View>
                        <Text style={styles.heroTitle}>How can we help you today?</Text>
                        <Text style={styles.heroSub}>
                            Get prompt assistance for your stays, fleet rentals, escrow transactions, and affiliate earnings.
                        </Text>
                    </View>
                </View>

                {/* 📞 OFFICIAL CHANNELS (Left Panel on Web) */}
                <View style={styles.channelsCard}>
                    <Text style={styles.channelsTitle}>Official Channels</Text>
                    
                    <TouchableOpacity style={styles.channelRow} onPress={() => Linking.openURL('tel:+2347078344409')}>
                        <View style={styles.channelIcon}><Text style={{fontSize: 20}}>📞</Text></View>
                        <View>
                            <Text style={styles.channelLabel}>Call Support 24/7</Text>
                            <Text style={styles.channelValue}>+234 707 834 4409</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.channelRow} onPress={() => Linking.openURL('mailto:info@airgo.ng')}>
                        <View style={styles.channelIcon}><Text style={{fontSize: 20}}>✉️</Text></View>
                        <View>
                            <Text style={styles.channelLabel}>General Inquiries</Text>
                            <Text style={styles.channelValue}>info@airgo.ng</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.escrowCard}>
                    <Text style={styles.escrowTitle}>🛡️ Airgo Escrow Guarantee</Text>
                    <Text style={styles.escrowText}>
                        Every reservation made on Airgo is fully backed by multi-sig partner protocol escrows. Your funds are secured until check-in or delivery is confirmed.
                    </Text>
                </View>

                {/* ⚙️ SMART CUSTOMER TABS (Right Panel on Web) */}
                <View style={styles.tabsContainer}>
                    <View style={styles.tabSelector}>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'chat' && styles.tabBtnActive]} onPress={() => setActiveTab('chat')}>
                            <Text style={[styles.tabBtnText, activeTab === 'chat' && styles.tabBtnTextActive]}>💬 AI Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'faqs' && styles.tabBtnActive]} onPress={() => setActiveTab('faqs')}>
                            <Text style={[styles.tabBtnText, activeTab === 'faqs' && styles.tabBtnTextActive]}>❓ FAQs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tabBtn, activeTab === 'message' && styles.tabBtnActive]} onPress={() => setActiveTab('message')}>
                            <Text style={[styles.tabBtnText, activeTab === 'message' && styles.tabBtnTextActive]}>✉️ Contact</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabContentArea}>
                        {/* 💬 TAB 1: AI CONCIERGE CHATBOT */}
                        {activeTab === 'chat' && (
                            <View style={styles.chatContainer}>
                                <ScrollView 
                                    ref={scrollViewRef} 
                                    style={styles.chatScroll} 
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                                >
                                    {chatMessages.map((msg, i) => (
                                        <View key={i} style={[styles.chatBubbleWrapper, msg.sender === 'user' ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
                                            <View style={[styles.chatBubble, msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot]}>
                                                <Text style={[styles.chatText, msg.sender === 'user' ? styles.chatTextUser : styles.chatTextBot]}>{msg.text}</Text>
                                                <Text style={[styles.chatTime, msg.sender === 'user' ? styles.chatTimeUser : styles.chatTimeBot]}>{msg.time}</Text>
                                            </View>
                                        </View>
                                    ))}
                                    {isBotTyping && (
                                        <View style={styles.typingIndicator}>
                                            <Text style={styles.typingText}>Concierge Assistant is typing...</Text>
                                        </View>
                                    )}
                                </ScrollView>
                                <View style={styles.chatInputRow}>
                                    <TextInput 
                                        style={styles.chatInput} 
                                        placeholder="Ask support..." 
                                        value={chatInput} 
                                        onChangeText={setChatInput} 
                                        onSubmitEditing={handleSendChat}
                                    />
                                    <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat}>
                                        <Text style={styles.chatSendBtnText}>Send</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* ❓ TAB 2: FAQ ACCORDIONS */}
                        {activeTab === 'faqs' && (
                            <View style={styles.faqContainer}>
                                <View style={styles.searchRow}>
                                    <Ionicons name="search" size={16} color="#A0AEC0" style={styles.searchIcon} />
                                    <TextInput 
                                        style={styles.faqSearchInput} 
                                        placeholder="Filter FAQs by keyword..." 
                                        value={faqSearch} 
                                        onChangeText={setFaqSearch}
                                    />
                                </View>
                                {filteredFaqs.length === 0 ? (
                                    <Text style={styles.noFaqsText}>No FAQs match your search criteria.</Text>
                                ) : (
                                    filteredFaqs.map((faq, index) => {
                                        const isOpen = expandedFaqIndex === index;
                                        return (
                                            <View key={index} style={styles.faqCard}>
                                                <TouchableOpacity style={styles.faqHeader} onPress={() => setExpandedFaqIndex(isOpen ? null : index)}>
                                                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                                                    <Text style={styles.faqIcon}>{isOpen ? '▲' : '▼'}</Text>
                                                </TouchableOpacity>
                                                {isOpen && (
                                                    <View style={styles.faqBody}>
                                                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* ✉️ TAB 3: CONTACT FORM */}
                        {activeTab === 'message' && (
                            <View style={styles.contactFormContainer}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput style={styles.inputField} placeholder="e.g. John Doe" value={name} onChangeText={setName} />
                                
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <TextInput style={styles.inputField} placeholder="e.g. john@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                                
                                <Text style={styles.inputLabel}>How can we assist you?</Text>
                                <TextInput style={[styles.inputField, styles.textArea]} placeholder="Include booking reference numbers..." multiline numberOfLines={4} textAlignVertical="top" value={message} onChangeText={setMessage} />

                                <TouchableOpacity style={[styles.submitBtn, isSending && styles.submitBtnDisabled]} onPress={handleSendMessage} disabled={isSending}>
                                    <Text style={styles.submitBtnText}>{isSending ? 'Sending Support Message...' : 'Send Direct Support Message'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    content: { paddingBottom: 40 },
    
    // HERO HEADER
    heroHeader: {
        backgroundColor: '#000080',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 20,
    },
    orb1: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,184,28,0.1)' },
    orb2: { position: 'absolute', bottom: -30, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    heroContent: { alignItems: 'center', marginTop: 10 },
    badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 15 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    heroSub: { color: '#EBF4FF', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },

    // CHANNELS CARD
    channelsCard: { backgroundColor: '#FFF', marginHorizontal: 20, padding: 20, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3, marginBottom: 15 },
    channelsTitle: { fontSize: 12, fontWeight: '900', color: '#1A202C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
    channelRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 16, marginBottom: 10 },
    channelIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    channelLabel: { fontSize: 10, fontWeight: '800', color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 2 },
    channelValue: { fontSize: 15, fontWeight: '900', color: '#1A202C' },

    // ESCROW CARD
    escrowCard: { backgroundColor: '#000080', marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 20 },
    escrowTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 8 },
    escrowText: { color: '#EBF4FF', fontSize: 12, lineHeight: 18 },

    // TABS
    tabsContainer: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
    tabSelector: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    tabBtnActive: { backgroundColor: '#FFF', borderBottomWidth: 2, borderBottomColor: '#004A99' },
    tabBtnText: { fontSize: 11, fontWeight: '900', color: '#A0AEC0', textTransform: 'uppercase' },
    tabBtnTextActive: { color: '#004A99' },
    tabContentArea: { padding: 20, minHeight: 400 },

    // CHAT TAB
    chatContainer: { flex: 1 },
    chatScroll: { flex: 1, maxHeight: 300, marginBottom: 15 },
    chatBubbleWrapper: { marginBottom: 15, flexDirection: 'row' },
    chatBubbleRight: { justifyContent: 'flex-end' },
    chatBubbleLeft: { justifyContent: 'flex-start' },
    chatBubble: { maxWidth: '85%', padding: 15, borderRadius: 20 },
    chatBubbleUser: { backgroundColor: '#004A99', borderTopRightRadius: 4 },
    chatBubbleBot: { backgroundColor: '#F0F4F8', borderTopLeftRadius: 4 },
    chatText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    chatTextUser: { color: '#FFF' },
    chatTextBot: { color: '#1A202C' },
    chatTime: { fontSize: 10, marginTop: 5, textAlign: 'right' },
    chatTimeUser: { color: 'rgba(255,255,255,0.7)' },
    chatTimeBot: { color: '#A0AEC0' },
    typingIndicator: { alignSelf: 'flex-start', backgroundColor: '#F0F4F8', padding: 12, borderRadius: 15, borderTopLeftRadius: 4 },
    typingText: { fontSize: 12, fontWeight: 'bold', color: '#718096' },
    chatInputRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 8, borderRadius: 16, borderWidth: 1, borderColor: '#EDF2F7' },
    chatInput: { flex: 1, paddingHorizontal: 12, fontSize: 14, color: '#1A202C' },
    chatSendBtn: { backgroundColor: '#004A99', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
    chatSendBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },

    // FAQ TAB
    faqContainer: { flex: 1 },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 20 },
    searchIcon: { marginRight: 10 },
    faqSearchInput: { flex: 1, height: 45, fontSize: 14, color: '#1A202C' },
    noFaqsText: { textAlign: 'center', color: '#A0AEC0', marginTop: 20 },
    faqCard: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 12, overflow: 'hidden' },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F8F9FA' },
    faqQuestion: { fontSize: 13, fontWeight: '800', color: '#1A202C', flex: 1, marginRight: 10 },
    faqIcon: { fontSize: 12, color: '#004A99', fontWeight: '900' },
    faqBody: { padding: 15, borderTopWidth: 1, borderTopColor: '#EDF2F7' },
    faqAnswer: { fontSize: 13, color: '#4A5568', lineHeight: 20 },

    // MESSAGE TAB
    contactFormContainer: { flex: 1 },
    inputLabel: { fontSize: 11, fontWeight: '900', color: '#1A202C', textTransform: 'uppercase', marginBottom: 6 },
    inputField: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 14, color: '#1A202C', marginBottom: 15 },
    textArea: { height: 100, paddingTop: 15 },
    submitBtn: { backgroundColor: '#004A99', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5 },
    submitBtnDisabled: { backgroundColor: '#A0AEC0' },
    submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' }
});