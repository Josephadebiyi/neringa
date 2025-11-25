import { Tabs } from "expo-router";
import { Hop as Home, Package, MessageCircle, User } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useWindowDimensions, Platform } from "react-native";

export default function TabLayout() {
  const { width, height } = useWindowDimensions();

  // More stable responsive scaling
  const minSide = Math.min(width, height);

  // Responsive values
  const tabHeight = Math.max(56, height * 0.085); // never too small
  const iconSize = Math.max(22, minSide * 0.065);
  const fontSize = Math.max(11, minSide * 0.035);
  const tabOffset = height * 0.015;
  const horizontalMargin = width * 0.04;

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
          paddingBottom: height * 0.015,
          paddingTop: height * 0.012,

          position: "absolute",
          bottom: tabOffset,
          marginHorizontal: horizontalMargin,
          borderRadius: 20,

          // Shadows
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize,
          fontWeight: "500",
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
