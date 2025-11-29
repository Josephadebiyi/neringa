import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Linking,
  Image
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter,useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { User, Shield, CreditCard,Copy, FileText,CheckCircle,XCircle , LogOut, ChevronRight, CircleAlert as AlertCircle, Wallet, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, Building, X, DollarSign, Search, Moon, Sun } from 'lucide-react-native';
import { walletTransactions } from '@/utils/dummyData';
import { currencies } from '@/utils/locations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { backendomain } from '@/utils/backendDomain';
import { useMemo } from 'react'
import * as Clipboard from 'expo-clipboard';
import { useRef } from 'react';
import * as Location from 'expo-location';


export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'paypal'>('bank');
  const [otp, setOtp] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [userData, setUserData] = useState(null);
  const [tripsData, setTripsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
const [isVerifying, setIsVerifying] = useState(false);
  // state near top
  const params = useLocalSearchParams();
  const hasUpdated = useRef(false);

  useEffect(() => {
    if (!hasUpdated.current && params?.updatedUser) {
      try {
        const updated = typeof params.updatedUser === 'string'
          ? JSON.parse(params.updatedUser)
          : params.updatedUser;

        setUserData(updated);
        hasUpdated.current = true; // mark as processed
      } catch (err) {
        console.error('Failed to parse updatedUser:', err);
      }
    }
  }, [params]);



  const [selectedBankId, setSelectedBankId] = useState(null); // primitive id
  // if you still want the whole bank object elsewhere:
  // const selectedBank = paystackBanks.find(b => String(b.id) === String(selectedBankId)) ?? null;
  const [walletTransactions, setWalletTransactions] = useState([]);
const CURRENCY_KEY = 'userCurrency';
const COUNTRY_KEY = 'userCountry';
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [symbol, setSymbol] = useState("₦");
    const [country, setCountry] = useState(null);

  const [otpInput, setOtpInput] = useState('');

  const saveCurrency = async (currencyCode: string) => {
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, currencyCode);
    } catch (err) {
      console.error('Error saving currency:', err);
    }
  };

  const loadCurrency = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(CURRENCY_KEY);
    } catch (err) {
      console.error('Error loading currency:', err);
      return null;
    }
  };
  const saveCountry = async (countryCode: string) => {
    try {
      await AsyncStorage.setItem(COUNTRY_KEY, countryCode);
    } catch (err) {
      console.error('Error saving country:', err);
    }
  };

  const loadCountry = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(COUNTRY_KEY);
    } catch (err) {
      console.error('Error loading country:', err);
      return null;
    }
  };


  const [isNigeria, setIsNigeria] = useState(false);
const [paystackBanks, setPaystackBanks] = useState([]);
// const [selectedBank, setSelectedBank] = useState(null);
const [accountNumber, setAccountNumber] = useState('');
const [recipientCode, setRecipientCode] = useState(null);
const [showPaystackSetup, setShowPaystackSetup] = useState(false);
const [userStars, setUserStars] = useState(0);
const maxStars = 5;


