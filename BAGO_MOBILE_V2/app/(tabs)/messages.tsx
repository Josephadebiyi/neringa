import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MessageCircle, Search, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

const MOCK_CHATS: any[] = [];

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Search size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Security Reminder */}
        <View style={styles.safetyBox}>
          <ShieldCheck size={18} color={COLORS.primary} />
          <Text style={styles.safetyText}>
            Chat safely by staying within Bago. We protect your payments and data.
          </Text>
        </View>

        {MOCK_CHATS.length > 0 ? (
          MOCK_CHATS.map(chat => (
            <TouchableOpacity 
              key={chat.id} 
              style={styles.chatItem}
              onPress={() => router.push({ pathname: '/messages/[id]', params: { id: chat.id } })}
            >
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.userName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <View style={styles.chatFooter}>
                  <Text style={[styles.lastMsg, chat.unread > 0 && styles.lastMsgUnread]} numberOfLines={1}>
                    {chat.lastMsg}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.gray200} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MessageCircle size={80} color={COLORS.gray400} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              When you contact a carrier or sender, your chats will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.black },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { padding: 24, paddingBottom: 24 },
  safetyBox: { backgroundColor: COLORS.primarySoft, padding: 16, borderRadius: 20, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 24 },
  safetyText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '700', lineHeight: 18 },

  chatItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, marginBottom: 8 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.bgSoft },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 17, fontWeight: '800', color: COLORS.black },
  chatTime: { fontSize: 13, color: COLORS.gray500, fontWeight: '600' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMsg: { fontSize: 14, color: COLORS.gray500, fontWeight: '600', maxWidth: '90%' },
  lastMsgUnread: { color: COLORS.black, fontWeight: '800' },
  unreadBadge: { backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unreadCount: { color: COLORS.white, fontSize: 11, fontWeight: '900' },

  emptyCard: { marginTop: 60, alignItems: 'center', padding: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.bgSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: COLORS.black, marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: COLORS.gray400, textAlign: 'center', lineHeight: 22 },
});
