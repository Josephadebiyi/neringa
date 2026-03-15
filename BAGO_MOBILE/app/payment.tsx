import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
  Platform,
  Linking,
  Modal,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { backendomain } from "@/utils/backendDomain";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { StripeProvider, CardField, useStripe } from "@/utils/stripe";

const PAYMENT_INTENT_URL = `${backendomain.backendomain}/api/payment/create-intent`;
const PAYSTACK_INIT_URL = `${backendomain.backendomain}/api/payment/initialize`;
const REQUEST_PACKAGE_URL = `${backendomain.backendomain}/api/bago/RequestPackage`;
const ESCROW_ADD_URL = `${backendomain.backendomain}/api/bago/add-to-escrow`;

export default function PaymentScreen() {
  const router = useRouter();
  const { confirmPayment } = useStripe();

  // --- NEW: Quote State ---
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  const {
    travellerName,
    travellerEmail,
    amount, // This is usually the item value
    travelerId,
    tripId,
    packageId,
    insurance,
    insuranceCost,
    image: imageParam,
    pricePerKg,
    travelerCurrency,
    weight,
  } = useLocalSearchParams();

  const [cardDetails, setCardDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState("stripe");
  const [paystackUrl, setPaystackUrl] = useState(null);
  const [imageState, setImageState] = useState(imageParam ?? null);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [userReferral, setUserReferral] = useState(null);
  const [hasUsedReferralDiscount, setHasUsedReferralDiscount] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [userData, setUserData] = useState<any>(null);

  // --- Utility: Get Currency Symbol ---
  const getSymbol = (currency: string) => {
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", GHS: "₵", KES: "KSh", ZAR: "R" };
    return symbols[currency] || currency;
  };

  // --- Step 1: Detect Location & Fetch Quote ---
  useEffect(() => {
    const initializePayment = async () => {
      setQuoteLoading(true);
      try {
        // A. Detect Country Code
        let countryCode = "US"; // Default
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            let reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            if (reverseGeocode.length > 0) {
              countryCode = reverseGeocode[0].isoCountryCode || "US";
            }
          }
        } catch (lErr: any) {
          console.warn("Location detection failed, using IP fallback:", lErr.message);
          const ipLoc = await axios.get(`${backendomain.backendomain}/api/location/detect`);
          countryCode = ipLoc.data?.location?.countryCode || "US";
        }

        // B. Determine Sender Currency
        const currencyMap: Record<string, string> = {
          US: "USD", GB: "GBP", NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR",
          FR: "EUR", DE: "EUR", IT: "EUR", ES: "EUR", NL: "EUR"
        };
        const senderCurrency = currencyMap[countryCode] || "USD";
        setCurrencySymbol(getSymbol(senderCurrency));

        // C. Fetch Quote from Backend
        console.log("🔄 Fetching payment quote...");
        const quoteRes = await axios.post(`${backendomain.backendomain}/api/currency/quote`, {
          weight: parseFloat(weight as string) || 1,
          travelerPricePerKg: parseFloat(pricePerKg as string) || 10,
          travelerCurrency: (travelerCurrency as string) || "USD",
          senderCurrency
        });

        if (quoteRes.data.success) {
          const q = quoteRes.data.quote;
          setQuote(q);
          setPaymentProvider(q.processor);
          console.log("✅ Quote received:", q);
        }
      } catch (err) {
        console.error("❌ Failed to initialize payment quote:", err);
        Alert.alert("Error", "Failed to calculate payment amount. Please try again.");
      } finally {
        setQuoteLoading(false);
      }
    };

    initializePayment();
  }, [weight, pricePerKg, travelerCurrency]);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const res = await axios.get(`${backendomain.backendomain}/api/bago/Profile`, {
          withCredentials: true,
        });

        const user = res.data?.data?.findUser;
        setUserData(user);
        console.log("🧾 User profile fetched:", user);
        setUserStatus(user?.status || "pending");
        setUserReferral(user?.referredBy || null);
        setHasUsedReferralDiscount(user?.hasUsedReferralDiscount || false);
      } catch (err) {
        console.error("Error fetching user KYC status:", err);
        setUserStatus("pending");
      }
    };

    fetchUserStatus();
  }, []);

  const safeEmail = (userData as any)?.email || travellerEmail;

  const markReferralUsed = async (userId: string) => {
    if (!userId) return;
    if (!userReferral || hasUsedReferralDiscount) return;

    try {
      await axios.post(
        `${backendomain.backendomain}/api/bago/use-referral-discount`,
        { userId },
        { withCredentials: true }
      );
      setHasUsedReferralDiscount(true);
    } catch (err) {
      console.error("markReferralUsed error:", err);
    }
  };

  const amountNum = parseFloat(amount as string) || 0;
  const insuranceNum = insuranceCost ? parseFloat(insuranceCost as string) : 0;
  
  // Use quote amount if available, otherwise fallback
  const baseAmount = (quote as any)?.senderAmount || 0;
  
  // Insurance is added on top of the shipping cost in the sender's currency
  const insuranceConverted = quote ? (insurance === "yes" ? insuranceNum : 0) : 0; 
  
  const discount = userReferral && !hasUsedReferralDiscount ? 0.03 * baseAmount : 0;
  const finalAmount = baseAmount + insuranceConverted - discount;



  // Load image from AsyncStorage if not passed
  useEffect(() => {
    (async () => {
      if (!imageParam) {
        try {
          const stored = await AsyncStorage.getItem("packageImage");
          console.log("📸 Retrieved stored image from AsyncStorage:", stored);
          if (stored) setImageState(stored);
        } catch (err) {
          console.warn("Could not load packageImage", err);
        }
      }
    })();
  }, [imageParam]);


  const publishableKey = "pk_test_51SIm5dLIu6dEtqiBkoXpgTb0PtWIKaDs7E5rRowKkQWAK6YsDXAq2pq9UFLhR2DdWfyxSA5jfEzO80gLraJYi6ec002FAQHMe8";


  // ✅ Update request payment
  const updatePaymentStatus = async ({ requestId, method, status }: { requestId: string; method: string; status: string }) => {
    if (!requestId) {
      console.warn("⚠️ Missing requestId, cannot update payment status");
      return;
    }

    if (!method) {
      console.warn("⚠️ Missing payment method");
    }

    if (!status) {
      console.warn("⚠️ Missing payment status");
    }

    try {
      const res = await axios.put(
        `${backendomain.backendomain}/api/bago/request/${requestId}/payment`,
        {
          paymentInfo: {
            requestId,
            method,
            status, // "paid" or "failed"
          },
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        console.log("✅ Request payment updated successfully:", res.data);
      } else {
        console.warn("⚠️ Unexpected response status:", res.status, res.data);
      }
    } catch (err: any) {
      console.error("❌ Failed to update request payment:", err.response?.data || err.message);
    }
  };


  // 🧾 Handle Stripe Payment
  const handleStripePayment = async () => {
    console.log('💡 handleStripePayment called');

    if (!(cardDetails as any)?.complete) {
      console.warn('⚠️ Card details incomplete');
      setPaymentError("Please enter valid card details" as any);
      return;
    }

    setPaymentLoading(true);

    try {
      console.log('💡 Sending POST request to create payment intent:', PAYMENT_INTENT_URL, { amount: finalAmount, travellerName, travellerEmail });

      const response = await axios.post(PAYMENT_INTENT_URL, {
        amount: finalAmount,
        travellerName,
        travellerEmail: safeEmail,
      });

      console.log('💡 Payment intent response:', response.data);

      const { clientSecret } = response.data.data;
      console.log('💡 Received clientSecret from backend:', clientSecret);

      // Check if clientSecret is valid
      if (!clientSecret || !clientSecret.startsWith("pi_") || !clientSecret.includes("_secret_")) {
        throw new Error("Invalid clientSecret received from backend");
      }

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: { email: safeEmail as string, name: travellerName as string },
        },
      });

      console.log('💡 Stripe confirmPayment result:', { error, paymentIntent });

      if (error) throw new Error(error.message);

      const requestId = await handleRequestPackage();
      console.log('💡 requestId after handleRequestPackage:', requestId);

      if (paymentIntent.status?.toLowerCase() === "succeeded") {
    console.log('✅ Payment succeeded');
    Alert.alert("✅ Payment Successful", "Your payment was completed.");

    if (requestId) {
      console.log('💡 Updating payment status to paid');
      await updatePaymentStatus({ requestId, method: "stripe", status: "paid" });

      // --- mark referral used if applicable ---
      if (userReferral && !hasUsedReferralDiscount) {
        await markReferralUsed(userData?._id);
      }
    }

    router.replace("/success-page");
  } else {
    console.warn('⚠️ Payment not succeeded:', paymentIntent.status);
    Alert.alert("⚠️ Payment status:", paymentIntent.status);

    if (requestId) {
      console.log('💡 Updating payment status to failed');
      await updatePaymentStatus({ requestId, method: "stripe", status: "failed" });
    }
  }


    } catch (error: any) {
      console.error("❌ Payment Error:", error);
      Alert.alert("Payment Failed", error.message || "Something went wrong.");
    } finally {
      setPaymentLoading(false);
      console.log('💡 Payment loading set to false');
    }
  };


  // 💰 Handle Paystack Payment
  const handlePaystackPayment = async () => {
    if (!userData?.email && !travellerEmail) {
      Alert.alert("Error", "User email not available. Cannot proceed with Paystack payment.");
      return;
    }

    try {
      setPaymentLoading(true);


      const res = await axios.post(PAYSTACK_INIT_URL, {
        amount: Number(finalAmount),
        email: safeEmail,
      });

      const authUrl = res.data?.data?.authorization_url;
      if (!authUrl) throw new Error("Could not get Paystack payment URL.");

      setPaystackUrl(authUrl);
    } catch (error: any) {
      console.error("❌ Paystack init failed:", error.response?.data || error.message);
      Alert.alert("Error", "Unable to start Paystack payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const isKycVerified =
    userStatus?.toLowerCase().trim() === "completed" ||
    userStatus?.toLowerCase().trim() === "verified" ||
    (userData as any)?.isVerified === true;


  const handleStripePress = () => {
    if (!isKycVerified) {
      setKycModalVisible(true);
      return;
    }
    handleStripePayment();
  };

  const handlePaystackPress = () => {
    if (!isKycVerified) {
      setKycModalVisible(true);
      return;
    }
    handlePaystackPayment();
  };


// 🧩 Request package after successful payment
const handleRequestPackage = async () => {
  try {
    let imageUri = imageState as string;

    // Convert base64 to file only if it's base64
    if (imageState && (imageState as string).startsWith("data:image")) {
      const fileUri = `${FileSystem.cacheDirectory}package_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        (imageState as string).replace(/^data:image\/\w+;base64,/, ""),
        { encoding: "base64" }
      );
      imageUri = fileUri;
      console.log("📸 Converted base64 image to file URI:", imageUri);
    }

    const formData = new FormData();

    if (imageUri) {
      formData.append("image", {
        uri: imageUri,
        name: `package_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);
    }

    formData.append("travelerId", travelerId);
    formData.append("packageId", packageId as string);
    formData.append("tripId", tripId as string);
    formData.append("amount", finalAmount.toString());
    formData.append("insurance", insurance as string);
    formData.append(
      "insuranceCost",
      insurance === "yes" ? insuranceNum.toString() : "0"
    );

    for (let pair of formData._parts) {
      console.log(`📦 ${pair[0]} =>`, pair[1]);
    }

    const res = await axios.post(REQUEST_PACKAGE_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });

    console.log("✅ Package Request Response:", res.data);

    await handleAddToEscrow();
    await AsyncStorage.removeItem("packageImage");

    return res.data?.request?._id;
  } catch (error: any) {
    console.log(
      "❌ Package request failed:",
      error.response?.data || error.message
    );
    Alert.alert("Error", "Could not complete booking.");
    return null;
  }
};

  const handleAddToEscrow = async () => {
    try {
      await axios.post(
        ESCROW_ADD_URL,
        { userId: travelerId as string, amount: Number(finalAmount) },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      console.error("❌ Error adding to escrow:", error.message);
    }
  };



  // 🖥️ Paystack WebView handler with verification
  if (paystackUrl) {
    return (
      <WebView
      source={{ uri: paystackUrl }}
      onNavigationStateChange={async (navState) => {
        const url = navState.url;

        // ✅ User completed payment
        if (url.includes("reference=")) {
          setPaystackUrl(null);
          const reference = url.split("reference=")[1].split("&")[0];
          console.log("Paystack payment reference:", reference);

          try {
            const verifyRes = await axios.get(
              `${backendomain.backendomain}/api/payment/verify/${reference}`
            );

            const rid = await handleRequestPackage();

            if (rid) {
  if (verifyRes.data.status) {
    Alert.alert("✅ Payment Successful", "Your Paystack payment was successful.");

    await updatePaymentStatus({
      requestId: rid,
      method: "paystack",
      status: "paid",
    });

    // --- mark referral used if applicable ---
    if (userReferral && !hasUsedReferralDiscount) {
      await markReferralUsed(userData?._id);
    }

    router.replace("/success-page");
  } else {
    await updatePaymentStatus({
      requestId: rid,
      method: "paystack",
      status: "failed",
    });

    router.replace("/failed-page");
  }
}

          } catch (err: any) {
            console.error("❌ Verification error:", err.response?.data || err.message);
            Alert.alert("❌ Error", "Could not verify payment.");
          }
        }

        // ✅ User closed WebView manually
        if (url.includes("paystack.com/close")) {
          setPaystackUrl(null);
          Alert.alert("❌ Payment Cancelled", "You closed the payment window.");
        }
      }}
    />



    );
  }


  return (
    <>
    <StripeProvider
    publishableKey={publishableKey}
      merchantIdentifier="merchant.identifier"
      urlScheme="your-url-scheme"
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#5845D8', '#4534B8']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
          <Text style={styles.headerAmount}>
  {currencySymbol}
  {Number(finalAmount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</Text>

            <Text style={styles.headerSubtitle}>Pay Invoice</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
  >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Image Preview */}
          {imageState && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageState as string }} style={styles.image} resizeMode="cover" />
            </View>
          )}

          {/* Traveller Info */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Traveller Info</Text>
            <Text style={styles.summaryText}>Name: {travellerName}</Text>
            <Text style={styles.summaryText}>Email: {safeEmail}</Text>

            <Text style={styles.summaryText}>
          Amount: {currencySymbol}{Number(amount).toLocaleString('en-US')}
        </Text>

            <Text style={styles.summaryText}>Insurance: {insurance}</Text>
            {insuranceCost && (
    <Text style={styles.summaryText}>
      Insurance Cost: {currencySymbol}{insuranceCost}
    </Text>
  )}
  {userReferral && !hasUsedReferralDiscount && (
    <Text style={[styles.summaryText, { color: '#5845D8' }]}>
      Referral Discount Applied: -3% ({currencySymbol}{discount.toFixed(2)})
    </Text>
  )}

          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, paymentProvider === "stripe" && styles.activeTab]}
              onPress={() => setPaymentProvider("stripe")}
            >
              <Text
                style={[
                  styles.tabText,
                  paymentProvider === "stripe" && styles.activeTabText,
                ]}
              >
                Credit Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, paymentProvider === "paystack" && styles.activeTab]}
              onPress={() => setPaymentProvider("paystack")}
            >
              <Text
                style={[
                  styles.tabText,
                  paymentProvider === "paystack" && styles.activeTabText,
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment Section */}
          <View style={styles.paymentSection}>
    {paymentProvider === "stripe" ? (
      <>
      <CardField
      postalCodeEnabled={false}
      placeholders={{ number: "4242 4242 4242 4242" }}
      style={styles.cardField}
      cardStyle={{
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        borderColor: "#d9d9d9",
        borderWidth: 1,
        borderRadius: 10,
      }}
      onCardChange={(details: any) => {
        setCardDetails(details);

        // 👇 dismiss keyboard when card is complete
        if (details.complete) {
          Keyboard.dismiss();
        }
      }}
    />

        {paymentError && <Text style={styles.errorText}>{paymentError}</Text>}

        <TouchableOpacity
          style={[styles.payButton, paymentLoading && styles.buttonDisabled]}
          onPress={handleStripePress}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
  Pay {finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
</Text>

          )}
        </TouchableOpacity>
      </>
    ) : (
      <TouchableOpacity
        style={[styles.payButton, paymentLoading && styles.buttonDisabled]}
        onPress={handlePaystackPress}
        disabled={paymentLoading}
      >
        {paymentLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Pay with Paystack</Text>
        )}
      </TouchableOpacity>
    )}
  </View>

        </ScrollView>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </StripeProvider>
    <Modal
  visible={kycModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setKycModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>KYC Verification Required</Text>
      <Text style={styles.modalMessage}>
        You must complete your KYC verification before making payments.
      </Text>

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => setKycModalVisible(false)}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalButton, styles.modalVerifyButton]}
          onPress={() => {
            setKycModalVisible(false);
            router.push("/kyc-verification");
          }}
        >
          <Text style={styles.modalVerifyText}>Go to KYC</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
