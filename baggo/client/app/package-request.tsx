import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Package,
  Weight,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  Shield,
  MapPin,
  Clock,
  Upload,
  ChevronLeft,
} from 'lucide-react-native';
import { backendomain } from '@/utils/backendDomain';
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PackageRequestScreen() {
  const router = useRouter();
  const { id: tripId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [loadingButton, setLoadingButton] = useState(null);
  // index of currently-displayed request
  const [currentIndex, setCurrentIndex] = useState(0);
  const [proofImage, setProofImage] = useState(null);
   const [uploading, setUploading] = useState(false);
  // date picker state (for iOS or modal fallback, we keep these)
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [dateField, setDateField] = useState(null); // 'estimatedDeparture' or 'estimatedArrival'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [balance, setBalance] = useState(0);
const [escrowBalance, setEscrowBalance] = useState(0);
  // accept animation/overlay state
  const [accepting, setAccepting] = useState(false);
  const [requestLoading, setRequestLoading] = useState(true);

  const [symbol, setSymbol] = useState("₦");
    const [country, setCountry] = useState(null);
    const [isNigeria, setIsNigeria] = useState(false);

  const [userData, setUserData] = useState(null);
const [currency, setCurrency] = useState('EUR');
  const base = (typeof backendomain === 'object' && backendomain.backendomain) ? backendomain.backendomain : backendomain;


  const CURRENCY_KEY = "userCurrency";

  const saveCurrency = async (value: string) => {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, value);
    } catch (err) {
      console.error("Error saving currency:", err);
    }
  };

  const loadCurrency = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(CURRENCY_KEY);
    } catch (err) {
      console.error("Error loading currency:", err);
      return null;
    }
  };

  const currencySymbols = {
    EUR: "€",
    AT: "€",
    BE: "€",
    CY: "€",
    EE: "€",
    FI: "€",
    FR: "€",
    DE: "€",
    GR: "€",
    IE: "€",
    IT: "€",
    LV: "€",
    LT: "€",
    LU: "€",
    MT: "€",
    NL: "€",
    PT: "€",
    SK: "€",
    SI: "€",
    ES: "€",

    NGN: "₦",
    GHS: "₵",
    KES: "KSh",
    ZAR: "R",
    EGP: "£",
    TZS: "TSh",
    UGX: "USh",
    MAD: "DH",
    DZD: "DA",
    SDG: "£",
    XOF: "CFA",
    XAF: "FCFA",

    USD: "$",
    CAD: "CA$",
    MXN: "$",
    BRL: "R$",
    ARS: "$",
    CLP: "$",
    COP: "$",
    PEN: "S/",
    UYU: "$U",

    INR: "₹",
    CNY: "¥",
    JPY: "¥",
    RUB: "₽",
    TRY: "₺",
    AED: "د.إ",
    SGD: "S$",
    AUD: "A$",
    NZD: "NZ$",
    CHF: "CHF",

    GBP: "£",
  };



  useEffect(() => {
    (async () => {
      try {
        // 🟢 Load saved currency if previously selected
        const savedCurrency = await loadCurrency();
        const savedCountry = await AsyncStorage.getItem("userCountry");

        if (savedCurrency && savedCountry) {
          setCurrency(savedCurrency);
          setCountry(savedCountry);
          setSymbol(currencySymbols[savedCurrency] || "₦");
          console.log("💾 Loaded saved currency and country:", savedCurrency, savedCountry);
          setLoading(false);
          return; // stop here
        }

        // 🟡 Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          // fallback to defaults
          setCurrency(savedCurrency || "NGN");
          setCountry(savedCountry || "Nigeria");
          setSymbol(currencySymbols[savedCurrency] || "₦");
          setLoading(false);
          return;
        }

        // Get current position
        const loc = await Location.getCurrentPositionAsync({});
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        let detectedCurrency = "NGN";
        let detectedCountry = "Nigeria";

        if (reverse.length > 0) {
          const countryCode = reverse[0].isoCountryCode || "NG";
          const countryName = reverse[0].country || "Nigeria";

          // Map country code to currency
          const currencyMap = {
            NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR", EG: "EGP",
            TZ: "TZS", UG: "UGX", MA: "MAD", DZ: "DZD", SD: "SDG",
            FR: "EUR", DE: "EUR", IT: "EUR", ES: "EUR", PT: "EUR",
            NL: "EUR", LU: "EUR", BE: "EUR", IE: "EUR", GR: "EUR",
            FI: "EUR", EE: "EUR", LT: "EUR", LV: "EUR", CY: "EUR",
            MT: "EUR", SK: "EUR", SI: "EUR", GB: "GBP", CA: "CAD",
            MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP",
            PE: "PEN", UY: "UYU", IN: "INR", CN: "CNY", JP: "JPY",
            RU: "RUB", TR: "TRY", AE: "AED", SG: "SGD", AU: "AUD",
            NZ: "NZD", CH: "CHF"
          };

          detectedCurrency = currencyMap[countryCode] || "NGN";
          detectedCountry = countryName;

          // Save detected currency/country if different from saved
          if (savedCurrency !== detectedCurrency || savedCountry !== detectedCountry) {
            await saveCurrency(detectedCurrency);
            await AsyncStorage.setItem("userCountry", detectedCountry);
          }
        }

        // Update state
        setCurrency(detectedCurrency);
        setCountry(detectedCountry);
        setSymbol(currencySymbols[detectedCurrency] || "₦");
        setIsNigeria(detectedCurrency === "NGN");

        console.log("🌍 Detected Country:", detectedCountry, "Currency:", detectedCurrency);

      } catch (err) {
        console.error("Location detection error:", err);
        // Fallback defaults
        setCurrency("NGN");
        setCountry("Nigeria");
        setSymbol("₦");
      } finally {
        setLoading(false);
      }
    })();
  }, []);


   useEffect(() => {
     const fetchData = async () => {
       try {
         console.log("Fetching wallet and profile data...");

         // 🟢 Fetch profile
         const profileUrl = `${base}/api/baggo/Profile`;
         const profileResponse = await fetch(profileUrl, {
           method: 'GET',
           credentials: 'include',
           headers: { 'Content-Type': 'application/json' },
         });

         const profileData = await profileResponse.json();
         console.log('profileData:', profileData);

         if (profileData?.data?.findUser) {
           const user = profileData.data.findUser;
           setUserData(user);

           // 💰 Balances
           const pBalance = Number(user.balance ?? 0);
           const pEscrow = Number(user.escrowBalance ?? user.escrow ?? 0);
           setBalance(!Number.isNaN(pBalance) ? pBalance : 0);
           setEscrowBalance(!Number.isNaN(pEscrow) ? pEscrow : 0);

           // 🟩 Balance History → Recent Transactions
           if (Array.isArray(user.balanceHistory)) {
             const mappedHistory = user.balanceHistory.map((txn) => ({
               id: txn._id,
               type:
                 txn.type === 'deposit' || txn.type === 'escrow_release'
                   ? 'credit'
                   : 'debit',
               amount: Number(txn.amount ?? 0),
               date: txn.date,
               description: txn.description || txn.type,
               status: txn.status,
             }));

             console.log('✅ Loaded balance history:', mappedHistory.length, 'transactions');
           } else {

             console.log('ℹ️ No balance history found');
           }




         } else {
           console.warn('Profile returned no user:', profileData);
           setUserData(null);

           setBalance(0);
           setEscrowBalance(0);

         }
       } catch (err) {
         console.error("🚨 Network or unexpected error:", err);
         setError("Error connecting to the server: " + err.message);
       } finally {
         setLoading(false);
       }
     };

     fetchData();
   }, []);


  useEffect(() => {
      const fetchBalance = async () => {
        const profileUrl = `${backendomain.backendomain}/api/baggo/Profile`;

        try {
          const response = await fetch(profileUrl, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          const data = await response.json();
          console.log("profileData:", data);

          if (data?.data?.findUser) {
            const user = data.data.findUser;
            const pBalance = Number(user.escrowBalance ?? 0);
            setBalance(!Number.isNaN(pBalance) ? pBalance : 0);
          }
        } catch (error) {
          console.error("❌ Error fetching balance:", error);
        }
      };

      fetchBalance();
    }, []);


  useEffect(() => {
    const fetchRequests = async () => {
      if (!tripId || tripId === 'undefined') {
        setError('Invalid or missing trip ID');
        setLoading(false);
        setRequestLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendomain.backendomain}/api/baggo/getRequests/${tripId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        // console.log('Raw requests response:', JSON.stringify(data, null, 2));

        if (data.success && Array.isArray(data.data.requests)) {
        const mappedRequests = data.data.requests
          .map((request, index) => {
            if (!request._id || !request.package) {
              console.warn(`Invalid request at index ${index}:`, request);
              return null;
            }

            return {
              _id: request._id,
              package: {
                fromCountry: request.package.fromCountry || 'Unknown',
                fromCity: request.package.fromCity || 'Unknown',
                toCountry: request.package.toCountry || 'Unknown',
                toCity: request.package.toCity || 'Unknown',
                packageWeight: request.package.packageWeight || 0,
                receiverName: request.package.receiverName || 'Unknown',
                receiverPhone: request.package.receiverPhone || 'Unknown',
                description: request.package.description || 'No description',
                pickupAddress: request.package.pickupAddress || request.package.fromAddress || '',
                deliveryAddress: request.package.deliveryAddress || request.package.toAddress || '',
                packageImage:
    // package-level image first
    request.package?.packageImage ||
    request.package?.image ||
    // then request-level image (where your log shows it lives)
    request.image ||
    // extra safety for nested raw (if needed)
    request.raw?.image ||
    null,

                value: request.package.value || request.package.declaredValue || null,
                shippingFee: request.package.shippingFee || null,
                appFee: request.package.appFee || null,
              },
              sender: {
                name: (request.sender && (request.sender.name || request.sender.email)) || 'Unknown',
              },
              status: request.status || 'pending',
              insurance: request.insurance || false,
              insuranceCost: request.insuranceCost || 0,
              movementTracking: request.movementTracking || [],
              estimatedDeparture: request.estimatedDeparture,
              estimatedArrival: request.estimatedArrival,
              raw: request,
            };
          })
      

          setRequests(mappedRequests);
          setCurrentIndex(0);

          if (mappedRequests.length === 0 && data.data.requests.length > 0) {
            setError('No valid requests found due to missing data');
          }
        } else {
          setError(data.message || 'Failed to fetch requests');
          setRequests([]);
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Error fetching requests');
        setRequests([]);
      } finally {
        setRequestLoading(false);
      }
    };

    fetchRequests();
  }, [tripId]);



  // Log the currently displayed request and its image whenever requests/currentIndex changes
useEffect(() => {
  if (!requests || requests.length === 0) return;
  const current = requests[currentIndex];
  if (!current) {
    console.log('No current request at index', currentIndex);
    return;
  }

  console.log('--- Current Request Image Debug ---');
  console.log('requestId:', current._id);
  console.log('current.package.packageImage:', current.package?.packageImage ?? null);
  console.log('current.raw.image (request-level image):', current.raw?.image ?? null);
  console.log('full raw request object (first 1k chars):', JSON.stringify(current.raw).slice(0, 1000));
}, [requests, currentIndex]);


  // Returns true if update succeeded
  const handleUpdateStatus = async (requestId, newStatus, location = '') => {
    console.log("🚀 handleUpdateStatus CALLED:", { requestId, newStatus, location }); // 👈 Add this first

    try {


      const response = await fetch(`${backendomain.backendomain}/api/baggo/updateRequestStatus/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, location }),
      });

      const data = await response.json();
      console.log("✅ Update request status response:", data);

      if (data.success) {
        // ✅ Update UI state
        setRequests(prevRequests =>
          prevRequests.map(req =>
            req._id === requestId
              ? {
                  ...req,
                  status: newStatus,
                  movementTracking: data.data.movementTracking || req.movementTracking,
                }
              : req
          )
        );

        // ✅ Get the full request info
        const currentReq = data.data || requests.find(r => r._id === requestId);

        // ✅ Safely extract senderId
        const senderId = currentReq?.sender?._id;

        if (!senderId) {
          console.log("⚠️ No senderId found in request:", currentReq);
        } else {
          console.log("📨 Sending notification to senderId:", senderId);
          await sendPushNotification(senderId, newStatus, currentReq);
        }

        return true;
      } else {
        console.error('❌ Failed to update request status:', data.message);
        setError(data.message || 'Failed to update status');
        return false;
      }
    } catch (err) {
      console.error('🔥 Error updating request status:', err);
      setError('Error updating request status');
      return false;
    }
  };



  const sendPushNotification = async (senderId, status, requestData) => {
    try {
      console.log("🔔 Sending push notification...");
      console.log("SenderId:", senderId);
      console.log("Status:", status);
      console.log("Request Data (partial):", {
        packageName: requestData?.raw?.packageName,
        traveler: requestData?.raw?.traveler?.firstName,
      });

      const senderName = requestData?.raw?.sender?.firstName || "Dear";
      const travelerName = requestData?.raw?.traveler?.firstName || "your traveler";
      const packageName = requestData?.raw?.packageName || "your package";
      const packageWeight = requestData?.raw?.packageWeight || "";
      const deliveryLocation = requestData?.raw?.deliveryLocation || "";

      const titles = {
        accepted: "Package Accepted ✅",
        intransit: "Package In Transit 🚚",
        delivering: "Package Out for Delivery 📦",
        completed: "Package Delivered 🎉",
      };

      const messages = {
        accepted: `Hello ${senderName}, ${travelerName} has accepted ${packageName}${
          packageWeight ? ` (${packageWeight}kg)` : ""
        } for delivery to ${deliveryLocation}.`,
        intransit: `Hello ${senderName}, ${packageName} is now in transit with ${travelerName}.`,
        delivering: `Hello ${senderName}, ${travelerName} is currently delivering ${packageName}.`,
        completed: `Hello ${senderName}, ${packageName} has been successfully delivered to ${deliveryLocation} by ${travelerName}.`,
      };

      const title = titles[status] || "Package Update";
      const body = messages[status] || `Hello ${senderName}, ${packageName} status changed to ${status}.`;

      console.log("📦 Notification Payload:", { userId: senderId, title, body });

      const response = await fetch(`${backendomain.backendomain}/send-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: senderId, // ✅ fixed from receiverId
          title,
          body,
        }),
      });

      const resText = await response.text();
      console.log("✅ Notification Response:", resText);

    } catch (err) {
      console.error("❌ Failed to send push notification:", err);
    }
  };




  const handleCancel = async (pkg) => {
    try {
      const requestId = pkg?._id;
      if (!requestId) return;

      const response = await fetch(`${base}/api/baggo/remove-cancelled-escrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("❌ Cancel request failed:", data.message);
        Alert.alert("Error", data.message || "Failed to cancel request");
        return;
      }

      console.log("✅ Request cancelled:", data.message);

      await sendPushNotification(pkg.senderId, "cancelled", pkg);

      setRequests(prev => prev.filter(r => r._id !== requestId));

      Alert.alert("Success", "Request has been cancelled successfully");

    } catch (error) {
      console.error("handleCancel error:", error);
      Alert.alert("Error", "Something went wrong while cancelling the request");
    }
  };


  const handleUpdateDate = async (requestId, field, date) => {
    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/updateRequestDates/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: date.toISOString() }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        setRequests(prevRequests =>
          prevRequests.map(req =>
            req._id === requestId
              ? { ...req, [field]: data.data[field] }
              : req
          )
        );
      } else {
        console.error('Failed to update date:', data.message);
        setError(data.message || 'Failed to update date');
      }
    } catch (err) {
      console.error('Error updating date:', err);
      setError(err.message || 'Error updating date');
    }
  };


  const openDatePicker = (requestId, field, currentDate) => {
    const date = currentDate ? new Date(currentDate) : new Date();
    setSelectedRequestId(requestId);
    setDateField(field);
    setSelectedDate(date);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'datetime',
        minimumDate: new Date(),
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            handleUpdateDate(requestId, field, selected);
          }
          DateTimePickerAndroid.dismiss('datetime');
        },
      });
    } else {
      // iOS: can show a custom modal if you want
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // UI helpers: get current request safely
  const currentRequest = requests.length > 0 && requests[currentIndex] ? requests[currentIndex] : null;

  // derive fields used in UI (with fallbacks)
  const pkg = currentRequest
    ? {
        senderName: currentRequest.sender?.name || 'Unknown',
        senderRating: currentRequest.raw?.senderRating || 0,
        from: currentRequest.package?.fromCity || currentRequest.package?.fromCountry || 'Unknown',
        to: currentRequest.package?.toCity || currentRequest.package?.toCountry || 'Unknown',
        weight: currentRequest.package?.packageWeight || 0,
        description: currentRequest.package?.description || 'No description',
        value: currentRequest.package?.value || currentRequest.raw?.value || null,
        insurance: currentRequest.insurance || false,
        insuranceCost: currentRequest.insuranceCost || 0,
        shippingFee: currentRequest.package?.shippingFee || currentRequest.raw?.shippingFee || 0,
        appFee: currentRequest.package?.appFee || currentRequest.raw?.appFee || 0,
        // compute an estimated total earning if fields exist; otherwise 0
        totalEarning:
          (currentRequest.raw?.totalEarning ??
            currentRequest.package?.totalEarning ??
            // fallback: shippingFee - appFee (if present)
            ((currentRequest.package?.shippingFee || currentRequest.raw?.shippingFee) - (currentRequest.package?.appFee || currentRequest.raw?.appFee) || 0)) || 0,
        pickupAddress: currentRequest.package?.pickupAddress || '',
        deliveryAddress: currentRequest.package?.deliveryAddress || '',
        packageImage: currentRequest.package?.packageImage || null,
        status: currentRequest.status || 'pending',
        estimatedDeparture: currentRequest.estimatedDeparture,
        estimatedArrival: currentRequest.estimatedArrival,
        movementTracking: currentRequest.movementTracking || [],
        _id: currentRequest._id,
      }
    : null;

  // Accept wrapper to show overlay when success
  const handleAccept = async () => {
    if (!pkg) return;
    setLoadingButton('accept');
    try {
      const success = await handleUpdateStatus(pkg._id, 'accepted');
      if (success) {
        setAccepting(true);
        setTimeout(() => {
          setAccepting(false);
          router.back();
        }, 2000);
      }
    } finally {
      setLoadingButton(null);
    }
  };

  const handleDecline = async () => {
    if (!pkg) return;
    setLoadingButton('decline');
    try {
      await handleUpdateStatus(pkg._id, 'rejected');
    } finally {
      setLoadingButton(null);
    }
  };

  const handleMarkInTransit = async () => {
    if (!pkg) return;
    setLoadingButton('intransit');
    try {
      await handleUpdateStatus(pkg._id, 'intransit', pkg.from);
    } finally {
      setLoadingButton(null);
    }
  };

  const handleMarkDelivering = async () => {
    if (!pkg) return;
    setLoadingButton('delivering');
    try {
      await handleUpdateStatus(pkg._id, 'delivering', pkg.to);
    } finally {
      setLoadingButton(null);
    }
  };

  const handleMarkCompleted = async () => {
    if (!pkg) return;
    setLoadingButton('completed');
    try {
      await handleUpdateStatus(pkg._id, 'completed', pkg.to);
    } finally {
      setLoadingButton(null);
    }
  };

  const handleNext = () => {
    if (requests.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % requests.length);
  };

  const handlePrev = () => {
    if (requests.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + requests.length) % requests.length);
  };



  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker?.MediaType
          ? [ImagePicker.MediaType.Image]
          : ImagePicker.MediaTypeOptions.Images, // fallback for older versions
        allowsEditing: true,
        quality: 1,
      });

      if (!result || result.canceled || result.cancelled) return;

      // get the URI
      const uri = result?.assets?.[0]?.uri ?? result?.uri;
      setProofImage({ uri }); // keep for preview

      // optional: resize/compress
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat?.JPEG ?? "jpeg",
        }
      );

      // ensure proper file URI
      const fileUri = manipResult.uri.startsWith("file://")
        ? manipResult.uri
        : `file://${manipResult.uri}`;

      // convert to base64 if you need it for API
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType?.Base64 ?? "base64",
      });

      // save the base64 string for upload
      setProofImage(prev => ({ ...prev, base64: `data:image/jpeg;base64,${base64}` }));
    } catch (err: any) {
      console.error("Error picking or converting proof image:", err);
      Alert.alert("Error", err?.message ?? "Failed to process image.");
    }
  };

  // Optional remove function
  const removeProofImage = () => {
    setProofImage(null);
  };



 // 🆕 Function to upload proof
 const handleSendProof = async () => {
   if (!proofImage || !requests[currentIndex]?._id) {
     Alert.alert('Please select an image first');
     return;
   }

   try {
     setUploading(true);
     const formData = new FormData();
     formData.append('senderProof', {
       uri: proofImage.uri,
       name: 'proof.jpg',
       type: 'image/jpeg',
     });

     const response = await fetch(
       `${backendomain.backendomain}/api/baggo/request/${requests[currentIndex]._id}/image`,
       {
         method: 'PUT',
         body: formData, // let fetch set Content-Type
       }
     );

     const text = await response.text(); // first check raw response
     console.log('Raw response:', text);

     const data = JSON.parse(text); // parse JSON manually
     if (data.success) {
       Alert.alert('Success', 'Proof image uploaded successfully');
       setProofImage(null);
     } else {
       Alert.alert('Error', data.message || 'Upload failed');
     }
   } catch (err) {
     Alert.alert('Error', 'Failed to upload proof image');
     console.error(err);
   } finally {
     setUploading(false);
   }
 };



 if (requestLoading) {
   return (
     <View style={{ flex:1 , justifyContent:"center", alignItems:"center" }}>
       <ActivityIndicator size="large" color="#6C63FF" />
     </View>
   );
 }

 if (!requestLoading && requests.length === 0) {
   return (
     <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
       <Text style={{ fontSize:16, color:"#555" }}>
         No requests yet
       </Text>
     </View>
   );
 }


  if (!pkg) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.noRequestsText}>There are no requests yet</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#111111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[#6366F1, #6366F1Dark]} style={styles.earningCard}>
        <Text style={styles.earningLabel}>Your Earning</Text>

