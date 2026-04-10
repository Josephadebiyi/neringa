import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function PaymentFailed() {
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <LinearGradient colors={['#054752', '#032c33']} style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Transaction Status</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.xMark, { color: '#EF4444' }]}>✕</Text>
          </View>
        </View>

        <Text style={[styles.failedTitle, { color: '#054752' }]}>Payment Failed</Text>
        <Text style={[styles.failedSubtitle, { color: '#708c91' }]}>
          We couldn't process your payment. Please check your card details or try a different payment method.
        </Text>

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#5845D8' }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.cancelButtonText, { color: '#708c91' }]}>Go to Dashboard</Text>
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
    paddingVertical: 64,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  xMark: {
    fontSize: 56,
    fontWeight: "300",
  },
  failedTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  failedSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 24,
  },
  retryButton: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 64,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#5845D8",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  retryButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: 24,
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
