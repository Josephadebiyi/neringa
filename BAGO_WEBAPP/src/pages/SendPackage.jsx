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
    User,
    Check,
    ArrowRight,
    Phone,
    Star,
    Cpu,
    Coffee,
    Heart,
    MoreHorizontal,
    Archive,
    Shield,
    Plane,
    Car,
    Luggage,
    MapPin,
} from 'lucide-react';
import api from '../api';
import { countries, locations } from '../utils/countries';
import { calculateInsurance, fetchExchangeRates } from '../utils/insuranceCalculator';

const AFRICAN_CURRENCIES = new Set([
    'AOA','BIF','BWP','CDF','CVE','DJF','DZD','EGP','ERN','ETB','GHS','GMD','GNF',
    'KES','KMF','LRD','LSL','LYD','MAD','MGA','MRU','MUR','MWK','MZN','NAD','NGN',
    'RWF','SCR','SDG','SLE','SOS','SSP','STN','SZL','TZS','UGX','XAF','XOF','ZAR','ZMW','ZWL',
]);

const ITEM_CATEGORIES = [
    { value: 'Documents',   label: 'Documents',   icon: FileText },
    { value: 'Clothing',    label: 'Clothing',    icon: Archive },
    { value: 'Electronics', label: 'Electronics', icon: Cpu },
    { value: 'Food',        label: 'Food',        icon: Coffee },
    { value: 'Beauty',      label: 'Beauty',      icon: Heart },
    { value: 'Other',       label: 'Other',       icon: MoreHorizontal },
];

const PAYMENT_PENDING_MESSAGE =
    'We are confirming your payment. If your bank has charged you, your shipment will be created automatically shortly.';

const getCountryFromCity = (cityName) => {
    if (!cityName) return '';
    const loc = locations.find(l => l.city && l.city.toLowerCase() === cityName.toLowerCase());
    return loc?.country || '';
};

const parseLocationData = (str) => {
    if (!str) return { city: '', country: '' };
    if (str.includes(',')) {
        const parts = str.split(',');
        return { city: parts[0].trim(), country: parts.slice(1).join(',').trim() };
    }
    return { city: str.trim(), country: '' };
};

const COUNTRY_ALIASES = { UK: 'United Kingdom', USA: 'United States', US: 'United States' };

const countryIsoFromName = (name) => {
    const norm = COUNTRY_ALIASES[String(name || '').trim()] || String(name || '').trim();
    const match = countries.find(c =>
        c.label.toLowerCase() === norm.toLowerCase() || c.value.toLowerCase() === norm.toLowerCase()
    );
    return (match?.value || 'US').toLowerCase();
};

const showPaymentError = (setError, message, error = null) => {
    if (error) console.error('[payment]', error);
    const d = error?.response?.data;
    const backendMsg = d?.message || d?.error || (Array.isArray(d?.errors) ? d.errors[0]?.message || d.errors[0] : null);
    const status413 = error?.response?.status === 413 ? 'The item image is too large. Please upload a smaller photo.' : null;
    setError(status413 || backendMsg || error?.message || message);
};

const resizePackageImage = (file) => new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) { reject(new Error('Please upload a valid image file.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Could not prepare the image.'));
        image.onload = () => {
            const maxSide = 1400;
            const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
            const w = Math.max(1, Math.round(image.width * scale));
            const h = Math.max(1, Math.round(image.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(image, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
});

const TravelMeanIcon = ({ means }) => {
    const m = String(means || '').toLowerCase();
    if (m.includes('plane') || m.includes('flight') || m.includes('air')) return <Plane size={13} />;
    if (m.includes('car') || m.includes('driv') || m.includes('road')) return <Car size={13} />;
    return <Luggage size={13} />;
};

const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <nav className="w-full bg-white/95 backdrop-blur border-b border-gray-100 py-3 px-4 md:px-8 flex justify-between items-center z-50 sticky top-0">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8] transition-colors"
            >
                <ChevronLeft size={20} />
                <span className="font-bold text-xs hidden sm:block">{t('back')}</span>
            </button>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-7 w-auto" />
            </Link>
            <div className="w-16" />
        </nav>
    );
};