const selectedBank = useMemo(
  () => paystackBanks.find(b => String(b.id) === String(selectedBankId)) ?? null,
  [paystackBanks, selectedBankId]
);


  const [stripeStatus, setStripeStatus] = useState({
    verified: false,
    chargesEnabled: false,
    accountLink: null,
  });


 const base = (typeof backendomain === 'object' && backendomain.backendomain) ? backendomain.backendomain : backendomain;




 // Load stars from AsyncStorage on mount
  useEffect(() => {
    const loadStars = async () => {
      try {
        const storedStars = await AsyncStorage.getItem('userStars');
        if (storedStars !== null) {
          setUserStars(parseInt(storedStars, 10));
        }
      } catch (error) {
        console.error('Failed to load stars:', error);
      }
    };
    loadStars();
  }, []);

  // Gradually increase stars
  const addStarGradually = async () => {
    if (userStars >= maxStars) return; // cap at maxStars

    let newStars = userStars;

    const interval = setInterval(async () => {
      if (newStars < maxStars) {
        newStars += 1;
        setUserStars(newStars);
        try {
          await AsyncStorage.setItem('userStars', newStars.toString());
        } catch (error) {
          console.error('Failed to save stars:', error);
        }
      } else {
        clearInterval(interval); // stop when max reached
      }
    }, 1000); // 1 second delay between each star
  };

  // 🟢 Fetch Stripe status
  const fetchStripeStatus = async (userId) => {
     if (!userId) {
       console.log('No userId yet, skipping stripe status fetch');
       return;
     }

     try {
       const url = `${base}/api/stripe/connect/status/${userId}`;
       console.log('Fetching Stripe status from:', url);

       const res = await fetch(url, {
         method: 'GET',
         credentials: 'include',
         headers: { 'Content-Type': 'application/json' },
       });

       console.log('Stripe status HTTP:', res.status);
       const text = await res.text();
       console.log('Stripe raw response:', text);

       let data;
       try {
         data = JSON.parse(text);
       } catch (err) {
         console.error('Stripe status response not JSON:', err, 'raw:', text);
         return;
       }

       if (data.success && data.account !== undefined) {
         setStripeStatus({
           verified: !!data.verified, // server returns verified
           chargesEnabled: !!data.account.charges_enabled,
           accountLink: null,
         });
       } else {
         console.warn('Stripe status returned unexpected shape:', data);
       }
     } catch (err) {
       console.error('Error fetching Stripe status:', err);
     }
   };

// 🟢 Create a new connect link
const handleStripeConnect = async () => {
  try {
    if (!userData?._id || !userData?.email) {
      alert('User data missing (id or email).');
      return;
    }

    const url = `${base}/api/stripe/connect/onboard`;
    console.log('Requesting Stripe onboarding link:', url);

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userData._id, email: userData.email }),
    });

    console.log('Create onboarding HTTP:', res.status);
    const text = await res.text();
    console.log('Create onboarding raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Onboard response not JSON:', err, 'raw:', text);
      return;
    }

    if (data && data.url) {
      setStripeStatus(prev => ({ ...prev, accountLink: data.url }));
      Linking.openURL(data.url).catch(e => console.error('Linking error:', e));
    } else {
      alert('Unable to create Stripe connection link.');
      console.warn('Onboard returned unexpected payload:', data);
    }
  } catch (err) {
    console.error('Error connecting Stripe:', err);
  }
};



// 🌍 Detect user country
const currencySymbols = {
  // Eurozone countries (EUR)
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

  // Africa
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

  // Americas
  USD: "$",
  CAD: "CA$",
  MXN: "$",
  BRL: "R$",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
  UYU: "$U",

  // Asia & Others
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

  // ✅ Add GBP
  GBP: "£",   // United Kingdom
};


useEffect(() => {
  (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverse.length > 0) {
        const countryCode = reverse[0].isoCountryCode || 'US';
        const countryName = reverse[0].country || 'Unknown';

        // Use currency symbol mapping
        let currency = 'USD'; // default
        switch (countryCode) {
          case 'NG':
            currency = 'NGN';
            break;
          case 'GH':
            currency = 'GHS';
            break;
          case 'KE':
            currency = 'KES';
            break;
          case 'ZA':
            currency = 'ZAR';
            break;
          case 'EG':
            currency = 'EGP';
            break;
          case 'TZ':
            currency = 'TZS';
            break;
          case 'UG':
            currency = 'UGX';
            break;
          case 'MA':
            currency = 'MAD';
            break;
          case 'DZ':
            currency = 'DZD';
            break;
          case 'SD':
            currency = 'SDG';
            break;
          case 'FR':
          case 'DE':
          case 'IT':
          case 'ES':
          case 'PT':
          case 'NL':
          case 'LU':
          case 'BE':
          case 'IE':
          case 'GR':
          case 'FI':
          case 'EE':
          case 'LT':
          case 'LV':
          case 'CY':
          case 'MT':
          case 'SK':
          case 'SI':
            currency = 'EUR';
            break;
          case 'GB':
            currency = 'GBP';
            break;
          case 'CA':
            currency = 'CAD';
            break;
          case 'MX':
            currency = 'MXN';
            break;
          case 'BR':
            currency = 'BRL';
            break;
          case 'AR':
            currency = 'ARS';
            break;
          case 'CL':
            currency = 'CLP';
            break;
          case 'CO':
            currency = 'COP';
            break;
          case 'PE':
            currency = 'PEN';
            break;
          case 'UY':
            currency = 'UYU';
            break;
          case 'IN':
            currency = 'INR';
            break;
          case 'CN':
            currency = 'CNY';
            break;
          case 'JP':
            currency = 'JPY';
            break;
          case 'RU':
            currency = 'RUB';
            break;
          case 'TR':
            currency = 'TRY';
            break;
          case 'AE':
            currency = 'AED';
            break;
          case 'SG':
            currency = 'SGD';
            break;
          case 'AU':
            currency = 'AUD';
            break;
          case 'NZ':
            currency = 'NZD';
            break;
          case 'CH':
            currency = 'CHF';
            break;
          default:
            currency = 'USD';
        }
        // ✅ Set state so UI reacts
                setCountry(countryCode);
                setCurrency(currency);
                setSymbol(currencySymbols[currency] || '$');
                setIsNigeria(countryCode === 'NG');


        console.log('Detected Country:', countryName);
        console.log('Country Code:', countryCode);
        console.log('Currency:', currency, currencySymbols[currency]);
      }
    } catch (err) {
      console.error(err);
    }
  })();
}, []);




