import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function PaymentFailed() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textInverse }]}>Payment Failed</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: colors.error }]}>
            <Text style={[styles.xMark, { color: colors.textInverse }]}>✕</Text>
          </View>
        </View>

        <Text style={[styles.failedText, { color: colors.text }]}>Your payment could not be completed</Text>

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  xMark: {
    fontSize: 48,
    fontWeight: "700",
  },
  failedText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
  },
  retryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
