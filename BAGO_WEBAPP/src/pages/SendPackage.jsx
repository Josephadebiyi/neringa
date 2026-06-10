import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Package,
    ChevronLeft,
    AlertCircle,
    FileText,
    Info,
    User,
    Check,
    ArrowRight,
    MapPin,
    CreditCard,
    RefreshCw,
    Phone
} from 'lucide-react';
import api from '../api';
import { countries, locations } from '../utils/countries';
import { calculateInsurance, fetchExchangeRates } from '../utils/insuranceCalculator';

const getCountryFromCity = (cityName) => {
    if (!cityName) return '';

    const location = locations.find(loc =>
        loc.city && loc.city.toLowerCase() === cityName.toLowerCase()
    );

    return location?.country || '';
};

// Robust parsing engine to extract city and country from traveler string
const parseLocationData = (locationStr) => {
    if (!locationStr) return { city: '', country: '' };

    // Handle "City, Country" format
    if (locationStr.includes(',')) {
        const parts = locationStr.split(',');
        const city = parts[0].trim();
        const country = parts.slice(1).join(',').trim();
        return { city, country };
    }

    // Fallback if no comma is present
    return { city: locationStr.trim(), country: '' };
};

const AFRICAN_PAYOUT_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR'];
const PAYMENT_UNAVAILABLE_MESSAGE =
    'Secure payment is temporarily unavailable. Please try again in a few minutes.';
const PAYMENT_PENDING_MESSAGE =
    'We are confirming your payment. If your bank has already charged you, your shipment will be created automatically shortly.';

const providerForCurrency = (value) => (
    AFRICAN_PAYOUT_CURRENCIES.includes(String(value || '').toUpperCase()) ? 'paystack' : 'paypal'
);

const ITEM_CATEGORIES = [
    { value: 'Documents', label: 'Documents', icon: FileText },
    { value: 'Electronics', label: 'Electronics', icon: CreditCard },
    { value: 'Clothing', label: 'Clothing', icon: User },
    { value: 'Food', label: 'Food', icon: Package },
    { value: 'Fragile', label: 'Fragile', icon: AlertCircle },
    { value: 'Other', label: 'Other', icon: Package },
];

const COUNTRY_ALIASES = {
    UK: 'United Kingdom',
    USA: 'United States',
    US: 'United States',
};

const countryIsoFromName = (name) => {
    const normalized = COUNTRY_ALIASES[String(name || '').trim()] || String(name || '').trim();
    const match = countries.find(c =>
        c.label.toLowerCase() === normalized.toLowerCase() ||
        c.value.toLowerCase() === normalized.toLowerCase()
    );
    return (match?.value || 'US').toLowerCase();
};

const showPaymentError = (setError, message = PAYMENT_UNAVAILABLE_MESSAGE, error = null) => {
    if (error) {
        console.error('[payment]', error);
    }
    setError(message);
};

const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8]">
                    <ChevronLeft size={20} />
                    <span className="font-bold text-xs">{t('back')}</span>
                </button>
            </div>

            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-7 w-auto" />
            </Link>

            <div className="w-16"></div>
        </nav>
    );
};