useEffect(() => {
  fetchPaystackBanks();  // always fetch for debug
}, []);


// 🏦 Fetch Paystack Banks (via backend proxy)
const fetchPaystackBanks = async () => {
  try {
    console.log('[client] fetching banks from:', `${base}/api/paystack/banks`);
    const res = await fetch(`${base}/api/paystack/banks`);
    console.log('[client] raw HTTP status:', res.status);
    const text = await res.text();
    console.log('[client] raw body:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('[client] JSON parse error:', parseErr);
      return;
    }

    // Paystack forward: { status: true, data: [...] }
    if (data.status && Array.isArray(data.data)) {
      console.log('[client] using data.data (paystack):', data.data.length, 'banks');
      setPaystackBanks(data.data);
      return;
    }

    // alternative backend shape: { success: true, banks: [...] }
    if (data.success && Array.isArray(data.banks)) {
      console.log('[client] using banks (backend):', data.banks.length, 'banks');
      setPaystackBanks(data.banks);
      return;
    }

    console.warn('[client] unexpected banks payload:', data);
  } catch (e) {
    console.error('[client] fetchPaystackBanks error:', e);
  }
};

// 🏦 Create Paystack recipient
const handlePaystackSetup = async () => {
  if (!accountNumber || !selectedBankId) {
    return alert('Enter account details and select a bank');
  }

  const bank = paystackBanks.find(b => String(b.id) === String(selectedBankId));
  if (!bank) return alert('Selected bank not found');

  try {
    console.log('[client] creating recipient with:', {
      name: `${userData?.firstName} ${userData?.lastName}`,
      account_number: accountNumber,
      bank_code: bank.code,
      userId: userData?._id,
    });

    const url = `${base}/create-recipient`; // use the correct base
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${userData.firstName} ${userData.lastName}`,
        account_number: accountNumber,
        bank_code: bank.code,
        userId: userData._id,
      }),
    });

    const text = await res.text();
    console.log('[client] create-recipient HTTP', res.status, 'raw body:', text);

    if (text.trim().startsWith('<')) {
      console.error('[client] server returned HTML — likely an error page.');
      return alert('Server error: returned HTML. Check server logs.');
    }

    const data = JSON.parse(text);
    console.log('[client] parsed create-recipient response:', data);

    // handle server wrapper { success: true, recipient: {...} }
    if (data.success) {
      const recipient = data.recipient ?? data.data; // support either
      if (recipient && recipient.recipient_code) {
        setRecipientCode(recipient.recipient_code);
        alert('Paystack setup complete');
        setShowPaystackSetup(false);
        return;
      }
      // If success but no recipient field, show full payload for debugging
      console.warn('[client] success but missing recipient object', data);
      return alert('Created but server response unexpected — check console.');
    }

    // handle Paystack-like forwarded shape { status: true, data: {...} }
    if (data.status) {
      const recipient = data.data;
      setRecipientCode(recipient.recipient_code);
      alert('Paystack setup complete');
      setShowPaystackSetup(false);
      return;
    }

    // Otherwise it's an error
    console.warn('[client] create-recipient failed payload:', data);
    const message = data.message || (data.paystack && data.paystack.message) || 'Failed to create recipient';
    alert(message);
  } catch (e) {
    console.error('Recipient creation error:', e);
    alert('Error creating recipient. See console for details.');
  }
};


const handleRegionWithdraw = async () => {
  if (isNigeria) {
    await handlePaystackWithdraw();
  } else {
    await handleStripeWithdraw();
  }
};




// 💸 Withdraw via Paystack
const handlePaystackWithdraw = async () => {
  const amount = parseFloat(withdrawAmount);

  if (!recipientCode || !amount) {
    return alert('Complete setup or enter amount');
  }

  if (amount <= 0) {
    return alert('Invalid amount');
  }

  // ✅ Check if the user has enough balance
  if (amount > balance) {
    return alert(`Insufficient balance. Your current balance is ₦${balance.toFixed(2)}`);
  }

  try {
    const res = await fetch(`${base}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: recipientCode,
        amount,
        userId: userData._id,
      }),
    });

    const data = await res.json();
    if (data.status) {
      alert('Withdrawal successful!');
      setBalance((prev) => prev - amount);
      setOtpModalVisible(false);
    } else {
      alert(data.message || 'Withdrawal failed');
    }
  } catch (e) {
    console.error('Withdraw error:', e);
    alert('An error occurred while processing your withdrawal.');
  }
};






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
        setTripsData(profileData.data.findTrips || []);

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
          setWalletTransactions(mappedHistory);
          console.log('✅ Loaded balance history:', mappedHistory.length, 'transactions');
        } else {
          setWalletTransactions([]);
          console.log('ℹ️ No balance history found');
        }

        // 🟩 Recipient code
        if (user.recipient_code) {
          console.log('✅ Loaded recipient code from backend:', user.recipient_code);
          setRecipientCode(user.recipient_code);
        } else {
          console.log('ℹ️ No recipient_code found for this user yet.');
        }

        // fetch stripe status
        await fetchStripeStatus(user._id);
      } else {
        console.warn('Profile returned no user:', profileData);
        setUserData(null);
        setTripsData([]);
        setBalance(0);
        setEscrowBalance(0);
        setWalletTransactions([]);
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


const handleWithdraw = async () => {
  if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
    return alert("Please enter a valid withdrawal amount.");
  }

  if (!userData?._id) {
    return alert("User data not found. Please log in again.");
  }

  try {
    setIsLoading(true); // show "Initializing..."
    console.log("📤 Sending OTP for withdrawal...");

    const otpRes = await fetch(`${base}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userData._id }),
    });

    const otpData = await otpRes.json();
    console.log("📨 send-otp response:", otpData);

    if (!otpData.success) {
      setIsLoading(false);
      return alert(otpData.message || "Failed to send OTP. Try again.");
    }

    alert("An OTP has been sent to your registered email.");

    setWithdrawModalVisible(false);
    setOtpModalVisible(true);
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    alert("Error sending OTP. Please try again.");
  } finally {
    setIsLoading(false); // reset button text
  }
};

// 🟢 Verify & Withdraw button
const handleVerifyOtp = async () => {
  if (otpInput.length !== 6) {
    return alert("Please enter the 6-digit OTP sent to your email.");
  }

  try {
    setIsVerifying(true);

    const verifyRes = await fetch(`${base}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userData._id,
        code: otpInput,
        amount: withdrawAmount,
      }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      setIsVerifying(false);
      return alert(verifyData.message || "Invalid or expired OTP.");
    }

    // ✅ This now auto-routes based on region
    await handleRegionWithdraw();

  } catch (err) {
    console.error("Verify OTP error:", err);
    alert("Failed to verify OTP. Try again.");
  } finally {
    setIsVerifying(false);
  }
};


  // 🟢 Handle withdraw via Stripe Connect (with balance check)