<Text style={styles.earningValue}>
  {symbol}{escrowBalance
    ? escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00"}
</Text>

          <View style={styles.escrowBadge}>
            <Shield size={14} color="#FFFFFF" />
            <Text style={styles.escrowText}>Held in Escrow Until Pickup</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Photo</Text>
          {pkg.packageImage ? (
            <Image source={{ uri: pkg.packageImage }} style={styles.packageImage} />
          ) : (
            <View style={[styles.packageImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <Package size={48} color="#6B7280" />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Package size={20} color="#6B7280" />
              <View style={styles.flex}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.value}>{pkg.description}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Weight size={20} color="#6B7280" />
              <View style={styles.flex}>
                <Text style={styles.label}>Weight</Text>
                <Text style={styles.value}>{pkg.weight} kg</Text>
              </View>
            </View>
            <View style={styles.row}>
              <DollarSign size={20} color="#6B7280" />
              <View style={styles.flex}>
                <Text style={styles.label}>Value</Text>
                <Text style={styles.value}>{pkg.value ? `€${pkg.value}` : 'N/A'}</Text>
              </View>
            </View>

            <View style={{ paddingVertical: 12 }}>
              <Text style={[styles.label, { marginBottom: 8 }]}>Status</Text>
              <Text style={[styles.value, { color: getStatusColor(pkg.status) }]}>{pkg.status}</Text>
            </View>

            <View style={{ paddingVertical: 12 }}>
              <Text style={[styles.sectionTitle, { fontSize: 14 }]}>Tracking Information</Text>
              <TouchableOpacity
                style={styles.trackingItem}
                onPress={() => openDatePicker(currentRequest._id, 'estimatedDeparture', pkg.estimatedDeparture)}
                disabled={['rejected', 'cancelled', 'completed'].includes(pkg.status)}
              >
                <Clock size={16} color="#6B7280" />
                <Text style={styles.trackingText}>
                  Est. Departure: {formatDate(pkg.estimatedDeparture)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.trackingItem}
                onPress={() => openDatePicker(currentRequest._id, 'estimatedArrival', pkg.estimatedArrival)}
                disabled={['rejected', 'cancelled', 'completed'].includes(pkg.status)}
              >
                <Clock size={16} color="#6B7280" />
                <Text style={styles.trackingText}>
                  Est. Arrival: {formatDate(pkg.estimatedArrival)}
                </Text>
              </TouchableOpacity>

              {pkg.movementTracking && pkg.movementTracking.length > 0 && (
                <View style={styles.trackingHistory}>
                  <Text style={styles.sectionTitle}>Movement History</Text>
                  {pkg.movementTracking.map((track, index) => (
                    <View key={index} style={styles.trackingItem}>
                      <MapPin size={16} color="#6B7280" />
                      <Text style={styles.trackingText}>
                        {track.status} {track.location ? `at ${track.location}` : ''} - {formatDate(track.timestamp)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.card}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#6366F1' }]} />
              <View style={styles.flex}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.value}>{pkg.from}</Text>
                {pkg.pickupAddress ? <Text style={styles.address}>{pkg.pickupAddress}</Text> : null}
              </View>
            </View>
            <View style={styles.line} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.flex}>
                <Text style={styles.label}>Delivery</Text>
                <Text style={styles.value}>{pkg.to}</Text>
                {pkg.deliveryAddress ? <Text style={styles.address}>{pkg.deliveryAddress}</Text> : null}
              </View>
            </View>
          </View>
        </View>



        <View style={styles.section}>
         <Text style={styles.sectionTitle}>Upload Proof Image</Text>
         {proofImage ? (
           <View style={{ alignItems: 'center' }}>
             <Image source={{ uri: proofImage.uri }} style={styles.proofPreview} />
             <TouchableOpacity
               onPress={() => setProofImage(null)}
               style={styles.removeProofButton}
             >
               <Text style={styles.removeProofText}>Remove Image</Text>
             </TouchableOpacity>
           </View>
         ) : (
           <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
             <Upload size={24} color="#6366F1" />
             <Text style={styles.uploadText}>Tap to select an image</Text>
           </TouchableOpacity>
         )}

         <TouchableOpacity
           onPress={handleSendProof}
           style={[styles.sendButton, uploading && { opacity: 0.6 }]}
           disabled={uploading}
         >
           {uploading ? (
             <ActivityIndicator color="#FFFFFF" />
           ) : (
             <Text style={styles.sendButtonText}>Send Proof</Text>
           )}
         </TouchableOpacity>
       </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sender</Text>
          <View style={styles.senderCard}>
            <View style={styles.avatar}>
              <User size={24} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.senderName}>{pkg.senderName}</Text>
              <Text style={styles.senderRating}>⭐ {pkg.senderRating} • Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Shield size={20} color="#6366F1" />
          <View style={styles.flex}>
            <Text style={styles.infoTitle}>Escrow Protection</Text>
            <Text style={styles.infoText}>
              Payment is held securely. You'll receive it after pickup and delivery.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {!accepting && (
      <View style={styles.footer}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrev} disabled={requests.length <= 1}>
            <Text style={styles.navButtonText}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={handleNext} disabled={requests.length <= 1}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 2, flexDirection: 'row', gap: 12 }}>
          {/* Show Decline + Accept only when pending */}
          {pkg.status === 'pending' && (
            <>
            <TouchableOpacity
  style={styles.declineButton}
  onPress={handleDecline}
  disabled={loadingButton === 'decline'}
>
  <XCircle size={20} color="#EF4444" />
  {loadingButton === 'decline' ? (
    <ActivityIndicator color="#EF4444" style={{ marginLeft: 8 }} />
  ) : (
    <Text style={styles.declineButtonText}>Decline</Text>
  )}
</TouchableOpacity>


              <TouchableOpacity
    style={styles.acceptButton}
    onPress={handleAccept}
    disabled={loadingButton === 'accept'} // disable while loading
  >
    <CheckCircle size={20} color="#FFFFFF" />
    {loadingButton === 'accept' ? (
      <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />
    ) : (
      <Text style={styles.acceptButtonText}>Accept</Text>
    )}
  </TouchableOpacity>

            </>
          )}

          {/* Status actions */}
          {pkg.status === 'accepted' && (
            <>
            <TouchableOpacity
    style={styles.statusButton}
    onPress={handleMarkInTransit}
    disabled={loadingButton === 'intransit'}
  >
    <MapPin size={18} color="#FFFFFF" />
    {loadingButton === 'intransit' ? (
      <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />
    ) : (
      <Text style={styles.actionButtonText}>Mark In Transit</Text>
    )}
  </TouchableOpacity>


              {/* Cancel button only for accepted */}
              <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(pkg)}>
        <View style={styles.cancelButtonContent}>
          <XCircle size={18} color="#FFFFFF" />
          <Text style={styles.cancelButtonText}> Cancel</Text>
        </View>
      </TouchableOpacity>


            </>
          )}

          {/* In Transit button */}
  {pkg.status === 'intransit' && (
    <>
      <TouchableOpacity
        style={styles.statusButton}
        onPress={handleMarkDelivering}
        disabled={loadingButton === 'delivering'}
      >
        <MapPin size={18} color="#FFFFFF" />
        {loadingButton === 'delivering' ? (
          <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />
        ) : (
          <Text style={styles.actionButtonText}>Mark Delivering</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
    style={styles.cancelButton}
    onPress={async () => {
      setLoadingButton('cancel');           // show spinner
      try {
        await handleCancel(pkg);
      } finally {
        setLoadingButton(null);             // hide spinner
      }
    }}
    disabled={loadingButton === 'cancel'}   // prevent multiple presses
  >
    <XCircle size={18} color="#FFFFFF" />
    {loadingButton === 'cancel' ? (
      <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />
    ) : (
      <Text style={styles.cancelButtonText}>Cancel</Text>
    )}
  </TouchableOpacity>

    </>
  )}

  {/* Delivering button */}
  {pkg.status === 'delivering' && (
    <TouchableOpacity
      style={styles.statusButton}
      onPress={handleMarkCompleted}
      disabled={loadingButton === 'completed'}
    >
      <CheckCircle size={18} color="#FFFFFF" />
      {loadingButton === 'completed' ? (
        <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />
      ) : (
        <Text style={styles.actionButtonText}>Mark Completed</Text>
      )}
    </TouchableOpacity>
  )}

        </View>
      </View>
    )}



      {accepting && (
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <CheckCircle size={64} color="#22C55E" />
            <Text style={styles.successTitle}>Request Accepted!</Text>
            <Text style={styles.successText}>Payment held in escrow. Pick up to start earning.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return #111111Light;
    case 'accepted':
      return #22C55E;
    case 'rejected':
      return #EF4444;
    case 'intransit':
      return #F59E0B;
    case 'delivering':
      return colors.info;
    case 'completed':
      return #6366F1;
    case 'cancelled':
      return #EF4444;
    default:
      return #111111;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F3' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F8F6F3', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111111' },
  content: { flex: 1 },
  earningCard: { margin: 20, borderRadius: 20, padding: 24, alignItems: 'center' },
  earningLabel: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginBottom: 8 },
  earningValue: { fontSize: 42, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  escrowText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111111', marginBottom: 12 },
  packageImage: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#F8F6F3'Light },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  flex: { flex: 1, marginLeft: 12 },
  label: { fontSize: 13, color: '#111111'Light, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '600', color: '#111111' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 16, height: 16, borderRadius: 8, marginTop: 4 },
  line: { width: 2, height: 32, backgroundColor: '#E5E7EB', marginLeft: 7, marginVertical: 8 },
  address: { fontSize: 14, color: '#111111'Light, marginTop: 4 },
  senderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  senderName: { fontSize: 16, fontWeight: '600', color: '#111111', marginBottom: 4 },
  senderRating: { fontSize: 14, color: '#111111'Light },
  infoBox: { flexDirection: 'row', backgroundColor: '#F8F6F3'Light, marginHorizontal: 20, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#6366F1' },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#111111', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#111111'Light, lineHeight: 18 },
  footer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12, alignItems: 'center' },
  navButton: { backgroundColor: '#6366F1', paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, height: 44 },
  navButtonText: { color: '#FFFFFF', fontWeight: '600' },
  declineButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, height: 56, gap: 8, borderWidth: 2, borderColor: '#EF4444' },
  declineButtonText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  acceptButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F1', borderRadius: 12, height: 56, gap: 8 },
  acceptButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  statusButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F1', borderRadius: 12, height: 56, gap: 8 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', maxWidth: 320 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#111111', marginTop: 16, marginBottom: 12 },
  successText: { fontSize: 15, color: '#111111'Light, textAlign: 'center', lineHeight: 22 },
  cancelButton: {
     backgroundColor: '#EF4444', // Red background
     paddingVertical: 10,
     paddingHorizontal: 16,
     borderRadius: 8,
     alignItems: 'center',
     justifyContent: 'center',
     flexDirection: 'row', // Icon + Text in a row
     gap: 8, // Space between icon and text
   },
   cancelButtonContent: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
   },
   cancelButtonText: {
     color: '#FFFFFF',
     fontWeight: 'bold',
     fontSize: 16,
   },
  // tracking styles reused
  trackingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  trackingText: { fontSize: 13, color: '#111111'Light, flex: 1 },
  trackingNotes: { fontSize: 12, color: '#111111'Light, marginLeft: 24, marginBottom: 4 },
  trackingHistory: { marginTop: 8 },

  uploadBox: {
      height: 160,
      borderWidth: 2,
      borderColor: '#6366F1',
      borderStyle: 'dashed',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8F6F3'Light,
    },
    uploadText: { color: '#6366F1', fontWeight: '600', marginTop: 8 },
    proofPreview: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12 },
    removeProofButton: { backgroundColor: '#EF4444', borderRadius: 8, padding: 8 },
    removeProofText: { color: '#FFFFFF', fontWeight: '600' },
    sendButton: {
      backgroundColor: '#6366F1',
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 14,
      marginTop: 12,
    },
    sendButtonText: { color: '#FFFFFF', fontWeight: '700' },

  // misc
  noRequestsText: { fontSize: 16, color: '#111111'Light, textAlign: 'center', marginBottom: 20 },
  errorText: { fontSize: 16,   color: 'gray', textAlign: 'center', marginBottom: 20 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#6366F1' },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