export default function SendPackage() {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // Get trip from navigation state
    const selectedTrip = location.state?.trip;
    const initialWeight = location.state?.weight || '1';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [platformRate, setPlatformRate] = useState(0);
    const [currency, setCurrency] = useState(user?.preferredCurrency || 'USD');
    const [kycStatus, setKycStatus] = useState(user?.kycStatus || 'not_started');
    const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified === true);
    const [insuranceCost, setInsuranceCost] = useState(0);
    const [exchangeRates, setExchangeRates] = useState(null);
    const [quote, setQuote] = useState(null);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [receiverPhoneCountry, setReceiverPhoneCountry] = useState('us');

    // Initialize form data with empty location fields
    const [formData, setFormData] = useState({
        packageName: '',
        packageDescription: '',
        packageValue: '',
        packageWeight: initialWeight,
        fromCity: '',
        fromCountry: '',
        toCity: '',
        toCountry: '',
        deliveryDeadline: '',
        specialInstructions: '',
        insuranceProtection: false,
        category: 'Documents',
        receiverName: '',
        receiverPhone: '',
        imagePreview: null,
        height: '',
        termsAccepted: [false, false, false]
    });

    useEffect(() => {
        if (selectedTrip) {
            let fromCity = selectedTrip.fromCity || '';
            let fromCountry = selectedTrip.fromCountry || '';
            let toCity = selectedTrip.toCity || '';
            let toCountry = selectedTrip.toCountry || '';

            const fromLocation = selectedTrip.origin || selectedTrip.fromLocation || '';
            const toLocation = selectedTrip.destination || selectedTrip.toLocation || '';

            if (!fromCity || !fromCountry) {
                const parsedFrom = parseLocationData(fromLocation);
                if (!fromCity) fromCity = parsedFrom.city;
                if (!fromCountry) fromCountry = parsedFrom.country;
            }

            if (!toCity || !toCountry) {
                const parsedTo = parseLocationData(toLocation);
                if (!toCity) toCity = parsedTo.city;
                if (!toCountry) toCountry = parsedTo.country;
            }

            if (!fromCountry && fromCity) fromCountry = getCountryFromCity(fromCity);
            if (!toCountry && toCity) toCountry = getCountryFromCity(toCity);

            setFormData(prev => ({
                ...prev,
                fromCity,
                fromCountry,
                toCity,
                toCountry,
                deliveryDeadline: selectedTrip.departureDate || ''
            }));
            setReceiverPhoneCountry(countryIsoFromName(toCountry));
        }
    }, [selectedTrip]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    packageImage: reader.result,
                    imagePreview: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (!selectedTrip) {
            navigate('/search', { replace: true });
        } else {
            checkVerificationStatus();
            loadExchangeRates();
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (user?.preferredCurrency && !selectedTrip) {
            setCurrency(user.preferredCurrency);
        }
    }, [user?.preferredCurrency]);

    const loadExchangeRates = async () => {
        try {
            const rates = await fetchExchangeRates('USD');
            setExchangeRates(rates);
        } catch (error) {
            console.error('Failed to load exchange rates:', error);
        }
    };

    useEffect(() => {
        if (selectedTrip) {
            fetchPricing();
        }
    }, [selectedTrip, formData.packageWeight, user?.preferredCurrency]);

    const fetchPricing = async () => {
        try {
            const senderCurrency = user?.preferredCurrency || 'USD';

            const quoteRes = await api.post('/api/currency/quote', {
                weight: parseFloat(formData.packageWeight) || 1,
                travelerPricePerKg: selectedTrip?.pricePerKg || 10,
                travelerCurrency: selectedTrip?.currency || 'USD',
                senderCurrency
            });

            if (quoteRes.data.success) {
                setQuote(quoteRes.data.quote);
                setCurrency(senderCurrency);
                setPlatformRate(quoteRes.data.quote.senderAmount / (parseFloat(formData.packageWeight) || 1));
            }
        } catch (error) {
            setPlatformRate(selectedTrip?.pricePerKg || 15);
            setCurrency(user?.preferredCurrency || 'USD');
        }
    };

    const checkVerificationStatus = async () => {
        try {
            const response = await api.get('/api/bago/kyc/status');
            if (response.data.success) {
                setKycStatus(response.data.kycStatus || user?.kycStatus || 'not_started');
                setPhoneVerified(response.data.phoneVerified === true || user?.phoneVerified === true);
            }
        } catch (error) {
            setKycStatus(user?.kycStatus || 'not_started');
            setPhoneVerified(user?.phoneVerified === true);
        }
    };

    useEffect(() => {
        const calculateInsuranceCost = () => {
            if (!formData.insuranceProtection) {
                setInsuranceCost(0);
                return;
            }

            const itemValue = parseFloat(formData.packageValue);

            if (!itemValue || itemValue <= 0) {
                setInsuranceCost(0);
                return;
            }

            if (!exchangeRates) {
                setInsuranceCost(0);
                return;
            }

            try {
                const result = calculateInsurance(itemValue, currency, exchangeRates);
                if (result.error) {
                    setInsuranceCost(0);
                    return;
                }
                setInsuranceCost(result.insurancePrice);
            } catch (error) {
                setInsuranceCost(0);
            }
        };

        const timer = setTimeout(calculateInsuranceCost, 500);
        return () => clearTimeout(timer);
    }, [formData.packageValue, formData.insuranceProtection, currency, exchangeRates]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleReceiverPhoneChange = (value, countryData) => {
        setFormData(prev => ({ ...prev, receiverPhone: value }));
        if (countryData?.countryCode) {
            setReceiverPhoneCountry(countryData.countryCode.toLowerCase());
        }
    };

    const shippingCost = quote ? quote.senderAmount : (parseFloat(formData.packageWeight) || 1) * platformRate;
    const totalCost = (shippingCost + insuranceCost).toFixed(2);
    const paymentProvider = providerForCurrency(currency);

    const createShipmentRequestAfterPayment = async ({ packageId, paymentReference, provider }) => {
        const requestResponse = await api.post('/api/bago/RequestPackage', {
            travelerId: selectedTrip.user,
            packageId,
            tripId: selectedTrip._id,
            amount: Number(totalCost),
            currency,
            estimatedDeparture: selectedTrip.departureDate,
            insurance: formData.insuranceProtection,
            insuranceCost: formData.insuranceProtection ? insuranceCost : 0,
            termsAccepted: true,
            paymentReference,
            paymentProvider: provider,
            paymentStatus: 'paid'
        });

        if ([200, 201, 202].includes(requestResponse.status) || requestResponse.data?.success) {
            setPendingPayment(null);
            navigate('/dashboard', { state: { message: t('requestSentSuccess') } });
        }
    };

    const handleVerifyPaystackPayment = async () => {
        if (!pendingPayment?.reference) return;
        setPaymentProcessing(true);
        setError('');
        try {
            const verify = await api.get(`/api/bago/paystack/verify/${pendingPayment.reference}`);
            if (!verify.data?.success) {
                showPaymentError(setError, PAYMENT_PENDING_MESSAGE, verify.data);
                return;
            }

            await createShipmentRequestAfterPayment({
                packageId: pendingPayment.packageId,
                paymentReference: pendingPayment.reference,
                provider: 'paystack',
            });
        } catch (err) {
            showPaymentError(setError, PAYMENT_PENDING_MESSAGE, err);
        } finally {
            setPaymentProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (kycStatus !== 'approved' && user?.kycStatus !== 'approved') {
            setError('Please verify your identity to send a package.');
            setLoading(false);
            navigate('/verify', {
                state: { message: 'Please verify your identity to send a package.', from: '/send-package' }
            });
            return;
        }

        if (!phoneVerified && user?.phoneVerified !== true) {
            setError('Please verify your phone number to send a package.');
            setLoading(false);
            navigate('/dashboard?tab=settings', {
                state: { message: 'Please verify your phone number to send a package.', from: '/send-package' }
            });
            return;
        }

        if (!formData.packageImage) {
            setError('Please upload an image of the item.');
            setLoading(false);
            return;
        }

        if (!formData.packageValue || parseFloat(formData.packageValue) <= 0) {
            setError('Please enter the item value.');
            setLoading(false);
            return;
        }

        if (parseFloat(formData.packageWeight) <= 0 || parseFloat(formData.packageWeight) > 50) {
            setError(t('packageWeightError') || 'Package weight must be between 0.1 and 50 kg.');
            setLoading(false);
            return;
        }

        if (!formData.termsAccepted.every(Boolean)) {
            setError('You must confirm all shipping agreement items.');
            setLoading(false);
            return;
        }

        try {
            if (selectedTrip) {
                if (!formData.fromCountry?.trim() || !formData.toCountry?.trim() || !formData.fromCity?.trim() || !formData.toCity?.trim()) {
                    setError('Missing or incomplete location data. Please ensure cities and countries are correctly filled.');
                    setLoading(false);
                    return;
                }

                const packageResponse = await api.post('/api/bago/createPackage', {
                    from_city: formData.fromCity.trim(),
                    from_country: formData.fromCountry.trim(),
                    to_city: formData.toCity.trim(),
                    to_country: formData.toCountry.trim(),
                    package_details: {
                        package_name: formData.packageName.trim(),
                        package_description: formData.packageDescription.trim(),
                        package_weight: parseFloat(formData.packageWeight) || 1,
                        package_value: formData.packageValue || 0,
                        package_image: formData.packageImage,
                        category: formData.category.trim()
                    },
                    recipient_details: {
                        receiver_name: formData.receiverName.trim(),
                        receiver_phone: formData.receiverPhone.trim(),
                        receiver_email: ''
                    }
                });

                if (packageResponse.status === 201) {
                    const packageId = packageResponse.data.package._id;

                    if (paymentProvider === 'paypal') {
                        const checkoutParams = new URLSearchParams({
                            packageId,
                            tripId: selectedTrip._id,
                            currency,
                            amount: Number(totalCost).toFixed(2),
                            insurance: String(formData.insuranceProtection),
                            insuranceCost: String(formData.insuranceProtection ? insuranceCost : 0),
                        });
                        navigate(`/checkout/payment?${checkoutParams.toString()}`);
                        return;
                    }

                    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    const paystackResponse = await api.post('/api/bago/paystack/initialize', {
                        packageId,
                        tripId: selectedTrip._id,
                        amount: Number(totalCost),
                        currency,
                        customerEmail: user?.email || '',
                        expiresAt,
                        metadata: {
                            insurance: formData.insuranceProtection,
                            insuranceCost: formData.insuranceProtection ? insuranceCost : 0,
                            estimatedDeparture: selectedTrip.departureDate,
                            estimatedArrival: selectedTrip.arrivalDate,
                        }
                    });

                    const authorizationUrl = paystackResponse.data?.authorization_url || paystackResponse.data?.data?.authorization_url;
                    const reference = paystackResponse.data?.reference || paystackResponse.data?.data?.reference;
                    if (!authorizationUrl || !reference) {
                        throw new Error('Payment checkout could not start.');
                    }

                    window.open(authorizationUrl, '_blank', 'noopener,noreferrer');
                    setPendingPayment({ provider: 'paystack', packageId, reference, authorizationUrl });
                    return;
                }
            } else {
                navigate(`/search?origin=${formData.fromCity}&destination=${formData.toCity}`, {
                    state: { packageDetails: formData }
                });
            }
        } catch (err) {
            showPaymentError(setError, 'We could not continue checkout right now. Please try again in a few minutes.', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-10 font-sans">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-[#012126] mb-3 tracking-tight">{t('sendPackageTitle')}</h1>
                    <div className="h-1 w-20 bg-[#5845D8] rounded-full"></div>
                </div>


                {pendingPayment && (
                    <div className="bg-white border border-[#5845D8]/15 rounded-[28px] p-6 md:p-8 mb-8 shadow-[0_18px_45px_rgba(88,69,216,0.08)]">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-11 h-11 bg-[#5845D8]/10 text-[#5845D8] rounded-2xl flex items-center justify-center shrink-0">
                                <CreditCard size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-[#012126] tracking-tight">Complete secure payment</h2>
                                <p className="text-sm text-[#6B7280] font-medium mt-1">
                                    Pay {currency} {Number(totalCost).toFixed(2)} before the shipment request is sent to the traveler.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-[#6B7280] font-medium">
                                Paystack opened in a new tab. Complete checkout there, then return here to verify payment and send the request.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href={pendingPayment.authorizationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center px-8 py-4 bg-white border border-gray-100 text-[#012126] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Reopen checkout
                                </a>
                                <button
                                    type="button"
                                    onClick={handleVerifyPaystackPayment}
                                    disabled={paymentProcessing}
                                    className="inline-flex items-center justify-center px-8 py-4 bg-[#5845D8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all disabled:opacity-50"
                                >
                                    {paymentProcessing ? 'Checking...' : 'Verify and send request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Package Details Section */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('packageDetails')}</h2>
                            </div>

                            {/* Section for Route Information (Read-Only) */}
                            {selectedTrip && (
                                <div className="mb-10 p-6 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin size={16} className="text-[#5845D8]" />
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Route Information (Pre-filled)</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">From City</p>
                                            <input readOnly value={formData.fromCity} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white/50 text-xs font-bold text-gray-400 cursor-not-allowed" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">From Country</p>
                                            <input readOnly value={formData.fromCountry} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white/50 text-xs font-bold text-gray-400 cursor-not-allowed" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">To City</p>
                                            <input readOnly value={formData.toCity} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white/50 text-xs font-bold text-gray-400 cursor-not-allowed" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight ml-1">To Country</p>
                                            <input readOnly value={formData.toCountry} className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white/50 text-xs font-bold text-gray-400 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">{t('itemLabel')}</label>
                                    <input
                                        required
                                        type="text"
                                        name="packageName"
                                        placeholder={t('itemPlaceholder')}
                                        className="w-full px-5 py-3.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[14px] font-bold tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        value={formData.packageName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">{t('descriptionLabel')}</label>
                                    <textarea
                                        required
                                        name="packageDescription"
                                        placeholder="Describe the items inside your package..."
                                        rows="3"
                                        className="w-full px-5 py-3.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[14px] font-bold tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm resize-none"
                                        value={formData.packageDescription}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">Item Category</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {ITEM_CATEGORIES.map(({ value, label, icon: Icon }) => {
                                            const selected = formData.category === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, category: value }))}
                                                    className={`h-[76px] rounded-[14px] border flex flex-col items-center justify-center gap-1.5 transition-all ${selected ? 'bg-[#5845D8] border-[#5845D8] text-white shadow-lg shadow-[#5845D8]/15' : 'bg-white border-gray-100 text-gray-500 hover:border-[#5845D8]/25 hover:bg-gray-50'}`}
                                                    aria-pressed={selected}
                                                >
                                                    <Icon size={18} strokeWidth={2.2} />
                                                    <span className="text-[11px] font-black tracking-tight">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">{t('weightKg') || 'Package Weight (KG)'}</label>
                                            <input
                                                required
                                                type="number"
                                                name="packageWeight"
                                                min="0.1"
                                                max="50"
                                                step="0.1"
                                                placeholder="e.g. 2.5"
                                                className="w-full px-5 py-3.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[14px] font-bold tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                                value={formData.packageWeight}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">
                                                {t('declarationLabel')} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="packageValue"
                                                    placeholder="Estimated Value"
                                                    required
                                                    min="1"
                                                    className="w-full px-5 py-3.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[14px] font-bold tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                                    value={formData.packageValue}
                                                    onChange={handleChange}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">{currency}</div>
                                            </div>
                                        </div>
                                    </div>



                                <div className="mt-8">
                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-3 tracking-[0.15em] ml-1">{t('itemImage') || 'Item Image'}</label>
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div
                                            onClick={() => document.getElementById('item-image').click()}
                                            className={`w-full md:w-48 h-48 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all ${formData.imagePreview ? 'border-[#5845D8] bg-[#5845D8]/5' : 'border-gray-100 hover:border-[#5845D8]/20 bg-gray-50/30'}`}
                                        >
                                            {formData.imagePreview ? (
                                                <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-[22px]" />
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-300 mb-3">
                                                        <Package size={24} />
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">{t('clickToUpload') || 'Click to upload'}</p>
                                                </>
                                            )}
                                            <input
                                                id="item-image"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3 pt-2">
                                            <div className="flex items-start gap-2 text-gray-400">
                                                <Info size={14} className="shrink-0 mt-0.5" />
                                                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider">
                                                    {t('imageUploadTells') || 'Uploading a clear image of your item helps travelers verify content and provides security for both parties during delivery.'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-green-600 font-black text-[9px] uppercase tracking-widest">
                                                    <Check size={12} /> {t('secureStorage') || 'Secure Storage'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-widest">
                                                    <User size={12} /> {t('travelerOnly') || 'Traveler Only Access'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recipient Section */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('recipientDetails')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">{t('receiverNameLabel')}</label>
                                    <input
                                        required
                                        type="text"
                                        name="receiverName"
                                        placeholder="Enter receiver's name"
                                        className="w-full px-5 py-3.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[14px] font-bold tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        value={formData.receiverName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">{t('receiverPhoneLabel')}</label>
                                    <div className="relative">
                                        <PhoneInput
                                            country={receiverPhoneCountry}
                                            value={formData.receiverPhone}
                                            onChange={handleReceiverPhoneChange}
                                            enableSearch
                                            disableSearchIcon
                                            inputProps={{ name: 'receiverPhone', required: true }}
                                            containerClass="!w-full"
                                            inputClass="!w-full !h-[56px] !pl-[72px] !pr-4 !rounded-[14px] !border !border-gray-100 !bg-gray-50/50 focus:!bg-white focus:!border-[#5845D8]/30 !outline-none !text-[14px] !font-bold !tracking-tight !text-[#012126]"
                                            buttonClass="!h-[56px] !w-[64px] !rounded-l-[14px] !border !border-gray-100 !border-r-0 !bg-white/70 hover:!bg-white"
                                            dropdownClass="!rounded-2xl !border-gray-100 !shadow-xl !text-sm"
                                            searchClass="!mx-3 !my-2 !w-[calc(100%-24px)] !rounded-xl !border-gray-100 !py-2"
                                        />
                                        <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Options */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('shippingOptions')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.insuranceProtection ? 'bg-green-50 border-green-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input type="checkbox" name="insuranceProtection" checked={formData.insuranceProtection} onChange={handleChange} className="hidden" />
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${formData.insuranceProtection ? 'bg-green-500 text-white' : 'bg-gray-100 text-transparent'}`}>
                                        <Check size={12} />
                                    </div>
                                    <span className="text-[10px] font-black text-[#012126] uppercase tracking-tight">{t('insuranceProtection') || 'Insurance Protection'}</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase mb-2 tracking-[0.1em] ml-1">{t('specialInstructionsLabel')} (Optional)</label>
                                <textarea
                                    name="specialInstructions"
                                    placeholder="e.g. Please handle with extra care..."
                                    rows="2"
                                    className="w-full px-5 py-3.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[14px] font-bold tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm resize-none"
                                    value={formData.specialInstructions}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#012126] rounded-[32px] p-8 text-white sticky top-28 shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mb-16"></div>
                            <h3 className="text-base font-black mb-8 border-b border-white/10 pb-4 uppercase tracking-[2px]">{t('summary')}</h3>

                            <div className="space-y-6 mb-10">
                                {selectedTrip && formData.fromCity && formData.toCity && (
                                    <>
                                        <div>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('from')}</p>
                                            <p className="text-xs font-black uppercase truncate">{formData.fromCity}, {formData.fromCountry}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('to')}</p>
                                            <p className="text-xs font-black uppercase truncate">{formData.toCity}, {formData.toCountry}</p>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-3 border-t border-white/10 pt-6">
                                    {formData.insuranceProtection && (
                                        <div className="flex justify-between items-center text-[8px] font-black text-white/40 uppercase tracking-widest">
                                            <span>Insurance (0.5%)</span>
                                            <span>{currency} {insuranceCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-2">
                                        <div>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('totalCost') || 'Total Cost'}</p>
                                            <p className="text-2xl font-black">{currency} {totalCost}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">All-inclusive</p>
                                            <p className="text-[10px] font-black">NO HIDDEN FEES</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-6 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-[9px] font-bold leading-tight uppercase">{error}</p>
                                </div>
                            )}

                            <div className="mb-6 space-y-2">
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Agreement & Shipping Confirmation</p>
                                {[
                                    'My shipment does not contain any prohibited or restricted items.',
                                    'I understand the traveler may inspect the contents for safety and compliance.',
                                    'I agree to follow Bago\'s guidelines and take responsibility for my shipment.',
                                ].map((label, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 cursor-pointer group"
                                        onClick={() => setFormData(prev => {
                                            const next = [...prev.termsAccepted];
                                            next[i] = !next[i];
                                            return { ...prev, termsAccepted: next };
                                        })}
                                    >
                                        <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${formData.termsAccepted[i] ? 'bg-[#5845D8] text-white shadow-lg shadow-[#5845D8]/20' : 'bg-white/10 text-transparent border border-white/20 group-hover:bg-white/20'}`}>
                                            <Check size={12} />
                                        </div>
                                        <p className="text-[9px] font-bold text-white/60 group-hover:text-white transition-colors leading-relaxed">{label}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || Boolean(pendingPayment)}
                                className="w-full py-4 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pendingPayment ? 'Complete payment above' : loading ? 'Processing...' : t('requestShipping')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="mt-6 text-[8px] font-bold text-white/30 text-center uppercase tracking-widest leading-relaxed">
                                {t('byJoiningAgree')} <Link to="/terms" className="text-white/60 underline hover:text-white transition-colors">{t('terms')}</Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
