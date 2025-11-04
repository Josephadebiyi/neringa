import { Tabs } from 'expo-router';
import { Hop as Home, Package, MessageCircle, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive sizing
const tabHeight = height * 0.08; // 8% of screen height
const iconSize = Math.min(width, height) * 0.06; // icon scales with screen size
const fontSize = Math.min(width, height) * 0.035; // responsive label font
const tabOffset = height * 0.015; // upward shift (~1.5% of screen height)

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: height * 0.015,
          paddingTop: height * 0.012,
          height: tabHeight,
          position: 'absolute',
          bottom: tabOffset, // ✅ move tab bar upward slightly
          marginHorizontal: width * 0.04,
          borderRadius: 20, // smooth rounded corners
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 5, // Android shadow
        },
        tabBarLabelStyle: {
          fontSize,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Home size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color }) => (
            <Package size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => (
            <MessageCircle size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
