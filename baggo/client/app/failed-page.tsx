import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function PaymentFailed() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Payment Failed</Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.xMark}>✕</Text>
          </View>
        </View>

        <Text style={styles.failedText}>Your payment could not be completed</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
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
    backgroundColor: "#E74C3C", // red failure tone
    alignItems: "center",
    justifyContent: "center",
  },
  xMark: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "700",
  },
  failedText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 40,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
