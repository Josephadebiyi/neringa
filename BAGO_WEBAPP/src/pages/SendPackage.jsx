import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserAccountCurrency } from '../utils/userCurrency';
import { buildShipmentPackage, validateShipmentPackage } from '../utils/shipmentPackage';
import { customerError } from '../utils/customerErrors';
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
import AppTopBar from '../components/AppTopBar';
import { countries, locations } from '../utils/countries';

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

const tripIdFrom = (trip) => String(trip?._id || trip?.id || '');

const travelerIdFrom = (trip) => String(
    trip?.travelerId ||
    trip?.userId ||
    trip?.user?._id ||
    trip?.user?.id ||
    trip?.user ||
    ''
);

const readPreviewNumber = (preview, key) => {
    const value = preview?.[key];
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const checkoutErrorMessage = (error, fallback = 'Checkout price could not be calculated. Please try again.') => customerError(error, fallback);

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
    setError(checkoutErrorMessage(error, message));
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
    const { t } = useLanguage();
    return <AppTopBar backLabel={t('back') || 'Back'} />;
};

export default function SendPackage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const selectedTrip = location.state?.trip;
    const initialWeight = location.state?.weight || '1';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [currency, setCurrency] = useState(() => getUserAccountCurrency(user));
    const [kycStatus, setKycStatus] = useState(user?.kycStatus || 'not_started');
    const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified === true);
    const [checkoutPreview, setCheckoutPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const [receiverPhoneCountry, setReceiverPhoneCountry] = useState('us');
    const [termsAccepted, setTermsAccepted] = useState([false, false, false]);

    const [formData, setFormData] = useState({
        contents: '',
        declaration: {},
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
        if (authLoading) return;
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!selectedTrip) { navigate('/search', { replace: true }); return; }
        checkVerificationStatus();
    }, [authLoading, isAuthenticated, navigate, selectedTrip]);

    useEffect(() => { if (user?.preferredCurrency) setCurrency(user.preferredCurrency); }, [user?.preferredCurrency]);

    useEffect(() => {
        if (selectedTrip && !authLoading && isAuthenticated) {
            const timer = setTimeout(() => { fetchPricing(); }, 350);
            return () => clearTimeout(timer);
        }
    }, [
        selectedTrip,
        authLoading,
        isAuthenticated,
        formData.packageWeight,
        formData.packageValue,
        formData.insuranceProtection,
        user?.preferredCurrency,
    ]);

    const fetchPricing = async ({ silent = false } = {}) => {
        const weight = parseFloat(formData.packageWeight);
        const declaredValue = parseFloat(formData.packageValue) || 0;
        const senderCurrency = getUserAccountCurrency(user, currency);
        const tripId = tripIdFrom(selectedTrip);
        if (!tripId || !Number.isFinite(weight) || weight <= 0) {
            setCheckoutPreview(null);
            setPreviewError('');
            setPreviewLoading(false);
            return null;
        }
        if (!silent) {
            setPreviewLoading(true);
            setPreviewError('');
        }
        try {
            const res = await api.post('/api/checkout/shipment-preview', {
                tripId,
                weight,
                senderCurrency,
                declaredValue,
                insurance: formData.insuranceProtection,
            });
            const preview = res.data?.preview;
            if (!res.data?.success || !preview) {
                throw new Error(res.data?.message || 'Checkout price could not be calculated.');
            }
            setCheckoutPreview(preview);
            setCurrency((preview.senderCurrency || preview.senderPaymentCurrency || senderCurrency).toUpperCase());
            setPreviewError('');
            return preview;
        } catch (err) {
            const msg = checkoutErrorMessage(err);
            setCheckoutPreview(null);
            setPreviewError(msg);
            return null;
        } finally {
            if (!silent) setPreviewLoading(false);
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

    const travelerCost = readPreviewNumber(checkoutPreview, 'convertedTravelerPayout');
    const bagoFee = readPreviewNumber(checkoutPreview, 'bagoNetRevenue');
    const insuranceCost = readPreviewNumber(checkoutPreview, 'insuranceAmount');
    const totalCostNumber = readPreviewNumber(checkoutPreview, 'totalAmount');
    const totalCost = totalCostNumber.toFixed(2);
    const previewCurrency = (checkoutPreview?.senderCurrency || checkoutPreview?.senderPaymentCurrency || currency || 'USD').toUpperCase();
    const packageWeight = Number(formData.packageWeight);
    const senderPricePerKg = checkoutPreview && packageWeight > 0
        ? readPreviewNumber(checkoutPreview, 'shippingAmount') / packageWeight
        : null;
    const canCheckout = Boolean(checkoutPreview && totalCostNumber > 0 && !previewLoading);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
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
        const validation = validateShipmentPackage(formData, termsAccepted);
        if (Object.keys(validation).length) {
            setFieldErrors(validation);
            setError('Please check the shipment details listed above before continuing.');
            setLoading(false);
            requestAnimationFrame(() => document.getElementById('shipment-validation')?.focus());
            return;
        }

        try {
            // Refresh before submission so a stale preview cannot create a
            // package and then fail with a different price at payment.
            const displayedTotal = checkoutPreview ? readPreviewNumber(checkoutPreview, 'totalAmount') : null;
            const preview = await fetchPricing({ silent: true });
            if (!preview) {
                setError(previewError || 'Checkout price could not be calculated. Please try again.');
                setLoading(false);
                return;
            }
            const checkoutCurrency = (preview.senderCurrency || preview.senderPaymentCurrency || currency || 'USD').toUpperCase();
            const checkoutTotal = readPreviewNumber(preview, 'totalAmount');
            const checkoutInsurance = readPreviewNumber(preview, 'insuranceAmount');
            if (displayedTotal !== null && Math.abs(displayedTotal - checkoutTotal) > 0.011) {
                setError('The shipment price changed. Review the updated total, then continue.');
                setLoading(false);
                return;
            }
            if (checkoutTotal <= 0) {
                setError('Checkout price could not be calculated. Please try again.');
                setLoading(false);
                return;
            }

            let packageId = '';
            try {
                const payload = buildShipmentPackage(formData, termsAccepted, receiverPhoneCountry);
                const pkgRes = await api.post('/api/bago/createPackage', payload);
                if (![200, 201].includes(pkgRes.status) || !(pkgRes.data?.package?._id || pkgRes.data?.package?.id)) throw new Error(pkgRes.data?.message || 'Package could not be created.');
                packageId = pkgRes.data.package._id || pkgRes.data.package.id;
            } catch (err) {
                showPaymentError(setError, 'We could not create this shipment request. Please check the details and try again.', err);
                setLoading(false);
                return;
            }

            // Checkout selects the same payment provider as the mobile app.
            // The user’s saved payment currency determines the provider.
            const params = new URLSearchParams({
                packageId,
                tripId: tripIdFrom(selectedTrip),
                travelerId: String(preview.travelerId || travelerIdFrom(selectedTrip)),
                currency: checkoutCurrency,
                amount: checkoutTotal.toFixed(2),
                insurance: String(formData.insuranceProtection),
                insuranceCost: String(formData.insuranceProtection ? checkoutInsurance : 0),
                estimatedDeparture: selectedTrip.departureDate || '',
            });
            navigate(`/checkout/payment?${params.toString()}`);
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
    const availableKg = selectedTrip?.availableKg
        ?? selectedTrip?.remainingKg
        ?? selectedTrip?.totalKg
        ?? selectedTrip?.availableCapacity
        ?? selectedTrip?.remainingCapacity
        ?? selectedTrip?.available_weight
        ?? selectedTrip?.capacity
        ?? '–';

    // Shared field style
    const field = 'w-full px-4 py-3 rounded-[14px] border border-[#ECEBF3] focus:border-[#5845D8]/30 outline-none text-sm font-bold bg-[#F5F4FC] hover:bg-white focus:bg-white focus:shadow-sm transition-all text-[#171B22]';

    return (
        <div className="min-h-screen bg-[#F5F4FC]">
            <Navbar />

            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">

                {/* Page title — visible on desktop */}
                <div className="hidden lg:flex items-center gap-3 mb-8">
                    <h1 className="text-2xl font-extrabold text-[#171B22] tracking-[-0.03em]">Request Shipment</h1>
                    <span className="text-[13px] font-semibold text-[#5845D8] bg-[#5845D8]/8 px-3 py-1 rounded-full ">Secure Checkout</span>
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
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-extrabold overflow-hidden shrink-0">
                                {travelerImage
                                    ? <img src={travelerImage} alt={travelerName} className="w-full h-full object-cover" />
                                    : travelerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-xl leading-tight truncate">{travelerName}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Star size={12} className="fill-yellow-300 text-yellow-300" />
                                        <span className="text-xs font-bold text-white/90">{travelerRating}</span>
                                    </span>
                                    <span className="text-white/30">•</span>
                                    <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[13px] font-bold">
                                        <TravelMeanIcon means={travelMeans} /> {travelMeans}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 relative">
                            <div className="flex-1 bg-white/15 rounded-[14px] px-3 py-3 text-center">
                                <p className="text-xs font-bold text-white/55 tracking-wide mb-0.5">Available</p>
                                <p className="text-sm font-semibold">{availableKg} kg</p>
                            </div>
                            <div className="flex-1 bg-white/15 rounded-[14px] px-3 py-3 text-center">
                                <p className="text-xs font-bold text-white/55 tracking-wide mb-0.5">Price / kg</p>
                                <p className="text-sm font-semibold">
                                    {previewLoading
                                        ? 'Calculating…'
                                        : senderPricePerKg !== null
                                            ? `${previewCurrency} ${senderPricePerKg.toFixed(2)}`
                                            : '—'}
                                </p>
                            </div>
                            {selectedTrip.departureDate && (
                                <div className="flex-1 bg-white/15 rounded-[14px] px-3 py-3 text-center">
                                    <p className="text-xs font-bold text-white/55 tracking-wide mb-0.5">Departs</p>
                                    <p className="text-sm font-semibold">
                                        {new Date(selectedTrip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Route Card (full-width) ── */}
                {selectedTrip && (
                    <div className="bg-white rounded-[20px] px-5 py-4 mb-5 border border-[#ECEBF3] shadow-sm">
                        <div className="flex items-center gap-4">
                            <MapPin size={15} className="text-[#5845D8] shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#6B7280] ">From</p>
                                <p className="text-sm font-semibold text-[#171B22] truncate">
                                    {formData.fromCity || '–'}{formData.fromCountry ? `, ${formData.fromCountry}` : ''}
                                </p>
                            </div>
                            <div className="w-7 h-7 bg-[#F5F4FC] rounded-full flex items-center justify-center shrink-0">
                                <ArrowRight size={14} className="text-[#5845D8]" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <p className="text-xs font-semibold text-[#6B7280] ">To</p>
                                <p className="text-sm font-semibold text-[#171B22] truncate">
                                    {formData.toCity || '–'}{formData.toCountry ? `, ${formData.toCountry}` : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mt-3 text-[13px] font-bold text-[#5845D8] hover:opacity-70 transition-opacity underline underline-offset-2"
                        >
                            Change route
                        </button>
                    </div>
                )}

                {/* ── Main grid: form (left) + summary sidebar (right on desktop) ── */}
                <form onSubmit={handleSubmit} noValidate>
                    {Object.keys(fieldErrors).length > 0 && <div id="shipment-validation" role="alert" tabIndex={-1} className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 focus:outline-none">
                        <p className="font-bold">Please check these shipment details:</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(fieldErrors).map(([field, message]) => <li key={field}>{message}</li>)}</ul>
                    </div>}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7 items-start">

                        {/* ── LEFT: form sections ── */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Shipment Details */}
                            <div className="bg-white rounded-[20px] p-5 md:p-6 border border-[#ECEBF3] shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Package size={17} />
                                    </div>
                                    <h2 className="text-sm font-semibold text-[#171B22]">Shipment Details</h2>
                                </div>

                                {/* Weight + Value */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div>
                                        <label htmlFor="shipment-packageWeight" className="block text-xs font-semibold text-[#171B22] mb-1.5 ml-0.5">Weight (kg)</label>
                                        <input
                                            required type="number"
                                            id="shipment-packageWeight" name="packageWeight" aria-invalid={Boolean(fieldErrors.packageWeight)}
                                            min="0.1" max="50" step="0.1"
                                            placeholder="e.g. 2.5"
                                            className={field}
                                            value={formData.packageWeight}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="shipment-packageValue" className="block text-xs font-semibold text-[#171B22] mb-1.5 ml-0.5">Item Value ({currency})</label>
                                        <input
                                            required type="number"
                                            id="shipment-packageValue" name="packageValue" aria-invalid={Boolean(fieldErrors.packageValue)}
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
                                    <label className="block text-xs font-semibold text-[#171B22] mb-2.5 ml-0.5">Category</label>
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
                                                    <span className="text-[13px] font-semibold">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="shipment-contents" className="mb-2 block text-xs font-semibold text-[#171B22]">Package contents <span className="text-red-600">*</span></label>
                                    <textarea id="shipment-contents" name="contents" required rows={4}
                                        value={formData.contents} onChange={handleChange}
                                        aria-invalid={Boolean(fieldErrors.contents)} aria-describedby="shipment-contents-help shipment-contents-error"
                                        placeholder={'2 cotton shirts\n1 pair of shoes'} className={field} />
                                    <p id="shipment-contents-help" className="mt-1 text-xs text-gray-500">List every item and its quantity, one per line. A category alone is not enough.</p>
                                    {fieldErrors.contents && <p id="shipment-contents-error" className="mt-1 text-xs text-red-600">{fieldErrors.contents}</p>}
                                </div>
                                <fieldset className="mb-5">
                                    <legend className="mb-2 text-xs font-semibold">Item and packaging details — select all that apply</legend>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {[
                                            ['factorySealed', 'Factory-sealed packaging'], ['personalSealed', 'Personally sealed packaging'],
                                            ['wrapped', 'Wrapped items'], ['hasBatteries', 'Contains batteries'],
                                            ['hasLiquids', 'Contains liquids'], ['fragile', 'Fragile items'],
                                            ['hasPrescriptionMedicine', 'Contains prescription medicine'],
                                            ['receiptProvided', 'Receipt included with item'], ['productLabelProvided', 'Product label included'],
                                            ['barcodeProvided', 'Barcode included'],
                                        ].map(([key, label]) => <label key={key} className="flex items-start gap-2 text-xs text-gray-600">
                                            <input type="checkbox" checked={formData.declaration[key] === true}
                                                onChange={event => setFormData(previous => ({ ...previous, declaration: { ...previous.declaration, [key]: event.target.checked } }))} />
                                            <span>{label}</span>
                                        </label>)}
                                    </div>
                                </fieldset>

                                {/* Image picker */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#171B22] mb-2.5 ml-0.5">Item Photo</label>
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
                                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#9CA3AF] mb-2">
                                                    <Package size={22} />
                                                </div>
                                                <p className="text-[13px] font-semibold text-[#6B7280] ">Tap to add photo</p>
                                                <p className="text-xs text-[#9CA3AF] font-medium mt-1 px-8 text-center">A clear photo helps the traveler confirm your item</p>
                                            </>
                                        )}
                                        <input id="item-image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </div>
                                    {formData.imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, packageImage: null, imagePreview: null }))}
                                            className="mt-2 text-[13px] font-bold text-red-400 hover:text-red-600 transition-colors ml-1"
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Receiver Details */}
                            <div className="bg-white rounded-[20px] p-5 md:p-6 border border-[#ECEBF3] shadow-sm">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                        <User size={17} />
                                    </div>
                                    <h2 className="text-sm font-semibold text-[#171B22]">Receiver Details</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="shipment-receiverName" className="block text-xs font-semibold text-[#171B22] mb-1.5 ml-0.5">Full Name</label>
                                        <input
                                            required type="text"
                                            id="shipment-receiverName" name="receiverName" aria-invalid={Boolean(fieldErrors.receiverName)}
                                            placeholder="Receiver's full name"
                                            className={field}
                                            value={formData.receiverName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="shipment-receiverPhone" className="block text-xs font-semibold text-[#171B22] mb-1.5 ml-0.5">Phone Number</label>
                                        <PhoneInput
                                            country={receiverPhoneCountry}
                                            value={formData.receiverPhone}
                                            onChange={handleReceiverPhoneChange}
                                            enableSearch disableSearchIcon
                                            inputProps={{ id: 'shipment-receiverPhone', name: 'receiverPhone', required: true, 'aria-invalid': Boolean(fieldErrors.receiverPhone) }}
                                            containerClass="!w-full"
                                            inputClass="!w-full !h-[50px] !pl-[68px] !pr-4 !rounded-[14px] !border !border-[#ECEBF3] !bg-[#F5F4FC] focus:!bg-white focus:!border-[#5845D8]/30 !outline-none !text-sm !font-bold !text-[#171B22]"
                                            buttonClass="!h-[50px] !w-[60px] !rounded-l-[14px] !border !border-[#ECEBF3] !border-r-0 !bg-white/70 hover:!bg-white"
                                            dropdownClass="!rounded-2xl !border-[#ECEBF3] !shadow-xl !text-sm"
                                            searchClass="!mx-3 !my-2 !w-[calc(100%-24px)] !rounded-xl !border-[#ECEBF3] !py-2"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="shipment-deliveryAddress" className="block text-xs font-semibold text-[#171B22] mb-1.5 ml-0.5">Delivery Address</label>
                                        <textarea
                                            required
                                            id="shipment-deliveryAddress" name="deliveryAddress" aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                                            placeholder="Full drop-off address"
                                            rows="2"
                                            className={`${field} resize-none`}
                                            value={formData.deliveryAddress}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#171B22] mb-1.5 ml-0.5">
                                            Note to Traveler <span className="text-[#6B7280] font-medium">(optional)</span>
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
                                        <p className="text-sm font-semibold text-[#171B22]">Item Protection</p>
                                        {formData.insuranceProtection && insuranceCost > 0 ? (
                                            <p className="text-xs text-[#5845D8] font-bold mt-0.5">
                                                +{previewCurrency} {insuranceCost.toFixed(2)} fixed protection
                                            </p>
                                        ) : (
                                            <p className="text-xs text-[#6B7280] font-medium mt-0.5">Protect your item against loss or damage</p>
                                        )}
                                    </div>
                                    <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${formData.insuranceProtection ? 'bg-[#5845D8]' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.insuranceProtection ? 'left-5' : 'left-0.5'}`} />
                                    </div>
                                </div>
                            </button>

                            {/* Terms — visible only on mobile (below form, before sidebar) */}
                            <div className="lg:hidden bg-white rounded-[20px] p-5 border border-[#ECEBF3] shadow-sm space-y-2.5">
                                <p className="text-xs font-semibold text-[#6B7280] mb-1">Shipping Agreement</p>
                                {['My shipment does not contain any prohibited or restricted items.',
                                  'I agree that the traveller may inspect my package contents before collection.',
                                  "I agree to follow Bago's guidelines and take responsibility for my shipment.",
                                ].map((label, i) => (
                                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={termsAccepted[i]}
                                                aria-invalid={i === 1 && Boolean(fieldErrors.inspection)}
                                                onChange={event => setTermsAccepted(previous => previous.map((value, index) => index === i ? event.target.checked : value))}
                                                className="mt-0.5 h-5 w-5 shrink-0 accent-[#5845D8]" />
                                            <span className="text-xs font-medium leading-relaxed text-[#6B7280]">{label}</span>
                                        </label>
                                ))}
                            </div>

                            {/* Error — mobile */}
                            {error && (
                                <div className="lg:hidden bg-red-50 border border-red-100 text-red-600 p-4 rounded-[16px] flex items-start gap-2.5">
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold">{error}</p>
                                </div>
                            )}

                            {!error && (previewLoading || previewError) && (
                                <div className={`lg:hidden border p-4 rounded-[16px] flex items-start gap-2.5 ${
                                    previewError
                                        ? 'bg-red-50 border-red-100 text-red-600'
                                        : 'bg-white border-gray-100 text-gray-500'
                                }`}>
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold">
                                        {previewError || 'Calculating checkout total…'}
                                    </p>
                                </div>
                            )}

                            {/* Submit — mobile */}
                            <button
                                type="submit"
                                disabled={loading || !canCheckout}
                                className="lg:hidden w-full py-4 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-[18px] font-semibold text-[13px] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Processing…' : previewLoading ? 'Calculating…' : <><span>Continue to Payment</span> <ArrowRight size={14} /></>}
                            </button>
                        </div>

                        {/* ── RIGHT: sticky price summary (desktop only) ── */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-24 space-y-4">

                                {/* Price Summary */}
                                <div className="bg-[#171B22] rounded-[24px] p-6 text-white overflow-hidden relative shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                                    <h3 className="text-xs font-semibold text-white/45 mb-5">Price Summary</h3>
                                    <div className="space-y-3 relative">
                                        {previewLoading && (
                                            <div className="rounded-[14px] bg-white/10 px-3 py-2 text-[13px] font-semibold text-white/70">
                                                Calculating checkout total…
                                            </div>
                                        )}
                                        {previewError && (
                                            <div className="rounded-[14px] bg-red-500/15 px-3 py-2 text-[13px] font-bold text-red-100">
                                                {previewError}
                                            </div>
                                        )}
                                        {selectedTrip && formData.fromCity && (
                                            <>
                                                <div className="text-[13px] font-semibold text-white/40 mb-4">
                                                    {formData.fromCity} → {formData.toCity}
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/60 font-medium">Traveler delivery rate</span>
                                            <span className="text-sm font-semibold">
                                                {checkoutPreview ? `${previewCurrency} ${travelerCost.toFixed(2)}` : '--'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/60 font-medium">Bago service and payment fees</span>
                                            <span className="text-sm font-semibold">
                                                {checkoutPreview ? `${previewCurrency} ${bagoFee.toFixed(2)}` : '--'}
                                            </span>
                                        </div>
                                        {formData.insuranceProtection && insuranceCost > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-white/60 font-medium">Protection</span>
                                                <span className="text-sm font-semibold">{previewCurrency} {insuranceCost.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                                            <span className="text-xs font-semibold text-white/40 ">Total</span>
                                            <span className="text-2xl font-extrabold">
                                                {checkoutPreview ? `${previewCurrency} ${totalCost}` : '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms — desktop */}
                                <div className="bg-white rounded-[20px] p-5 border border-[#ECEBF3] shadow-sm space-y-2.5">
                                    <p className="text-xs font-semibold text-[#6B7280] mb-1">Agreement</p>
                                    {['My shipment does not contain any prohibited or restricted items.',
                                      'I agree that the traveller may inspect my package contents before collection.',
                                      "I agree to follow Bago's guidelines and take responsibility.",
                                    ].map((label, i) => (
                                        <label key={i} className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={termsAccepted[i]}
                                                aria-invalid={i === 1 && Boolean(fieldErrors.inspection)}
                                                onChange={event => setTermsAccepted(previous => previous.map((value, index) => index === i ? event.target.checked : value))}
                                                className="mt-0.5 h-5 w-5 shrink-0 accent-[#5845D8]" />
                                            <span className="text-xs font-medium leading-relaxed text-[#6B7280]">{label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Error — desktop */}
                                {error && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-[16px] flex items-start gap-2.5">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <p className="text-xs font-bold">{error}</p>
                                    </div>
                                )}

                                {/* Submit — desktop */}
                                <button
                                    type="submit"
                                    disabled={loading || !canCheckout}
                                    className="w-full py-4 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-[18px] font-semibold text-[13px] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Processing…' : previewLoading ? 'Calculating…' : <><span>Continue to Payment</span> <ArrowRight size={14} /></>}
                                </button>

                                <p className="text-center text-xs font-bold text-[#6B7280] ">
                                    By continuing you agree to{' '}
                                    <Link to="/terms" className="text-[#5845D8] underline hover:opacity-70">Bago's terms</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile terms link */}
                    <p className="lg:hidden text-center text-xs font-bold text-[#6B7280] mt-4">
                        By continuing you agree to{' '}
                        <Link to="/terms" className="text-[#5845D8] underline hover:opacity-70">Bago's terms</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