const handleStripeWithdraw = async () => {
  const amount = parseFloat(withdrawAmount);

  if (!withdrawAmount || isNaN(amount) || amount <= 0) {
    alert('Enter a valid amount.');
    return;
  }

  if (!userData?._id) {
    alert('User data missing.');
    return;
  }

  // 💡 Check if user has enough balance
  if (amount > balance) {
    alert('Insufficient balance. Please enter a smaller amount.');
    return;
  }

  try {
    const transferUrl = `${base}/api/stripe/connect/transfer`;

    const response = await fetch(transferUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData._id,
        totalAmount: amount,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message || 'Withdrawal successful via Stripe.');

      // 💰 Update internal wallet (deduct balance, record transaction)
      const processPaymentUrl = `${base}/api/baggo/processPayment`;
      await fetch(processPaymentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData._id,
          amount: -amount, // negative = withdrawal
          description: 'Stripe withdrawal',
        }),
      });

      setBalance((prev) => prev - amount);
      setOtpModalVisible(false);
      setWithdrawAmount('');
      setOtp('');
    } else {
      alert(result.message || 'Withdrawal failed.');
    }
  } catch (err) {
    console.error('❌ Withdrawal error:', err);
    alert('Error during withdrawal. Try again.');
  }
};


const handleCurrencySelect = (newCurrency: string) => {
  setCurrency(newCurrency);
  setSymbol(currencySymbols[newCurrency] || "$");
  saveCurrency(newCurrency); // persist for next app launch
  setCurrencyModalVisible(false);
};


  const handleSignOut = async () => {
    try {
      const response = await fetch(`${backendomain.backendomain}/api/baggo/logout`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!data.success) {
        console.warn('Logout API failed:', data.message);
      }
    } catch (err) {
      console.error('Error during logout API call:', err);
    }

    await signOut();
    router.replace('/auth/signin');
  };




  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Icon size={20} color={Colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.profileCard}
      >
      <TouchableOpacity   onPress={() => router.push('/personal-details')} style={styles.avatarContainer}>
  {userData?.image ? (
    <Image
      source={{ uri: userData.image }}
      style={styles.avatarImage}
      resizeMode="cover"
    />
  ) : (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {userData?.firstName?.[0]?.toUpperCase() || 'S'}
      </Text>
    </View>
  )}

  <View style={styles.editBadge}>
    <Text style={styles.editIcon}>✏️</Text>
  </View>

  <View style={styles.verifiedBadge}>
    <Shield size={12} color={Colors.white} fill={Colors.white} />
  </View>