</>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  backIcon: { fontSize: 24, color: "#fff" },
  headerCenter: { alignItems: "center" },
  headerAmount: { fontSize: 26, color: "#fff", fontWeight: "bold" },
  headerSubtitle: { fontSize: 14, color: "#e0f7f4", marginTop: 2 },

  content: {
    paddingHorizontal: 16,
  },

  imageWrapper: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    height: 160,
  },
  image: { width: "100%", height: "100%" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: "#e5e7eb",
  },
  modalVerifyButton: {
    backgroundColor: '#5845D8',
  },
  modalCancelText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  modalVerifyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  summaryText: { fontSize: 14, color: "#777", marginBottom: 4 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e6f2f2",
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: { backgroundColor: "#fff", elevation: 2 },
  tabText: { color: "#555", fontWeight: "500" },
  activeTabText: { color: '#5845D8', fontWeight: "600" },

  paymentSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  cardField: {
    height: 50,
    width: "100%",
    marginVertical: 10,
  },
  cardStyle: {
    backgroundColor: "#fff",
    textColor: "#000",
    borderColor: "#d9d9d9",
    borderWidth: 1,
    borderRadius: 10,
  },

  payButton: {
    backgroundColor: '#5845D8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  payButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  buttonDisabled: { opacity: 0.6 },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: "center",
    marginTop: 8,
  },
});
