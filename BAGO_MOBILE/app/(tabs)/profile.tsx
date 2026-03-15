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
  Image,
  Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, CreditCard, Copy, FileText, CheckCircle, XCircle, LogOut, ChevronRight, CircleAlert as AlertCircle, Wallet, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, Building, X, DollarSign, Search, Moon, Sun, Trash2, MessageCircle, ArrowLeft, Send } from 'lucide-react-native';
import { walletTransactions } from '@/utils/dummyData';
import { currencies } from '@/utils/locations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
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
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'paypal'>('bank');
  const [otp, setOtp] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [tripsData, setTripsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteImprovement, setDeleteImprovement] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [accountName, setAccountName] = useState('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);


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
      const response = await api.get(`/api/stripe/connect/status/${userId}`);
      const data = response.data;

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

      const response = await api.post('/api/stripe/connect/onboard', {
        userId: userData._id,
        email: userData.email
      });
      const data = response.data;

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


  // 🌍 Detect user country/currency as fallback
  useEffect(() => {
    (async () => {
      try {
        // Prefer settings from backend profile if available
        if (userData?.preferredCurrency) {
          setCurrency(userData.preferredCurrency);
          setSymbol(currencySymbols[userData.preferredCurrency] || "$");
        }

        if (userData?.paymentGateway) {
          setIsNigeria(userData.paymentGateway === 'paystack');
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || (userData?.paymentGateway && userData?.preferredCurrency)) {
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const reverse = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverse.length > 0 && !userData?.preferredCurrency) {
          const countryCode = reverse[0].isoCountryCode || 'US';
          let detectedCurrency = 'USD';

          // Simplified map for fallback
          if (countryCode === 'NG') detectedCurrency = 'NGN';
          else if (['GB', 'UK'].includes(countryCode)) detectedCurrency = 'GBP';
          else if (['FR', 'DE', 'IT', 'ES', 'NL'].includes(countryCode)) detectedCurrency = 'EUR';

          setCurrency(detectedCurrency);
          setSymbol(currencySymbols[detectedCurrency] || '$');
          setIsNigeria(countryCode === 'NG');
        }
      } catch (err) {
        console.error('Location detection fallback error:', err);
      }
    })();
  }, [userData]);




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

  // 🔍 Verify account number and get account name
  const verifyAccountNumber = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      setAccountName('');
      setAccountVerified(false);
      return;
    }

    if (!selectedBankId) {
      Alert.alert('Error', 'Please select a bank first');
      return;
    }

    const bank = paystackBanks.find((b: any) => String(b.id) === String(selectedBankId));
    if (!bank) {
      Alert.alert('Error', 'Selected bank not found');
      return;
    }

    setIsVerifyingAccount(true);
    setAccountName('');
    setAccountVerified(false);

    try {
      console.log('[client] verifying account:', { accountNumber, bankCode: bank.code });
      const res = await fetch(
        `${base}/api/paystack/resolve?accountNumber=${accountNumber}&bankCode=${bank.code}`
      );
      const data = await res.json();

      console.log('[client] verify response:', data);

      if (data.success && data.accountName) {
        setAccountName(data.accountName);
        setAccountVerified(true);
        console.log('✅ Account verified:', data.accountName);
      } else {
        setAccountVerified(false);
        Alert.alert(
          'Verification Failed',
          data.message || 'Could not verify account number. Please check the details.'
        );
      }
    } catch (error) {
      console.error('[client] verify account error:', error);
      setAccountVerified(false);
      Alert.alert('Error', 'Failed to verify account. Please try again.');
    } finally {
      setIsVerifyingAccount(false);
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
        const profileResponse = await api.get('/api/bago/Profile');
        const profileData = profileResponse.data;
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
        const processPaymentUrl = `${base}/api/bago/processPayment`;
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
      const response = await fetch(`${backendomain.backendomain}/api/bago/logout`, {
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

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      Alert.alert('Required', 'Please tell us why you want to delete your account.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await api.post('/api/bago/delete-account', {
                userId: userData?._id,
                reason: deleteReason,
                improvement: deleteImprovement,
              });

              if (response.data.success) {
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                await signOut();
                router.replace('/auth/signin');
              } else {
                Alert.alert('Error', response.data.message || 'Failed to delete account');
              }
            } catch (err: any) {
              console.error('Delete account error:', err);
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete account');
            } finally {
              setIsDeleting(false);
              setDeleteModalVisible(false);
            }
          },
        },
      ]
    );
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
        <Icon size={20} color={'#5845D8'} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={'#6B6B6B'} />
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
        colors={['#5845D8', '#4534B8']}
        style={styles.profileCard}
      >
        <TouchableOpacity onPress={() => router.push('/personal-details')} style={styles.avatarContainer}>
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
            <Shield size={12} color={'#FFFFFF'} fill={'#FFFFFF'} />
          </View>
        </TouchableOpacity>

        <View style={styles.nameRow}>
          <Text style={styles.profileName}>{userData ? `${userData.firstName} ${userData.lastName}` : 'Sarah'}</Text>
          <View style={styles.kycBadge}>
            <Shield size={14} color={userData?.status === 'verified' ? '#4CAF50' : '#FF9800'} />
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
            <Text style={{ fontSize: 16, color: "#fff", fontWeight: "600", marginBottom: 8 }}>
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
                  <Shield size={20} color={'#4CAF50'} />
                  <Text style={styles.stripeText}>Paystack Connected</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => setShowPaystackSetup(true)}
                >
                  <CreditCard size={20} color={'#FFFFFF'} />
                  <Text style={styles.connectButtonText}>Setup Paystack</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.stripeTitle}>Stripe Account</Text>
              {stripeStatus.chargesEnabled ? (
                <View style={styles.stripeConnected}>
                  <Shield size={20} color={'#4CAF50'} />
                  <Text style={styles.stripeText}>Stripe Connected</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.connectButton} onPress={handleStripeConnect}>
                  <CreditCard size={20} color={'#FFFFFF'} />
                  <Text style={styles.connectButtonText}>Connect Stripe</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>


        <LinearGradient
          colors={['#F5C563', '#E8B86D']}
          style={styles.walletCard}
        >
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletBalance}>
                {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>

              {/* -- NEW: Escrow balance display -- */}
              <Text style={{ color: '#FFFFFF', opacity: 0.85, marginTop: 6, fontSize: 14 }}>
                Held in Escrow: {symbol}{escrowBalance
                  ? escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : "0.00"}

              </Text>

            </View>
            <View style={styles.walletIcon}>
              <Wallet size={24} color={'#FFFFFF'} />
            </View>
          </View>


          <View style={styles.walletActions}>
            <TouchableOpacity
              style={styles.walletButton}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <ArrowUpCircle size={20} color={'#F5C563'} />
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
                            ? '#81C784'
                            : '#FDF9F1',
                      },
                    ]}
                  >
                    {txn.type === 'credit' ? (
                      <ArrowDownCircle size={20} color={'#4CAF50'} />
                    ) : (
                      <ArrowUpCircle size={20} color={'#6B6B6B'} />
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
                          txn.type === 'credit' ? '#4CAF50' : '#1A1A1A',
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
              <DollarSign size={20} color={'#5845D8'} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Currency</Text>
              <Text style={styles.menuSubtitle}>
                {currencies.find(c => c.code === currency)?.name} ({currencies.find(c => c.code === currency)?.symbol})
              </Text>
            </View>
            <ChevronRight size={20} color={'#6B6B6B'} />
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setDeleteModalVisible(true)}>
            <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 size={20} color={'#F44336'} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: '#F44336' }]}>Delete Account</Text>
              <Text style={styles.menuSubtitle}>Permanently delete your account and data</Text>
            </View>
            <ChevronRight size={20} color={'#F44336'} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={'#F44336'} />
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
                <X size={24} color={'#1A1A1A'} />
              </TouchableOpacity>
            </View>




            <Text style={styles.modalLabel}>Amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              placeholderTextColor={'#9E9E9E'}
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
                <X size={24} color={'#1A1A1A'} />
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
                <X size={24} color={'#1A1A1A'} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Search size={20} color={'#6B6B6B'} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search currencies..."
                placeholderTextColor={'#9E9E9E'}
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
                <X size={24} color={'#1A1A1A'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Select Bank</Text>
            <ScrollView style={{ maxHeight: 200, marginBottom: 10 }}>
              {paystackBanks.length === 0 ? (
                <Text style={{ padding: 12, color: '#6B6B6B' }}>
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
                        <Text style={{ color: '#5845D8', fontWeight: '700' }}>Selected</Text>
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
              onChangeText={(text) => {
                setAccountNumber(text);
                // Reset verification when user changes account number
                setAccountName('');
                setAccountVerified(false);
              }}
              onBlur={verifyAccountNumber}
            />

            {/* Account verification status */}
            {isVerifyingAccount && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: '#6B6B6B' }}>Verifying account...</Text>
              </View>
            )}

            {accountVerified && accountName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 }}>
                <CheckCircle size={16} color="#4CAF50" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#2E7D32', fontWeight: '600' }}>Account Verified</Text>
                  <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginTop: 2 }}>{accountName}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalButton, !accountVerified && { backgroundColor: '#E0E0E0' }]}
              onPress={handlePaystackSetup}
              disabled={!accountVerified}
            >
              <Text style={[styles.modalButtonText, !accountVerified && { color: '#9E9E9E' }]}>
                {accountVerified ? 'Complete Setup' : 'Verify Account First'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <X size={24} color={'#1A1A1A'} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 20, lineHeight: 20 }}>
              We're sorry to see you go. Please help us improve by answering these questions.
            </Text>

            <Text style={styles.modalLabel}>Why are you leaving? *</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Please tell us why you want to delete your account"
              placeholderTextColor={'#9E9E9E'}
              multiline
              value={deleteReason}
              onChangeText={setDeleteReason}
            />

            <Text style={styles.modalLabel}>What could we do better?</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Your feedback helps us improve (optional)"
              placeholderTextColor={'#9E9E9E'}
              multiline
              value={deleteImprovement}
              onChangeText={setDeleteImprovement}
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#F44336' }]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Text style={styles.modalButtonText}>
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, alignItems: 'center' }}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={{ color: '#5845D8', fontWeight: '600' }}>Cancel</Text>
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
    backgroundColor: '#F8F6F3',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
    color: '#FFFFFF',
  },
  stripeSection: {
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    marginBottom: 12,
  },
  stripeConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#81C784',
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
    backgroundColor: '#5845D8',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5845D8',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#FFFFFF',
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
    color: '#1A1A1A',
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
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  walletButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF9F1',
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
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
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
    color: '#F44336',
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
    borderBottomColor: '#F0F0F0',
  },
  selectedBank: {
    backgroundColor: '#7B68EE',
  },
  bankName: {
    fontSize: 16,
    color: '#1A1A1A',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
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
    borderColor: '#E5E5E5',
    gap: 8,
  },
  methodOptionActive: {
    borderColor: '#5845D8',
    backgroundColor: '#FDF9F1',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  methodTextActive: {
    color: '#5845D8',
  },
  modalInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#5845D8',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  referralContainer: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  referralLabel: {
    color: '#9E9E9E',
    fontSize: 13,
    marginBottom: 4,
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDF9F1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  referralCode: {
    fontWeight: '600',
    fontSize: 15,
    color: '#4534B8',
  },
  copyText: {
    color: '#5845D8',
    fontWeight: '600',
    fontSize: 14,
  },

  otpDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 64,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
    color: '#5845D8',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  currencySymbol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF9F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencySymbolText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5845D8',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  currencyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5845D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F6F3',
    marginBottom: 12,
    gap: 12,
  },
  themeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
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
    color: '#FFFFFF',
    fontWeight: '500',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5845D8',
  },
  editIcon: {
    fontSize: 12,
  },
});
