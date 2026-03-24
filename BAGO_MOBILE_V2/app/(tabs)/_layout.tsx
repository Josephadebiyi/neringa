import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Home, Package, MessageCircle, User, Briefcase, PlusSquare, Search, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentRole } = useAuth(); // 'sender' | 'carrier'

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: COLORS.black,
          tabBarInactiveTintColor: COLORS.gray400,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 70 + insets.bottom : 70,
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.gray100,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            paddingTop: 8,
          },
        }}
      >
        {/* SHARED TABS */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} />,
          }}
        />

        {/* SENDER SPECIFIC TABS */}
        <Tabs.Screen
          name="shipments"
          options={{
            tabBarLabel: "Shipments",
            href: currentRole === 'sender' ? '/shipments' : null,
            tabBarIcon: ({ color }) => <Package size={24} color={color} strokeWidth={2.5} />,
          }}
        />

        {/* CARRIER SPECIFIC TABS */}
        <Tabs.Screen
          name="trips"
          options={{
            tabBarLabel: "Trips",
            href: currentRole === 'carrier' ? '/trips' : null,
            tabBarIcon: ({ color }) => <Briefcase size={24} color={color} strokeWidth={2.5} />,
          }}
        />

        <Tabs.Screen
          name="messages"
          options={{
            tabBarLabel: "Chat",
            tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} strokeWidth={2.5} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: "Profile",
            tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
          }}
        />

        {/* Hidding others */}
        <Tabs.Screen name="tracking" options={{ href: null }} />
        <Tabs.Screen name="packages" options={{ href: null }} />
        <Tabs.Screen name="earnings" options={{ href: null }} />
        <Tabs.Screen name="requests" options={{ href: null }} />
        <Tabs.Screen name="qr-scan" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
