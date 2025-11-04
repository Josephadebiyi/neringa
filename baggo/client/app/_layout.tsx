import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/signin" />
            <Stack.Screen name="auth/signup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
