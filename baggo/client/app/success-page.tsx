import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function PaymentSuccess() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textInverse }]}>Payment Successful</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success }]}>
            <Text style={[styles.checkMark, { color: colors.textInverse }]}>✓</Text>
          </View>
        </View>

        <Text style={[styles.successText, { color: colors.text }]}>Your payment is complete</Text>

        <TouchableOpacity
          style={[styles.dashboardButton, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.dashboardButtonText, { color: colors.textInverse }]}>Go to Dashboard</Text>
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
  checkMark: {
    fontSize: 48,
    fontWeight: "700",
  },
  successText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
  },
  dashboardButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
