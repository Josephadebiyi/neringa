import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, MapPin, Calendar, Package, Plane, CheckCircle, ChevronDown,
    Globe, PlusCircle, UserCircle, ArrowRight, Bus, ShieldCheck, Check,
    Menu, X, AlertCircle, Calculator, CreditCard, Headphones,
    Plus, Minus, Star
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import api from '../api';
import AsyncCreatableSelect from 'react-select/async-creatable';
import {
    normalizeText as normalizeSearchText,
    locationOptions,
    loadCityOptions,
    formatCityOptionLabel,
    makeCustomLocation as makeCustomSearchLocation,
} from '../utils/citySearch.jsx';
import Footer from '../components/Footer';

const userIsVerified = (user) => {
    const status = String(
        user?.kycStatus ||
        user?.kyc_status ||
        user?.kyc?.status ||
        user?.verificationStatus ||
        ''
    ).toLowerCase();

    return ['approved', 'passed', 'verified', 'completed', 'success'].includes(status) ||
        user?.is_kyc_completed === true ||
        user?.kycApproved === true ||
        user?.hasPassedKyc === true ||
        user?.isVerified === true ||
        user?.kyc === true;
};

const goToPostTripWhenVerified = ({ navigate, isAuthenticated, user, redirect = '/post-trip' }) => {
    if (!isAuthenticated) {
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return false;
    }

    if (!userIsVerified(user)) {
        navigate('/verify', {
            state: {
                message: 'Please verify your identity before posting a trip.',
                from: redirect,
            },
        });
        return false;
    }

    navigate(redirect);
    return true;
};