</TouchableOpacity>

        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{userData ? `${userData.firstName} ${userData.lastName}` : 'Sarah'}</Text>
          <View style={styles.kycBadge}>
            <Shield size={14} color={userData?.status === 'verified' ? Colors.success : Colors.warning} />
            <Text style={styles.kycText}>
              {userData?.status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Text style={styles.profileEmail}>
      {userData?.email || 'sarah.j@email.com'}
    </Text>

    {userData?.emailVerified ? (
      <CheckCircle size={18} color="green" />
    ) : (
      <XCircle size={18} color="red" />
    )}
  </View>
  {userData?.referralCode && (
    <View style={{ marginVertical: 20, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 16, color:"#fff", fontWeight: "600", marginBottom: 8 }}>
        Your Referral Code
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f5f5f5",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#333" }}>
          {userData.referralCode}
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await Clipboard.setStringAsync(userData.referralCode);
            Alert.alert("Copied!", "Referral code copied to clipboard.");
          }}
        >
          <Copy size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  )}


        <View style={styles.statsRow}>
        <View style={styles.statItem}>
  <Text style={styles.statValue}>{userStars} ⭐</Text>
  <Text style={styles.statLabel}>Stars</Text>
</View>

          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tripsData.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
        </View>
      </LinearGradient>
      {userData?.referredBy && !userData?.hasUsedReferralDiscount && (
    <LinearGradient
      colors={['#D4A574', '#C9934A']}
      style={styles.referralBanner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.referralContent}>
        <Text style={styles.referralTitle}>Get 3% Off!</Text>
        <Text style={styles.referralDesc}>
          🎉 You’ve unlocked a special discount{'\n'}
          on your first delivery!
        </Text>
        <View style={styles.referralCodeBox}>
          <Text style={styles.referralCodeText}>REFERRAL</Text>
        </View>
      </View>
      <Text style={styles.referralEmoji}>💸</Text>
    </LinearGradient>
  )}



      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>



        {/* 🟣 Payment Setup Section */}
  <View style={styles.stripeSection}>
    {isNigeria ? (
      <>
        <Text style={styles.stripeTitle}>Paystack Account</Text>
        {recipientCode ? (
          <View style={styles.stripeConnected}>
            <Shield size={20} color={Colors.success} />
            <Text style={styles.stripeText}>Paystack Connected</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => setShowPaystackSetup(true)}
          >
            <CreditCard size={20} color={Colors.white} />
            <Text style={styles.connectButtonText}>Setup Paystack</Text>
          </TouchableOpacity>
        )}
      </>
    ) : (
      <>
        <Text style={styles.stripeTitle}>Stripe Account</Text>
        {stripeStatus.chargesEnabled ? (
          <View style={styles.stripeConnected}>
            <Shield size={20} color={Colors.success} />
            <Text style={styles.stripeText}>Stripe Connected</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.connectButton} onPress={handleStripeConnect}>
            <CreditCard size={20} color={Colors.white} />
            <Text style={styles.connectButtonText}>Connect Stripe</Text>
          </TouchableOpacity>
        )}
      </>
    )}
  </View>


        <LinearGradient
          colors={[Colors.gold, Colors.secondary]}
          style={styles.walletCard}
        >
        <View style={styles.walletHeader}>
  <View>
    <Text style={styles.walletLabel}>Available Balance</Text>
    <Text style={styles.walletBalance}>
    {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </Text>

    {/* -- NEW: Escrow balance display -- */}
    <Text style={{ color: Colors.white, opacity: 0.85, marginTop: 6, fontSize: 14 }}>
      Held in Escrow: {symbol}{escrowBalance
  ? escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : "0.00"}

    </Text>

  </View>
  <View style={styles.walletIcon}>
    <Wallet size={24} color={Colors.white} />
  </View>
</View>


          <View style={styles.walletActions}>
            <TouchableOpacity
              style={styles.walletButton}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <ArrowUpCircle size={20} color={Colors.gold} />
              <Text style={styles.walletButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.transactionsSection}>
      <Text style={styles.transactionTitle}>Recent Transactions</Text>

      {walletTransactions.length === 0 ? (
        <Text style={styles.noTransactionsText}>No recent transactions</Text>
      ) : (
        walletTransactions
          .slice(0, 3)
          .map((txn) => (
            <View key={txn.id} style={styles.transactionItem}>
              <View
                style={[
                  styles.transactionIcon,
                  {
                    backgroundColor:
                      txn.type === 'credit'
                        ? Colors.successLight
                        : Colors.backgroundLight,
                  },
                ]}
              >
                {txn.type === 'credit' ? (
                  <ArrowDownCircle size={20} color={Colors.success} />
                ) : (
                  <ArrowUpCircle size={20} color={Colors.textLight} />
                )}
              </View>

              <View style={styles.transactionInfo}>
              <Text style={styles.transactionDesc}>
  {((txn.description || txn.type.replace('_', ' '))?.length > 26
    ? (txn.description || txn.type.replace('_', ' ')).slice(0, 26) + '...'
    : txn.description || txn.type.replace('_', ' '))}
</Text>

                <Text style={styles.transactionDate}>
                  {new Date(txn.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color:
                      txn.type === 'credit' ? Colors.success : Colors.text,
                  },
                ]}
              >
                {txn.type === 'credit' ? '+' : '-'}
                {symbol}
                {txn.amount.toFixed(2)}
              </Text>
            </View>
          ))
      )}
    </View>
