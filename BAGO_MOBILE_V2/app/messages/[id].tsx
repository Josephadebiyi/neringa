import { View, Text, ScrollView, StyleSheet, TextInput, Image, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, Send, Phone, Info, 
  ShieldAlert, ShieldCheck, MoreVertical,
  Camera, Mic
} from 'lucide-react-native';
import { useState, useRef } from 'react';
import { COLORS } from '../../constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! Is the iPhone still available for carriage?", sender: 'other', time: '10:12 AM' },
    { id: '2', text: "Yes it is. I'm traveling to Lagos tomorrow morning.", sender: 'me', time: '10:15 AM' },
  ]);

  // Security Keywords
  const BLOCKED_KEYWORDS = ['whatsapp', 'telegram', 'phone', 'number', 'call', 'outside', 'crypto', 'payment link'];

  const sendMessage = () => {
    if (!message.trim()) return;

    // Check for blocked keywords
    const lowerMsg = message.toLowerCase();
    const found = BLOCKED_KEYWORDS.find(k => lowerMsg.includes(k));

    if (found) {
      Alert.alert(
        "Security Alert", 
        "To protect your payments and items, Bago strictly prohibits sharing contact details or moving chats outside the app. Please stay within Bago.",
        [{ text: "I understand", style: "default" }]
      );
      return;
    }

    setMessages([...messages, { id: String(Date.now()), text: message, sender: 'me', time: 'Just now' }]);
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Image 
          source={{ uri: 'https://i.pravatar.cc/150?u=james' }} 
          style={styles.avatar}
        />
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerName}>James Wilson</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Recently active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
           <ShieldCheck size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Security Banner */}
      <View style={styles.securityBanner}>
        <ShieldAlert size={18} color={COLORS.primary} />
        <Text style={styles.securityText}>
          Stay Safe: Never share phone numbers or pay outside Bago. Our escrow only protects in-app transactions.
        </Text>
      </View>

      <ScrollView 
        style={styles.flex} 
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgWrapper, msg.sender === 'me' ? styles.msgMe : styles.msgOther]}>
            <View style={[styles.msgBubble, msg.sender === 'me' ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.msgText, msg.sender === 'me' ? styles.textMe : styles.textOther]}>{msg.text}</Text>
            </View>
            <Text style={styles.msgTime}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn}>
            <Camera size={22} color={COLORS.gray400} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.gray400}
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Send size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, 
    borderBottomWidth: 1, borderBottomColor: COLORS.gray100, backgroundColor: COLORS.white, gap: 12 
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerTitleBox: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: COLORS.black },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusText: { fontSize: 12, color: COLORS.gray500, fontWeight: '600' },
  headerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  securityBanner: { backgroundColor: COLORS.primarySoft, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  securityText: { flex: 1, fontSize: 12, color: COLORS.primary, fontWeight: '700', lineHeight: 16 },

  chatScroll: { padding: 20, paddingBottom: 40 },
  msgWrapper: { marginBottom: 20, maxWidth: '80%' },
  msgMe: { alignSelf: 'flex-end' },
  msgOther: { alignSelf: 'flex-start' },
  msgBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24 },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.bgSoft, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  textMe: { color: COLORS.white },
  textOther: { color: COLORS.black },
  msgTime: { fontSize: 11, color: COLORS.gray400, marginTop: 6, marginHorizontal: 4 },

  inputArea: { 
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20, 
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.gray100
  },
  attachBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  inputWrapper: { flex: 1, backgroundColor: COLORS.bgSoft, borderRadius: 24, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  input: { fontSize: 15, color: COLORS.black, fontWeight: '600', paddingVertical: 8 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
