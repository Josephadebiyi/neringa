import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    MapPin,
    Calendar,
    Package,
    Plane,
    Bus,
    Car,
    Train,
    Ship,
    ChevronLeft,
    AlertCircle,
    CheckCircle,
    Wallet,
    ArrowRight,
    ChevronRight,
    DollarSign,
    CreditCard,
    Shield,
    Loader2
} from 'lucide-react';
import api from '../api';
import { locations, countries } from '../utils/countries';

const COUNTRY_OPTIONS = countries; // already sorted via export

// Cities for a given country (by label)
const getCitiesForCountry = (countryLabel) =>
    locations.filter(loc => loc.country === countryLabel);

const Navbar = ({ step }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const steps = ['Route & Details', 'Review', 'Payment', 'Done'];
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#054752] hover:text-[#5845D8]">
                <ChevronLeft size={24} />
                <span className="font-semibold">{t('back')}</span>
            </button>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>
            {/* Step indicators */}
            <div className="hidden md:flex items-center gap-1 text-xs font-bold">
                {steps.map((s, i) => (
                    <React.Fragment key={i}>
                        <span className={`px-2 py-1 rounded-full ${i + 1 === step ? 'bg-[#5845D8] text-white' : i + 1 < step ? 'text-green-600' : 'text-gray-400'}`}>
                            {i + 1 < step ? '✓' : i + 1}
                        </span>
                        {i < steps.length - 1 && <span className="text-gray-300">—</span>}
                    </React.Fragment>
                ))}
            </div>
        </nav>
    );
};

// City field: dropdown if we have cities, text input if we don't
const CityField = ({ countryLabel, value, onChange, name, label }) => {
    const cities = getCitiesForCountry(countryLabel);
    if (!countryLabel) return null;

    if (cities.length > 0) {
        return (
            <div>
                <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{label}</label>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                >
                    <option value="">Any city in {countryLabel}</option>
                    {cities.map(loc => (
                        <option key={loc.city} value={loc.city}>{loc.city}</option>
                    ))}
                </select>
            </div>
        );
    }

    // Fallback: free text input for countries without pre-seeded cities
    return (
        <div>
            <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={`Enter city in ${countryLabel}...`}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
            />
        </div>
    );
};

