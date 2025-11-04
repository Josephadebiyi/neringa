import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Colors } from '@/constants/Colors';
import { MessageCircle, ArrowLeft, Send } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';
import { SafeAreaView,useSafeAreaInsets  } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';




export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);
const insets = useSafeAreaInsets();
  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(backendomain.backendomain, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('new_conversation', (conversation) => {
      console.log('New conversation received:', JSON.stringify(conversation, null, 2));
      setConversations((prev) => [conversation, ...prev]);
    });

    newSocket.on('new_message', (message) => {
      console.log('New message received:', JSON.stringify(message, null, 2));
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        setMessages((prev) => {
          const updatedMessages = [...prev, { ...message, id: message._id }];
          console.log('Updated messages (socket):', JSON.stringify(updatedMessages, null, 2));
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          return updatedMessages;
        });
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === message.conversationId
            ? { ...conv, last_message: message.text, updated_at: message.timestamp }
            : conv
        )
      );
    });

    newSocket.on('update_conversation', (conversation) => {
      console.log('Conversation updated:', JSON.stringify(conversation, null, 2));
      setConversations((prev) =>
        prev.map((conv) => (conv._id === conversation._id ? conversation : conv))
      );
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message);
      setError('Socket error: ' + error.message);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Socket connection error: ' + error.message);
    });

    return () => {
      newSocket.disconnect();
      console.log('Socket disconnected');
    };
  }, []);

  // Fetch User ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        console.log('Fetching user ID from:', `${backendomain.backendomain}/api/baggo/getuser`);
        const userResponse = await fetch(`${backendomain.backendomain}/api/baggo/getuser`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('getuser error response:', errorText);
          throw new Error(`HTTP error! Status: ${userResponse.status}, Message: ${errorText}`);
        }
        const userData = await userResponse.json();
        console.log('fetchUserId response:', JSON.stringify(userData, null, 2));
        if (userData.user) {
          setUserId(userData.user._id);
        } else {
          console.error('Failed to fetch user ID:', userData.message);
          setError('Failed to fetch user ID: ' + userData.message);
        }
      } catch (error) {
        console.error('Error in fetchUserId:', error);
        setError('Error: ' + error.message);
      }
    };
    fetchUserId();
  }, []);

  // Fetch Conversations after User ID is set
  useEffect(() => {
    if (userId) {
      const fetchConversations = async () => {
        try {
          console.log('Fetching conversations from:', `${backendomain.backendomain}/api/baggo/conversations`);
          const response = await fetch(`${backendomain.backendomain}/api/baggo/conversations`, {
            method: 'GET',
            credentials: 'include',
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('conversations error response:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
          }
          const data = await response.json();
          console.log('fetchConversations response:', JSON.stringify(data, null, 2));
          if (data.success) {
            setConversations(data.data.conversations);
            if (data.data.conversations.length === 0) {
              console.log('No conversations found');
              setSelectedConversation(null);
            }
          } else {
            console.error('Failed to fetch conversations:', data.message);
            setError('Failed to fetch conversations: ' + data.message);
          }
        } catch (error) {
          console.error('Error fetching conversations:', error);
          setError('Error fetching conversations: ' + error.message);
        }
      };
      fetchConversations();
    }
  }, [userId]);

  // Fetch Messages for Selected Conversation
  useEffect(() => {
    if (selectedConversation && socket && userId) {
      socket.emit('join_conversation', selectedConversation._id);
      const fetchMessages = async () => {
        try {
          console.log('Fetching messages from:', `${backendomain.backendomain}/api/baggo/conversations/${selectedConversation._id}/messages`);
          const response = await fetch(
            `${backendomain.backendomain}/api/baggo/conversations/${selectedConversation._id}/messages`,
            {
              method: 'GET',
              credentials: 'include',
            }
          );
          if (!response.ok) {
            const errorText = await response.text();
            console.error('messages error response:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
          }
          const data = await response.json();
          console.log('fetchMessages response:', JSON.stringify(data, null, 2));
          if (data.success) {
            const sortedMessages = data.data.messages.sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
            setMessages(sortedMessages);
            console.log('Sorted messages:', JSON.stringify(sortedMessages, null, 2));
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } else {
            console.error('Failed to fetch messages:', data.message);
            setError('Failed to fetch messages: ' + data.message);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          setError('Error fetching messages: ' + error.message);
        }
      };
      fetchMessages();
    }
  }, [selectedConversation, socket, userId]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setError(null);
  };

  const handleSend = async () => {
    if (newMessage.trim() && selectedConversation && socket && userId) {
      setIsSending(true);
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        _id: tempId,
        conversation: selectedConversation._id,
        sender: { _id: userId, firstName: 'You' },
        text: newMessage,
        timestamp: new Date().toISOString(),
        id: tempId,
      };
      setMessages((prev) => {
        const updatedMessages = [...prev, optimisticMessage];
        console.log('Updated messages (send):', JSON.stringify(updatedMessages, null, 2));
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return updatedMessages;
      });
      const message = {
        conversationId: selectedConversation._id,
        senderId: userId,
        text: newMessage,
      };
      socket.emit('send_message', message);
      setNewMessage('');
      setIsSending(false);
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color={Colors.textLight} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>No Messages</Text>
      <Text style={styles.emptySubtitle}>
        Messages will appear here when travelers accept your booking requests
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderConversation = ({ item }) => {
    const otherUser = item.sender._id === userId ? item.traveler : item.sender;
    const unreadCount = item.sender._id === userId ? item.unread_count_traveler : item.unread_count_sender;
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleSelectConversation(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(otherUser.firstName || otherUser.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>
              {item.sender._id === item.traveler._id
                ? item.sender.firstName || item.sender.email || 'User'
                : otherUser.firstName || otherUser.email || 'User'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender._id === userId ? styles.myMessage : styles.otherMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTimestamp}>
        {new Date(item.timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
        })}
      </Text>
    </View>
  );

  const getDisplayName = () => {
    if (!selectedConversation) return 'Conversation';
    const otherUser =
      selectedConversation.sender._id === userId
        ? selectedConversation.traveler
        : selectedConversation.sender;
    if (selectedConversation.sender._id === selectedConversation.traveler._id) {
      return selectedConversation.sender.firstName || selectedConversation.sender.email || 'User';
    }
    return otherUser.firstName || otherUser.email || 'User';
  };

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom || 0 : 0}
    >

      {selectedConversation ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getDisplayName()}</Text>
          </View>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => (item && item._id ? String(item._id) : `msg-${index}`)}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textLight}
            />
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.sendButton} />
            ) : (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Send size={24} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
        <View style={styles.header}>
  <TouchableOpacity
    onPress={() => router.push('/')}
    style={{ padding: 8, marginRight: 8 }}
    accessibilityLabel="Go to Home"
  >
    <ArrowLeft size={24} color={Colors.text} />
  </TouchableOpacity>

  <Text style={styles.title}>Messages</Text>
</View>

          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
          />
        </>
      )}

    </KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationCard: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textLight,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textLight,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  sendButton: {
    borderRadius: 20,
    padding: 12,
    marginLeft: 12,
    backgroundColor: Colors.primary,
  },
});
