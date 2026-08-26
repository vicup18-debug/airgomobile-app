/**
 * DriverChatModal — Airgo Mobile
 *
 * Native real-time chat between a driver and client, tied to a booking.
 * Ported from the web Chatroom.tsx component.
 *
 * Features:
 *  - Fetches chat history on open
 *  - Real-time socket.io delivery
 *  - Phone number exchange protection
 *  - Auto-scrolls to latest message
 *  - Shows sender name / role per bubble
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { io, Socket } from 'socket.io-client';
import { Audio } from 'expo-av';
import { API_URL } from '../../constants/config';

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  _id?: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'partner' | 'admin';
  text: string;
  createdAt: string;
}

interface DriverChatModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  bookingName: string;
  currentUserId: string;
  currentUserName: string;
}

// ── Phone-number regex (10+ consecutive digit groups) ─────────────────────
const PHONE_REGEX = /(?:\d[\s\-.()+]*){10,}/;

// ── Format time ───────────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function DriverChatModal({
  visible,
  onClose,
  bookingId,
  bookingName,
  currentUserId,
  currentUserName,
}: DriverChatModalProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputText, setInputText]   = useState('');
  const [isLoading, setIsLoading]   = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending]   = useState(false);

  const socketRef  = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const socketUrl = API_URL.replace('/api', '');

  // ── Scroll to bottom ────────────────────────────────────────────────────
  const scrollToEnd = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  // ── Fetch history + connect socket when modal opens ─────────────────────
  useEffect(() => {
    if (!visible || !bookingId) return;

    setIsLoading(true);
    setMessages([]);

    const setup = async () => {
      const token = await AsyncStorage.getItem('authToken');

      // 1. Fetch chat history
      try {
        const res = await fetch(`${API_URL}/chats/booking/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Chat history fetch error:', e);
      } finally {
        setIsLoading(false);
      }

      // 2. Connect socket
      const socket = io(socketUrl, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('join_booking_chat', { bookingId });
      });

      socket.on('disconnect', () => setIsConnected(false));

      socket.on('receive_chat_message', (msg: Message) => {
        if (msg.senderId !== currentUserId) {
          try {
            Audio.Sound.createAsync(require('../../assets/sounds/notification.wav'))
              .then(({ sound }) => {
                sound.setOnPlaybackStatusUpdate((status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                  }
                });
                sound.playAsync();
              })
              .catch(() => {});
          } catch (e) {}
        }
        setMessages(prev => {
          const msgIdStr = msg._id ? String(msg._id) : '';
          const exists = prev.some(m => {
            if (m._id && msgIdStr && String(m._id) === msgIdStr) return true;
            if (m.senderId === msg.senderId && m.text.trim() === msg.text.trim()) return true;
            return false;
          });
          if (exists) return prev;
          return [...prev, msg];
        });
      });
    };

    setup();

    return () => {
      socketRef.current?.emit('leave_booking_chat', { bookingId });
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [visible, bookingId]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    // Phone number guard
    if (PHONE_REGEX.test(trimmed)) {
      Toast.show({
        type: 'error',
        text1: 'Not Allowed',
        text2: 'Phone number exchange is prohibited on this platform.',
      });
      return;
    }

    setIsSending(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/chats/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, text: trimmed }),
      });

      if (res.ok) {
        const savedMsg: Message = await res.json();

        // Optimistically add to local state with robust deduplication check
        setMessages(prev => {
          const savedIdStr = savedMsg._id ? String(savedMsg._id) : '';
          const exists = prev.some(m => {
            if (m._id && savedIdStr && String(m._id) === savedIdStr) return true;
            if (m.senderId === savedMsg.senderId && m.text.trim() === savedMsg.text.trim()) return true;
            return false;
          });
          if (exists) return prev;
          return [...prev, savedMsg];
        });
        setInputText('');
      } else {
        const err = await res.json().catch(() => ({}));
        Toast.show({ type: 'error', text1: 'Send Failed', text2: err.message || 'Try again.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Check your connection.' });
    } finally {
      setIsSending(false);
    }
  };

  // ── Render a single message bubble ───────────────────────────────────────
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View
        key={item._id || index}
        style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperThem]}
      >
        {!isMe && (
          <Text style={styles.senderLabel}>
            {item.senderName} · {item.senderRole}
          </Text>
        )}
        <View style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          item.senderRole === 'admin' && !isMe && styles.bubbleAdmin,
        ]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // ── Modal UI ──────────────────────────────────────────────────────────────
  const androidHeaderPadding = (StatusBar.currentHeight || 44) + 16;
  const topHeaderPadding = Platform.OS === 'android'
    ? Math.max(androidHeaderPadding, 60)
    : Math.max(insets.top + 8, 16);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[
          styles.header,
          { paddingTop: topHeaderPadding }
        ]}>
          <View style={styles.headerAvatar}>
            <Ionicons name="chatbubbles" size={18} color="#000080" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{bookingName}</Text>
            <View style={styles.headerStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#38A169' : '#E53E3E' }]} />
              <Text style={styles.headerStatusText}>
                {isConnected ? 'Secure Connection Active' : 'Connecting...'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Security banner */}
        <View style={styles.securityBanner}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#92400E" />
          <Text style={styles.securityBannerText}>
            Phone number exchange (10+ digits) is strictly blocked in this chat.
          </Text>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#000080" />
              <Text style={styles.loadingText}>Syncing chat history...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="chatbubble-ellipses-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Start the Conversation</Text>
              <Text style={styles.emptySubtitle}>
                Coordinate pickup details, timing, or ask questions safely here.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, i) => item._id || String(i)}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={scrollToEnd}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input row */}
          <View style={[
            styles.inputRow,
            { paddingBottom: Math.max(insets.bottom + 12, Platform.OS === 'android' ? 32 : 16) }
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#A0AEC0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              {isSending
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Ionicons name="send" size={18} color="#FFF" />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  flex: { flex: 1 },

  // Header
  header: {
    backgroundColor: '#000080',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFB81C',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 20 },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  headerStatusText: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Security banner
  securityBanner: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityBannerText: { color: '#92400E', fontSize: 11, fontWeight: '600', flex: 1 },

  // Messages
  messagesList: { padding: 16, paddingBottom: 8, gap: 12 },

  bubbleWrapper: { maxWidth: '78%', marginBottom: 4 },
  bubbleWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapperThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  senderLabel: {
    fontSize: 10, fontWeight: '700', color: '#718096',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3,
  },

  bubble: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleMe: {
    backgroundColor: '#000080',
    borderTopRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 4,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  bubbleAdmin: {
    backgroundColor: '#FFB81C',
    borderColor: '#F6AD55',
  },
  bubbleText: { fontSize: 14, color: '#1A202C', fontWeight: '500', lineHeight: 20 },
  bubbleTextMe: { color: '#FFF' },
  bubbleTime: { fontSize: 10, color: '#718096', fontWeight: '600', textAlign: 'right', marginTop: 4 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.6)' },

  // Empty / loading states
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  loadingText: { color: '#718096', fontSize: 14, fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  emptySubtitle: { fontSize: 13, color: '#718096', textAlign: 'center', lineHeight: 20 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1, backgroundColor: '#F7F9FC',
    borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14, color: '#1A202C', fontWeight: '500',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#000080',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000080', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E0', shadowOpacity: 0 },
});