export default function PostTrip() {
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=form, 2=review, 3=payment, 4=success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [kycStatus, setKycStatus] = useState('');

    const [formData, setFormData] = useState({
        originCountry: '',
        originCity: '',
        destinationCountry: '',
        destinationCity: '',
        departureDate: '',
        arrivalDate: '',
        transportMode: 'airplane',
        availableWeight: '',
        additionalNotes: ''
    });

    const getCountryFlag = (countryLabel) => {
        const found = COUNTRY_OPTIONS.find(c => c.label === countryLabel);
        return found?.flag || '';
    };

    useEffect(() => {
        const saved = localStorage.getItem('pending_trip_post');
        if (saved) {
            try { setFormData(JSON.parse(saved)); } catch (e) { }
        }

        // Auto-detect origin country
        const detectLocation = async () => {
            try {
                const resp = await fetch('https://ipapi.co/json/');
                const data = await resp.json();
                if (data.country_name) {
                    setFormData(prev => ({ ...prev, originCountry: data.country_name }));
                }
            } catch { }
        };
        detectLocation();

        if (isAuthenticated) checkKycStatus();
    }, [isAuthenticated]);

    const checkKycStatus = async () => {
        try {
            const res = await api.get('/api/bago/kyc/status');
            setKycStatus(res.data?.kycStatus || 'not_started');
        } catch {
            setKycStatus('not_started');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'originCountry') updated.originCity = '';
            if (name === 'destinationCountry') updated.destinationCity = '';
            return updated;
        });
    };

    // ── Step 1 → Step 2 ──
    const handleFormNext = (e) => {
        e.preventDefault();
        setError('');

        if (!isAuthenticated) {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/signup');
            return;
        }
        if (kycStatus !== 'approved') {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/dashboard', { state: { message: t('kycRequired') } });
            return;
        }
        if (!formData.originCountry || !formData.destinationCountry) {
            setError('Please select both origin and destination countries.');
            return;
        }
        if (
            formData.originCountry === formData.destinationCountry &&
            formData.originCity && formData.destinationCity &&
            formData.originCity === formData.destinationCity
        ) {
            setError('Origin and destination city cannot be the same.');
            return;
        }
        if (!formData.availableWeight || parseFloat(formData.availableWeight) <= 0 || parseFloat(formData.availableWeight) > 50) {
            setError('Available weight must be between 1 and 50 kg.');
            return;
        }
        setStep(2);
        window.scrollTo(0, 0);
    };

    // ── Step 2 → Step 3 ──
    const handleReviewNext = () => {
        setStep(3);
        window.scrollTo(0, 0);
    };

    // ── Step 3 → Submit & Step 4 ──
    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            const backendData = {
                fromLocation: formData.originCity
                    ? `${formData.originCity}, ${formData.originCountry}`
                    : formData.originCountry,
                toLocation: formData.destinationCity
                    ? `${formData.destinationCity}, ${formData.destinationCountry}`
                    : formData.destinationCountry,
                departureDate: formData.departureDate,
                arrivalDate: formData.arrivalDate,
                availableKg: formData.availableWeight,
                travelMeans: formData.transportMode,
                notes: formData.additionalNotes
            };

            const response = await api.post('/api/bago/AddAtrip', backendData);
            if (response.status === 201) {
                localStorage.removeItem('pending_trip_post');
                setStep(4);
                window.scrollTo(0, 0);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const transportModes = [
        { value: 'airplane', icon: Plane, label: 'Air' },
        { value: 'bus', icon: Bus, label: 'Bus' },
        { value: 'car', icon: Car, label: 'Car' },
        { value: 'train', icon: Train, label: 'Train' },
        { value: 'ship', icon: Ship, label: 'Ship' }
    ];

    const originFlag = getCountryFlag(formData.originCountry);
    const destFlag = getCountryFlag(formData.destinationCountry);
    const fromDisplay = formData.originCity
        ? `${formData.originCity}, ${formData.originCountry}`
        : formData.originCountry;
    const toDisplay = formData.destinationCity
        ? `${formData.destinationCity}, ${formData.destinationCountry}`
        : formData.destinationCountry;

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar step={step} />

            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* ══════════════ STEP 1 — FORM ══════════════ */}
                {step === 1 && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-black text-[#054752] mb-2">{t('postTripTitle')}</h1>
                            <p className="text-[#708c91] font-medium">{t('postTripSubtitle')}</p>
                        </div>

                        <form onSubmit={handleFormNext} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            {/* ── Route ── */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-[#054752] mb-5 flex items-center gap-2">
                                    <MapPin size={20} className="text-[#5845D8]" />
                                    {t('route')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Origin */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{t('fromCountry')}</label>
                                            <select
                                                name="originCountry"
                                                value={formData.originCountry}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                                                required
                                            >
                                                <option value="">{t('selectCountry')}</option>
                                                {COUNTRY_OPTIONS.map(c => (
                                                    <option key={c.label} value={c.label}>{c.flag} {c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* City always shows once country selected */}
                                        <CityField
                                            countryLabel={formData.originCountry}
                                            value={formData.originCity}
                                            onChange={handleChange}
                                            name="originCity"
                                            label={t('fromCity')}
                                        />
                                    </div>

                                    {/* Destination */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{t('toCountry')}</label>
                                            <select
                                                name="destinationCountry"
                                                value={formData.destinationCountry}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                                                required
                                            >
                                                <option value="">{t('selectCountry')}</option>
                                                {COUNTRY_OPTIONS.map(c => (
                                                    <option key={c.label} value={c.label}>{c.flag} {c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* City always shows once country selected */}
                                        <CityField
                                            countryLabel={formData.destinationCountry}
                                            value={formData.destinationCity}
                                            onChange={handleChange}
                                            name="destinationCity"
                                            label={t('toCity')}
                                        />
                                    </div>
                                </div>

                                {/* Live route preview */}
                                {(formData.originCountry || formData.destinationCountry) && (
                                    <div className="mt-5 bg-[#5845D8]/5 rounded-xl p-3 flex items-center gap-3 text-sm font-semibold text-[#054752]">
                                        <span>{originFlag} {fromDisplay || '…'}</span>
                                        <ArrowRight size={16} className="text-[#5845D8] flex-shrink-0" />
                                        <span>{destFlag} {toDisplay || '…'}</span>
                                    </div>
                                )}
                            </div>

                            {/* ── Dates ── */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-[#054752] mb-5 flex items-center gap-2">
                                    <Calendar size={20} className="text-[#5845D8]" />
                                    {t('travelDates')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{t('departureDate')}</label>
                                        <input
                                            type="date" name="departureDate" value={formData.departureDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{t('arrivalDate')}</label>
                                        <input
                                            type="date" name="arrivalDate" value={formData.arrivalDate}
                                            onChange={handleChange}
                                            min={formData.departureDate || new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Transport ── */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-[#054752] mb-5">{t('transportMode')}</h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {transportModes.map(({ value, icon: Icon, label }) => (
                                        <button
                                            key={value} type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, transportMode: value }))}
                                            className={`p-4 rounded-xl border-2 transition-all ${formData.transportMode === value ? 'border-[#5845D8] bg-[#5845D8]/5' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <Icon size={24} className={`mx-auto mb-1.5 ${formData.transportMode === value ? 'text-[#5845D8]' : 'text-gray-400'}`} />
                                            <span className={`text-xs font-bold ${formData.transportMode === value ? 'text-[#5845D8]' : 'text-gray-500'}`}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Capacity & Pricing ── */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-[#054752] mb-5 flex items-center gap-2">
                                    <Package size={20} className="text-[#5845D8]" />
                                    {t('capacity')} & Pricing
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">{t('availableWeight')}</label>
                                        <input
                                            type="number" name="availableWeight" value={formData.availableWeight}
                                            onChange={handleChange} min="1" max="50" step="0.5"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                            placeholder="e.g. 10" required
                                        />
                                        <p className="text-xs text-gray-400 mt-1">{t('maxWeight')}</p>
                                    </div>
                                </div>

                                <div className="mt-4 bg-[#5845D8]/5 border border-[#5845D8]/20 rounded-xl p-4">
                                    <h4 className="font-bold text-[#5845D8] flex items-center gap-2 text-sm mb-1">
                                        <Wallet size={16} /> {t('earningsWallet')}
                                    </h4>
                                    <p className="text-xs text-[#054752] leading-relaxed">{t('earningsDesc')}</p>
                                </div>
                            </div>

                            {/* ── Notes ── */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <label className="block text-sm font-bold text-[#054752] mb-2">
                                    {t('additionalNotes')} <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    name="additionalNotes" value={formData.additionalNotes} onChange={handleChange}
                                    rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none resize-none text-sm"
                                    placeholder={t('notesPlaceholder')}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold text-base hover:bg-[#4838B5] transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                Review Trip <ChevronRight size={20} />
                            </button>
                            <p className="text-xs text-gray-400 text-center pb-4">
                                By posting a trip, you agree to our <Link to="/terms" className="underline">terms of service</Link>.
                            </p>
                        </form>
                    </>
                )}

                {/* ══════════════ STEP 2 — REVIEW ══════════════ */}
                {step === 2 && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-[#054752] mb-2">Review Your Trip</h1>
                            <p className="text-[#708c91] font-medium">Confirm all details before publishing</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                            {/* Route banner */}
                            <div className="bg-gradient-to-r from-[#054752] to-[#5845D8] p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="text-center">
                                        <p className="text-white/60 text-xs uppercase tracking-wide mb-1">From</p>
                                        <p className="text-2xl font-black">{originFlag}</p>
                                        <p className="font-bold">{formData.originCity || formData.originCountry}</p>
                                        {formData.originCity && <p className="text-white/60 text-xs">{formData.originCountry}</p>}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px w-8 bg-white/30"></div>
                                            {formData.transportMode === 'airplane' && <Plane size={20} />}
                                            {formData.transportMode === 'bus' && <Bus size={20} />}
                                            {formData.transportMode === 'car' && <Car size={20} />}
                                            {formData.transportMode === 'train' && <Train size={20} />}
                                            {formData.transportMode === 'ship' && <Ship size={20} />}
                                            <div className="h-px w-8 bg-white/30"></div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white/60 text-xs uppercase tracking-wide mb-1">To</p>
                                        <p className="text-2xl font-black">{destFlag}</p>
                                        <p className="font-bold">{formData.destinationCity || formData.destinationCountry}</p>
                                        {formData.destinationCity && <p className="text-white/60 text-xs">{formData.destinationCountry}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="p-6 grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Departure', value: formData.departureDate },
                                    { label: 'Arrival', value: formData.arrivalDate },
                                    { label: 'Available Weight', value: `${formData.availableWeight} kg` },
                                    { label: 'Transport', value: formData.transportMode.charAt(0).toUpperCase() + formData.transportMode.slice(1) },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                                        <p className="font-bold text-[#054752]">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {formData.additionalNotes && (
                                <div className="px-6 pb-6">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                                    <p className="text-sm text-[#708c91]">{formData.additionalNotes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 font-bold text-[#054752] hover:border-[#5845D8] transition-colors">
                                ← Edit
                            </button>
                            <button onClick={handleReviewNext} className="flex-2 flex-grow-[2] bg-[#5845D8] text-white py-4 rounded-xl font-bold hover:bg-[#4838B5] transition-colors flex items-center justify-center gap-2">
                                Continue to Payment Setup <ChevronRight size={20} />
                            </button>
                        </div>
                    </>
                )}

                {/* ══════════════ STEP 3 — PAYMENT SETUP ══════════════ */}
                {step === 3 && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-[#054752] mb-2">Payment & Payout Setup</h1>
                            <p className="text-[#708c91] font-medium">How you'll receive earnings from senders</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 text-sm mb-6">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        {/* Payout info card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6 space-y-4">
                            <h3 className="font-bold text-[#054752] flex items-center gap-2">
                                <Shield size={18} className="text-[#5845D8]" /> Secure Escrow Payments
                            </h3>
                            <p className="text-sm text-[#708c91] leading-relaxed">
                                When a sender books your space, their payment is held securely by Bago's escrow system.
                                You only receive the funds after successful delivery is confirmed — protecting both you and the sender.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="bg-[#5845D8]/5 border border-[#5845D8]/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CreditCard size={16} className="text-[#5845D8]" />
                                        <span className="font-bold text-sm text-[#054752]">Stripe Payout</span>
                                    </div>
                                    <p className="text-xs text-[#708c91]">Funds sent directly to your bank via Stripe Connect. Available globally.</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign size={16} className="text-green-600" />
                                        <span className="font-bold text-sm text-[#054752]">Bago Wallet</span>
                                    </div>
                                    <p className="text-xs text-[#708c91]">Earnings credited to your Bago Wallet instantly. Withdraw any time from your dashboard.</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                                <strong>💡 Note:</strong> Your payout method is managed in your Dashboard → Settings.
                                You can set up or update your Stripe Connect account there before or after posting this trip.
                            </div>
                        </div>

                        {/* Trip summary recap */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                            <h3 className="font-bold text-[#054752] mb-4">Trip Summary</h3>
                            <div className="flex items-center gap-3 text-sm font-semibold text-[#054752] bg-gray-50 rounded-xl p-3">
                                <span>{originFlag} {fromDisplay}</span>
                                <ArrowRight size={14} className="text-[#5845D8] flex-shrink-0" />
                                <span>{destFlag} {toDisplay}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                                <div>
                                    <p className="text-gray-400 text-xs">Departure</p>
                                    <p className="font-bold text-[#054752]">{formData.departureDate}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-xs">Weight</p>
                                    <p className="font-bold text-[#054752]">{formData.availableWeight} kg</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 font-bold text-[#054752] hover:border-[#5845D8] transition-colors">
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-2 flex-grow-[2] bg-[#5845D8] text-white py-4 rounded-xl font-bold hover:bg-[#4838B5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 size={20} className="animate-spin" /> Publishing…</>
                                ) : (
                                    <><CheckCircle size={20} /> Publish Trip</>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* ══════════════ STEP 4 — SUCCESS ══════════════ */}
                {step === 4 && (
                    <div className="text-center py-8">
                        {/* Animated success ring */}
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30"></div>
                            <div className="relative w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={60} className="text-green-500" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-[#054752] mb-3">Trip Published! 🎉</h2>
                        <p className="text-[#708c91] text-lg font-medium mb-2">
                            Your trip is now live.
                        </p>
                        <p className="text-[#708c91] mb-8">
                            Package senders on this route can now discover and book your available luggage space.
                        </p>

                        {/* Route recap */}
                        <div className="inline-flex items-center gap-3 bg-[#5845D8]/5 border border-[#5845D8]/20 rounded-2xl px-6 py-4 mb-8 text-sm font-bold text-[#054752]">
                            <span>{originFlag} {fromDisplay}</span>
                            <ArrowRight size={16} className="text-[#5845D8]" />
                            <span>{destFlag} {toDisplay}</span>
                        </div>

                        {/* What's next */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left mb-8">
                            <h3 className="font-bold text-[#054752] mb-4 text-center">What happens next?</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: '📩', title: 'Receive booking requests', desc: 'Senders on your route will send package requests directly to you.' },
                                    { icon: '💬', title: 'Chat & confirm details', desc: 'Use Bago chat to discuss package contents and arrange pickup.' },
                                    { icon: '📦', title: 'Pick up & deliver', desc: 'Collect the package, verify contents, and complete delivery.' },
                                    { icon: '💰', title: 'Get paid', desc: 'Funds are released to your Bago Wallet once delivery is confirmed.' },
                                ].map(({ icon, title, desc }) => (
                                    <div key={title} className="flex gap-4">
                                        <span className="text-2xl">{icon}</span>
                                        <div>
                                            <p className="font-bold text-[#054752] text-sm">{title}</p>
                                            <p className="text-xs text-[#708c91]">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/dashboard"
                                className="flex-1 py-4 rounded-xl bg-[#5845D8] text-white font-bold text-center hover:bg-[#4838B5] transition-colors"
                            >
                                Go to Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    setFormData({
                                        originCountry: '', originCity: '', destinationCountry: '', destinationCity: '',
                                        departureDate: '', arrivalDate: '', transportMode: 'airplane',
                                        availableWeight: '', additionalNotes: ''
                                    });
                                    setStep(1);
                                }}
                                className="flex-1 py-4 rounded-xl border-2 border-[#5845D8] text-[#5845D8] font-bold hover:bg-[#5845D8]/5 transition-colors"
                            >
                                Post Another Trip
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
