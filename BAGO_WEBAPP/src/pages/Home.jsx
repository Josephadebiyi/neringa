import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, MapPin, Calendar, Package, CheckCircle, ChevronDown,
    Globe, PlusCircle, UserCircle, ArrowRight, ShieldCheck, Check,
    Menu, X, AlertCircle, Calculator, CreditCard, Headphones,
    Plus, Minus, Star
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import AsyncCreatableSelect from 'react-select/async-creatable';
import {
    locationOptions,
    loadCityOptions,
    formatCityOptionLabel,
    makeCustomLocation as makeCustomSearchLocation,
} from '../utils/citySearch.jsx';
import Footer from '../components/Footer';



/* ─────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────── */
const Navbar = () => {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0 shadow-sm">
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex gap-10 items-center">
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

                {/* Mobile Hamburger */}
                <button onClick={() => setShowMobileMenu(true)} className="md:hidden flex items-center p-2 rounded-xl bg-gray-50 text-[#012126]">
                    <Menu size={24} />
                </button>
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
                                            onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                                            className={`w-full py-3.5 text-lg font-black flex items-center gap-4 hover:opacity-70 transition-opacity ${item.purple ? 'text-[#5845D8]' : 'text-[#012126]'}`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-4">Language</p>
                                    <select value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50 text-[#012126] font-bold text-sm outline-none">
                                        {languages.map((lang) => (
                                            <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                                        ))}
                                    </select>
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
                                            className="w-full block text-center py-3.5 bg-[#5845D8] text-white rounded-2xl font-black shadow-lg">
                                            Go to Dashboard
                                        </Link>
                                    </div>
                                ) : (
                                    <Link to="/login" onClick={() => setShowMobileMenu(false)}
                                        className="w-full block text-center py-3.5 bg-[#5845D8] text-white rounded-2xl font-black shadow-lg">
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
    const { t } = useLanguage();

    return (
        <section className="relative w-full bg-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[280px] lg:min-h-[320px]">
                {/* Left */}
                <div className="flex flex-col justify-center px-6 md:px-12 py-6 lg:py-8 z-10">
                    <span className="inline-block px-4 py-1.5 bg-[#5845D8]/8 text-[#5845D8] border border-[#5845D8]/15 rounded-full text-[11px] font-black uppercase tracking-widest mb-4 w-fit">
                        Next Generation Shipping
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#012126] leading-[0.9] tracking-tighter mb-4">
                        {(() => {
                            const title = t('heroTitle') || 'International package delivery redefined.';
                            const words = title.split(' ');
                            return words.map((word, i) =>
                                i === words.length - 1
                                    ? <span key={i} className="opacity-20 text-gray-400">{word}</span>
                                    : <React.Fragment key={i}>{word} </React.Fragment>
                            );
                        })()}
                    </h1>
                    <p className="text-[#6B7280] text-sm md:text-base font-medium mb-4 max-w-lg leading-relaxed">
                        {t('heroSummary') || 'The easiest and most affordable way to send packages across the world. Connect with verified travelers ready to deliver your items.'}
                    </p>

                    {/* Rating badge and App Download in one row */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-[#FFB800] fill-[#FFB800]" />)}
                            </div>
                            <span className="text-[10px] font-black text-[#012126] tracking-widest">4.9/5 RATED</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href="#" className="flex items-center gap-2 bg-[#012126] text-white px-3.5 py-2 rounded-xl hover:opacity-80 transition-opacity">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                <div>
                                    <div className="text-[9px] text-white/60 font-semibold leading-none">Download on the</div>
                                    <div className="text-[12px] font-black leading-tight">App Store</div>
                                </div>
                            </a>
                            <a href="#" className="flex items-center gap-2 bg-[#012126] text-white px-3.5 py-2 rounded-xl hover:opacity-80 transition-opacity">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.18 23.76c.3.17.65.2.98.09L15.65 12 4.16.15c-.33-.11-.68-.08-.98.09A1.07 1.07 0 002.5 1.1v21.8c0 .41.23.78.68.86z" fill="#00C3F3"/>
                                    <path d="M19.75 10.19l-2.87-1.64L13.5 12l3.38 3.45 2.87-1.64A1.16 1.16 0 0020.5 12a1.16 1.16 0 00-.75-1.81z" fill="#FFBC00"/>
                                    <path d="M4.16.15L15.65 12 16.88 10.77 5.5.1A1.12 1.12 0 004.16.15z" fill="#00EE76"/>
                                    <path d="M15.65 12L4.16 23.85a1.12 1.12 0 001.34.05l11.38-10.67L15.65 12z" fill="#F93448"/>
                                </svg>
                                <div>
                                    <div className="text-[9px] text-white/60 font-semibold leading-none">Get it on</div>
                                    <div className="text-[12px] font-black leading-tight">Google Play</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right — hero image */}
                <div className="relative hidden lg:block bg-[#f0f4f5] overflow-hidden">
                    <img
                        src="/assets/hero_bago_group.png"
                        alt="Bago Travelers"
                        className="w-full h-full object-cover object-center"
                        onError={(e) => { e.target.src = '/hero_v3.png'; }}
                    />
                    {/* DELIVERED stamp overlay */}
                    <div className="absolute bottom-10 right-10 bg-[#5845D8] text-white font-black text-xs tracking-widest px-5 py-3 rounded-full shadow-xl rotate-[-6deg] uppercase">
                        ✓ {t('deliveredStamp') || 'DELIVERED'}
                    </div>
                </div>
            </div>
        </section>
    );
};

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
                        <div className="ml-4 flex-1 min-w-0 relative">
                            <span className={`text-[15px] font-bold pointer-events-none select-none ${date ? 'text-[#012126]' : 'text-gray-400'}`}>
                                {date
                                    ? new Date(date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Travel date'}
                            </span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        {date && <CheckCircle size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                    </label>

                    <button type="submit"
                        className="h-[52px] md:h-[68px] md:px-9 bg-[#5845D8] text-white font-extrabold rounded-b-[24px] md:rounded-b-none md:rounded-r-[24px] hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                        <Search size={18} strokeWidth={3} />
                        <span>Find a traveler</span>
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
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/70">
                                <ShieldCheck size={13} />
                                Trust built in
                            </span>
                            <h2 className="mt-6 text-4xl md:text-5xl font-black leading-[0.95] tracking-tight">
                                Ship with people, keep the process clear.
                            </h2>
                            <p className="mt-5 max-w-sm text-sm md:text-base font-medium leading-relaxed text-white/65">
                                Bago keeps the important parts visible: who is verified, what the route costs, where the shipment stands, and who to contact when plans change.
                            </p>
                        </div>

                        <div className="mt-10 grid grid-cols-3 gap-3">
                            {[
                                ['KYC', 'checks'],
                                ['Escrow', 'flow'],
                                ['Live', 'updates'],
                            ].map(([value, label]) => (
                                <div key={value} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                                    <p className="text-sm font-black leading-none">{value}</p>
                                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/45">{label}</p>
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
                                <h3 className="text-base font-black text-[#012126] tracking-tight">{f.title}</h3>
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
   USER STORIES / TESTIMONIALS
───────────────────────────────────────────── */
const STORIES = [
    {
        name: 'Olugbemi Sowemimo',
        location: 'Nigeria',
        flag: 'ng',
        quote: 'Helpful and timely. Intersects the global shipping ecosystem in such a way that individuals get a chance to send packages no matter the country. Helped me settle in a new city with minimal hassle. Thank you Bago.',
        photo: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=800&q=80&fit=crop',
    },
    {
        name: 'Bertrand Nkemdirim',
        location: 'Cameroon',
        flag: 'cm',
        quote: 'Easy Peasy! This app is such a breeze to use! Customer service is also highly responsive. Definitely a must have to send packages with.',
        photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&fit=crop',
    },
    {
        name: 'Adaeze Okonkwo',
        location: 'Nigeria',
        flag: 'ng',
        quote: "Sending and receiving packages to and from Nigeria just got easier. I've used Bago three times now and it keeps getting better.",
        photo: 'https://images.unsplash.com/photo-1614107151491-6876eecbff89?w=800&q=80&fit=crop',
    },
];

const StoryCard = ({ story, large = false }) => (
    <div
        className="relative rounded-3xl overflow-hidden"
        style={{ minHeight: large ? 520 : 240 }}
    >
        <img
            src={story.photo}
            alt={story.name}
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className={`absolute bottom-0 left-0 right-0 ${large ? 'p-8' : 'p-6'}`}>
            <p className={`text-white/90 font-medium leading-relaxed mb-5 ${large ? 'text-base max-w-xs' : 'text-sm line-clamp-3'}`}>
                {story.quote}
            </p>
            <div className="flex items-center gap-3">
                <img
                    src={`https://flagcdn.com/w40/${story.flag}.png`}
                    alt={story.location}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' }}
                    loading="lazy"
                />
                <span className="text-white font-black text-sm">{story.name}, {story.location}</span>
            </div>
        </div>
    </div>
);

const TestimonialsSection = () => (
    <section className="bg-black py-24 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
            <div className="flex items-start justify-between mb-12">
                <div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter">
                        Real people.<br />
                        <span className="font-black">Real <span className="opacity-25">deliveries.</span></span>
                    </h2>
                    <p className="mt-5 text-white/55 text-base font-medium max-w-md leading-relaxed">
                        From Lagos to London, thousands of senders and travelers trust Bago to get their packages where they need to go — safely and affordably.
                    </p>
                </div>
                <div className="hidden md:flex gap-2 mt-1">
                    <button className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <ArrowRight size={18} className="rotate-180" />
                    </button>
                    <button className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
                <StoryCard story={STORIES[0]} large />
                <div className="grid grid-rows-2 gap-4">
                    <StoryCard story={STORIES[1]} />
                    <StoryCard story={STORIES[2]} />
                </div>
            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   FAQ SECTION (dark bg)
───────────────────────────────────────────── */
const FAQSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        { q: 'What types of items can I send through Bago?', a: 'You can send almost anything — documents, clothing, electronics, food items, and gifts — as long as they are not on our prohibited items list. When in doubt, check the item categories when creating your package.' },
        { q: 'Is my money safe?', a: 'Yes. Bago holds your payment in escrow until the package is confirmed delivered. Funds are only released to the traveler once you mark the item as received. If something goes wrong, you can raise a dispute and our team will review it.' },
        { q: 'How do I know the traveler is trustworthy?', a: 'Every traveler on Bago goes through identity verification (KYC) before they can accept deliveries. You can also see their ratings, completed trips, and reviews from other senders before you request.' },
        { q: 'How are the shipping rates determined?', a: 'Each traveler sets their own rate per kilogram based on the route. You see the full cost — including any service fee — before confirming your request. No hidden charges.' },
        { q: 'What happens if my package is lost or damaged?', a: 'You can raise a dispute directly from the app. Bago reviews the case and, where applicable, refunds are processed back to your wallet or original payment method.' },
        { q: 'How long does delivery take?', a: 'Delivery time depends on the traveler\'s trip date and route. You can filter by departure date when searching, and the traveler\'s expected arrival is shown on their trip listing.' },
        { q: 'Can I track my package?', a: 'Yes. Every shipment gets a tracking number you can share with the recipient. Both sender and receiver can follow the status — from accepted to in transit to delivered — in real time.' },
    ];

    return (
        <section className="bg-black pt-24 pb-0 px-6 md:px-12">
            <div className="max-w-[1200px] mx-auto flex flex-col xl:flex-row gap-20">
                {/* Left */}
                <div className="flex-1 min-w-0">
                    <span className="inline-block px-4 py-1.5 bg-white/10 text-white/50 border border-white/20 rounded-full text-[11px] font-bold uppercase tracking-widest mb-8">
                        FAQs
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.05] tracking-tight mb-0">
                        Got questions about<br />
                        <span className="text-[#5845D8]">Bago?</span>
                    </h2>

                    <div className="mt-16 relative w-full h-[380px] rounded-[36px] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                        <img src="/assets/traveler_join.png" alt="Traveler" className="w-full h-full object-cover" />
                        <div className="absolute bottom-8 left-8 z-20 max-w-xs">
                            <h3 className="text-2xl font-black text-white mb-5 leading-tight">
                                {t('joinRailsTitle') || 'Join us in building the rails for global shipping.'}
                            </h3>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-7 py-3.5 bg-[#5845D8] text-white font-black rounded-full shadow-lg hover:scale-105 hover:bg-[#4838B5] transition-all text-sm">
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
    <a href="#" className="flex items-center gap-3 bg-white/10 hover:bg-white/[0.16] border border-white/20 text-white px-5 py-3 rounded-2xl transition-all group">
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <div>
            <div className="text-[10px] text-white/55 font-semibold leading-none mb-0.5">Download on the</div>
            <div className="text-[15px] font-black leading-tight">App Store</div>
        </div>
    </a>
);

const GooglePlayBadge = () => (
    <a href="#" className="flex items-center gap-3 bg-white/10 hover:bg-white/[0.16] border border-white/20 text-white px-5 py-3 rounded-2xl transition-all group">
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.18 23.76c.3.17.65.2.98.09L15.65 12 4.16.15c-.33-.11-.68-.08-.98.09A1.07 1.07 0 002.5 1.1v21.8c0 .41.23.78.68.86z" fill="#00C3F3"/>
            <path d="M19.75 10.19l-2.87-1.64L13.5 12l3.38 3.45 2.87-1.64A1.16 1.16 0 0020.5 12a1.16 1.16 0 00-.75-1.81z" fill="#FFBC00"/>
            <path d="M4.16.15L15.65 12 16.88 10.77 5.5.1A1.12 1.12 0 004.16.15z" fill="#00EE76"/>
            <path d="M15.65 12L4.16 23.85a1.12 1.12 0 001.34.05l11.38-10.67L15.65 12z" fill="#F93448"/>
        </svg>
        <div>
            <div className="text-[10px] text-white/55 font-semibold leading-none mb-0.5">Get it on</div>
            <div className="text-[15px] font-black leading-tight">Google Play</div>
        </div>
    </a>
);

const AppSection = () => (
    <section className="px-6 md:px-12 max-w-[1200px] mx-auto pb-16 pt-4">
        <div className="relative rounded-[36px] overflow-hidden bg-[#07080f]">
            {/* Arc decoration anchored top-right */}
            <svg className="absolute -right-16 -top-16 w-[680px] h-[680px] opacity-[0.18] pointer-events-none" viewBox="0 0 680 680" fill="none">
                {[160, 260, 360, 460, 560].map((r, i) => (
                    <circle key={i} cx="580" cy="100" r={r} stroke="#4B5EE4" strokeWidth="1.5" />
                ))}
            </svg>

            {/* Two-column grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
                {/* Left: text */}
                <div className="flex flex-col justify-center px-10 lg:px-16 py-14 lg:py-16">
                    <h2 className="text-4xl md:text-5xl text-white font-light leading-[1.15] tracking-tight mb-6">
                        Every delivery is a story.<br />
                        <strong className="font-black">What is yours?</strong>
                    </h2>
                    <p className="text-white/55 text-[14px] leading-relaxed mb-4 max-w-[340px]">
                        When it comes to international package delivery, every shipment becomes more than a transaction — it is a chance to send care and connection to the people that matter most.
                    </p>
                    <p className="text-white/55 text-[14px] leading-relaxed mb-10 max-w-[340px]">
                        That is why Bago makes cross-border delivery feel as simple as handing something to a neighbour. Verified travelers, transparent pricing, zero hidden fees.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <AppStoreBadge />
                        <GooglePlayBadge />
                    </div>
                </div>

                {/* Right: phone anchored at top — overflows naturally */}
                <div className="hidden lg:flex justify-center items-start pt-8">
                    <PhoneMockup />
                </div>
            </div>
        </div>
    </section>
);



/* ─────────────────────────────────────────────
   PROMO BAR (earn from travels)
───────────────────────────────────────────── */
const PromoBar = () => {
    const { t } = useLanguage();
    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-6">
            <div className="bg-[#012126] rounded-2xl p-8 md:p-10 text-center">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter leading-[0.9]">
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
                <Link to="/post-trip"
                    className="inline-flex items-center gap-3 bg-white text-[#012126] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all group text-sm">
                    <ArrowRight size={18} className="text-[#5845D8] rotate-180 group-hover:-translate-x-1 transition-transform" />
                    {t('shareRide') || 'Post a trip'}
                </Link>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   HOME PAGE (assembled)
───────────────────────────────────────────── */
export default function Home() {
    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans">
            <Navbar />
            <HeroSection />
            <StickySearch />
            <CountrySlider />
            <AppSection />
            <TestimonialsSection />
            <FeaturesSection />
            <FAQSection />
            <Footer />
        </div>
    );
}