export default function SendPackage() {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

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
    const [termsAccepted, setTermsAccepted] = useState([false, false, false]);

    const [formData, setFormData] = useState({
        packageValue: '',
        packageWeight: initialWeight,
        fromCity: '', fromCountry: '', toCity: '', toCountry: '',
        deliveryDeadline: '',
        specialInstructions: '',
        insuranceProtection: false,
        category: 'Documents',
        receiverName: '', receiverPhone: '', deliveryAddress: '',
        imagePreview: null, packageImage: null,
    });

    useEffect(() => {
        if (!selectedTrip) return;
        let fromCity = selectedTrip.fromCity || '';
        let fromCountry = selectedTrip.fromCountry || '';
        let toCity = selectedTrip.toCity || '';
        let toCountry = selectedTrip.toCountry || '';

        if (!fromCity || !fromCountry) {
            const p = parseLocationData(selectedTrip.origin || selectedTrip.fromLocation || '');
            if (!fromCity) fromCity = p.city;
            if (!fromCountry) fromCountry = p.country;
        }
        if (!toCity || !toCountry) {
            const p = parseLocationData(selectedTrip.destination || selectedTrip.toLocation || '');
            if (!toCity) toCity = p.city;
            if (!toCountry) toCountry = p.country;
        }
        if (!fromCountry && fromCity) fromCountry = getCountryFromCity(fromCity);
        if (!toCountry && toCity) toCountry = getCountryFromCity(toCity);

        setFormData(prev => ({ ...prev, fromCity, fromCountry, toCity, toCountry, deliveryDeadline: selectedTrip.departureDate || '' }));
        setReceiverPhoneCountry(countryIsoFromName(toCountry));
    }, [selectedTrip]);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!selectedTrip) { navigate('/search', { replace: true }); return; }
        checkVerificationStatus();
        loadExchangeRates();
    }, [isAuthenticated, navigate]);

    useEffect(() => { if (user?.preferredCurrency) setCurrency(user.preferredCurrency); }, [user?.preferredCurrency]);

    useEffect(() => { if (selectedTrip) fetchPricing(); }, [selectedTrip, formData.packageWeight, user?.preferredCurrency]);

    const loadExchangeRates = async () => {
        try { setExchangeRates(await fetchExchangeRates('USD')); } catch (_) {}
    };

    const fetchPricing = async () => {
        try {
            const senderCurrency = user?.preferredCurrency || 'USD';
            const res = await api.post('/api/currency/quote', {
                weight: parseFloat(formData.packageWeight) || 1,
                travelerPricePerKg: selectedTrip?.pricePerKg || 10,
                travelerCurrency: selectedTrip?.currency || 'USD',
                senderCurrency,
            });
            if (res.data.success) {
                setQuote(res.data.quote);
                setCurrency(senderCurrency);
                setPlatformRate(res.data.quote.senderAmount / (parseFloat(formData.packageWeight) || 1));
            }
        } catch (_) {
            setPlatformRate(selectedTrip?.pricePerKg || 15);
            setCurrency(user?.preferredCurrency || 'USD');
        }
    };

    const checkVerificationStatus = async () => {
        try {
            const res = await api.get('/api/bago/kyc/status');
            if (res.data.success) {
                setKycStatus(res.data.kycStatus || user?.kycStatus || 'not_started');
                setPhoneVerified(res.data.phoneVerified === true || user?.phoneVerified === true);
            }
        } catch (_) {
            setKycStatus(user?.kycStatus || 'not_started');
            setPhoneVerified(user?.phoneVerified === true);
        }
    };

    useEffect(() => {
        if (!formData.insuranceProtection || !formData.packageValue || !exchangeRates) { setInsuranceCost(0); return; }
        const itemValue = parseFloat(formData.packageValue);
        if (!itemValue || itemValue <= 0) { setInsuranceCost(0); return; }
        const timer = setTimeout(() => {
            try {
                const result = calculateInsurance(itemValue, currency, exchangeRates);
                setInsuranceCost(result.error ? 0 : result.insurancePrice);
            } catch (_) { setInsuranceCost(0); }
        }, 400);
        return () => clearTimeout(timer);
    }, [formData.packageValue, formData.insuranceProtection, currency, exchangeRates]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleReceiverPhoneChange = (value, countryData) => {
        setFormData(prev => ({ ...prev, receiverPhone: value }));
        if (countryData?.countryCode) setReceiverPhoneCountry(countryData.countryCode.toLowerCase());
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = await resizePackageImage(file);
            setFormData(prev => ({ ...prev, packageImage: data, imagePreview: data }));
        } catch (err) {
            setError(err.message || 'Could not upload this image. Please try another.');
        }
    };

    const shippingCost = quote ? quote.senderAmount : (parseFloat(formData.packageWeight) || 1) * platformRate;
    const totalCost = (shippingCost + insuranceCost).toFixed(2);
    const isAfricanCurrency = AFRICAN_CURRENCIES.has(String(currency || '').toUpperCase());

    const createShipmentAfterPayment = async ({ packageId, paymentReference, provider }) => {
        const res = await api.post('/api/bago/RequestPackage', {
            travelerId: selectedTrip.user,
            packageId, tripId: selectedTrip._id,
            amount: Number(totalCost), currency,
            estimatedDeparture: selectedTrip.departureDate,
            insurance: formData.insuranceProtection,
            insuranceCost: formData.insuranceProtection ? insuranceCost : 0,
            termsAccepted: true, paymentReference,
            paymentProvider: provider, paymentStatus: 'paid',
        });
        if ([200, 201, 202].includes(res.status) || res.data?.success) {
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
            if (!verify.data?.success) { showPaymentError(setError, PAYMENT_PENDING_MESSAGE, verify.data); return; }
            await createShipmentAfterPayment({ packageId: pendingPayment.packageId, paymentReference: pendingPayment.reference, provider: 'paystack' });
        } catch (err) {
            showPaymentError(setError, PAYMENT_PENDING_MESSAGE, err);
        } finally { setPaymentProcessing(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (kycStatus !== 'approved' && user?.kycStatus !== 'approved') {
            setLoading(false);
            navigate('/verify', { state: { message: 'Please verify your identity to send a package.', from: '/send-package' } });
            return;
        }
        if (!phoneVerified && user?.phoneVerified !== true) {
            setLoading(false);
            navigate('/dashboard?tab=settings', { state: { message: 'Please verify your phone number to send a package.' } });
            return;
        }
        if (!formData.packageImage) { setError('Please upload an image of the item.'); setLoading(false); return; }
        if (!formData.packageValue || parseFloat(formData.packageValue) <= 0) { setError('Please enter the item value.'); setLoading(false); return; }
        if (parseFloat(formData.packageWeight) <= 0 || parseFloat(formData.packageWeight) > 50) { setError('Package weight must be between 0.1 and 50 kg.'); setLoading(false); return; }
        if (!formData.receiverName.trim() || !formData.receiverPhone.trim() || !formData.deliveryAddress.trim()) { setError('Please fill in all receiver details.'); setLoading(false); return; }
        if (!termsAccepted.every(Boolean)) { setError('You must confirm all shipping agreement items.'); setLoading(false); return; }
        if (!formData.fromCountry?.trim() || !formData.toCountry?.trim() || !formData.fromCity?.trim() || !formData.toCity?.trim()) { setError('Missing location data. Please go back and select a trip.'); setLoading(false); return; }

        try {
            let packageId = '';
            try {
                const pkgRes = await api.post('/api/bago/createPackage', {
                    from_city: formData.fromCity.trim(), from_country: formData.fromCountry.trim(),
                    to_city: formData.toCity.trim(), to_country: formData.toCountry.trim(),
                    package_details: {
                        package_name: formData.category,
                        package_description: formData.specialInstructions.trim() || formData.category,
                        package_weight: parseFloat(formData.packageWeight) || 1,
                        package_value: formData.packageValue || 0,
                        package_image: formData.packageImage,
                        category: formData.category,
                    },
                    recipient_details: {
                        receiver_name: formData.receiverName.trim(),
                        receiver_phone: formData.receiverPhone.trim(),
                        receiver_phone_country_code: receiverPhoneCountry.toUpperCase(),
                        receiver_email: '',
                    },
                    deliveryAddress: formData.deliveryAddress.trim(),
                    specialInstructions: formData.specialInstructions.trim(),
                });
                if (![200, 201].includes(pkgRes.status) || !pkgRes.data?.package?._id) throw new Error(pkgRes.data?.message || 'Package could not be created.');
                packageId = pkgRes.data.package._id;
            } catch (err) {
                showPaymentError(setError, 'We could not create this shipment request. Please check the details and try again.', err);
                setLoading(false);
                return;
            }

            if (!isAfricanCurrency) {
                const params = new URLSearchParams({
                    packageId,
                    tripId: selectedTrip._id,
                    travelerId: String(selectedTrip.user?._id || selectedTrip.user || ''),
                    currency,
                    amount: Number(totalCost).toFixed(2),
                    insurance: String(formData.insuranceProtection),
                    insuranceCost: String(formData.insuranceProtection ? insuranceCost : 0),
                    estimatedDeparture: selectedTrip.departureDate || '',
                });
                navigate(`/checkout/payment?${params.toString()}`);
                return;
            }

            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            try {
                const psRes = await api.post('/api/bago/paystack/initialize', {
                    packageId, tripId: selectedTrip._id,
                    amount: Number(totalCost), currency,
                    customerEmail: user?.email || '',
                    expiresAt,
                    metadata: {
                        insurance: formData.insuranceProtection,
                        insuranceCost: formData.insuranceProtection ? insuranceCost : 0,
                        estimatedDeparture: selectedTrip.departureDate,
                        estimatedArrival: selectedTrip.arrivalDate,
                    },
                });
                const authorizationUrl = psRes.data?.authorization_url || psRes.data?.data?.authorization_url;
                const reference = psRes.data?.reference || psRes.data?.data?.reference;
                if (!authorizationUrl || !reference) throw new Error('Payment checkout could not start.');
                localStorage.setItem('bagoPendingShipment', JSON.stringify({
                    packageId,
                    tripId: selectedTrip._id,
                    travelerId: String(selectedTrip.user?._id || selectedTrip.user || ''),
                    amount: Number(totalCost),
                    currency,
                    estimatedDeparture: selectedTrip.departureDate || '',
                    insurance: formData.insuranceProtection,
                    insuranceCost: formData.insuranceProtection ? insuranceCost : 0,
                }));
                window.open(authorizationUrl, '_blank', 'noopener,noreferrer');
                setPendingPayment({ provider: 'paystack', packageId, reference, authorizationUrl });
                setLoading(false);
            } catch (err) {
                showPaymentError(setError, 'We could not continue checkout right now. Please try again in a few minutes.', err);
                setLoading(false);
            }
        } catch (err) {
            showPaymentError(setError, 'We could not continue checkout right now. Please try again in a few minutes.', err);
            setLoading(false);
        }
    };

    const travelerName = selectedTrip?.travelerName
        || [selectedTrip?.user?.firstName, selectedTrip?.user?.lastName].filter(Boolean).join(' ')
        || 'Traveler';
    const travelerImage = selectedTrip?.travelerImage || selectedTrip?.user?.image || selectedTrip?.user?.profileImage || null;
    const travelerRating = Number(selectedTrip?.rating || selectedTrip?.travelerRating || selectedTrip?.user?.rating || 5).toFixed(1);
    const travelMeans = selectedTrip?.meansOfTransport || selectedTrip?.travelMeans || selectedTrip?.transportMode || 'Flight';
    const availableKg = selectedTrip?.availableCapacity ?? selectedTrip?.remainingCapacity ?? selectedTrip?.available_weight ?? selectedTrip?.capacity ?? '–';

    // Shared field style
    const field = 'w-full px-4 py-3 rounded-[14px] border border-gray-100 focus:border-[#5845D8]/30 outline-none text-sm font-bold bg-[#F5F4FC] hover:bg-white focus:bg-white focus:shadow-sm transition-all text-[#012126]';

    return (
        <div className="min-h-screen bg-[#F5F4FC]">
            <Navbar />

            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

                {/* Page title — visible on desktop */}
                <div className="hidden lg:flex items-center gap-3 mb-8">
                    <h1 className="text-2xl font-black text-[#012126] tracking-tight">Request Shipment</h1>
                    <span className="text-[10px] font-black text-[#5845D8] bg-[#5845D8]/8 px-3 py-1 rounded-full uppercase tracking-widest">Secure Checkout</span>
                </div>

                {/* ── Traveler Hero Card (full-width) ── */}
                {selectedTrip && (
                    <div
                        className="rounded-[24px] p-5 md:p-6 mb-5 text-white overflow-hidden relative"
                        style={{ background: 'linear-gradient(135deg, #5C4BFD 0%, #7C6FFF 100%)' }}
                    >
                        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full -ml-10 -mb-10 pointer-events-none" />

                        <div className="flex items-center gap-4 relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-black overflow-hidden shrink-0">
                                {travelerImage
                                    ? <img src={travelerImage} alt={travelerName} className="w-full h-full object-cover" />
                                    : travelerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-xl leading-tight truncate">{travelerName}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Star size={12} className="fill-yellow-300 text-yellow-300" />
                                        <span className="text-xs font-bold text-white/90">{travelerRating}</span>
                                    </span>
                                    <span className="text-white/30">•</span>
                                    <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                        <TravelMeanIcon means={travelMeans} /> {travelMeans}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 relative">
                            <div className="flex-1 bg-white/15 rounded-[14px] px-3 py-3 text-center">
                                <p className="text-[9px] font-bold text-white/55 uppercase tracking-wide mb-0.5">Available</p>
                                <p className="text-sm font-black">{availableKg} kg</p>
                            </div>
                            <div className="flex-1 bg-white/15 rounded-[14px] px-3 py-3 text-center">
                                <p className="text-[9px] font-bold text-white/55 uppercase tracking-wide mb-0.5">Price / kg</p>
                                <p className="text-sm font-black">{selectedTrip.currency || currency} {Number(selectedTrip.pricePerKg || 0).toFixed(0)}</p>
                            </div>
                            {selectedTrip.departureDate && (
                                <div className="flex-1 bg-white/15 rounded-[14px] px-3 py-3 text-center">
                                    <p className="text-[9px] font-bold text-white/55 uppercase tracking-wide mb-0.5">Departs</p>
                                    <p className="text-sm font-black">
                                        {new Date(selectedTrip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Route Card (full-width) ── */}
                {selectedTrip && (
                    <div className="bg-white rounded-[20px] px-5 py-4 mb-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <MapPin size={15} className="text-[#5845D8] shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">From</p>
                                <p className="text-sm font-black text-[#012126] truncate">
                                    {formData.fromCity || '–'}{formData.fromCountry ? `, ${formData.fromCountry}` : ''}
                                </p>
                            </div>
                            <div className="w-7 h-7 bg-[#F5F4FC] rounded-full flex items-center justify-center shrink-0">
                                <ArrowRight size={14} className="text-[#5845D8]" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">To</p>
                                <p className="text-sm font-black text-[#012126] truncate">
                                    {formData.toCity || '–'}{formData.toCountry ? `, ${formData.toCountry}` : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mt-3 text-[10px] font-bold text-[#5845D8] hover:opacity-70 transition-opacity underline underline-offset-2"
                        >
                            Change route
                        </button>
                    </div>
                )}

                {/* ── Main grid: form (left) + summary sidebar (right on desktop) ── */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7 items-start">

                        {/* ── LEFT: form sections ── */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Shipment Details */}
                            <div className="bg-white rounded-[20px] p-5 md:p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Package size={17} />
                                    </div>
                                    <h2 className="text-sm font-black text-[#012126]">Shipment Details</h2>
                                </div>

                                {/* Weight + Value */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div>
                                        <label className="block text-xs font-black text-[#012126] mb-1.5 ml-0.5">Weight (kg)</label>
                                        <input
                                            required type="number"
                                            name="packageWeight"
                                            min="0.1" max="50" step="0.1"
                                            placeholder="e.g. 2.5"
                                            className={field}
                                            value={formData.packageWeight}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-[#012126] mb-1.5 ml-0.5">Item Value ({currency})</label>
                                        <input
                                            required type="number"
                                            name="packageValue"
                                            placeholder="Estimated value"
                                            min="1"
                                            className={field}
                                            value={formData.packageValue}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Category grid */}
                                <div className="mb-5">
                                    <label className="block text-xs font-black text-[#012126] mb-2.5 ml-0.5">Category</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                                        {ITEM_CATEGORIES.map(({ value, label, icon: Icon }) => {
                                            const sel = formData.category === value;
                                            return (
                                                <button
                                                    key={value} type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, category: value }))}
                                                    className={`h-[72px] rounded-[16px] border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                                        sel
                                                            ? 'bg-[#5845D8] border-[#5845D8] text-white shadow-lg shadow-[#5845D8]/20'
                                                            : 'bg-[#F5F4FC] border-transparent text-gray-500 hover:border-[#5845D8]/20 hover:bg-white'
                                                    }`}
                                                >
                                                    <Icon size={18} strokeWidth={2} />
                                                    <span className="text-[10px] font-black">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Image picker */}
                                <div>
                                    <label className="block text-xs font-black text-[#012126] mb-2.5 ml-0.5">Item Photo</label>
                                    <div
                                        onClick={() => document.getElementById('item-image').click()}
                                        className={`w-full h-44 md:h-52 border-2 border-dashed rounded-[18px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                                            formData.imagePreview
                                                ? 'border-[#5845D8] bg-[#5845D8]/5'
                                                : 'border-gray-200 hover:border-[#5845D8]/40 bg-[#F5F4FC]'
                                        }`}
                                    >
                                        {formData.imagePreview ? (
                                            <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-[16px]" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-300 mb-2">
                                                    <Package size={22} />
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap to add photo</p>
                                                <p className="text-[9px] text-gray-300 font-medium mt-1 px-8 text-center">A clear photo helps the traveler confirm your item</p>
                                            </>
                                        )}
                                        <input id="item-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </div>
                                    {formData.imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, packageImage: null, imagePreview: null }))}
                                            className="mt-2 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors ml-1"
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Receiver Details */}
                            <div className="bg-white rounded-[20px] p-5 md:p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                        <User size={17} />
                                    </div>
                                    <h2 className="text-sm font-black text-[#012126]">Receiver Details</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-[#012126] mb-1.5 ml-0.5">Full Name</label>
                                        <input
                                            required type="text"
                                            name="receiverName"
                                            placeholder="Receiver's full name"
                                            className={field}
                                            value={formData.receiverName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-[#012126] mb-1.5 ml-0.5">Phone Number</label>
                                        <PhoneInput
                                            country={receiverPhoneCountry}
                                            value={formData.receiverPhone}
                                            onChange={handleReceiverPhoneChange}
                                            enableSearch disableSearchIcon
                                            inputProps={{ name: 'receiverPhone', required: true }}
                                            containerClass="!w-full"
                                            inputClass="!w-full !h-[50px] !pl-[68px] !pr-4 !rounded-[14px] !border !border-gray-100 !bg-[#F5F4FC] focus:!bg-white focus:!border-[#5845D8]/30 !outline-none !text-sm !font-bold !text-[#012126]"
                                            buttonClass="!h-[50px] !w-[60px] !rounded-l-[14px] !border !border-gray-100 !border-r-0 !bg-white/70 hover:!bg-white"
                                            dropdownClass="!rounded-2xl !border-gray-100 !shadow-xl !text-sm"
                                            searchClass="!mx-3 !my-2 !w-[calc(100%-24px)] !rounded-xl !border-gray-100 !py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-[#012126] mb-1.5 ml-0.5">Delivery Address</label>
                                        <textarea
                                            required
                                            name="deliveryAddress"
                                            placeholder="Full drop-off address"
                                            rows="2"
                                            className={`${field} resize-none`}
                                            value={formData.deliveryAddress}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-[#012126] mb-1.5 ml-0.5">
                                            Note to Traveler <span className="text-gray-400 font-medium">(optional)</span>
                                        </label>
                                        <textarea
                                            name="specialInstructions"
                                            placeholder="Handling instructions, pickup notes..."
                                            rows="2"
                                            className={`${field} resize-none`}
                                            value={formData.specialInstructions}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Tile */}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, insuranceProtection: !prev.insuranceProtection }))}
                                className={`w-full bg-white rounded-[20px] p-5 border text-left transition-all shadow-sm ${
                                    formData.insuranceProtection ? 'border-[#5845D8]/30' : 'border-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                        formData.insuranceProtection ? 'bg-[#5845D8] text-white' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        <Shield size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-[#012126]">Item Protection</p>
                                        {formData.insuranceProtection && insuranceCost > 0 ? (
                                            <p className="text-xs text-[#5845D8] font-bold mt-0.5">
                                                +{currency} {insuranceCost.toFixed(2)} (0.5% of item value)
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">Protect your item against loss or damage</p>
                                        )}
                                    </div>
                                    <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${formData.insuranceProtection ? 'bg-[#5845D8]' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.insuranceProtection ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </button>

                            {/* Terms — visible only on mobile (below form, before sidebar) */}
                            <div className="lg:hidden bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-2.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Shipping Agreement</p>
                                {['My shipment does not contain any prohibited or restricted items.',
                                  'I understand the traveler may inspect the contents for safety.',
                                  "I agree to follow Bago's guidelines and take responsibility for my shipment.",
                                ].map((label, i) => (
                                    <div key={i} className="flex items-start gap-3 cursor-pointer group" onClick={() => setTermsAccepted(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}>
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                            termsAccepted[i] ? 'bg-[#5845D8] text-white' : 'bg-gray-100 text-transparent border border-gray-200 group-hover:bg-gray-200'
                                        }`}>
                                            <Check size={11} />
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 leading-relaxed group-hover:text-[#012126] transition-colors">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Error — mobile */}
                            {error && (
                                <div className="lg:hidden bg-red-50 border border-red-100 text-red-600 p-4 rounded-[16px] flex items-start gap-2.5">
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold">{error}</p>
                                </div>
                            )}

                            {/* Pending Paystack — mobile */}
                            {pendingPayment && (
                                <div className="lg:hidden bg-amber-50 border border-amber-100 rounded-[20px] p-5">
                                    <p className="text-xs font-black text-amber-800 mb-3">Complete payment in the Paystack tab, then verify here.</p>
                                    <div className="flex gap-3">
                                        <a href={pendingPayment.authorizationUrl} target="_blank" rel="noreferrer"
                                            className="flex-1 py-3 bg-white border border-amber-200 text-amber-700 rounded-[14px] text-[10px] font-black uppercase tracking-widest text-center">
                                            Reopen
                                        </a>
                                        <button type="button" onClick={handleVerifyPaystackPayment} disabled={paymentProcessing}
                                            className="flex-1 py-3 bg-[#5845D8] text-white rounded-[14px] text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                                            {paymentProcessing ? 'Checking…' : 'Verify & Send'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit — mobile */}
                            <button
                                type="submit"
                                disabled={loading || Boolean(pendingPayment)}
                                className="lg:hidden w-full py-4 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-[18px] font-black text-[11px] uppercase tracking-[2px] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {pendingPayment ? 'Complete payment above' : loading ? 'Processing…' : <><span>Continue to Payment</span> <ArrowRight size={14} /></>}
                            </button>
                        </div>

                        {/* ── RIGHT: sticky price summary (desktop only) ── */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-24 space-y-4">

                                {/* Price Summary */}
                                <div className="bg-[#012126] rounded-[24px] p-6 text-white overflow-hidden relative shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-white/45 mb-5">Price Summary</h3>
                                    <div className="space-y-3 relative">
                                        {selectedTrip && formData.fromCity && (
                                            <>
                                                <div className="text-[10px] font-black text-white/40 uppercase tracking-wider mb-4">
                                                    {formData.fromCity} → {formData.toCity}
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/60 font-medium">Shipping</span>
                                            <span className="text-sm font-black">{currency} {shippingCost.toFixed(2)}</span>
                                        </div>
                                        {formData.insuranceProtection && insuranceCost > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-white/60 font-medium">Protection</span>
                                                <span className="text-sm font-black">{currency} {insuranceCost.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total</span>
                                            <span className="text-2xl font-black">{currency} {totalCost}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms — desktop */}
                                <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-2.5">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Agreement</p>
                                    {['My shipment does not contain any prohibited or restricted items.',
                                      'I understand the traveler may inspect the contents for safety.',
                                      "I agree to follow Bago's guidelines and take responsibility.",
                                    ].map((label, i) => (
                                        <div key={i} className="flex items-start gap-3 cursor-pointer group" onClick={() => setTermsAccepted(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                                termsAccepted[i] ? 'bg-[#5845D8] text-white' : 'bg-gray-100 text-transparent border border-gray-200 group-hover:bg-gray-200'
                                            }`}>
                                                <Check size={11} />
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500 leading-relaxed group-hover:text-[#012126] transition-colors">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Error — desktop */}
                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-[16px] flex items-start gap-2.5">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <p className="text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                {/* Pending Paystack — desktop */}
                                {pendingPayment && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-[18px] p-4">
                                        <p className="text-xs font-black text-amber-800 mb-3">Complete payment in the Paystack tab, then verify here.</p>
                                        <div className="flex gap-2">
                                            <a href={pendingPayment.authorizationUrl} target="_blank" rel="noreferrer"
                                                className="flex-1 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-[12px] text-[9px] font-black uppercase tracking-widest text-center">
                                                Reopen
                                            </a>
                                            <button type="button" onClick={handleVerifyPaystackPayment} disabled={paymentProcessing}
                                                className="flex-1 py-2.5 bg-[#5845D8] text-white rounded-[12px] text-[9px] font-black uppercase tracking-widest disabled:opacity-50">
                                                {paymentProcessing ? 'Checking…' : 'Verify & Send'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Submit — desktop */}
                                <button
                                    type="submit"
                                    disabled={loading || Boolean(pendingPayment)}
                                    className="w-full py-4 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-[18px] font-black text-[11px] uppercase tracking-[2px] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {pendingPayment ? 'Complete payment above' : loading ? 'Processing…' : <><span>Continue to Payment</span> <ArrowRight size={14} /></>}
                                </button>

                                <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    By continuing you agree to{' '}
                                    <Link to="/terms" className="text-[#5845D8] underline hover:opacity-70">Bago's terms</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile terms link */}
                    <p className="lg:hidden text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                        By continuing you agree to{' '}
                        <Link to="/terms" className="text-[#5845D8] underline hover:opacity-70">Bago's terms</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
