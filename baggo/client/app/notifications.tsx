import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import { Package, CircleCheck as CheckCircle, Clock, ChevronRight } from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';

const API_BASE_URL = `${backendomain.backendomain}/api/baggo`;
// Configure axios defaults for cookie-based authentication
axios.defaults.withCredentials = true;

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);


  // Fetch notifications from the backend
  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const response = await axios.get(`${API_BASE_URL}/getNotifications`);

      console.log('API Response:', response.data);

      // Transform backend data to match UI structure
      const transformedNotifications = response.data.data.notifications.map((notif) => {
        const createdAt = new Date(notif.createdAt);
        if (isNaN(createdAt.getTime())) {
          console.warn(`Invalid createdAt date for notification ${notif._id}: ${notif.createdAt}`);
        }

        let type, icon, iconColor, title;

        // Determine notification type, icon, and title based on message content
        if (notif.message.includes('package request') && notif.message.includes('has been accepted')) {
          type = 'package_update';
          icon = CheckCircle;
          iconColor = '#4CAF50';
          title = 'Package Request Accepted';
        } else if (notif.message.includes('You have accepted a package request')) {
          type = 'new_request';
          icon = Package;
          iconColor = '#5845D8';
          title = 'New Package Accepted';
        } else {
          // Fallback for unrecognized messages
          type = 'update';
          icon = Clock;
          iconColor = '#6B6B6B';
          title = 'Update';
        }

        return {
          id: notif._id,
          type,
          title,
          message: notif.message,
          time: isNaN(createdAt.getTime()) ? 'Unknown time' : formatDistanceToNow(createdAt, { addSuffix: true }),
          read: notif.isRead,
          icon,
          iconColor,
          createdAt: notif.createdAt, // Keep raw createdAt for filtering
        };
      });

      console.log('Transformed Notifications:', transformedNotifications);
      setNotifications(transformedNotifications);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err.response?.data || err.message);
      setError('Failed to fetch notifications');
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_BASE_URL}/markNotificationAsRead/${notificationId}`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err.response?.data || err.message);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/markAllNotificationsAsRead`);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err.response?.data || err.message);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' }, // ✅ centers it vertically + horizontally
        ]}
      >
        <Text style={{ fontSize: 16, color: '#6B6B6B' }}>
          Loading notifications...
        </Text>
      </View>
    );
  }


  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
        <TouchableOpacity onPress={fetchNotifications} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group notifications by "Today" and "Earlier"
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today in local time (WAT)
  const todayNotifications = notifications.filter(
    (notif) => {
      const notifDate = new Date(notif.createdAt);
      const isSameDay =
        notifDate.getFullYear() === today.getFullYear() &&
        notifDate.getMonth() === today.getMonth() &&
        notifDate.getDate() === today.getDate();
      console.log(`Notification ${notif.id}: createdAt=${notif.createdAt}, isSameDay=${isSameDay}`);
      return isSameDay;
    }
  );
  const earlierNotifications = notifications.filter(
    (notif) =>
      !(
        new Date(notif.createdAt).getFullYear() === today.getFullYear() &&
        new Date(notif.createdAt).getMonth() === today.getMonth() &&
        new Date(notif.createdAt).getDate() === today.getDate()
      )
  );

  console.log('Today Notifications:', todayNotifications);
  console.log('Earlier Notifications:', earlierNotifications);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications available</Text>
          </View>
        )}

        {todayNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            {todayNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => {
  markNotificationAsRead(notification.id);
  setSelectedNotification(notification);
  setModalVisible(true);
}}

              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${notification.iconColor}20` },
                  ]}
                >
                  <notification.icon size={24} color={notification.iconColor} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
                <ChevronRight size={20} color={'#6B6B6B'} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {earlierNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earlier</Text>
            {earlierNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => {
    markNotificationAsRead(notification.id);
    setSelectedNotification(notification);
    setModalVisible(true);
  }}

              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${notification.iconColor}20` },
                  ]}
                >
                  <notification.icon size={24} color={notification.iconColor} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
                <ChevronRight size={20} color={'#6B6B6B'} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      {selectedNotification && (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{selectedNotification.title}</Text>
          <Text style={styles.message}>{selectedNotification.message}</Text>
          <Text style={styles.time}>{selectedNotification.time}</Text>

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  overlay: {
     flex: 1,
     backgroundColor: 'rgba(0,0,0,0.5)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   modalContainer: {
     backgroundColor: '#FFFFFF',
     borderRadius: 16,
     padding: 24,
     width: '85%',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 6,
     elevation: 5,
   },
   title: {
     fontSize: 18,
     fontWeight: '700',
     color: '#1A1A1A',
     marginBottom: 12,
   },
   message: {
     fontSize: 15,
     color: '#6B6B6B',
     marginBottom: 16,
   },
   time: {
     fontSize: 13,
     color: '#9E9E9E',
     marginBottom: 20,
   },
   closeButton: {
     backgroundColor: '#5845D8',
     borderRadius: 8,
     paddingVertical: 10,
     alignItems: 'center',
   },
   closeButtonText: {
     color: '#FFFFFF',
     fontWeight: '600',
     fontSize: 15,
   },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5845D8',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  notificationUnread: {
    backgroundColor: '#FDF9F1',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5845D8',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#5845D8',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
