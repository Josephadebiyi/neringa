import { Tabs } from "expo-router";
import { Hop as Home, Package, MessageCircle, User } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useWindowDimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // More stable responsive scaling
  const minSide = Math.min(width, height);

  // Responsive values
  const tabHeight = Platform.OS === 'ios' ? 60 + insets.bottom : Math.max(56, height * 0.085);
  const iconSize = Math.max(22, minSide * 0.06);
  const fontSize = Math.max(10, minSide * 0.03);

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
          height: tabHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
          // Remove floating style for iOS - keep tab bar at bottom in safe area
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          // Shadows
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 6,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize,
          fontWeight: "500",
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Home size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="tracking"
        options={{
          title: "Tracking",
          tabBarIcon: ({ color }) => (
            <Package size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color }) => (
            <MessageCircle size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User size={iconSize} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
