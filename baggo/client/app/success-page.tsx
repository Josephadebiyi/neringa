import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Payment Successful</Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        <Text style={styles.successText}>Your payment is complete</Text>

        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
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
    backgroundColor: "#5AD27C", // soft green success tone
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "700",
  },
  successText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 40,
  },
  dashboardButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
