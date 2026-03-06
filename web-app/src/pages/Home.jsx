import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    MapPin,
    Calendar,
    Users,
    Package,
    Plane,
    CheckCircle,
    ChevronDown,
    Globe,
    PlusCircle,
    UserCircle,
    ArrowRight,
    Bus as BusIcon,
    Car,
    ShieldCheck,
    Check,
    Smartphone,
    Menu,
    X,
    AlertCircle,
    Calculator,
    CreditCard,
    Headphones
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import api from '../api';
import RecentTrips from '../components/RecentTrips';
import Select from 'react-select';
import { locations } from '../utils/countries';

const Navbar = () => {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData, currency, setCurrency } = useLanguage();
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'ZAR', 'KES', 'GHS'];

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0 shadow-sm">
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Baggo" className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-10 items-center">
                <button onClick={() => navigate('/about')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    Who we are
                </button>
                <button onClick={() => navigate('/how-it-works')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    How it works
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* Language Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Globe size={18} className="text-[#054752]" />
                        <span className="text-[22px]">{currentLangData?.flag}</span>
                        <span className="text-sm font-medium text-[#054752]">{currentLangData?.code.toUpperCase()}</span>
                        <ChevronDown size={16} className={`text-[#054752] transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showLangDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setShowLangDropdown(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${currentLanguage === lang.code ? 'bg-purple-50' : ''
                                        }`}
                                >
                                    <span className="text-[24px]">{lang.flag}</span>
                                    <span className="text-sm font-medium text-[#054752]">{lang.name}</span>
                                    {currentLanguage === lang.code && (
                                        <Check size={16} className="ml-auto text-[#5845D8]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Currency Selector */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowCurrencyDropdown(!showCurrencyDropdown);
                            setShowLangDropdown(false);
                        }}
                        className="hidden md:flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-sm font-medium text-[#054752]">{currency}</span>
                        <ChevronDown size={14} className={`text-[#054752] transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showCurrencyDropdown && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto">
                            {currencies.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setCurrency(c);
                                        setShowCurrencyDropdown(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${currency === c ? 'bg-purple-50 font-bold text-[#5845D8]' : 'font-medium text-[#054752]'
                                        }`}
                                >
                                    <span>{c}</span>
                                    {currency === c && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => navigate('/search')} className="hidden md:flex items-center cursor-pointer group">
                    <Search size={22} className="text-[#054752] group-hover:text-[#5845D8] transition-colors" />
                </button>

                <Link to="/post-trip" className="hidden md:flex items-center gap-2 cursor-pointer text-[#5845D8] hover:text-[#4838B5] transition-colors">
                    <PlusCircle size={22} />
                    <span className="font-semibold text-[15px]">{t('offerRide')}</span>
                </Link>

                <div className="hidden md:flex items-center gap-5">
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <Smartphone size={20} className="text-[#054752] group-hover:text-[#5845D8] transition-colors" />
                        <span className="text-[#054752] text-sm font-semibold group-hover:text-[#5845D8] transition-colors">{t('getApp')}</span>
                    </div>
                    <Link to="/signup" className="flex items-center">
                        <UserCircle size={32} className="text-[#d9d9d9] hover:text-[#054752] transition-colors" />
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setShowMobileMenu(true)}
                    className="md:hidden flex items-center p-2 rounded-xl bg-gray-50 text-[#054752] hover:text-[#5845D8] transition-all"
                >
                    <Menu size={26} />
                </button>
            </div>

            {/* Mobile Side Menu */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileMenu(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                        />

                        {/* Side Sheet */}
                        <motion.div
                            initial={{ x: '100.5%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100.5%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white z-[101] shadow-2xl flex flex-col md:hidden overflow-y-auto"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white z-10">
                                <Link to="/" onClick={() => setShowMobileMenu(false)}>
                                    <img src="/bago_logo.png" alt="Bago" className="h-8" />
                                </Link>
                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="p-2 rounded-full bg-gray-100 text-[#054752] hover:bg-gray-200 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 px-6 py-8 space-y-8">
                                {/* Navigation Links */}
                                <div className="space-y-4 text-center">
                                    <button
                                        onClick={() => { navigate('/search'); setShowMobileMenu(false); }}
                                        className="w-full py-4 text-xl font-black text-[#054752] flex items-center gap-4 hover:text-[#5845D8] transition-colors"
                                    >
                                        <Search size={24} />
                                        <span>Find a Route</span>
                                    </button>
                                    <button
                                        onClick={() => { navigate('/post-trip'); setShowMobileMenu(false); }}
                                        className="w-full py-4 text-xl font-black text-[#5845D8] flex items-center gap-4 hover:text-[#4838B5] transition-colors"
                                    >
                                        <PlusCircle size={24} />
                                        <span>Offer Ride</span>
                                    </button>
                                    <Link
                                        to="/about"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block py-4 text-xl font-black text-[#054752] flex items-center gap-4 border-t border-gray-100 pt-8"
                                    >
                                        <AlertCircle size={24} />
                                        Who we are
                                    </Link>
                                    <Link
                                        to="/how-it-works"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block py-4 text-xl font-black text-[#054752] flex items-center gap-4"
                                    >
                                        <CheckCircle size={24} />
                                        How it works
                                    </Link>
                                </div>

                                {/* Language/Currency Section */}
                                <div className="pt-8 border-t border-gray-100 space-y-8">
                                    <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-6 font-bold">Select Language</h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setLanguage(lang.code);
                                                        setShowMobileMenu(false);
                                                    }}
                                                    className={`flex items-center flex-col gap-2 p-4 rounded-2xl border transition-all ${currentLanguage === lang.code
                                                        ? 'border-[#5845D8] bg-[#5845D8]/5 ring-1 ring-[#5845D8]'
                                                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <span className="text-3xl">{lang.flag}</span>
                                                    <span className="text-xs font-black text-[#054752]">{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-6 font-bold">Preferred Currency</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {currencies.map((c) => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        setCurrency(c);
                                                        setShowMobileMenu(false);
                                                    }}
                                                    className={`px-4 py-3 rounded-xl border text-sm font-black transition-all ${currency === c
                                                        ? 'border-[#5845D8] bg-[#5845D8] text-white'
                                                        : 'border-gray-100 bg-gray-50/50 text-[#054752]'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Auth Actions */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <Link
                                    to="/login"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="w-full block text-center py-4 bg-[#5845D8] text-white rounded-2xl font-black text-lg shadow-lg"
                                >
                                    Log In / Register
                                </Link>
                                <p className="mt-6 text-center text-xs font-medium text-gray-400">
                                    Trusted by 10k+ Travelers worldwide.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav >
    );
};

const HeroSection = () => {
    return (
        <section className="relative w-full max-w-[1240px] mx-auto pt-10 px-6 md:px-12 pb-16">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="w-full md:w-[60%] mb-12 md:mb-0">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-5">
                        <span className="text-gray-500">Real People.</span> <br />
                        <span className="text-[#B0891D]">Real Routes.</span> <br />
                        <span className="text-[#5845D8]">Real Fast.</span>
                    </h1>
                    <p className="text-[#708c91] text-base font-medium mb-8 max-w-md">
                        Connect with reliable delivery partners traveling across the globe. Professional, secure, and affordable package delivery.
                    </p>
                    <div className="flex gap-4">
                        <img src="/app-store.svg" alt="App Store" className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                        <img src="/google-play.svg" alt="Google Play" className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                </div>

                <div className="w-full md:w-[50%] h-[350px] overflow-hidden rounded-2xl shadow-lg">
                    <img
                        src="/hero_new.png"
                        alt="Real Delivery Service"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
            </div>
        </section>
    );
};

const BAGO_COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia",
    "Germany", "France", "Spain", "Italy", "Nigeria",
    "South Africa", "Kenya", "Ghana", "India", "China",
    "Japan", "Brazil", "Mexico", "United Arab Emirates"
].sort();

const StickySearch = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [date, setDate] = useState('');

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

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.city) {
                    const detected = locationOptions.find(opt => opt.city === data.city) || {
                        value: data.city,
                        label: (
                            <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>{data.city}, {data.country_name}</span>
                            </div>
                        ),
                        city: data.city,
                        country: data.country_name
                    };
                    setOrigin(detected);
                }
            } catch (err) {
                console.error("Failed to auto-detect location", err);
            }
        };
        fetchLocation();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();

        const params = new URLSearchParams();
        if (origin) params.append('origin', origin.city);
        if (destination) params.append('destination', destination.city);
        if (date) params.append('date', date);

        navigate(`/search?${params.toString()}`);
    };

    const customStyles = {
        control: (base) => ({
            ...base,
            border: 'none',
            boxShadow: 'none',
            background: 'transparent',
            minHeight: 'auto',
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0 8px',
        }),
        input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
        }),
        placeholder: (base) => ({
            ...base,
            color: '#708c91',
            fontSize: '14px',
            fontWeight: '500',
        }),
        singleValue: (base) => ({
            ...base,
            color: '#054752',
            fontSize: '14px',
            fontWeight: '500',
        }),
        indicatorsContainer: (base) => ({
            ...base,
            display: 'none',
        }),
    };

    return (
        <div className="sticky top-[75px] z-50 w-full px-6 md:px-12 max-w-[1240px] mx-auto">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col relative overflow-hidden -mt-8 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch w-full">
                    <div className="flex w-full md:w-[30%] items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100 group">
                        <MapPin size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <Select
                                options={locationOptions}
                                value={origin}
                                onChange={setOrigin}
                                placeholder="From (City)"
                                styles={customStyles}
                                isClearable
                            />
                        </div>
                    </div>
                    <div className="flex w-full md:w-[30%] items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100 group">
                        <MapPin size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <Select
                                options={locationOptions}
                                value={destination}
                                onChange={setDestination}
                                placeholder="To (City)"
                                styles={customStyles}
                                isClearable
                            />
                        </div>
                    </div>
                    <div className="flex w-full md:w-[25%] items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                        <Calendar size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="outline-none text-sm font-medium w-full bg-transparent text-[#054752] cursor-pointer"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full md:w-[15%] px-8 bg-[#5845D8] text-white py-4 font-bold hover:bg-[#4838B5] transition-all hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Search size={20} className="md:hidden" />
                        <span>{t('search')}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

const PromoBar = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-10">
            <div className="bg-[#5845D8] rounded-3xl p-10 md:p-14 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Earn from your travels.</h2>
                <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
                    Help others send packages while you travel by bus or flight. It's simple: publish your trip, deliver the package, and earn money for your luggage space.
                </p>
                <Link to="/post-trip" className="inline-flex items-center gap-3 bg-white text-[#5845D8] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all">
                    <span>Post my trip</span>
                </Link>
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-20">
                {[
                    {
                        icon: ShieldCheck,
                        title: 'Insurance Online Payments',
                        desc: 'With Bago your money is safe at all times. Bago uses a secure payment system and you have a guaranteed refund.',
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: Package,
                        title: 'Guaranteed delivery',
                        desc: 'If a traveler cancels your order or delivers an item in poor condition, we will process a full refund and try to find a new traveler for you.',
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: CreditCard,
                        title: 'Multiple Payment Options',
                        desc: 'To make your life easier, we accept a variety of payment methods such as Visa, MasterCard and American Express, with more options available soon.',
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: Calculator,
                        title: 'No Hidden Fees',
                        desc: 'For total transparency, Bago uses machine learning to calculate applicable rates and taxes before you post your order. That way you will know exactly how much you are paying.',
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: UserCircle,
                        title: 'Community of Verified Senders and Travelers',
                        desc: 'At Bago, trust is our highest priority, and we work hard to ensure that our community treats all its members with the utmost respect.',
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: Headphones,
                        title: '24/7 support',
                        desc: 'Our team of customer service professionals are at your disposal to resolve any incident that may arise during the order and delivery process.',
                        color: 'bg-[#fef2f2] text-[#ef4444]'
                    }
                ].map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                        <div className={`w-32 h-32 ${feature.color} rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500`}>
                            <feature.icon size={60} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-[#054752] mb-4">{feature.title}</h3>
                        <p className="text-[#708c91] text-sm font-medium leading-relaxed px-4">
                            {feature.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const CommunityCTA = () => {
    const navigate = useNavigate();
    return (
        <section className="w-full relative py-32 overflow-hidden flex items-center justify-center">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80"
                    alt="Global Community"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 text-center px-6">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-12 tracking-tight">Join our global community</h2>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <button
                        onClick={() => navigate('/search')}
                        className="px-12 py-5 bg-[#5845D8] text-white font-bold rounded-lg text-lg hover:bg-[#4838B5] transition-all min-w-[240px]"
                    >
                        Send with Bago
                    </button>
                    <button
                        onClick={() => navigate('/post-trip')}
                        className="px-12 py-5 bg-[#5845D8] text-white font-bold rounded-lg text-lg hover:bg-[#4838B5] transition-all min-w-[240px]"
                    >
                        Travel with Bago
                    </button>
                </div>
            </div>
        </section>
    );
};

const TripTypeSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#054752] text-center mb-12">{t('tripTypeTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => navigate('/search?mode=flight')} className="bg-[#f0f4f5] rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <Plane size={40} className="text-[#5845D8]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-[#054752]">By flight</h3>
                        <p className="text-[#708c91] font-medium text-[15px]">Fly with travelers and send your packages faster.</p>
                    </div>
                    <div className="bg-[#5845D8] rounded-full p-2 hover:bg-[#4838B5] transition-colors">
                        <ArrowRight size={20} className="text-white" />
                    </div>
                </div>
                <div onClick={() => navigate('/search?mode=bus')} className="bg-[#f0f4f5] rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <BusIcon size={40} className="text-[#5845D8]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-[#054752]">By bus</h3>
                        <p className="text-[#708c91] font-medium text-[15px]">Send your packages with bus travelers.</p>
                    </div>
                    <div className="bg-[#5845D8] rounded-full p-2 hover:bg-[#4838B5] transition-colors">
                        <ArrowRight size={20} className="text-white" />
                    </div>
                </div>
            </div>
        </section>
    );
};


const TrackingSection = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16 bg-[#f8f9fa] rounded-3xl my-8">
            <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2 flex justify-center py-6">
                    <img
                        src="/mobile-mockup.png"
                        alt="Bago App Mockup"
                        className="w-full max-w-[320px] h-auto rounded-3xl shadow-2xl"
                    />
                </div>
                <div className="w-full md:w-1/2">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#054752] mb-6 leading-tight tracking-tight">
                        Real-time tracking. <br />
                        Total peace of <br />
                        mind.
                    </h2>
                    <p className="text-[#708c91] text-base font-medium leading-relaxed mb-8 max-w-md">
                        Follow your package every step of the way. From pickup to delivery, you will know exactly where your items are and when they will arrive. Send with total confidence!
                    </p>
                    <Link to="/search" className="inline-block bg-[#5845D8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4838B5] transition-colors">
                        Check live status
                    </Link>
                </div>
            </div>
        </section>
    );
};

const CarSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16">
            <div className="flex flex-col-reverse md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2">
                    <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-8">
                        {t('testimonialTitle')}
                    </h2>
                    <div className="relative">
                        <p className="text-[#054752] text-xl font-medium leading-relaxed mb-8 italic">
                            {t('testimonialQuote')}
                        </p>
                        <p className="text-[#054752] font-bold text-lg">
                            {t('testimonialAuthor')}
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-1/2">
                    <img
                        src="/two_people_car.png"
                        alt="Friends in car"
                        className="rounded-3xl w-full h-auto shadow-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
            </div>
        </section>
    );
};

const DiscountPromo = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-12">
            <div className="bg-gradient-to-r from-[#5845D8] to-[#9B4dca] rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(88,69,216,0.2)] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="z-10 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center md:justify-start gap-3">
                        <Smartphone className="text-white/80" size={32} />
                        Get Your First Delivery Free!
                    </h2>
                    <p className="text-white/90 text-base font-medium max-w-lg leading-relaxed">
                        Sign up today and get your first package delivered to any destination for free, or a 100% bonus on your first payout as a courier.
                    </p>
                </div>

                <div className="z-10 bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md text-center shrink-0 w-full md:w-auto">
                    <p className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Use Promo Code</p>
                    <div className="bg-white text-[#5845D8] px-8 py-4 rounded-xl font-black text-3xl tracking-wider shadow-inner">
                        BAGO10
                    </div>
                    <p className="text-white/80 text-xs mt-3">Valid for new users only.</p>
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-[#f2f2f2] pt-16 pb-6 mt-10">
            <div className="px-6 md:px-12 max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Compare our ride options</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/search?origin=London&destination=Paris" className="hover:text-[#5845D8] transition-colors">London → Paris</Link>
                        <Link to="/search?origin=Paris&destination=London" className="hover:text-[#5845D8] transition-colors">Paris → London</Link>
                        <Link to="/search?origin=Manchester&destination=London" className="hover:text-[#5845D8] transition-colors">Manchester → London</Link>
                        <Link to="/search?origin=London&destination=Brussels" className="hover:text-[#5845D8] transition-colors">London → Brussels</Link>
                        <Link to="/search" className="hover:text-[#5845D8] transition-colors">Popular rides on Baggo</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Travel with carpool</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/search?mode=carpool" className="hover:text-[#5845D8] transition-colors">Popular carpool rides</Link>
                        <Link to="/search?mode=carpool" className="hover:text-[#5845D8] transition-colors">Popular carpool destinations</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Travel with Baggo Bus</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/search?mode=bus" className="hover:text-[#5845D8] transition-colors">Popular Baggo Bus lines</Link>
                        <Link to="/search?mode=bus" className="hover:text-[#5845D8] transition-colors">Popular Baggo Bus destinations</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Find out more</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/about" className="hover:text-[#5845D8] transition-colors">Who we are</Link>
                        <Link to="/how-it-works" className="hover:text-[#5845D8] transition-colors">How does Baggo work?</Link>
                        <Link to="/help" className="hover:text-[#5845D8] transition-colors">Help Centre</Link>
                        <div className="mt-4 flex gap-4">
                            <img src="/app-store.svg" alt="App Store" className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                            <img src="/google-play.svg" alt="Google Play" className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 max-w-[1240px] mx-auto border-t border-gray-300 pt-6 flex flex-col md:flex-row justify-between items-center text-[12px] font-medium text-[#708c91]">
                <div className="flex gap-6 mb-4 md:mb-0">
                    <Link to="/terms" className="hover:text-[#054752] transition-colors">Terms and Conditions</Link>
                    <Link to="/privacy" className="hover:text-[#054752] transition-colors">Privacy Policy</Link>
                </div>
                <div className="flex items-center gap-2">
                    <img src="/bago_logo.png" alt="Baggo" className="h-4 w-auto grayscale brightness-50 opacity-60" />
                    <span>Baggo, 2026 ©</span>
                </div>
            </div>
        </footer>
    );
};

export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans">
            <Navbar />
            <HeroSection />
            <StickySearch />
            <div className="h-4 md:h-0"></div>
            <RecentTrips user={user} />
            <PromoBar />
            <FeaturesSection />
            <TripTypeSection />
            <CommunityCTA />
            <TrackingSection />
            <CarSection />
            <DiscountPromo />
            <Footer />
        </div>
    );
}
