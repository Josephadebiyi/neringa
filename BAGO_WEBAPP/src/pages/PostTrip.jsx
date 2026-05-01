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
    Shield,
    Loader2,
    FileText,
    Upload,
    Ticket
} from 'lucide-react';
import api from '../api';
import { locations } from '../utils/countries';
import Select from 'react-select';

const Navbar = ({ step }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const steps = [t('routeDetailsTitle'), t('reviewTitle'), t('doneTitle')];
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8]">
                <ChevronLeft size={20} />
                <span className="font-bold text-xs">{t('back')}</span>
            </button>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-7 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-1 font-black text-[8px] uppercase tracking-[0.2em] opacity-60">
                {steps.map((_s, i) => (
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

const LocationSelect = ({ value, onChange, placeholder, label, icon: Icon, t }) => {
    const locationOptions = locations.map(loc => ({
        value: loc.city,
        label: (
            <div className="flex items-center gap-2">
                <span>{loc.flag}</span>
                <span>{loc.label}</span>
            </div>
        ),
        city: loc.city,
        country: loc.country,
        flag: loc.flag
    }));

    const customStyles = {
        control: (b) => ({ 
            ...b, 
            border: 'none', 
            boxShadow: 'none', 
            background: 'transparent', 
            minHeight: 'auto',
            padding: 0
        }),
        valueContainer: (b) => ({ ...b, padding: '0 4px' }),
        input: (b) => ({ ...b, margin: 0, padding: 0 }),
        placeholder: (b) => ({ ...b, color: '#9CA3AF', fontSize: '13px', fontWeight: '500' }),
        singleValue: (b) => ({ ...b, color: '#012126', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase' }),
        indicatorsContainer: (b) => ({ ...b, display: 'none' }),
        menu: (b) => ({ ...b, zIndex: 9999 }),
        menuPortal: (b) => ({ ...b, zIndex: 9999 }),
    };

    const selectedOption = locationOptions.find(o => o.city === value) || (value ? {
        value: value,
        label: value,
        city: value
    } : null);

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-[0.15em] ml-1">{label}</label>
            <div className="flex items-center px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 focus-within:border-[#5845D8]/30 focus-within:bg-white transition-all">
                <Icon size={18} className="text-gray-400 mr-3 shrink-0" />
                <div className="flex-1">
                    <Select
                        options={locationOptions}
                        value={selectedOption}
                        onChange={(opt) => onChange(opt)}
                        placeholder={placeholder || t('pickCityPlaceHolder') || 'Select Location'}
                        styles={customStyles}
                        isClearable
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                    />
                </div>
            </div>
        </div>
    );
};

export default function PostTrip() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [kycStatus, setKycStatus] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified === true);

    const [formData, setFormData] = useState({
        originCountry: '',
        originCity: '',
        destinationCountry: '',
        destinationCity: '',
        departureDate: '',
        transportMode: 'airplane',
        availableWeight: '',
        pricePerKg: '',
        landmark: '',
        additionalNotes: '',
        travelDocument: null,
        termsAccepted: false
    });
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [documentPreview, setDocumentPreview] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('pending_trip_post');
        if (saved) {
            try { setFormData(JSON.parse(saved)); } catch (e) { }
        }

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
            setPhoneVerified(res.data?.phoneVerified === true || user?.phoneVerified === true);
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

    const handleDocumentUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Document size must be less than 5MB');
                return;
            }
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a valid document (JPG, PNG, or PDF)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, travelDocument: reader.result }));
                setDocumentPreview(file.name);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormNext = (e) => {
        e.preventDefault();
        setError('');

        if (authLoading) return;

        if (!isAuthenticated) {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/signup');
            return;
        }
        if (kycStatus !== 'approved') {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/verify');
            return;
        }
        if (!phoneVerified) {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/dashboard?tab=settings', {
                state: { message: 'Please verify your phone number before posting a trip.' }
            });
            return;
        }

        if (!formData.termsAccepted) {
            setError('You must agree to the Terms and Conditions.');
            return;
        }

        if (!formData.originCountry || !formData.destinationCountry || !formData.originCity || !formData.destinationCity) {
            setError('Please complete the route details.');
            return;
        }
        if (!formData.departureDate) {
            setError('Please select a departure date.');
            return;
        }
        if (formData.originCountry === formData.destinationCountry && formData.originCity === formData.destinationCity) {
            setError(t('sameCityError') || 'Origin and destination cannot be the same city.');
            return;
        }
        if (!formData.availableWeight || parseFloat(formData.availableWeight) <= 0 || parseFloat(formData.availableWeight) > 50) {
            setError(t('weightRangeError') || 'Available weight must be between 1 and 50 kg.');
            return;
        }
        if (!formData.pricePerKg || parseFloat(formData.pricePerKg) <= 0) {
            setError('Please enter a price per kg.');
            return;
        }
        if (!formData.landmark || !formData.landmark.trim()) {
            setError('Please enter a landmark address.');
            return;
        }
        if (!formData.travelDocument) {
            setError('Please upload your travel document (flight/bus ticket).');
            return;
        }
        if (!user?.preferredCurrency && !selectedCurrency) {
            setShowCurrencyModal(true);
            return;
        }
        setStep(2);
        window.scrollTo(0, 0);
    };

    const handlePostTrip = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/api/bago/AddAtrip', {
                fromLocation: `${formData.originCity}, ${formData.originCountry}`,
                fromCountry: formData.originCountry,
                toLocation: `${formData.destinationCity}, ${formData.destinationCountry}`,
                toCountry: formData.destinationCountry,
                departureDate: formData.departureDate,
                availableKg: parseFloat(formData.availableWeight),
                travelMeans: formData.transportMode,
                pricePerKg: parseFloat(formData.pricePerKg),
                currency: user?.preferredCurrency || selectedCurrency || 'USD',
                landmark: formData.landmark,
                notes: formData.additionalNotes,
                travelDocument: formData.travelDocument
            });
            if (res.status === 201 || res.data?.trip || res.data?.message?.toLowerCase().includes('created')) {
                localStorage.removeItem('pending_trip_post');
                setStep(3);
                window.scrollTo(0, 0);
            } else {
                setError(res.data?.message || 'Failed to post trip.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCurrency = async () => {
        if (!selectedCurrency) return;
        setLoading(true);
        try {
            await api.put('/api/bago/edit', { preferredCurrency: selectedCurrency });
            setShowCurrencyModal(false);
            setStep(2);
        } catch (err) {
            setError('Failed to save currency preference.');
        } finally {
            setLoading(false);
        }
    };

    const CurrencyModal = () => (
        <div className="fixed inset-0 bg-[#012126]/40 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-100">
                <div className="w-16 h-16 bg-[#5845D8]/10 text-[#5845D8] rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Wallet size={32} />
                </div>
                <h3 className="text-2xl font-black text-[#012126] text-center mb-3 uppercase tracking-tight">{t('setWalletCurrency') || 'Set Wallet Currency'}</h3>
                <p className="text-gray-400 font-bold text-xs text-center mb-8 uppercase tracking-[2px] leading-relaxed">
                    {t('setCurrencyDesc') || 'Please select your preferred currency for earnings and trip pricing.'}
                </p>
                <div className="space-y-3 mb-10">
                    {['USD', 'NGN', 'ZAR', 'KES', 'GHS', 'EUR', 'GBP'].map(curr => (
                        <button
                            key={curr}
                            onClick={() => setSelectedCurrency(curr)}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[3px] transition-all flex items-center justify-between px-6 border-2 ${selectedCurrency === curr ? 'bg-[#5845D8] border-[#5845D8] text-white shadow-xl shadow-[#5845D8]/20' : 'bg-gray-50 border-gray-50 text-gray-400 hover:bg-white hover:border-[#5845D8]/20 hover:text-[#5845D8]'}`}
                        >
                            {curr}
                            {selectedCurrency === curr && <CheckCircle size={14} />}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleSaveCurrency}
                    disabled={!selectedCurrency || loading}
                    className="w-full py-4 bg-[#012126] text-white rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-xl hover:bg-[#0a262c] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <>{t('confirmSelection') || 'Confirm Selection'} <ChevronRight size={14} /></>}
                </button>
            </div>
        </div>
    );

    if (step === 3) {
        return (
            <div className="min-h-screen bg-[#F8F6F3]">
                <Navbar step={step} />
                <div className="max-w-md mx-auto px-6 py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-[#012126] mb-4 tracking-tight uppercase">{t('tripPostedSuccess')}</h1>
                    <p className="text-gray-500 font-bold text-xs mb-10 leading-relaxed uppercase tracking-widest">{t('tripPostedDesc')}</p>
                    <Link to="/dashboard" className="inline-flex items-center gap-2 px-10 py-4 bg-[#5845D8] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-xl hover:shadow-[#5845D8]/20 transition-all hover:scale-[1.02] active:scale-95">
                        {t('goDashboard')} <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar step={step} />

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-10 font-sans">
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <div className="mb-10">
                                <h1 className="text-4xl font-black text-[#012126] mb-3 tracking-tight">{t('postTripTitle')}</h1>
                                <div className="h-1 w-20 bg-[#5845D8] rounded-full"></div>
                            </div>

                            <form onSubmit={handleFormNext} className="space-y-8">
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <MapPin size={20} />
                                        </div>
                                        <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('routeDetails')}</h2>
                                    </div>                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <LocationSelect 
                                            label={t('leavingFromLabel') || 'Origin City'}
                                            placeholder={t('pickCityPlaceHolder') || 'Leaving From'}
                                            value={formData.originCity}
                                            icon={MapPin}
                                            t={t}
                                            onChange={(opt) => setFormData(prev => ({ 
                                                ...prev, 
                                                originCity: opt?.city || '', 
                                                originCountry: opt?.country || '' 
                                            }))}
                                        />

                                        <LocationSelect 
                                            label={t('goingToLabel') || 'Destination City'}
                                            placeholder={t('pickCityPlaceHolder') || 'Going To'}
                                            value={formData.destinationCity}
                                            icon={MapPin}
                                            t={t}
                                            onChange={(opt) => setFormData(prev => ({ 
                                                ...prev, 
                                                destinationCity: opt?.city || '', 
                                                destinationCountry: opt?.country || '' 
                                            }))}
                                        />
                                    </div>

                                                    <div className="mb-8">
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('departureLabel')}</label>
                                        <input
                                            type="date"
                                            name="departureDate"
                                            value={formData.departureDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-sm font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                            <Package size={20} />
                                        </div>
                                        <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('transportAndWeight')}</h2>
                                    </div>

                                    <div className="mb-8">
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-4 tracking-[0.15em] ml-1">{t('transportMode')}</label>
                                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                            {[
                                                { id: 'airplane', icon: Plane, label: t('airplane') },
                                                { id: 'car', icon: Car, label: t('car') },
                                                { id: 'bus', icon: Bus, label: t('bus') },
                                                { id: 'train', icon: Train, label: t('train') },
                                                { id: 'ship', icon: Ship, label: t('ship') }
                                            ].map(mode => (
                                                <button
                                                    key={mode.id}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, transportMode: mode.id }))}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group ${formData.transportMode === mode.id ? 'bg-[#5845D8] border-[#5845D8] text-white shadow-lg' : 'border-gray-100 hover:border-gray-200 text-gray-400'}`}
                                                >
                                                    <mode.icon size={20} className={formData.transportMode === mode.id ? 'text-white' : 'group-hover:text-[#5845D8]'} />
                                                    <span className="text-[8px] font-black uppercase tracking-wider">{mode.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('availableWeightLabel')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="availableWeight"
                                                    value={formData.availableWeight}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 15"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-sm font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">KG</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('pricePerKg')} ({user?.preferredCurrency || selectedCurrency || 'USD'}) <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="pricePerKg"
                                                    value={formData.pricePerKg}
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-sm font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">{user?.preferredCurrency || selectedCurrency || 'USD'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('pickupLandmark') || 'Pick up Landmark'} <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            value={formData.landmark}
                                            onChange={handleChange}
                                            placeholder="e.g. Near Central Station, or Hilton Lobby..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-sm font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                            <FileText size={20} />
                                        </div>
                                        <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('additionalNotesLabel')}</h2>
                                    </div>
                                    <textarea
                                        name="additionalNotes"
                                        value={formData.additionalNotes}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-xs font-bold bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm resize-none"
                                        placeholder={t('additionalNotesPlaceholder')}
                                    ></textarea>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Ticket size={20} />
                                        </div>
                                        <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">Travel Document <span className="text-red-500">*</span></h2>
                                    </div>
                                    <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl text-center group hover:border-[#5845D8]/30 transition-all cursor-pointer relative">
                                        <input
                                            type="file"
                                            onChange={handleDocumentUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*,application/pdf"
                                        />
                                        <Upload className={`mx-auto mb-4 ${documentPreview ? 'text-green-500' : 'text-gray-300 group-hover:text-[#5845D8]'}`} size={32} />
                                        <p className="text-[10px] font-black text-[#012126] uppercase tracking-wider mb-2">
                                            {documentPreview || 'Click to upload flight or bus ticket'}
                                        </p>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                                            JPG, PNG or PDF (Max 5MB)
                                        </p>
                                    </div>
                                    <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3">
                                        <Shield size={16} className="text-amber-600 flex-shrink-0" />
                                        <p className="text-[8px] text-amber-700 font-bold uppercase tracking-wide leading-relaxed">
                                            Your trip will be verified by our team. Proof of travel is mandatory to ensure reliability.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in duration-300">
                                        <AlertCircle size={18} />
                                        <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="termsAccepted"
                                                checked={formData.termsAccepted}
                                                onChange={handleChange}
                                                className="hidden"
                                            />
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.termsAccepted ? 'bg-[#5845D8] border-[#5845D8] shadow-lg shadow-[#5845D8]/20' : 'border-gray-100 bg-gray-50 group-hover:border-[#5845D8]/20'}`}>
                                                {formData.termsAccepted && <CheckCircle size={14} className="text-white" />}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-[#012126] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                            {t('agreeToTermsPrefix') || 'I agree to the'} <Link to="/terms" className="text-[#5845D8] underline">{t('termsAndConditions') || 'Terms & Conditions'}</Link>
                                        </span>
                                    </label>

                                    <button
                                        type="submit"
                                        className="w-full md:w-auto inline-flex items-center gap-2 px-10 py-4 bg-[#5845D8] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-xl hover:shadow-[#5845D8]/20 transition-all hover:scale-[1.02] active:scale-95 group"
                                    >
                                        {t('reviewTrip')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="space-y-6 sticky top-28">
                                <div className="bg-[#012126] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mb-16"></div>
                                    <Shield className="text-[#5845D8] mb-6" size={32} />
                                    <h3 className="text-base font-black mb-4 uppercase tracking-wider leading-tight">{t('postTripHeading')}</h3>
                                    <p className="text-white/60 font-bold text-[10px] mb-8 leading-relaxed uppercase tracking-widest">
                                        {t('postTripSub')}
                                    </p>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/80">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[#5845D8]">✓</div>
                                            {t('verifiedTransactions')}
                                        </li>
                                        <li className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/80">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[#5845D8]">✓</div>
                                            {t('escrowPayment')}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-black text-[#012126] mb-3 tracking-tight uppercase">{t('reviewYourTrip')}</h1>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">{t('confirmDetails')}</p>
                        </div>

                        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-10">
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#5845D8]">
                                        {formData.transportMode === 'airplane' && <Plane size={20} />}
                                        {formData.transportMode === 'car' && <Car size={20} />}
                                        {formData.transportMode === 'bus' && <Bus size={20} />}
                                        {formData.transportMode === 'train' && <Train size={20} />}
                                        {formData.transportMode === 'ship' && <Ship size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('transportMode')}</p>
                                        <p className="text-xs font-black uppercase">{formData.transportMode}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('availableWeight')}</p>
                                    <p className="text-lg font-black text-[#5845D8]">{formData.availableWeight} KG</p>
                                </div>
                            </div>

                            <div className="p-10 space-y-12">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
                                    <div className="text-center md:text-left flex-1">
                                        <p className="text-xs font-black text-[#5845D8] uppercase tracking-[3px] mb-3">{t('origin')}</p>
                                        <h3 className="text-xl font-black text-[#012126] uppercase mb-1">{formData.originCity || 'Any City'}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{formData.originCountry}</p>
                                        <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-[10px] font-black text-gray-400">
                                            <Calendar size={14} className="text-[#5845D8]/50" />
                                            {t('departure')}: {formData.departureDate}
                                        </div>
                                    </div>

                                    <div className="hidden md:flex flex-col items-center gap-2 group">
                                        <div className="w-12 h-12 rounded-full bg-[#F8F6F3] flex items-center justify-center text-gray-300 group-hover:text-[#5845D8] transition-colors">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right flex-1">
                                        <p className="text-xs font-black text-[#5845D8] uppercase tracking-[3px] mb-3">{t('destination')}</p>
                                        <h3 className="text-xl font-black text-[#012126] uppercase mb-1">{formData.destinationCity || 'Any City'}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{formData.destinationCountry}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                                    <div className="text-center md:text-left">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t('pricePerKg')}</p>
                                        <p className="text-xl font-black text-[#012126]">{formData.pricePerKg} {user?.preferredCurrency || selectedCurrency || 'USD'}</p>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t('landmark')}</p>
                                        <p className="text-xs font-bold text-[#012126] uppercase">{formData.landmark}</p>
                                    </div>
                                </div>

                                {formData.additionalNotes && (
                                    <div className="bg-[#F8F6F3] p-6 rounded-3xl border border-gray-100">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t('tripNotes')}</p>
                                        <p className="text-xs font-bold text-[#012126] leading-relaxed italic">"{formData.additionalNotes}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-8 animate-in shake duration-500">
                                <AlertCircle size={18} />
                                <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-[2px] text-[#012126] hover:bg-gray-50 transition-all"
                            >
                                {t('editDetails')}
                            </button>
                            <button
                                onClick={handlePostTrip}
                                disabled={loading}
                                className="flex-[2] py-4 bg-[#5845D8] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-xl hover:shadow-[#5845D8]/20 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <><Shield size={16} /> {t('confirmPost')}</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showCurrencyModal && <CurrencyModal />}
        </div>
    );
}