</View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon={User}
            title="Personal Details"
            subtitle={userData ? `${userData.firstName} ${userData.lastName}, ${userData.email}, ${userData.phone}` : 'Name, email, phone'}
            onPress={() => router.push('/personal-details')}
          />
          <MenuItem
            icon={Shield}
            title="Verification Status"
            subtitle={userData?.status === 'verified' ? 'Verified User' : 'Pending Verification'}
            onPress={() => router.push('/kyc-verification')}
          />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <View style={styles.menuIcon}>
              <DollarSign size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Currency</Text>
              <Text style={styles.menuSubtitle}>
                {currencies.find(c => c.code === currency)?.name} ({currencies.find(c => c.code === currency)?.symbol})
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setThemeModalVisible(true)}
          >
            <View style={styles.menuIcon}>
              <Moon size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Appearance</Text>
              <Text style={styles.menuSubtitle}>
                {theme === 'system' ? 'System Default' : theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Support</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon={FileText}
            title="Terms & Conditions"
            onPress={() => router.push('/terms-conditions')}
          />
          <MenuItem
            icon={FileText}
            title="Privacy Policy"
            onPress={() => router.push('/privacy-policy')}
          />
          <MenuItem
            icon={AlertCircle}
            title="Contact Support"
            onPress={() => router.push('/contact-support')}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />

      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>




            <Text style={styles.modalLabel}>Amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <TouchableOpacity
    style={styles.modalButton}
    onPress={handleWithdraw}
    disabled={isLoading}
  >
    <Text style={styles.modalButtonText}>
      {isLoading ? "Initializing..." : "Continue"}
    </Text>
  </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
    visible={otpModalVisible}
    transparent
    animationType="fade"
    onRequestClose={() => setOtpModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Enter OTP</Text>
          <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalLabel}>6-digit OTP</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Enter OTP"
          keyboardType="numeric"
          maxLength={6}
          value={otpInput}
          onChangeText={setOtpInput}
        />

        <TouchableOpacity
      style={styles.modalButton}
      onPress={handleVerifyOtp}
      disabled={isVerifying}
    >
      <Text style={styles.modalButtonText}>
        {isVerifying ? "Verifying & Withdrawing..." : "Verify & Withdraw"}
      </Text>
    </TouchableOpacity>
      </View>
    </View>
  </Modal>


      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Search size={20} color={Colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search currencies..."
                placeholderTextColor={Colors.textMuted}
                value={currencySearch}
                onChangeText={setCurrencySearch}
              />
            </View>

            <ScrollView style={styles.currencyList}>
              {currencies
                .filter(c =>
                  c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.code.toLowerCase().includes(currencySearch.toLowerCase())
                )
                .map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={styles.currencyItem}
                  onPress={() => handleCurrencySelect(curr.code)}
                  >
                    <View style={styles.currencySymbol}>
                      <Text style={styles.currencySymbolText}>{curr.symbol}</Text>
                    </View>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyName}>{curr.name}</Text>
                      <Text style={styles.currencyCode}>{curr.code}</Text>
                    </View>
                    {currency === curr.code && (
                      <View style={styles.currencyCheck}>
                        <Text style={styles.checkMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appearance</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={() => {
                setTheme('light');
                setThemeModalVisible(false);
              }}
            >
              <Sun size={24} color={Colors.primary} />
              <Text style={styles.themeText}>Light Mode</Text>
              {theme === 'light' && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={() => {
                setTheme('dark');
                setThemeModalVisible(false);
              }}
            >
              <Moon size={24} color={Colors.primary} />
              <Text style={styles.themeText}>Dark Mode</Text>
              {theme === 'dark' && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={() => {
                setTheme('system');
                setThemeModalVisible(false);
              }}
            >
              <Shield size={24} color={Colors.primary} />
              <Text style={styles.themeText}>System Default</Text>
              {theme === 'system' && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🟢 Paystack Setup Modal */}
<Modal
  visible={showPaystackSetup}
  transparent
  animationType="slide"
  onRequestClose={() => setShowPaystackSetup(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Setup Paystack</Text>
        <TouchableOpacity onPress={() => setShowPaystackSetup(false)}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.modalLabel}>Select Bank</Text>
      <ScrollView style={{ maxHeight: 200, marginBottom: 10 }}>
      {paystackBanks.length === 0 ? (
        <Text style={{ padding: 12, color: Colors.textLight }}>
          No banks loaded — check console logs.
        </Text>
      ) : (
        // If you want to *hide* other banks once one is chosen:
        // paystackBanks.filter(b => !selectedBankId || String(b.id) === String(selectedBankId))
        paystackBanks.map((bank) => {
          const isSelected = String(bank.id) === String(selectedBankId);
          return (
            <TouchableOpacity
              key={`bank-${bank.id}`}
              activeOpacity={0.8}
              style={[
                styles.bankItem,
                isSelected && styles.selectedBank,
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
              ]}
              onPress={() => {
                console.log('[UI] bank pressed:', { id: bank.id, code: bank.code, name: bank.name });
                setSelectedBankId(prev => (String(prev) === String(bank.id) ? null : bank.id));
              }}
            >
              <Text style={styles.bankName} numberOfLines={1}>
                {bank.name}
              </Text>

              {isSelected && (
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>Selected</Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>


      <Text style={styles.modalLabel}>Account Number</Text>
      <TextInput
        style={styles.modalInput}
        placeholder="Enter your 10-digit account number"
        keyboardType="number-pad"
        maxLength={10}
        value={accountNumber}
        onChangeText={setAccountNumber}
      />

      <TouchableOpacity
        style={styles.modalButton}
        onPress={handlePaystackSetup}
      >
        <Text style={styles.modalButtonText}>Complete Setup</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
  width: 80,
  height: 80,
  borderRadius: 40,
  borderWidth: 2,
  borderColor: '#fff',
},

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  stripeSection: {
  backgroundColor: Colors.white,
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
},
stripeTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: Colors.text,
  marginBottom: 12,
},
stripeConnected: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.successLight,
  padding: 12,
  borderRadius: 12,
  gap: 8,
},
stripeText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},
connectButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: Colors.primary,
  borderRadius: 12,
  paddingVertical: 12,
  gap: 8,
},
connectButtonText: {
  color: Colors.white,
  fontSize: 15,
  fontWeight: '600',
},
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.white,
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  walletCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  walletLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  walletButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  walletButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  profileEmail: {
  fontSize: 16,
  fontWeight: '500',
  color: '#fff',
},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bankItem: {
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: Colors.borderLight,
},
selectedBank: {
  backgroundColor: Colors.primaryLight,
},
bankName: {
  fontSize: 16,
  color: Colors.text,
},

  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  methodOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  methodOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundLight,
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
  },
  methodTextActive: {
    color: Colors.primary,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  referralContainer: {
  marginTop: 10,
  backgroundColor: Colors.white,
  borderRadius: 10,
  padding: 10,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
},
referralLabel: {
  color: Colors.textMuted,
  fontSize: 13,
  marginBottom: 4,
},
referralBox: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: Colors.backgroundLight,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
},
referralCode: {
  fontWeight: '600',
  fontSize: 15,
  color: Colors.primaryDark,
},
copyText: {
  color: Colors.primary,
  fontWeight: '600',
  fontSize: 14,
},

  otpDescription: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencySymbol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencySymbolText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 13,
    color: Colors.textLight,
  },
  currencyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 12,
    gap: 12,
  },
  themeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  referralBanner: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   borderRadius: 16,
   paddingVertical: 16,
   paddingHorizontal: 20,
   marginVertical: 14,
   shadowColor: '#000',
   width: '90%', // 🔹 Reduced width (centered look)
   alignSelf: 'center', // centers the card
   shadowOpacity: 0.15,
   shadowRadius: 8,
   elevation: 5,
 },
 referralContent: {
   flex: 1,
 },
 referralTitle: {
   fontSize: 20,
   fontWeight: '800',
   color: '#fff',
   marginBottom: 4,
 },
 referralDesc: {
   fontSize: 14,
   color: '#fff',
   lineHeight: 20,
   opacity: 0.9,
 },
 referralCodeBox: {
   marginTop: 10,
   backgroundColor: 'rgba(255,255,255,0.2)',
   borderRadius: 10,
   paddingVertical: 6,
   paddingHorizontal: 14,
   alignSelf: 'flex-start',
 },
 referralCodeText: {
   fontSize: 13,
   fontWeight: '700',
   color: '#fff',
   letterSpacing: 1,
 },
 referralEmoji: {
   fontSize: 36,
   marginLeft: 12,
 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  kycText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editIcon: {
    fontSize: 12,
  },
});