/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
const Navbar = () => {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData, currency, setCurrency } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'ZAR', 'KES', 'GHS'];
    const handlePostTrip = () => {
        goToPostTripWhenVerified({ navigate, isAuthenticated, user });
        setShowMobileMenu(false);
    };

    return (
        <nav className="w-full bg-white/95 border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0 shadow-sm backdrop-blur-xl">
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex gap-9 items-center">
                <button onClick={() => navigate('/about')} className="text-[#012126] font-semibold hover:text-[#5845D8] transition-colors text-[15px]">
                    Who we are
                </button>
                <button onClick={() => navigate('/how-it-works')} className="text-[#012126] font-semibold hover:text-[#5845D8] transition-colors text-[15px]">
                    How it works
                </button>
                <button onClick={() => navigate('/track')} className="text-[#012126] font-semibold hover:text-[#5845D8] transition-colors text-[15px]">
                    Track
                </button>
            </div>

            <div className="flex items-center gap-5">
                {/* Language */}
                <div className="relative hidden md:block">
                    <button
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Globe size={16} className="text-[#012126]" />
                        <span className="text-[18px]">{currentLangData?.flag}</span>
                        <span className="text-xs font-semibold text-[#012126]">{currentLangData?.code?.toUpperCase()}</span>
                        <ChevronDown size={14} className={`text-[#012126] transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showLangDropdown && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => { setLanguage(lang.code); setShowLangDropdown(false); }}
                                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 ${currentLanguage === lang.code ? 'bg-purple-50' : ''}`}
                                >
                                    <span className="text-[20px]">{lang.flag}</span>
                                    <span className="text-sm font-medium text-[#012126]">{lang.name}</span>
                                    {currentLanguage === lang.code && <Check size={14} className="ml-auto text-[#5845D8]" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                {/* Auth */}
                <div className="flex items-center gap-2 md:gap-3">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="flex items-center gap-2 bg-[#5845D8]/5 border border-[#5845D8]/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-[#5845D8]/10 transition-all group">
                            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-[10px] md:text-xs uppercase">
                                {user?.firstName?.charAt(0) || user?.email?.charAt(0)}
                            </div>
                            <span className="text-xs md:text-sm font-bold text-[#012126]">Dashboard</span>
                        </Link>
                    ) : (
                        <Link to="/login" className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-[#5845D8] text-white rounded-full font-bold text-[11px] md:text-sm hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/20">
                            <UserCircle size={16} className="text-white/80 hidden xs:block" />
                            <span>Login</span>
                        </Link>
                    )}
                </div>

            </div>

            {/* Mobile Side Sheet */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowMobileMenu(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white z-[101] shadow-2xl flex flex-col overflow-y-auto"
                        >
                            <div className="p-5 flex justify-between items-center border-b border-gray-100 sticky top-0 bg-white z-10">
                                <Link to="/" onClick={() => setShowMobileMenu(false)}>
                                    <img src="/bago_logo.png" alt="Bago" className="h-7" />
                                </Link>
                                <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-full bg-gray-100 text-[#012126]">
                                    <X size={22} />
                                </button>
                            </div>
                            <div className="flex-1 px-6 py-8 space-y-6">
                                <div className="space-y-2">
                                    {[
                                        { label: 'Find a Route', path: '/search', icon: <Search size={22} /> },
                                        { label: 'Post a Trip', path: '/post-trip', icon: <PlusCircle size={22} />, purple: true },
                                        { label: 'Who we are', path: '/about', icon: <AlertCircle size={22} /> },
                                        { label: 'How it works', path: '/how-it-works', icon: <CheckCircle size={22} /> },
                                    ].map((item) => (
                                        <button key={item.path}
                                            onClick={() => item.path === '/post-trip' ? handlePostTrip() : (navigate(item.path), setShowMobileMenu(false))}
                                            className={`w-full py-3.5 text-lg font-extrabold flex items-center gap-4 hover:opacity-70 transition-opacity ${item.purple ? 'text-[#5845D8]' : 'text-[#012126]'}`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-gray-400 mb-4">Language</p>
                                    <select value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-[#012126] font-bold text-sm outline-none">
                                        {languages.map((lang) => (
                                            <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-[2px] text-gray-400 mb-4">Currency</p>
                                    <div className="flex flex-wrap gap-2">
                                        {currencies.map((c) => (
                                            <button key={c} onClick={() => { setCurrency(c); setShowMobileMenu(false); }}
                                                className={`px-3 py-2 rounded-xl border text-xs font-extrabold transition-all ${currency === c ? 'border-[#5845D8] bg-[#5845D8] text-white' : 'border-gray-100 bg-gray-50 text-[#012126]'}`}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                                {isAuthenticated ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold uppercase">
                                                {user?.firstName?.charAt(0)}
                                            </div>
                                            <div><p className="font-bold text-[#012126] text-sm">{user?.firstName} {user?.lastName}</p></div>
                                        </div>
                                        <Link to="/dashboard" onClick={() => setShowMobileMenu(false)}
                                            className="w-full block text-center py-3.5 bg-[#5845D8] text-white rounded-2xl font-extrabold shadow-lg">
                                            Go to Dashboard
                                        </Link>
                                    </div>
                                ) : (
                                    <Link to="/login" onClick={() => setShowMobileMenu(false)}
                                        className="w-full block text-center py-3.5 bg-[#5845D8] text-white rounded-2xl font-extrabold shadow-lg">
                                        Log In / Register
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
};

/* ─────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────── */
const HeroSection = () => {
    const navigate = useNavigate();
    const { t, currency: selectedCurrency } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [mode, setMode] = useState('send');
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [date, setDate] = useState('');
    const [geoCurrency, setGeoCurrency] = useState(selectedCurrency || 'USD');

    useEffect(() => {
        let active = true;
        const detectCurrency = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (!active) return;
                const detected = currencyForCountryCode(data?.country_code) || data?.currency;
                if (detected) setGeoCurrency(String(detected).toUpperCase());
                if (data?.city && active) {
                    const country = data.country_name || '';
                    const flag = countryCodeToFlag(data.country_code || '');
                    setOrigin((current) => current || {
                        value: `detected:${data.city}:${country}`,
                        label: `${data.city}, ${country}`,
                        city: data.city,
                        country,
                        flag,
                        type: 'city',
                    });
                }
            } catch {
                if (active && selectedCurrency) setGeoCurrency(selectedCurrency);
            }
        };
        detectCurrency();
        return () => { active = false; };
    }, [selectedCurrency]);

    const displayCurrency = (geoCurrency || selectedCurrency || 'USD').toUpperCase();

    const customStyles = {
        control: (b) => ({ ...b, border: 'none', boxShadow: 'none', background: 'transparent', minHeight: '28px' }),
        valueContainer: (b) => ({ ...b, padding: 0 }),
        input: (b) => ({ ...b, margin: 0, padding: 0 }),
        placeholder: (b) => ({ ...b, color: '#9CA3AF', fontSize: '14px', fontWeight: '700' }),
        singleValue: (b) => ({ ...b, color: '#171B22', fontSize: '14px', fontWeight: '800' }),
        indicatorsContainer: (b) => ({ ...b, display: 'none' }),
        clearIndicator: (b) => ({ ...b, display: 'none' }),
        menu: (b) => ({ ...b, zIndex: 9999 }),
        menuPortal: (b) => ({ ...b, zIndex: 9999 }),
    };

    const submitHeroSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (origin?.city) params.append('origin', origin.city);
        if (origin?.country) params.append('originCountry', origin.country);
        if (destination?.city) params.append('destination', destination.city);
        if (destination?.country) params.append('destinationCountry', destination.country);
        if (date) params.append('date', date);
        if (mode === 'earn') {
            const query = params.toString();
            goToPostTripWhenVerified({
                navigate,
                isAuthenticated,
                user,
                redirect: query ? `/post-trip?${query}` : '/post-trip',
            });
        } else {
            navigate(`/search?${params.toString()}`);
        }
    };

    return (
        <section className="bg-white px-6 py-14 md:px-12 md:py-20">
            <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                    <div className="mb-7 flex items-center gap-3">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} className="fill-[#FFB800] text-[#FFB800]" />)}
                        </div>
                        <span className="text-sm font-extrabold text-gray-500">4.9 Store Rating</span>
                    </div>
                    <h1 className="max-w-3xl text-4xl font-extrabold leading-[0.96] text-[#171B22] sm:text-5xl md:text-6xl lg:text-7xl">
                        Send packages. Earn from trips.
                    </h1>
                    <p className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-gray-500 md:text-lg">
                        Bago lets people ship items through verified travelers already going that way. Senders get protection. Travelers get paid for space they already have.
                    </p>
                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={() => navigate('/search')}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#171B22] px-7 py-4 text-sm font-extrabold text-white shadow-[0_18px_45px_rgba(23,27,34,0.16)] transition hover:bg-[#5845D8]"
                        >
                            <Search size={18} strokeWidth={3} />
                            Send a package
                        </button>
                        <button
                            onClick={() => goToPostTripWhenVerified({ navigate, isAuthenticated, user })}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-4 text-sm font-extrabold text-[#171B22] transition hover:border-[#5845D8] hover:text-[#5845D8]"
                        >
                            <Plane size={18} strokeWidth={3} />
                            Earn as a traveler
                        </button>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <AppStoreBadge />
                        <GooglePlayBadge />
                    </div>
                    <div className="mt-8 flex flex-wrap gap-5">
                        <span className="text-sm font-extrabold text-gray-500">Escrow protected</span>
                        <span className="text-sm font-extrabold text-gray-500">Insurance available</span>
                        <span className="text-sm font-extrabold text-gray-500">Open-box policy</span>
                    </div>
                </div>

                <div className="rounded-[32px] bg-[#F6F7FA] p-2 shadow-[0_28px_90px_rgba(23,27,34,0.08)] ring-1 ring-gray-100">
                    <div className="rounded-[28px] bg-white p-5 md:p-7">
                        <div className="grid grid-cols-2 rounded-full bg-[#EEEFF3] p-1.5 text-center text-sm font-extrabold text-gray-500">
                            {[
                                ['send', 'Send'],
                                ['earn', 'Earn'],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setMode(value)}
                                    className={`rounded-full py-4 transition ${mode === value ? 'bg-white text-[#171B22] shadow-sm' : 'text-gray-500 hover:text-[#171B22]'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <form onSubmit={submitHeroSearch} className="mt-7 space-y-4">
                            <HeroLocationField
                                label="From"
                                value={origin}
                                onChange={setOrigin}
                                placeholder="Departure city or country"
                                styles={customStyles}
                            />
                            <HeroLocationField
                                label="To"
                                value={destination}
                                onChange={setDestination}
                                placeholder="Destination city or country"
                                styles={customStyles}
                            />
                            <label className="block rounded-2xl bg-[#F7F7F8] px-5 py-4">
                                <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-gray-400">Date</span>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-[#5845D8]" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-transparent text-sm font-extrabold text-[#171B22] outline-none"
                                    />
                                </div>
                            </label>
                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-3 rounded-full bg-[#171B22] py-5 text-sm font-extrabold text-white transition hover:bg-[#5845D8]"
                            >
                                {mode === 'earn' ? 'Post your trip' : 'Find a traveler'}
                                <ArrowRight size={18} />
                            </button>
                            <p className="text-center text-xs font-bold text-gray-400">
                                Prices and payouts shown in {displayCurrency} based on your location.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

const HeroLocationField = ({ label, value, onChange, placeholder, styles }) => (
    <div className="rounded-2xl bg-[#F7F7F8] px-5 py-4">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-gray-400">{label}</p>
        <div className="flex items-center gap-3 rounded-full bg-[#ECEEF3] px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                <span className="text-[21px] leading-none">{value?.flag || '🌍'}</span>
            </div>
            <div className="min-w-0 flex-1">
                <AsyncCreatableSelect
                    loadOptions={loadCityOptions}
                    defaultOptions={locationOptions.slice(0, 30)}
                    value={value}
                    onChange={onChange}
                    onCreateOption={(inputValue) => onChange(makeCustomSearchLocation(inputValue))}
                    placeholder={placeholder}
                    styles={styles}
                    formatOptionLabel={formatCityOptionLabel}
                    isClearable
                    formatCreateLabel={(inputValue) => `Search "${inputValue}"`}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                />
            </div>
            <ChevronDown size={17} className="shrink-0 text-[#171B22]" />
        </div>
    </div>
);

const currencyForCountryCode = (code = '') => {
    const map = {
        US: 'USD', GB: 'GBP', NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
        CA: 'CAD', AU: 'AUD', FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR',
        NL: 'EUR', BE: 'EUR', PT: 'EUR', IE: 'EUR',
    };
    return map[String(code).toUpperCase()] || null;
};

const countryCodeToFlag = (code = '') => {
    const normalized = String(code).toUpperCase();
    if (normalized.length !== 2) return '🌍';
    return [...normalized]
        .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
        .join('');
};

const TrustStrip = () => {
    const items = [
        { icon: Plane, title: 'Travelers earn money', desc: 'Get paid for luggage space' },
        { icon: ShieldCheck, title: 'Item protection', desc: 'Cover for loss or damage' },
        { icon: Search, title: 'AI compliance scan', desc: 'Route and item risk checks' },
        { icon: CreditCard, title: 'Escrow protected', desc: 'Funds release after delivery' },
    ];

    return (
        <section className="bg-white px-6 py-6 md:px-12">
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => (
                    <div key={item.title} className="flex items-center gap-4 border-b border-gray-100 py-4 sm:border-b-0 lg:border-r lg:last:border-r-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5845D8]/8 text-[#5845D8]">
                            <item.icon size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-extrabold text-[#012126]">{item.title}</p>
                            <p className="mt-1 text-xs font-bold text-gray-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const SLIDESHOW_IMAGES = [
    '/assets/bago-app-preview.png',
    '/assets/bago-travelers-thailand.jpg',
];

const RotatingImagePanel = ({ images = SLIDESHOW_IMAGES, badge = 'Bago', overlay }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setIndex((current) => (current + 1) % images.length);
        }, 4200);
        return () => window.clearInterval(timer);
    }, [images.length]);

    return (
        <div className="relative min-h-[430px] overflow-hidden rounded-[34px] bg-gray-100">
            {images.map((src, i) => (
                <img
                    key={src}
                    src={src}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
                    onError={(e) => { e.currentTarget.src = '/assets/bago-app-preview.png'; }}
                />
            ))}
            <div className="absolute left-6 top-6 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#171B22] shadow-lg">
                {badge}
            </div>
            <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#171B22] shadow-lg">
                <span className="h-4 w-1.5 rounded-full bg-[#171B22]" />
                <span className="ml-1 h-4 w-1.5 rounded-full bg-[#171B22]" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            {overlay}
            <div className="absolute bottom-6 left-6 flex gap-2">
                {images.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setIndex(i)}
                        className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/55'}`}
                        aria-label={`Show slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

const AppRouteCard = ({ className = '' }) => (
    <div className={`rounded-[22px] bg-white/95 p-4 shadow-2xl backdrop-blur ${className}`}>
        <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5845D8]/8 text-[#5845D8]">
                <Bus size={21} />
            </div>
            <div className="text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Trip #0004 · Pending</p>
                <p className="mt-1 text-base font-extrabold text-[#171B22]">EUR 1/kg</p>
            </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
                <p className="text-2xl font-extrabold text-[#171B22]">LAG</p>
                <p className="text-xs font-bold text-gray-400">Lagos</p>
            </div>
            <div className="flex items-center gap-2 text-[#5845D8]">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-px w-10 border-t border-dashed border-gray-300" />
                <Bus size={20} />
                <span className="h-px w-10 border-t border-dashed border-gray-300" />
                <span className="h-2 w-2 rounded-full border-2 border-gray-300" />
            </div>
            <div className="text-right">
                <p className="text-2xl font-extrabold text-[#171B22]">IBA</p>
                <p className="text-xs font-bold text-gray-400">Ibadan</p>
            </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-gray-200 pt-3">
            <span className="rounded-full bg-[#F5F6F8] px-3 py-2 text-xs font-extrabold text-gray-600">6kg free</span>
            <span className="rounded-full bg-[#F5F6F8] px-3 py-2 text-xs font-extrabold text-gray-600">0kg booked</span>
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   STICKY SEARCH BAR
───────────────────────────────────────────── */
const StickySearch = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [date, setDate] = useState('');

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.city) {
                    const detected = locationOptions.find(o => o.city === data.city) || {
                        value: data.city,
                        label: <div className="flex items-center gap-2"><span>📍</span><span>{data.city}, {data.country_name || ''}</span></div>,
                        city: data.city,
                        country: data.country_name || ''
                    };
                    setOrigin(detected);
                }
            } catch { }
        };
        fetchLocation();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (origin?.city) params.append('origin', origin.city);
        if (origin?.country) params.append('originCountry', origin.country);
        if (destination?.city) params.append('destination', destination.city);
        if (destination?.country) params.append('destinationCountry', destination.country);
        if (date) params.append('date', date);
        navigate(`/search?${params.toString()}`);
    };

    const customStyles = {
        control: (b) => ({ ...b, border: 'none', boxShadow: 'none', background: 'transparent', minHeight: '28px' }),
        valueContainer: (b) => ({ ...b, padding: 0 }),
        input: (b) => ({ ...b, margin: 0, padding: 0 }),
        placeholder: (b) => ({ ...b, color: '#9CA3AF', fontSize: '15px', fontWeight: '500' }),
        singleValue: (b) => ({ ...b, color: '#012126', fontSize: '15px', fontWeight: '700' }),
        indicatorsContainer: (b) => ({ ...b, display: 'none' }),
        menu: (b) => ({ ...b, zIndex: 9999 }),
        menuPortal: (b) => ({ ...b, zIndex: 9999 }),
    };

    return (
        <div className="w-full px-6 md:px-12 max-w-[1100px] mx-auto -mt-1 mb-10 relative z-40">
            <div className="bg-white rounded-[24px] shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-gray-100 overflow-visible">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center">
                    <div className="flex flex-1 items-center px-5 py-4 min-h-[58px] md:min-h-[68px]">
                        <MapPin size={20} className={`${origin ? 'text-[#5845D8]' : 'text-gray-400'} shrink-0`} />
                        <div className="flex-1 min-w-0 ml-4">
                            <AsyncCreatableSelect
                                loadOptions={loadCityOptions}
                                defaultOptions={locationOptions.slice(0, 30)}
                                value={origin}
                                onChange={setOrigin}
                                onCreateOption={(inputValue) => setOrigin(makeCustomSearchLocation(inputValue))}
                                placeholder={t('enterPickupCity') || 'Departure city or country'}
                                styles={customStyles}
                                formatOptionLabel={formatCityOptionLabel}
                                isClearable
                                formatCreateLabel={(inputValue) => `Search "${inputValue}"`}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        {origin && <CheckCircle size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                    </div>

                    <div className="h-px md:h-9 md:w-px bg-gray-100 mx-5 md:mx-0" />

                    <div className="flex flex-1 items-center px-5 py-4 min-h-[58px] md:min-h-[68px]">
                        <MapPin size={20} className={`${destination ? 'text-[#5845D8]' : 'text-gray-400'} shrink-0`} />
                        <div className="flex-1 min-w-0 ml-4">
                            <AsyncCreatableSelect
                                loadOptions={loadCityOptions}
                                defaultOptions={locationOptions.slice(0, 30)}
                                value={destination}
                                onChange={setDestination}
                                onCreateOption={(inputValue) => setDestination(makeCustomSearchLocation(inputValue))}
                                placeholder={t('enterDestination') || 'Destination city or country'}
                                styles={customStyles}
                                formatOptionLabel={formatCityOptionLabel}
                                isClearable
                                formatCreateLabel={(inputValue) => `Search "${inputValue}"`}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </div>
                        {destination && <CheckCircle size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                    </div>

                    <div className="h-px md:h-9 md:w-px bg-gray-100 mx-5 md:mx-0" />

                    <label className="flex flex-1 items-center px-5 py-4 min-h-[58px] md:min-h-[68px] cursor-pointer">
                        <Calendar size={20} className={`${date ? 'text-[#5845D8]' : 'text-gray-400'} shrink-0`} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={`ml-4 flex-1 min-w-0 bg-transparent outline-none text-[15px] font-bold cursor-pointer ${date ? 'text-[#012126]' : 'text-gray-400'}`}
                        />
                        {date && <CheckCircle size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                    </label>

                    <button type="submit"
                        className="h-[52px] md:h-[68px] md:px-9 bg-[#5845D8] text-white font-extrabold rounded-b-[24px] md:rounded-b-none md:rounded-r-[24px] hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                        <Search size={18} strokeWidth={3} />
                        <span>{t('findTravelerButton') || t('search') || 'Find traveler'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   COUNTRY SLIDER
───────────────────────────────────────────── */
const COUNTRIES = [
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ng', name: 'Nigeria' },
    { code: 'us', name: 'United States' },
    { code: 'fr', name: 'France' },
    { code: 'de', name: 'Germany' },
    { code: 'ca', name: 'Canada' },
    { code: 'za', name: 'South Africa' },
    { code: 'gh', name: 'Ghana' },
    { code: 'ke', name: 'Kenya' },
    { code: 'it', name: 'Italy' },
    { code: 'es', name: 'Spain' },
    { code: 'nl', name: 'Netherlands' },
    { code: 'be', name: 'Belgium' },
    { code: 'se', name: 'Sweden' },
    { code: 'ch', name: 'Switzerland' },
    { code: 'ae', name: 'UAE' },
    { code: 'cm', name: 'Cameroon' },
    { code: 'sn', name: 'Senegal' },
    { code: 'ci', name: "Côte d'Ivoire" },
    { code: 'br', name: 'Brazil' },
    { code: 'au', name: 'Australia' },
    { code: 'pt', name: 'Portugal' },
];

const CountrySlider = () => {
    const doubled = [...COUNTRIES, ...COUNTRIES];
    return (
        <section className="py-10 overflow-hidden bg-[#F8F6F3] border-y border-gray-200">
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-7">
                Our Countries
            </p>
            <div className="relative">
                <div
                    className="flex gap-3 animate-marquee"
                    style={{ width: 'max-content' }}
                >
                    {doubled.map((c, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 cursor-default select-none"
                            style={{
                                background: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '999px',
                                padding: '10px 20px 10px 10px',
                                minWidth: 'max-content',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            }}
                        >
                            <img
                                src={`https://flagcdn.com/w40/${c.code}.png`}
                                alt={c.name}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                }}
                                loading="lazy"
                            />
                            <span style={{ color: '#1a1a2e', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {c.name}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-20" style={{ background: 'linear-gradient(to right, #F8F6F3, transparent)' }} />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-20" style={{ background: 'linear-gradient(to left, #F8F6F3, transparent)' }} />
            </div>
            <style>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 35s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
};

const HowItWorksSection = () => {
    const steps = [
        {
            icon: Package,
            title: 'Tell Bago what you need to send',
            desc: 'Choose the route, weight, value, and delivery details before paying anything.',
        },
        {
            icon: UserCircle,
            title: 'Match with a verified traveler',
            desc: 'Compare available trips and request someone already heading toward your destination.',
        },
        {
            icon: CheckCircle,
            title: 'Track until delivery is confirmed',
            desc: 'Payment stays protected while both sides get status updates through the journey.',
        },
    ];

    return (
        <section className="bg-[#F8F6F3] px-6 py-24 md:px-12">
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-12 max-w-2xl">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#5845D8]">How Bago works</span>
                    <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#012126] md:text-5xl">
                        A shipping flow that feels simple from both sides.
                    </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {steps.map((step, index) => (
                        <div key={step.title} className="rounded-[24px] border border-gray-100 bg-white p-7 shadow-[0_18px_50px_rgba(1,33,38,0.05)]">
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#012126] text-white">
                                    <step.icon size={22} />
                                </div>
                                <span className="text-5xl font-extrabold leading-none text-[#012126]/8">0{index + 1}</span>
                            </div>
                            <h3 className="text-xl font-extrabold leading-tight text-[#012126]">{step.title}</h3>
                            <p className="mt-4 text-sm font-medium leading-relaxed text-gray-500">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const EarnMoneySection = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    return (
        <section className="bg-white px-6 py-24 md:px-12">
            <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-2">
                <div>
                    <span className="text-sm font-extrabold text-gray-400">Earn with Bago</span>
                    <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#171B22] md:text-5xl lg:text-6xl">
                        Make money from trips you already planned.
                    </h2>
                    <p className="mt-7 max-w-xl text-lg font-semibold leading-relaxed text-gray-500">
                        Travelers can post their route, choose the package requests they want, and get paid after delivery is confirmed. No extra trip. No confusing payout flow.
                    </p>
                    <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                        {[
                            ['Post route', '2 min'],
                            ['Accept item', 'Your choice'],
                            ['Get paid', 'After delivery'],
                        ].map(([title, desc]) => (
                            <div key={title} className="rounded-2xl bg-[#F5F6F8] p-4">
                                <p className="text-sm font-extrabold text-[#171B22]">{title}</p>
                                <p className="mt-1 text-xs font-bold text-gray-400">{desc}</p>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => goToPostTripWhenVerified({ navigate, isAuthenticated, user })}
                        className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#171B22] px-7 py-4 text-sm font-extrabold text-white transition hover:bg-[#5845D8]"
                    >
                        Post a trip
                        <ArrowRight size={18} />
                    </button>
                </div>
                <RotatingImagePanel
                    badge="Traveler earnings"
                    images={[
                        '/assets/bago-transit-phone.jpg',
                        '/assets/bago-train-travelers.jpg',
                        '/assets/bago-travelers-map.jpg',
                    ]}
                    overlay={
                        <>
                            <AppRouteCard className="absolute bottom-7 left-7 w-[390px] max-w-[calc(100%-56px)] hidden md:block" />
                            <div className="absolute right-6 top-24 rounded-[22px] bg-white/95 px-5 py-4 shadow-2xl backdrop-blur">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Can earn</p>
                                <p className="mt-1 text-3xl font-extrabold text-[#171B22]">£42</p>
                            </div>
                        </>
                    }
                />
            </div>
        </section>
    );
};

const ProtectionPolicySection = () => {
    const policies = [
        {
            icon: ShieldCheck,
            title: 'Insurance and item protection',
            desc: 'Eligible shipments can be protected against loss or damage, with declared value captured before the trip starts.',
        },
        {
            icon: Package,
            title: 'Open-box policy',
            desc: 'Travelers can inspect package contents before pickup so nobody carries unknown, unsafe, or prohibited items.',
        },
        {
            icon: AlertCircle,
            title: 'Clear prohibited item rules',
            desc: 'Restricted and prohibited items are checked before payment, not after a traveler has accepted the request.',
        },
        {
            icon: Search,
            title: 'AI-assisted compliance scan',
            desc: 'Bago checks the item category, weight, origin, and destination, then surfaces medium or high-risk customs notes before checkout.',
        },
    ];

    return (
        <section className="bg-[#F8F6F3] px-6 py-24 md:px-12">
            <div className="mx-auto max-w-[1240px] space-y-24">
                <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                    <RotatingImagePanel
                        badge="Protected shipment"
                        images={[
                            '/assets/bago-delivery-handoff.jpg',
                            '/assets/bago-delivery-doorstep.jpg',
                            '/assets/bago-parcel-carrier.jpg',
                        ]}
                        overlay={
                            <div className="absolute bottom-8 left-6 w-[270px] rounded-[22px] bg-white/95 p-4 shadow-2xl backdrop-blur hidden md:block">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Protection status</p>
                                <div className="mt-3 space-y-2">
                                    {['Declared value saved', 'Open-box check complete', 'Escrow payment protected'].map((item) => (
                                        <div key={item} className="flex items-center gap-3">
                                            <CheckCircle size={16} className="text-[#5845D8]" />
                                            <span className="text-xs font-extrabold text-[#171B22]">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                    />
                    <div>
                        <span className="text-sm font-extrabold text-gray-400">Protection before pickup</span>
                        <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#171B22] md:text-5xl lg:text-6xl">
                            Protected from pickup to delivery.
                        </h2>
                        <p className="mt-7 max-w-xl text-lg font-semibold leading-relaxed text-gray-500">
                            Bago is not just matching people. It protects the transaction with declared item value, inspection rules, escrow, AI-assisted compliance checks, and support if something goes wrong.
                        </p>
                        <div className="mt-8 space-y-3">
                            {policies.map((policy) => (
                                <div key={policy.title} className="flex gap-4 rounded-[22px] bg-white p-5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5845D8]/8 text-[#5845D8]">
                                        <policy.icon size={21} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-[#171B22]">{policy.title}</h3>
                                        <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">{policy.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
                    <div>
                        <span className="text-sm font-extrabold text-gray-400">Payouts after delivery</span>
                        <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#171B22] md:text-5xl">
                            Travelers know where their money is going.
                        </h2>
                        <p className="mt-7 max-w-xl text-lg font-semibold leading-relaxed text-gray-500">
                            Show payout setup clearly before a traveler posts a route. Supported local options, currency conversion, and earning estimates should feel simple and bank-like.
                        </p>
                        <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                            {[
                                ['Choose payout', 'All currencies'],
                                ['Complete trip', 'Sender confirms'],
                                ['Get paid', 'Status visible'],
                            ].map(([title, desc]) => (
                                <div key={title} className="rounded-2xl bg-white p-4">
                                    <p className="text-sm font-extrabold text-[#171B22]">{title}</p>
                                    <p className="mt-1 text-xs font-bold text-gray-400">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <RotatingImagePanel
                        badge="Payout ready"
                        images={[
                            '/assets/bago-courier-portrait.jpg',
                            '/assets/bago-transit-phone.jpg',
                            '/assets/bago-train-travelers.jpg',
                        ]}
                        overlay={
                            <div className="absolute bottom-8 right-6 hidden max-w-[270px] rounded-[22px] bg-white/95 p-4 shadow-2xl backdrop-blur md:block">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Global payouts</p>
                                <p className="mt-2 text-xl font-extrabold leading-tight text-[#171B22]">We pay out in all currencies.</p>
                                <p className="mt-2 text-xs font-bold leading-relaxed text-gray-400">Travelers can see payout status and supported local options in their account.</p>
                            </div>
                        }
                    />
                </div>
            </div>
        </section>
    );
};

const TransparentPricingSection = () => {
    const rows = [
        ['Route', 'London → Lagos'],
        ['Package', '3.5kg electronics'],
        ['Traveler payout', '£38.00'],
        ['Bago protection', '£4.50'],
    ];

    return (
        <section className="bg-white px-6 py-24 md:px-12">
            <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#5845D8]">Transparent pricing</span>
                    <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#012126] md:text-5xl">
                        See the cost before you commit.
                    </h2>
                    <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-gray-500">
                        Bago feels closer to a modern wallet than an old courier quote, with route, weight, protection, payment method, and total visible before the user sends a request.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        {['No hidden fees', 'Escrow release', 'Clear traveler payout'].map((label) => (
                            <span key={label} className="rounded-full border border-[#5845D8]/15 bg-[#5845D8]/8 px-4 py-2 text-xs font-extrabold text-[#5845D8]">
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-[28px] bg-[#012126] p-4 text-white shadow-[0_28px_80px_rgba(1,33,38,0.22)]">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-6">
                        <div className="mb-7 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/45">Sample checkout</p>
                                <h3 className="mt-2 text-2xl font-extrabold">Bago estimate</h3>
                            </div>
                            <Calculator className="text-[#8B7DFF]" size={30} />
                        </div>
                        <div className="space-y-3">
                            {rows.map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3">
                                    <span className="text-sm font-bold text-white/55">{label}</span>
                                    <span className="text-sm font-extrabold text-white">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-[#012126]">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-extrabold">Total today</span>
                                <span className="text-3xl font-extrabold tracking-tight">£42.50</span>
                            </div>
                            <p className="mt-2 text-xs font-bold text-gray-400">Held securely until delivery is confirmed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const TestimonialsSection = () => {
    const reviews = [
        {
            quote: 'I could see the traveler, route, and delivery status clearly. It felt much safer than sending blindly.',
            name: 'Amara',
            meta: 'Sender to Nigeria',
        },
        {
            quote: 'I posted my trip and earned from space I already had in my luggage. The payout flow was simple.',
            name: 'Daniel',
            meta: 'Verified traveler',
        },
        {
            quote: 'The escrow and tracking made the whole delivery feel professional, even though it was peer to peer.',
            name: 'Nadia',
            meta: 'Bago member',
        },
    ];

    return (
        <section className="bg-[#F8F6F3] px-6 py-24 md:px-12">
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="max-w-2xl">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#5845D8]">Community proof</span>
                        <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#012126] md:text-5xl">
                            Built for senders and travelers.
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} className="fill-[#FFB800] text-[#FFB800]" />)}
                        <span className="ml-2 text-sm font-extrabold text-[#012126]">4.9 rated</span>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {reviews.map((review) => (
                        <div key={review.name} className="rounded-[24px] border border-gray-100 bg-white p-7 shadow-[0_18px_50px_rgba(1,33,38,0.05)]">
                            <p className="text-base font-bold leading-relaxed text-[#012126]">“{review.quote}”</p>
                            <div className="mt-8 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5845D8] text-sm font-extrabold text-white">
                                    {review.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-[#012126]">{review.name}</p>
                                    <p className="text-xs font-bold text-gray-400">{review.meta}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   TRUST SECTION
───────────────────────────────────────────── */
const FeaturesSection = () => {
    const { t } = useLanguage();

    const features = [
        { icon: ShieldCheck, title: t('featureTitleInsurance') || 'Protected payments', desc: t('featureDescInsurance') || 'Your money stays secured until the shipment is completed or a refund is approved.' },
        { icon: Package, title: t('featureTitleGuaranteed') || 'Delivery backup', desc: t('featureDescGuaranteed') || 'If a trip falls through, Bago helps resolve the order and find a better route.' },
        { icon: CreditCard, title: t('featureTitleOptions') || 'Flexible checkout', desc: t('featureDescOptions') || 'Pay with major cards and supported regional payment methods as they become available.' },
        { icon: Calculator, title: t('featureTitleNoHidden') || 'Upfront pricing', desc: t('featureDescNoHidden') || 'See the route cost, weight, and service fees before you request a traveler.' },
        { icon: UserCircle, title: t('featureTitleCommunity') || 'Verified people', desc: t('featureDescCommunity') || 'Traveler and sender profiles show verification status so you know who you are dealing with.' },
        { icon: Headphones, title: t('featureTitleSupport') || 'Real support', desc: t('featureDescSupport') || 'If something feels off, support can review the shipment and help both sides resolve it.' },
    ];

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-20">
            <div className="rounded-[34px] bg-white border border-gray-100 shadow-[0_18px_55px_rgba(1,33,38,0.05)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="p-8 md:p-10 lg:p-12 bg-[#012126] text-white flex flex-col justify-between min-h-[360px]">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                                <ShieldCheck size={13} />
                                Trust built in
                            </span>
                            <h2 className="mt-6 text-3xl md:text-5xl font-extrabold leading-[1.02]">
                                Ship with people, keep the process clear.
                            </h2>
                            <p className="mt-5 max-w-sm text-sm md:text-base font-medium leading-relaxed text-white/65">
                                Bago keeps the important parts visible: who is verified, what the route costs, where the shipment stands, and who to contact when plans change.
                            </p>
                        </div>

                        <div className="mt-10 grid grid-cols-3 gap-3">
                            {[
                                ['AI', 'checks'],
                                ['Escrow', 'flow'],
                                ['Live', 'updates'],
                            ].map(([value, label]) => (
                                <div key={value} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                                    <p className="text-sm font-extrabold leading-none">{value}</p>
                                    <p className="mt-1 text-[9px] font-extrabold uppercase tracking-widest text-white/45">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className={`group p-6 md:p-7 border-gray-100 hover:bg-[#F8F6F3] transition-colors ${
                                    i % 2 === 0 ? 'sm:border-r' : ''
                                } ${i < 4 ? 'border-b' : ''}`}
                            >
                                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5845D8]/8 text-[#5845D8] group-hover:bg-[#5845D8] group-hover:text-white transition-colors">
                                    <f.icon size={21} strokeWidth={2.1} />
                                </div>
                                <h3 className="text-base font-extrabold text-[#012126] tracking-tight">{f.title}</h3>
                                <p className="mt-2 text-sm font-medium leading-relaxed text-[#6B7280]">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   TRIP TYPE (How are you shipping today?)
───────────────────────────────────────────── */
const TripTypeSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user, isAuthenticated } = useAuth();

    return (
        <section className="bg-white px-6 py-24 md:px-12">
            <div className="mx-auto max-w-[1200px]">
                <div className="mb-10 max-w-2xl">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#5845D8]">Choose your side</span>
                    <h2 className="mt-4 text-3xl font-extrabold leading-[1.04] text-[#012126] md:text-5xl">
                        Send something, or earn from a trip you already planned.
                    </h2>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                    {
                        icon: Package,
                        label: t('sendPackageTitle') || 'Send a package',
                        desc: 'Find a traveler, compare the route, pay into escrow, and track the delivery.',
                        path: '/search',
                        cta: 'Find a traveler',
                    },
                    {
                        icon: Plane,
                        label: t('shareRide') || 'Post a trip',
                        desc: 'Turn extra luggage space into earnings with protected payouts after delivery.',
                        path: '/post-trip',
                        cta: 'Start earning',
                    },
                ].map((item) => (
                    <button key={item.label}
                        onClick={() => item.path === '/post-trip'
                            ? goToPostTripWhenVerified({ navigate, isAuthenticated, user })
                            : navigate(item.path)}
                        className="group rounded-[28px] border border-gray-100 bg-[#F8F6F3] p-8 text-left transition hover:-translate-y-1 hover:bg-[#012126] hover:text-white hover:shadow-[0_28px_70px_rgba(1,33,38,0.16)]">
                        <div className="mb-10 flex items-center justify-between">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#5845D8] shadow-sm group-hover:bg-white/10 group-hover:text-white">
                                <item.icon size={30} />
                            </div>
                            <ArrowRight size={22} className="text-[#5845D8] transition group-hover:translate-x-1 group-hover:text-white" />
                        </div>
                        <h3 className="text-3xl font-extrabold tracking-tight text-[#012126] group-hover:text-white">{item.label}</h3>
                        <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-gray-500 group-hover:text-white/62">{item.desc}</p>
                        <div className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-[#5845D8] group-hover:text-white">
                            {item.cta}
                            <ArrowRight size={16} />
                        </div>
                    </button>
                ))}
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   FAQ SECTION (dark bg)
───────────────────────────────────────────── */
const FAQSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        { q: t('faqQ1') || 'What types of items can I send through Bago?', a: t('faqA1') || 'You can send almost anything from documents, clothing, electronics and gifts, provided they are not on our prohibited items list.' },
        { q: t('faqQ2') || 'Are my packages insured?', a: t('faqA2') || 'Yes! Every verified shipment is backed by our secure escrow system and insurance protection policy.' },
        { q: t('faqQ3') || 'Who can I mail my packages to?', a: t('faqA3') || 'You can send packages to any of the cities available on our platform. Our travelers cover thousands of routes globally.' },
        { q: t('faqQ4') || 'How are the shipping rates determined?', a: t('faqA4') || 'Rates are based on regional standards set by our platform and travelers, taking into account the route, weight, and speed.' },
    ];

    return (
        <section className="bg-black py-24 px-6 md:px-12">
            <div className="max-w-[1200px] mx-auto flex flex-col xl:flex-row gap-20">
                {/* Left */}
                <div className="flex-1 min-w-0">
                    <span className="inline-block px-4 py-1.5 bg-white/10 text-white/50 border border-white/20 rounded-full text-[11px] font-bold uppercase tracking-widest mb-8">
                        FAQs
                    </span>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.04] mb-0">
                        {(() => {
                            const part1 = t('answersHeader') || 'Here are Answers Related to';
                            const part2 = t('bagoService') || 'Bago Service';
                            const words = `${part1} ${part2}`.split(' ');
                            return words.map((word, i) =>
                                i >= words.length - 2
                                    ? <span key={i} className="text-[#5845D8]">{word} </span>
                                    : <React.Fragment key={i}>{word} </React.Fragment>
                            );
                        })()}
                    </h2>

                    <div className="mt-16 relative w-full h-[380px] rounded-[36px] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                        <img src="/assets/bago-market-community.jpg" alt="Bago community market" className="w-full h-full object-cover" />
                        <div className="absolute bottom-8 left-8 z-20 max-w-xs">
                            <h3 className="text-2xl font-extrabold text-white mb-5 leading-tight">
                                {t('joinRailsTitle') || 'Join us in building the rails for global shipping.'}
                            </h3>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-7 py-3.5 bg-[#5845D8] text-white font-extrabold rounded-full shadow-lg hover:scale-105 hover:bg-[#4838B5] transition-all text-sm">
                                {t('getStartedBtn') || 'Get started for free'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right — accordion */}
                <div className="flex-1 flex flex-col gap-3 xl:pt-[88px]">
                    {faqs.map((faq, i) => (
                        <div key={i}
                            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:bg-white/[0.08] transition-all"
                            onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
                            <div className="px-7 py-5 flex items-center justify-between gap-4">
                                <h4 className="text-base font-bold text-white/90 leading-snug">{faq.q}</h4>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                                    {openIndex === i ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </div>
                            {openIndex === i && (
                                <div className="px-7 pb-6 text-white/50 text-sm font-medium leading-relaxed">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   FREE APP SECTION
───────────────────────────────────────────── */
const PhoneMockup = ({ className = '' }) => (
    <div className={`relative mx-auto w-[270px] md:w-[310px] ${className}`}>
        <div className="absolute inset-x-4 -bottom-8 h-16 rounded-full bg-[#5845D8]/20 blur-3xl" />
        <div className="absolute -left-1.5 top-28 h-12 w-1 rounded-l-full bg-[#111]" />
        <div className="absolute -right-1.5 top-36 h-16 w-1 rounded-r-full bg-[#111]" />
        <div className="relative rounded-[48px] bg-[#050505] p-[10px] shadow-[0_30px_80px_rgba(1,33,38,0.24)] ring-1 ring-black/10">
            <div className="pointer-events-none absolute inset-[10px] rounded-[38px] ring-1 ring-white/10" />
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[37px] bg-white">
                <img
                    src="/mobile-mockup.png"
                    alt="Bago app screen"
                    className="h-full w-full object-cover object-top"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black md:h-7 md:w-28" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent opacity-45" />
            </div>
        </div>
    </div>
);

const AppStoreBadge = () => (
    <a
        href="#"
        className="block"
    >
        <img src="/app-store.svg" alt="Download on App Store" className="h-10 hover:opacity-80 transition" />
    </a>
);

const GooglePlayBadge = () => (
    <a
        href="https://play.google.com/store/apps/details?id=com.deracali.boltexponativewind&hl=en"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
    >
        <img src="/google-play.svg" alt="Get it on Google Play" className="h-10 hover:opacity-80 transition" />
    </a>
);

const AppSection = () => (
    <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-16">
        <div className="relative rounded-[36px] overflow-hidden bg-[#07080f]" style={{ height: 520 }}>
            {/* Concentric arc decorations — top-right anchor */}
            <svg className="absolute -right-20 -top-20 w-[760px] h-[760px] opacity-[0.18] pointer-events-none" viewBox="0 0 760 760" fill="none">
                {[140, 220, 310, 410, 510, 620].map((r, i) => (
                    <circle key={i} cx="660" cy="100" r={r} stroke="#3B4ECC" strokeWidth="1.2" />
                ))}
            </svg>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] h-full">
                {/* Left — text, vertically centred */}
                <div className="flex flex-col justify-center px-10 md:px-16 py-14">
                    <h2 className="text-[42px] md:text-[52px] text-white font-light leading-[1.12] tracking-tight mb-7">
                        Every delivery is a story.<br />
                        <strong className="font-extrabold">What is yours?</strong>
                    </h2>
                    <p className="text-white/55 text-[13.5px] leading-relaxed mb-5 max-w-[360px]">
                        When it comes to international package delivery, every shipment becomes more than a transaction — it is a chance to send care and connection to the people and places that matter most.
                    </p>
                    <p className="text-white/55 text-[13.5px] leading-relaxed mb-10 max-w-[360px]">
                        That is why Bago makes cross-border delivery feel as simple as handing something to a neighbour. Verified travelers, transparent pricing, zero hidden fees.
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                        <AppStoreBadge />
                        <GooglePlayBadge />
                    </div>
                </div>

                {/* Right — phone mockup anchored at top, card clips the bottom */}
                <div className="hidden lg:flex justify-center items-start pt-6">
                    <PhoneMockup />
                </div>
            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   COMMUNITY CTA (full-width bg image)
───────────────────────────────────────────── */
const CommunityCTA = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user, isAuthenticated } = useAuth();

    return (
        <section className="w-full relative py-28 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <img
                    src="/assets/bago-delivery-handoff.jpg"
                    alt="Bago traveler"
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-[#012126]/72" />
            </div>
            <div className="relative z-10 max-w-4xl px-6 text-center">
                <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-white/70">
                    Ready when you are
                </span>
                <h2 className="text-3xl font-extrabold text-white md:text-5xl lg:text-6xl leading-[1.04]">
                    Send smarter across borders.
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-white/68">
                    Find a verified traveler for your package, or post your next route and earn from space you already have.
                </p>
                <div className="mt-10 flex flex-col md:flex-row gap-4 justify-center">
                    <button onClick={() => navigate('/search')}
                        className="px-9 py-4 bg-[#5845D8] text-white font-extrabold rounded-full text-sm hover:bg-[#4838B5] transition-all min-w-[210px] shadow-lg">
                        {t('sendWithBago') || 'Send with Bago'}
                    </button>
                    <button onClick={() => goToPostTripWhenVerified({ navigate, isAuthenticated, user })}
                        className="px-9 py-4 border border-white/20 bg-white/10 text-white font-extrabold rounded-full text-sm hover:bg-white/15 transition-all min-w-[210px]">
                        {t('travelWithBago') || 'Travel with Bago'}
                    </button>
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   TRACKING SECTION (phone mockup left, text right)
───────────────────────────────────────────── */
const TrackingSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-24">
            <div className="flex flex-col md:flex-row items-center gap-14 md:gap-20">
                {/* phone */}
                <div className="w-full md:w-5/12 flex justify-center rounded-[36px] bg-white/55 py-10 shadow-sm ring-1 ring-white">
                    <PhoneMockup />
                </div>
                {/* text */}
                <div className="w-full md:w-7/12">
                    <h2 className="text-3xl md:text-5xl font-bold text-[#012126] leading-tight mb-6">
                        {t('realTimeTrackingTitle') || <>Real-time tracking.<br />Total peace of<br />mind.</>}
                    </h2>
                    <p className="text-[#6B7280] text-base font-medium leading-relaxed mb-8 max-w-md">
                        {t('realTimeTrackingDesc') || 'Follow your package every step of the way. From pickup to delivery, you will know exactly where your items are and when they will arrive.'}
                    </p>
                    <Link to="/search"
                        className="inline-flex items-center justify-center bg-[#5845D8] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#4838B5] transition-all hover:-translate-y-0.5 text-sm shadow-lg shadow-[#5845D8]/20">
                        {t('checkLiveStatusBtn') || 'Check live status'}
                    </Link>
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   CAR / TESTIMONIAL SECTION
───────────────────────────────────────────── */
const CarSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-16">
            <div className="flex flex-col-reverse md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-[#012126] mb-8">
                        {t('testimonialTitle') || 'Only on Bago...'}
                    </h2>
                    <p className="text-[#012126] text-xl font-medium leading-relaxed mb-6 italic">
                        {t('testimonialQuote') || '"Perfect for me because I can send packages with courier partners! It is faster and more affordable than traditional couriers."'}
                    </p>
                    <p className="text-[#012126] font-bold">
                        {t('testimonialAuthor') || 'Anna, Bago member since 2024'}
                    </p>
                </div>
                <div className="w-full md:w-1/2">
                    <img
                        src="/assets/bago-london-bus.jpg"
                        alt="Friends in car"
                        className="rounded-3xl w-full h-auto shadow-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   DISCOUNT PROMO BANNER
───────────────────────────────────────────── */
const DiscountPromo = ({ inside = false }) => {
    const content = (
            <button
                type="button"
                onClick={() => window.location.assign('/search')}
                className="block w-full overflow-hidden rounded-3xl shadow-[0_18px_45px_rgba(88,69,216,0.18)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                aria-label="Explore faster shipping"
            >
                <img
                    src="/assets/faster-shipping-banner.png"
                    alt="Faster shipping. Pay less. Send more."
                    className="w-full aspect-[3.18/1] object-cover"
                />
            </button>
    );

    if (inside) {
        return <div className="mb-8">{content}</div>;
    }

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-12 pb-16">
            {content}
        </section>
    );
};

/* ─────────────────────────────────────────────
   PROMO BAR (earn from travels)
───────────────────────────────────────────── */
const PromoBar = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-6">
            <div className="bg-[#012126] rounded-2xl p-8 md:p-10 text-center">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-[1.04]">
                    {(() => {
                        const title = t('promoTitle') || 'Earn from your travels.';
                        const words = title.split(' ');
                        return words.map((word, i) =>
                            i === words.length - 1
                                ? <span key={i} className="opacity-20">{word}</span>
                                : <React.Fragment key={i}>{word} </React.Fragment>
                        );
                    })()}
                </h2>
                <p className="text-white/75 text-sm max-w-xl mx-auto mb-7 leading-relaxed font-medium">
                    {t('promoDesc') || 'Help others send packages as a delivery partner. Post your route and get paid for your available luggage space.'}
                </p>
                <button
                    type="button"
                    onClick={() => goToPostTripWhenVerified({ navigate, isAuthenticated, user })}
                    className="inline-flex items-center gap-3 bg-white text-[#012126] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all group text-sm">
                    <ArrowRight size={18} className="text-[#5845D8] rotate-180 group-hover:-translate-x-1 transition-transform" />
                    {t('shareRide') || 'Post a trip'}
                </button>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   HOME PAGE (assembled)
───────────────────────────────────────────── */
export default function Home() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans">
            <Navbar />
            <HeroSection />
            <TrustStrip />
            <EarnMoneySection />
            <HowItWorksSection />
            <ProtectionPolicySection />
            <AppSection />
            <TripTypeSection />
            <CountrySlider />
            <FeaturesSection />
            <TransparentPricingSection />
            <TestimonialsSection />
            <CommunityCTA />
            <FAQSection />
            <Footer />
        </div>
    );
}
