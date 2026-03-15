import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <LinearGradient colors={['#5845D8', '#4534B8']} style={styles.header}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Transaction Status</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: '#ECFDED' }]}>
            <Text style={[styles.checkMark, { color: '#16A34A' }]}>✓</Text>
          </View>
        </View>

        <Text style={[styles.successTitle, { color: '#054752' }]}>Payment Successful</Text>
        <Text style={[styles.successSubtitle, { color: '#708c91' }]}>
          Your payment has been processed successfully. You can now track your shipment in the dashboard.
        </Text>

        <TouchableOpacity
          style={[styles.dashboardButton, { backgroundColor: '#5845D8' }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.dashboardButtonText, { color: '#FFFFFF' }]}>Back to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("/(tabs)/shipments")}
        >
          <Text style={[styles.secondaryButtonText, { color: '#5845D8' }]}>View My Shipments</Text>
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
    shadowColor: "#16A34A",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  checkMark: {
    fontSize: 56,
    fontWeight: "300",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 24,
  },
  dashboardButton: {
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
  dashboardButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 24,
    padding: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
