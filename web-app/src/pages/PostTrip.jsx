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
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8]">
                <ChevronLeft size={20} />
                <span className="font-bold text-xs">{t('back')}</span>
            </button>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-7 w-auto" />
            </Link>
            {/* Step indicators */}
            <div className="hidden md:flex items-center gap-1 font-black text-[8px] uppercase tracking-[0.2em] opacity-60">
                {steps.map((s, i) => (
                    <React.Fragment key={i}>
                        <span className={`px-2 py-0.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'bg-[#5845D8] text-white shadow-xl shadow-[#5845D8]/20' : i + 1 < step ? 'text-green-600' : 'text-gray-300'}`}>
                            {i + 1 < step ? '✓' : i + 1}
                        </span>
                        {i < steps.length - 1 && <span className="text-gray-100 mx-1">/</span>}
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
                <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{label}</label>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all appearance-none text-[#012126] focus:bg-white focus:shadow-sm"
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
            <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={`Enter city in ${countryLabel}...`}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
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
                        <div className="mb-6 font-sans">
                            <h1 className="text-xl font-black text-[#012126] mb-1 uppercase tracking-tight">{t('postTripTitle')}</h1>
                            <p className="text-[#6B7280] font-black text-[9px] uppercase tracking-widest opacity-60">{t('postTripSubtitle')}</p>
                        </div>

                        <form onSubmit={handleFormNext} className="space-y-6 font-sans">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            {/* ── Route ── */}
                            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-[10px] font-black text-[#012126] mb-5 flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                                    <MapPin size={14} className="text-[#5845D8]" />
                                    {t('route')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Origin */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('fromCountry')}</label>
                                            <select
                                                name="originCountry"
                                                value={formData.originCountry}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all appearance-none text-[#012126] focus:bg-white focus:shadow-sm"
                                                required
                                            >
                                                <option value="">{t('selectCountry')}</option>
                                                {COUNTRY_OPTIONS.map(c => (
                                                    <option key={c.label} value={c.label}>{c.flag} {c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <CityField
                                            countryLabel={formData.originCountry}
                                            value={formData.originCity}
                                            onChange={handleChange}
                                            name="originCity"
                                            label={t('fromCity')}
                                        />
                                    </div>

                                    {/* Destination */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('toCountry')}</label>
                                            <select
                                                name="destinationCountry"
                                                value={formData.destinationCountry}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all appearance-none text-[#012126] focus:bg-white focus:shadow-sm"
                                                required
                                            >
                                                <option value="">{t('selectCountry')}</option>
                                                {COUNTRY_OPTIONS.map(c => (
                                                    <option key={c.label} value={c.label}>{c.flag} {c.label}</option>
                                                ))}
                                            </select>
                                        </div>
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
                                    <div className="mt-6 bg-[#5845D8]/5 rounded-xl p-3 flex items-center gap-3 text-[9px] font-black text-[#012126] uppercase tracking-widest border border-[#5845D8]/10 animate-in fade-in duration-500">
                                        <span className="opacity-70">{originFlag} {fromDisplay || '…'}</span>
                                        <ArrowRight size={12} className="text-[#5845D8] flex-shrink-0 animate-pulse" />
                                        <span className="opacity-70">{destFlag} {toDisplay || '…'}</span>
                                    </div>
                                )}
                            </div>

                            {/* ── Dates ── */}
                            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-[10px] font-black text-[#012126] mb-5 flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                                    <Calendar size={14} className="text-[#5845D8]" />
                                    {t('travelDates')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('departureDate')}</label>
                                        <input
                                            type="date" name="departureDate" value={formData.departureDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black bg-gray-50/50 hover:bg-white transition-all flex-row-reverse text-[#012126]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('arrivalDate')}</label>
                                        <input
                                            type="date" name="arrivalDate" value={formData.arrivalDate}
                                            onChange={handleChange}
                                            min={formData.departureDate || new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black bg-gray-50/50 hover:bg-white transition-all flex-row-reverse text-[#012126]"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Transport ── */}
                            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-[10px] font-black text-[#012126] mb-5 uppercase tracking-[0.2em] opacity-80">{t('transportMode')}</h3>
                                <div className="grid grid-cols-5 gap-3">
                                    {transportModes.map(({ value, icon: Icon, label }) => (
                                        <button
                                            key={value} type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, transportMode: value }))}
                                            className={`p-3 rounded-2xl border-2 transition-all group ${formData.transportMode === value ? 'border-[#5845D8] bg-[#5845D8]/5 shadow-lg shadow-[#5845D8]/10 scale-105' : 'border-gray-50/50 hover:border-gray-200'}`}
                                        >
                                            <Icon size={18} className={`mx-auto mb-1 transition-colors ${formData.transportMode === value ? 'text-[#5845D8]' : 'text-gray-300 group-hover:text-gray-400'}`} />
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${formData.transportMode === value ? 'text-[#5845D8]' : 'text-gray-400 opacity-60'}`}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Capacity & Pricing ── */}
                            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-[10px] font-black text-[#012126] mb-5 flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                                    <Package size={14} className="text-[#5845D8]" />
                                    {t('capacity')} & Pricing
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('availableWeight')}</label>
                                        <div className="relative group">
                                            <input
                                                type="number" name="availableWeight" value={formData.availableWeight}
                                                onChange={handleChange} min="1" max="50" step="0.5"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black bg-gray-50/50 hover:bg-white transition-all text-[#012126] pr-10"
                                                placeholder="e.g. 10" required
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">KG</span>
                                        </div>
                                        <p className="text-[7px] text-gray-400 font-black mt-2 ml-1 uppercase tracking-widest opacity-60">{t('maxWeight')}</p>
                                    </div>
                                </div>

                                <div className="mt-6 bg-[#5845D8]/5 border border-[#5845D8]/10 rounded-2xl p-4 flex gap-3 text-left">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#5845D8] shadow-sm flex-shrink-0">
                                        <Wallet size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#5845D8] text-[9px] uppercase tracking-widest mb-1.5 opacity-90">{t('earningsWallet')}</h4>
                                        <p className="text-[9px] text-[#012126] leading-loose font-bold uppercase tracking-wide opacity-60 m-0">{t('earningsDesc')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Notes ── */}
                            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 ml-1 opacity-80">
                                    {t('additionalNotes')} <span className="opacity-40 italic lowercase">(optional)</span>
                                </label>
                                <textarea
                                    name="additionalNotes" value={formData.additionalNotes} onChange={handleChange}
                                    rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none resize-none text-[11px] font-black bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white placeholder:text-gray-300 placeholder:text-[9px] placeholder:uppercase placeholder:tracking-widest"
                                    placeholder={t('notesPlaceholder')}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#4838B5] hover:scale-[1.01] transition-all shadow-xl shadow-[#5845D8]/20 flex items-center justify-center gap-2 active:scale-95"
                            >
                                Review Trip <ChevronRight size={14} />
                            </button>
                            <p className="text-[7px] text-gray-400 text-center pb-4 font-black uppercase tracking-widest leading-relaxed opacity-60 px-6">
                                By posting a trip, you agree to our <Link to="/terms" className="underline hover:text-[#5845D8]">terms of service</Link> and platform safety guidelines.
                            </p>
                        </form>
                    </>
                )}

                {/* ══════════════ STEP 2 — REVIEW ══════════════ */}
                {step === 2 && (
                    <div className="font-sans">
                        <div className="mb-8">
                            <h1 className="text-xl font-black text-[#012126] mb-1 uppercase tracking-tight">Review Your Trip</h1>
                            <p className="text-[#6B7280] font-black text-[9px] uppercase tracking-widest opacity-60">Confirm all details before publishing</p>
                        </div>

                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
                            {/* Route banner */}
                            <div className="bg-gradient-to-br from-[#012126] to-[#5845D8] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="text-center">
                                        <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.2em] mb-2">From</p>
                                        <p className="text-xl font-black mb-1">{originFlag}</p>
                                        <p className="font-black text-[11px] uppercase tracking-tight">{formData.originCity || formData.originCountry}</p>
                                        {formData.originCity && <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{formData.originCountry}</p>}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center px-4">
                                        <div className="flex items-center gap-3 w-full max-w-[120px]">
                                            <div className="h-[2px] flex-1 bg-gradient-to-r from-white/0 to-white/40 rounded-full"></div>
                                            <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
                                                {formData.transportMode === 'airplane' && <Plane size={14} className="animate-pulse" />}
                                                {formData.transportMode === 'bus' && <Bus size={14} className="animate-pulse" />}
                                                {formData.transportMode === 'car' && <Car size={14} className="animate-pulse" />}
                                                {formData.transportMode === 'train' && <Train size={14} className="animate-pulse" />}
                                                {formData.transportMode === 'ship' && <Ship size={14} className="animate-pulse" />}
                                            </div>
                                            <div className="h-[2px] flex-1 bg-gradient-to-l from-white/0 to-white/40 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.2em] mb-2">To</p>
                                        <p className="text-xl font-black mb-1">{destFlag}</p>
                                        <p className="font-black text-[11px] uppercase tracking-tight">{formData.destinationCity || formData.destinationCountry}</p>
                                        {formData.destinationCity && <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{formData.destinationCountry}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="p-6 grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Departure', value: formData.departureDate },
                                    { label: 'Arrival', value: formData.arrivalDate },
                                    { label: 'Available Weight', value: `${formData.availableWeight} KG` },
                                    { label: 'Transport', value: formData.transportMode.toUpperCase() },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 ml-0.5">{label}</p>
                                        <p className="font-black text-[#012126] text-[11px] uppercase tracking-tight">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {formData.additionalNotes && (
                                <div className="px-6 pb-6 mt-2">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 ml-0.5">Additional Notes</p>
                                    <p className="text-[10px] text-[#012126] font-bold leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 opacity-80">{formData.additionalNotes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-[#012126] hover:bg-gray-50 transition-all active:scale-95">
                                ← Edit
                            </button>
                            <button onClick={handleReviewNext} className="flex-2 flex-grow-[2] bg-[#5845D8] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#4838B5] transition-all shadow-xl shadow-[#5845D8]/20 flex items-center justify-center gap-2 active:scale-95">
                                Continue to Payouts <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════ STEP 3 — PAYMENT SETUP ══════════════ */}
                {step === 3 && (
                    <div className="font-sans">
                        <div className="mb-8 text-center sm:text-left">
                            <h1 className="text-xl font-black text-[#012126] mb-1 uppercase tracking-tight">Payout Setup</h1>
                            <p className="text-[#6B7280] font-black text-[9px] uppercase tracking-widest opacity-60">How you'll receive earnings from senders</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6 border border-red-100">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        {/* Payout info card */}
                        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm mb-6 space-y-5 transition-all hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#5845D8]/5 flex items-center justify-center text-[#5845D8]">
                                    <Shield size={16} />
                                </div>
                                <h3 className="font-black text-[11px] text-[#012126] uppercase tracking-[0.1em]">
                                    Secure Escrow System
                                </h3>
                            </div>
                            <p className="text-[10px] text-[#012126] leading-relaxed font-bold opacity-60 uppercase tracking-wide">
                                Payments are held securely by Bago's escrow. Funds are only released after delivery is confirmed — protecting both you and the sender.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="bg-[#5845D8]/5 border border-[#5845D8]/10 rounded-[20px] p-5">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-7 h-7 rounded-full bg-[#5845D8] text-white flex items-center justify-center shadow-md shadow-[#5845D8]/20">
                                            <CreditCard size={12} />
                                        </div>
                                        <span className="font-black text-[10px] text-[#012126] uppercase tracking-widest">Stripe Payout</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-relaxed opacity-70">Direct bank transfers via Stripe Connect. Global coverage.</p>
                                </div>
                                <div className="bg-green-50/50 border border-green-100 rounded-[20px] p-5">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md shadow-green-500/20">
                                            <DollarSign size={12} />
                                        </div>
                                        <span className="font-black text-[10px] text-[#012126] uppercase tracking-widest">Bago Wallet</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-relaxed opacity-70">Instant digital credit. Withdraw to any account anytime.</p>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                <div className="text-amber-500 font-black text-sm relative top-0.5">💡</div>
                                <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest leading-loose opacity-80">
                                    Manage payout methods in <strong>Dashboard → Settings</strong>. You can update details before or after posting.
                                </p>
                            </div>
                        </div>

                        {/* Trip summary recap */}
                        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm mb-8">
                            <h3 className="text-[10px] font-black text-[#012126] mb-5 uppercase tracking-[0.2em] opacity-80">Trip Summary</h3>
                            <div className="flex items-center gap-3 text-[10px] font-black text-[#012126] bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 uppercase tracking-widest">
                                <span>{originFlag} {fromDisplay}</span>
                                <ArrowRight size={12} className="text-[#5845D8] flex-shrink-0" />
                                <span>{destFlag} {toDisplay}</span>
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-4">
                                <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/30">
                                    <p className="text-gray-400 text-[7px] font-black uppercase tracking-widest mb-1.5 opacity-60 text-center">Departure</p>
                                    <p className="font-black text-[#012126] text-[9px] text-center">{formData.departureDate}</p>
                                </div>
                                <div className="col-span-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100/30">
                                    <p className="text-gray-400 text-[7px] font-black uppercase tracking-widest mb-1.5 opacity-60 text-center">Available Capacity</p>
                                    <p className="font-black text-[#012126] text-[9px] text-center">{formData.availableWeight} KG</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-[#012126] hover:bg-gray-50 transition-all active:scale-95">
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-2 flex-grow-[2] bg-[#5845D8] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#4838B5] transition-all shadow-xl shadow-[#5845D8]/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                            >
                                {loading ? (
                                    <><Loader2 size={14} className="animate-spin" /> Publishing…</>
                                ) : (
                                    <><CheckCircle size={14} /> Publish Trip</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════ STEP 4 — SUCCESS ══════════════ */}
                {step === 4 && (
                    <div className="text-center py-12 font-sans">
                        {/* Animated success ring */}
                        <div className="relative w-28 h-28 mx-auto mb-10">
                            <div className="absolute inset-0 bg-green-100 rounded-[32px] animate-ping opacity-20 duration-[3000ms]"></div>
                            <div className="relative w-28 h-28 bg-green-50 rounded-[40px] border border-green-100 flex items-center justify-center shadow-xl shadow-green-500/5">
                                <CheckCircle size={48} className="text-green-500 drop-shadow-sm" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-[#012126] mb-3 uppercase tracking-tight">Trip Published! 🎉</h2>
                        <p className="text-[#6B7280] text-[11px] font-black uppercase tracking-widest opacity-60 mb-2 leading-relaxed">
                            Your trip is now live & visible.
                        </p>
                        <p className="text-[#012126] text-[10px] font-bold uppercase tracking-wide opacity-50 mb-10 max-w-sm mx-auto leading-relaxed">
                            Package senders on this route can now discover and book your available luggage space.
                        </p>

                        {/* Route recap */}
                        <div className="inline-flex items-center gap-4 bg-white border border-gray-100 rounded-[20px] px-8 py-5 mb-12 text-[10px] font-black text-[#012126] shadow-xl shadow-gray-200/40 uppercase tracking-[0.1em]">
                            <span className="flex items-center gap-2">{originFlag} {fromDisplay}</span>
                            <div className="w-10 h-[2px] bg-gradient-to-r from-gray-100 via-[#5845D8]/30 to-gray-100 rounded-full"></div>
                            <span className="flex items-center gap-2">{destFlag} {toDisplay}</span>
                        </div>

                        {/* What's next */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm text-left mb-10">
                            <h3 className="text-[10px] font-black text-[#012126] mb-8 text-center uppercase tracking-[0.3em] opacity-40">Next Phases</h3>
                            <div className="space-y-6">
                                {[
                                    { icon: '📩', title: 'Booking Requests', desc: 'Senders on your route will send requests directly.' },
                                    { icon: '💬', title: 'Collaboration', desc: 'Use secure chat to discuss package contents.' },
                                    { icon: '📦', title: 'Transit', desc: 'Collect the package & complete the secure delivery.' },
                                    { icon: '💰', title: 'Monetization', desc: 'Earnings released instantly upon confirmation.' },
                                ].map(({ icon, title, desc }) => (
                                    <div key={title} className="flex gap-5 group items-center">
                                        <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{icon}</span>
                                        <div>
                                            <p className="font-black text-[#012126] text-[10px] uppercase tracking-widest mb-1">{title}</p>
                                            <p className="text-[9px] text-[#6B7280] font-bold uppercase tracking-tight opacity-50 group-hover:opacity-80 transition-opacity">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/dashboard"
                                className="flex-1 py-4 rounded-2xl bg-[#5845D8] text-white font-black text-[10px] text-center uppercase tracking-[0.2em] shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all active:scale-95"
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
                                className="flex-1 py-4 rounded-2xl border-2 border-[#5845D8]/20 text-[#5845D8] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#5845D8]/5 transition-all active:scale-95"
                            >
                                Post Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
