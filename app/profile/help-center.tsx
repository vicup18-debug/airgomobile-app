import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpCenterScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'faqs' | 'chat'>('faqs');

    const faqs = [
        { q: 'How do I book a hotel?', a: 'Search for your destination, choose dates, and select a property that fits your needs.' },
        { q: 'What is Airgo Escrow?', a: 'Airgo Escrow protects your funds by holding them securely until the service is fully delivered.' },
        { q: 'How do I cancel a booking?', a: 'Go to your Bookings tab, select the active trip, and tap Cancel Booking. Cancellation policies apply.' },
        { q: 'How do I become a driver?', a: 'Go to your Profile tab and click "Become a Driver" to submit your application and documents.' },
    ];

    // Chat State
    const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
        { sender: 'bot', text: "Hello! I'm the Airgo Concierge Assistant. Ask me anything about our Stays, Car Rentals, Escrow ledger, or Partner protocols!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

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

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabSelector}>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'faqs' && styles.tabBtnActive]} onPress={() => setActiveTab('faqs')}>
                    <Text style={[styles.tabBtnText, activeTab === 'faqs' && styles.tabBtnTextActive]}>❓ FAQs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, activeTab === 'chat' && styles.tabBtnActive]} onPress={() => setActiveTab('chat')}>
                    <Text style={[styles.tabBtnText, activeTab === 'chat' && styles.tabBtnTextActive]}>💬 AI Chat</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'faqs' ? (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    
                    {faqs.map((faq, index) => (
                        <View key={index} style={styles.faqCard}>
                            <Text style={styles.faqQ}>{faq.q}</Text>
                            <Text style={styles.faqA}>{faq.a}</Text>
                        </View>
                    ))}

                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Contact Support</Text>
                    <TouchableOpacity style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="mail" size={20} color="#004A99" />
                        </View>
                        <View>
                            <Text style={styles.contactTitle}>Email Us</Text>
                            <Text style={styles.contactSub}>support@airgo.ng</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard}>
                        <View style={styles.contactIcon}>
                            <Ionicons name="call" size={20} color="#004A99" />
                        </View>
                        <View>
                            <Text style={styles.contactTitle}>Call Us</Text>
                            <Text style={styles.contactSub}>+234 800 AIRGO NG</Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <View style={styles.chatContainer}>
                    <ScrollView 
                        ref={scrollViewRef} 
                        style={styles.chatScroll} 
                        contentContainerStyle={{ paddingBottom: 20, padding: 15 }}
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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#004A99', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20
    },
    backButton: { padding: 5 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    
    // TABS
    tabSelector: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EDF2F7', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: {width:0, height:2} },
    tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#004A99' },
    tabBtnText: { fontSize: 14, fontWeight: 'bold', color: '#A0AEC0' },
    tabBtnTextActive: { color: '#004A99' },

    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 15 },
    faqCard: {
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 15,
        borderWidth: 1, borderColor: '#E2E8F0'
    },
    faqQ: { fontSize: 16, fontWeight: 'bold', color: '#004A99', marginBottom: 8 },
    faqA: { fontSize: 14, color: '#4A5568', lineHeight: 22 },
    contactCard: {
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 15,
        borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center'
    },
    contactIcon: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF4FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 15
    },
    contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
    contactSub: { fontSize: 14, color: '#718096' },

    // CHAT
    chatContainer: { flex: 1, backgroundColor: '#F8F9FA' },
    chatScroll: { flex: 1 },
    chatBubbleWrapper: { marginBottom: 15, flexDirection: 'row' },
    chatBubbleRight: { justifyContent: 'flex-end' },
    chatBubbleLeft: { justifyContent: 'flex-start' },
    chatBubble: { maxWidth: '85%', padding: 15, borderRadius: 20 },
    chatBubbleUser: { backgroundColor: '#004A99', borderTopRightRadius: 4 },
    chatBubbleBot: { backgroundColor: '#EBF4FF', borderTopLeftRadius: 4 },
    chatText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    chatTextUser: { color: '#FFF' },
    chatTextBot: { color: '#1A202C' },
    chatTime: { fontSize: 10, marginTop: 5, textAlign: 'right' },
    chatTimeUser: { color: 'rgba(255,255,255,0.7)' },
    chatTimeBot: { color: '#718096' },
    typingIndicator: { alignSelf: 'flex-start', backgroundColor: '#EBF4FF', padding: 12, borderRadius: 15, borderTopLeftRadius: 4, marginLeft: 15 },
    typingText: { fontSize: 12, fontWeight: 'bold', color: '#718096' },
    chatInputRow: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderTopWidth: 1, borderColor: '#EDF2F7', alignItems: 'center', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
    chatInput: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20, paddingHorizontal: 15, height: 40, fontSize: 14, color: '#1A202C', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    chatSendBtn: { backgroundColor: '#004A99', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, justifyContent: 'center' },
    chatSendBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
