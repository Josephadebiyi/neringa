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
    Bus,
    Car,
    ShieldCheck,
    Check,
    Smartphone,
    Menu,
    X,
    AlertCircle,
    Calculator,
    CreditCard,
    Headphones,
    Plus,
    Minus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import api from '../api';
import RecentTrips from '../components/RecentTrips';
import Select from 'react-select';
import { locations } from '../utils/countries';
import Footer from '../components/Footer';

const Navbar = () => {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData, currency, setCurrency } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'ZAR', 'KES', 'GHS'];

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0 shadow-sm">
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Baggo" className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-10 items-center">
                <button onClick={() => navigate('/about')} className="text-[#5845D8] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('whoWeAre')}
                </button>
                <button onClick={() => navigate('/how-it-works')} className="text-[#5845D8] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('howItWorks')}
                </button>
                <button onClick={() => navigate('/track')} className="text-[#5845D8] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('track')}
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* Language Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Globe size={18} className="text-[#5845D8]" />
                        <span className="text-[22px]">{currentLangData?.flag}</span>
                        <span className="text-sm font-medium text-[#5845D8]">{currentLangData?.code.toUpperCase()}</span>
                        <ChevronDown size={16} className={`text-[#5845D8] transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
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
                                    <span className="text-sm font-medium text-[#5845D8]">{lang.name}</span>
                                    {currentLanguage === lang.code && (
                                        <Check size={16} className="ml-auto text-[#5845D8]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => navigate('/search')} className="hidden md:flex items-center cursor-pointer group">
                    <Search size={22} className="text-[#5845D8] group-hover:text-[#5845D8] transition-colors" />
                </button>

                <Link to="/post-trip" className="hidden md:flex items-center gap-2 cursor-pointer text-[#5845D8] hover:text-[#4838B5] transition-colors">
                    <PlusCircle size={22} />
                    <span className="font-semibold text-[15px]">{t('offerRide')}</span>
                </Link>

                <div className="hidden md:flex items-center gap-5">
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <Smartphone size={20} className="text-[#5845D8] group-hover:text-[#5845D8] transition-colors" />
                        <span className="text-[#5845D8] text-sm font-semibold group-hover:text-[#5845D8] transition-colors">{t('getApp')}</span>
                    </div>
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="flex items-center gap-3 bg-[#5845D8]/5 border border-[#5845D8]/20 px-4 py-2 rounded-full hover:bg-[#5845D8]/10 transition-all group">
                            <div className="w-8 h-8 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition-transform">
                                {user?.firstName?.charAt(0) || user?.email?.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-[#5845D8]">{t('dashboard')}</span>
                        </Link>
                    ) : (
                        <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 bg-[#5845D8] text-white rounded-full font-bold hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/10 group">
                            <UserCircle size={20} className="text-white/80 group-hover:text-white transition-colors" />
                            <span>{t('loginSignup')}</span>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setShowMobileMenu(true)}
                    className="md:hidden flex items-center p-2 rounded-xl bg-gray-50 text-[#5845D8] hover:text-[#5845D8] transition-all"
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
                                    className="p-2 rounded-full bg-gray-100 text-[#5845D8] hover:bg-gray-200 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 px-6 py-8 space-y-8">
                                {/* Navigation Links */}
                                <div className="space-y-4 text-center">
                                    <button
                                        onClick={() => { navigate('/search'); setShowMobileMenu(false); }}
                                        className="w-full py-4 text-xl font-black text-[#5845D8] flex items-center gap-4 hover:text-[#5845D8] transition-colors"
                                    >
                                        <Search size={24} />
                                        <span>{t('findRoute')}</span>
                                    </button>
                                    <button
                                        onClick={() => { navigate('/post-trip'); setShowMobileMenu(false); }}
                                        className="w-full py-4 text-xl font-black text-[#5845D8] flex items-center gap-4 hover:text-[#4838B5] transition-colors"
                                    >
                                        <PlusCircle size={24} />
                                        <span>{t('postTrip')}</span>
                                    </button>
                                    <Link
                                        to="/about"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block py-4 text-xl font-black text-[#5845D8] flex items-center gap-4 border-t border-gray-100 pt-8"
                                    >
                                        <AlertCircle size={24} />
                                        {t('whoWeAre')}
                                    </Link>
                                    <Link
                                        to="/how-it-works"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block py-4 text-xl font-black text-[#5845D8] flex items-center gap-4"
                                    >
                                        <CheckCircle size={24} />
                                        {t('howItWorks')}
                                    </Link>
                                </div>

                                {/* Language/Currency Section */}
                                {/* Language Selector Mobile */}
                                <div className="pt-8 border-t border-gray-100">
                                    <h5 className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-6 font-bold">{t('selectLanguage')}</h5>
                                    <div className="relative">
                                        <select
                                            value={currentLanguage}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 appearance-none text-[#5845D8] font-black focus:border-[#5845D8] outline-none transition-all"
                                        >
                                            {languages.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown size={20} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-6 font-bold">{t('preferredCurrency')}</h5>
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
                                                    : 'border-gray-100 bg-gray-50/50 text-[#5845D8]'
                                                    }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Auth Actions */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                {isAuthenticated ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="w-12 h-12 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-xl uppercase">
                                                {user?.firstName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold text-[#5845D8] truncate">{user?.firstName} {user?.lastName}</p>
                                                <p className="text-xs text-[#6B7280] truncate font-medium">{user?.email}</p>
                                            </div>
                                        </div>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setShowMobileMenu(false)}
                                            className="w-full block text-center py-4 bg-[#5845D8] text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {t('goToDashboard')}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5845D8]/20"
                                        >
                                            {t('login')}
                                        </button>
                                        <button
                                            onClick={() => navigate('/signup')}
                                            className="w-full bg-white text-[#5845D8] border-2 border-[#5845D8]/10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
                                        >
                                            {t('signup')}
                                        </button>
                                    </div>
                                )}
                                <p className="mt-6 text-center text-xs font-medium text-gray-400">
                                    {t('trustedBy')}
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
    const navigate = useNavigate();
    const { t, currency } = useLanguage();

    // Search states
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [date, setDate] = useState('');

    const locationOptions = locations.map(loc => ({
        value: loc.city,
        label: (
            <div className="flex items-center gap-2">
                <span className="text-base">{loc.flag}</span>
                <span className="font-bold">{loc.label}</span>
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
                    const detected = locationOptions.find(opt => opt.city === data.city) || (data.city ? {
                        value: data.city,
                        label: (
                            <div className="flex items-center gap-2 text-[13px] font-bold">
                                <span>📍</span>
                                <span>{data.city}, {data.country_name || ''}</span>
                            </div>
                        ),
                        city: data.city,
                        country: data.country_name || ''
                    } : null);
                    if (detected) setOrigin(detected);
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
            padding: 0,
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0 4px',
        }),
        placeholder: (base) => ({
            ...base,
            color: '#6B7280',
            fontSize: '14px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.5
        }),
        singleValue: (base) => ({
            ...base,
            color: '#5845D8',
            fontSize: '16px',
            fontWeight: '900',
        }),
        indicatorsContainer: (base) => ({
            ...base,
            display: 'none',
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
            borderRadius: '24px',
            border: '1px solid #f0f0f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            marginTop: '12px',
            overflow: 'hidden'
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#5845D810' : 'white',
            color: '#5845D8',
            fontSize: '14px',
            fontWeight: '800',
            padding: '16px 20px',
            cursor: 'pointer'
        })
    };

    return (
        <section className="relative w-full">
            {/* Main Hero Background Section */}
            <div className="relative bg-[#012126] pt-4 pb-12 md:pt-6 md:pb-20 px-6 overflow-hidden">
                {/* 3D Background Illustration Overlay */}
                <motion.div
                    initial={{ opacity: 0, scale: 1.1, x: 20 }}
                    animate={{ opacity: 0.3, scale: 1, x: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <img
                        src="/assets/bago_hero_vibe.png"
                        alt="Global Logistics Background"
                        className="w-full h-full object-cover object-right-bottom scale-110 md:scale-100 mix-blend-screen"
                    />
                </motion.div>

                {/* Content Overlay */}
                <div className="max-w-[1400px] mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        {/* Text Content Column */}
                        <div className="max-w-2xl text-center md:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-2"
                            >
                                <span className="flex h-1.5 w-1.5 rounded-full bg-[#A78BFA] animate-pulse"></span>
                                <span className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{t('nextGenShipping')}</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="text-4xl md:text-[48px] font-black text-white mb-1 tracking-[-0.04em] leading-[0.85]"
                            >
                                {t('heroTitle').split(' ').map((word, idx) => (
                                    <React.Fragment key={idx}>
                                        {word === 'package' || word === 'delivery' ? (
                                            <span className="text-[#A78BFA]">{word} </span>
                                        ) : (
                                            <>{word} </>
                                        )}
                                        {idx === 0 && <br />}
                                        {idx === 2 && <br />}
                                    </React.Fragment>
                                ))}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="hidden md:block text-white/70 text-sm md:text-[15px] font-bold mb-3 max-w-lg leading-tight tracking-tight opacity-90 mx-auto md:mx-0"
                            >
                                {t('heroSummary')}
                            </motion.p>
                        </div>

                        {/* Parallel App Download and Visuals */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="hidden lg:flex flex-row items-end gap-10 relative pr-4"
                        >
                            {/* Fancy STAMP - now part of the parallel flow */}
                            <motion.div
                                initial={{ scale: 2, rotate: 0, opacity: 0 }}
                                animate={{ scale: 1, rotate: -12, opacity: 0.8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 1 }}
                                className="px-6 py-2.5 border-[4px] border-[#A78BFA] text-[#A78BFA] font-black rounded-xl text-[16px] uppercase tracking-[0.2em] font-mono shadow-[0_0_40px_rgba(167,139,250,0.2)] bg-[#5845D8]/40 backdrop-blur-sm"
                            >
                                {t('deliveredStamp')}
                            </motion.div>

                            <div className="flex flex-col items-end gap-3">
                                <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t('downloadOfficialApps')}</p>
                                <div className="flex flex-row gap-3">
                                    <img src="/app-store.svg" alt="App Store" className="h-[36px] cursor-pointer hover:scale-105 transition-transform" />
                                    <img src="/google-play.svg" alt="Google Play" className="h-[36px] cursor-pointer hover:scale-105 transition-transform" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="w-3.5 h-3.5 rounded-full bg-[#FFD700] flex items-center justify-center p-0.5 border border-[#5845D8]">
                                                <Check size={8} strokeWidth={4} className="text-[#5845D8]" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-white/40 text-[8px] font-black uppercase tracking-widest">{t('ratedStars')}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Omio-Perfect Search Bar Cluster */}
            <div className="max-w-[1100px] mx-auto px-6 -mt-10 md:-mt-12 relative z-40">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="bg-white rounded-[24px] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.2)] p-1.5"
                >
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch">
                        {/* From Field */}
                        <div className="flex-1 flex flex-col justify-center px-6 py-3 rounded-[20px] hover:bg-gray-50 transition-colors group relative cursor-pointer min-w-0">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-[#5845D8]"></div>
                                {t('leavingFromLabel')}
                            </label>
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-[#5845D8] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <Select
                                        options={locationOptions}
                                        value={origin}
                                        onChange={setOrigin}
                                        placeholder={t('pickCityPlaceHolder')}
                                        styles={customStyles}
                                        isClearable
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block w-[1px] bg-gray-100 my-4"></div>

                        {/* To Field */}
                        <div className="flex-1 flex flex-col justify-center px-6 py-3 rounded-[20px] hover:bg-gray-50 transition-colors group relative cursor-pointer min-w-0">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-[#5845D8]"></div>
                                {t('goingToLabel')}
                            </label>
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-[#5845D8] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <Select
                                        options={locationOptions}
                                        value={destination}
                                        onChange={setDestination}
                                        placeholder={t('pickCityPlaceHolder')}
                                        styles={customStyles}
                                        isClearable
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block w-[1px] bg-gray-100 my-4"></div>

                        {/* Date Field */}
                        <div className="flex-1 lg:max-w-[200px] flex flex-col justify-center px-6 py-3 rounded-[20px] hover:bg-gray-50 transition-colors group min-w-0">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('departureDateLabel')}</label>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-[#5845D8] flex-shrink-0" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="outline-none text-[14px] font-black w-full bg-transparent text-[#5845D8] cursor-pointer"
                                    required
                                />
                            </div>
                        </div>

                        {/* Search Action */}
                        <button
                            type="submit"
                            className="bg-[#5845D8] text-white px-8 py-4 rounded-[20px] font-black text-[14px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[#5845D8]/30 group active:scale-95 ml-1 mr-1 my-1 lg:my-0"
                        >
                            <Search size={20} className="group-hover:scale-110 transition-transform" />
                            <span>{t('searchRoutesBtn')}</span>
                        </button>
                    </form>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    viewport={{ once: true }}
                    className="h-10 invisible"
                >
                </motion.div>
            </div>
        </section>
    );
};

const BrandsSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-20 bg-white">
            <div className="text-center mb-12">
                <span className="px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">{t('partners')}</span>
                <h2 className="text-4xl md:text-7xl font-black text-[#5845D8] mt-8 leading-[0.9] tracking-tighter">
                    {t('partnershipLogistics')}
                </h2>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale invert-[0.3]">
                {/* Logo cloud - using mock placeholders for branding as per design style */}
                <div className="text-3xl font-black italic tracking-tighter">DHL-ish</div>
                <div className="text-3xl font-black italic tracking-tighter">FEDEX-ish</div>
                <div className="text-3xl font-black italic tracking-tighter">UPS-ish</div>
                <div className="text-3xl font-black italic tracking-tighter">AIR FRANCE</div>
                <div className="text-3xl font-black italic tracking-tighter">BRITISH AIRWAYS</div>
                <div className="text-3xl font-black italic tracking-tighter">LUFTHANSA</div>
            </div>
        </section>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(0);
    const { t } = useLanguage(); // Added useLanguage hook

    const faqs = [
        {
            q: t('faqQ1'),
            a: t('faqA1')
        },
        {
            q: t('faqQ2'),
            a: t('faqA2')
        },
        {
            q: t('faqQ3'),
            a: t('faqA3')
        },
        {
            q: t('faqQ4'),
            a: t('faqA4')
        }
    ];

    return (
        <section className="bg-black py-24 px-6 md:px-12">
            <div className="max-w-[1240px] mx-auto flex flex-col xl:flex-row gap-20">
                <div className="flex-1">
                    <span className="px-4 py-1.5 bg-white/10 text-white/50 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">{t('faqsTitle')}</span>
                    <h2 className="text-4xl md:text-6xl font-black text-white mt-8 leading-tight">
                        {t('answersHeader')} <span className="text-[#A78BFA]">{t('bagoService')}</span>
                    </h2>

                    <div className="mt-20 relative w-full h-[400px] overflow-hidden rounded-[40px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black z-10"></div>
                        <img src="/assets/traveler_join.png" alt="Traveler" className="w-full h-full object-cover" />
                        <div className="absolute bottom-10 left-10 z-20 max-w-sm">
                            <h3 className="text-3xl font-black text-white mb-6">{t('joinRailsTitle')}</h3>
                            <button className="px-8 py-4 bg-[#5845D8] text-white font-black rounded-full shadow-lg hover:scale-105 transition-all">{t('getStartedBtn')}</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all hover:bg-white/10"
                            onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                        >
                            <div className="px-8 py-6 flex items-center justify-between gap-4">
                                <h4 className="text-lg font-bold text-white/90">{faq.q}</h4>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                                    {openIndex === i ? <Minus size={18} /> : <Plus size={18} />}
                                </div>
                            </div>
                            {openIndex === i && (
                                <div className="px-8 pb-8 text-white/50 font-medium leading-relaxed">
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

const FeaturesSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-20">
                {[
                    {
                        icon: ShieldCheck,
                        title: t('featureTitleInsurance'),
                        desc: t('featureDescInsurance'),
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: Package,
                        title: t('featureTitleGuaranteed'),
                        desc: t('featureDescGuaranteed'),
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: CreditCard,
                        title: t('featureTitleOptions'),
                        desc: t('featureDescOptions'),
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: Calculator,
                        title: t('featureTitleNoHidden'),
                        desc: t('featureDescNoHidden'),
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: UserCircle,
                        title: t('featureTitleCommunity'),
                        desc: t('featureDescCommunity'),
                        color: 'bg-[#5845D8]/10 text-[#5845D8]'
                    },
                    {
                        icon: Headphones,
                        title: t('featureTitleSupport'),
                        desc: t('featureDescSupport'),
                        color: 'bg-[#fef2f2] text-[#ef4444]'
                    }
                ].map((feature, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                        <div className={`w-32 h-32 ${feature.color} rounded-full flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500`}>
                            <feature.icon size={60} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-[#5845D8] mb-4">{feature.title}</h3>
                        <p className="text-[#6B7280] text-sm font-medium leading-relaxed px-4">
                            {feature.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const CommunityCTA = () => {
    const { t } = useLanguage();
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
                <h2 className="text-4xl md:text-5xl font-black text-white mb-12 tracking-tight">{t('joinGlobalCommunity')}</h2>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <button
                        onClick={() => navigate('/search')}
                        className="px-12 py-5 bg-[#5845D8] text-white font-bold rounded-lg text-lg hover:bg-[#4838B5] transition-all min-w-[240px]"
                    >
                        {t('sendWithBago')}
                    </button>
                    <button
                        onClick={() => navigate('/post-trip')}
                        className="px-12 py-5 bg-[#5845D8] text-white font-bold rounded-lg text-lg hover:bg-[#4838B5] transition-all min-w-[240px]"
                    >
                        {t('travelWithBago')}
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
            <h2 className="text-3xl md:text-4xl font-black text-[#5845D8] text-center mb-12">{t('tripTypeTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => navigate('/search?mode=flight')} className="bg-[#f0f4f5] rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <Plane size={40} className="text-[#5845D8]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-[#5845D8]">{t('byFlight')}</h3>
                        <p className="text-[#6B7280] font-medium text-[15px]">{t('byFlightDesc')}</p>
                    </div>
                    <div className="bg-[#5845D8] rounded-full p-2 hover:bg-[#4838B5] transition-colors">
                        <ArrowRight size={20} className="text-white" />
                    </div>
                </div>
                <div onClick={() => navigate('/search?mode=bus')} className="bg-[#f0f4f5] rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <Bus size={40} className="text-[#5845D8]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-[#5845D8]">{t('byBus')}</h3>
                        <p className="text-[#6B7280] font-medium text-[15px]">{t('byBusDesc')}</p>
                    </div>
                    <div className="bg-[#5845D8] rounded-full p-2 hover:bg-[#4838B5] transition-colors">
                        <ArrowRight size={20} className="text-white" />
                    </div>
                </div>
            </div>
        </section>
    );
};



const DiscountPromo = () => {
    const { t } = useLanguage();
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-12">
            <div className="bg-gradient-to-r from-[#5845D8] to-[#9B4dca] rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(88,69,216,0.2)] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="z-10 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center md:justify-start gap-3">
                        <Smartphone className="text-white/80" size={32} />
                        {t('firstDeliveryFree')}
                    </h2>
                    <p className="text-white/90 text-base font-medium max-w-lg leading-relaxed">
                        {t('discountPromoDesc')}
                    </p>
                </div>

                <div className="z-10 bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md text-center shrink-0 w-full md:w-auto">
                    <p className="text-sm font-bold text-white mb-2 uppercase tracking-wide">{t('usePromoCode')}</p>
                    <div className="bg-white text-[#5845D8] px-8 py-4 rounded-xl font-black text-3xl tracking-wider shadow-inner">
                        BAGO10
                    </div>
                    <p className="text-white/80 text-xs mt-3">{t('validNewUsers')}</p>
                </div>
            </div>
        </section>
    );
};


const AppPromotionSection = () => {
    const { t } = useLanguage();
    return (
        <section className="px-6 md:px-12 max-w-[1400px] mx-auto py-24 bg-white overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-20">
                {/* QR Code / Visual Side */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 relative flex justify-center lg:justify-end pr-0 lg:pr-12"
                >
                    <div className="relative w-full max-w-[400px] h-auto group">
                        {/* Decorative circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#5845D8]/5 rounded-full blur-3xl -z-10 group-hover:bg-[#5845D8]/10 transition-colors duration-1000"></div>

                        <motion.img
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            src="/mobile-mockup.png"
                            alt="Scan to get Bago app"
                            className="w-full h-auto drop-shadow-2xl"
                        />

                        {/* QR Code Overlay (Styled like Omio) */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl p-4 rounded-3xl shadow-xl border border-white/50 flex flex-col items-center gap-2 scale-90 md:scale-100"
                        >
                            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 border border-gray-100">
                                {/* Mock QR Code */}
                                <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://bago.com')] bg-cover opacity-80"></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#5845D8] opacity-60">{t('scanToGetApp')}</span>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Content Side */}
                <div className="flex-1 text-center lg:text-left">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl md:text-7xl font-black text-[#5845D8] mb-6 leading-[0.9] tracking-tighter"
                    >
                        {t('ourFreeAppTitle').split(' ').map((word, idx) => (
                            <React.Fragment key={idx}>
                                {word.toLowerCase() === 'app.' ? (
                                    <span className="opacity-20 underline decoration-[#5845D8] decoration-8 underline-offset-[12px]">{word} </span>
                                ) : (
                                    <>{word} </>
                                )}
                            </React.Fragment>
                        ))}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[#6B7280] text-lg font-bold mb-12 max-w-lg leading-relaxed opacity-80"
                    >
                        {t('appDescription')}
                    </motion.p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 mb-12">
                        {[
                            { icon: Smartphone, title: t('mobileTrackingTitle'), desc: t('mobileTrackingDesc') },
                            { icon: Globe, title: t('globalRoutesTitle'), desc: t('globalRoutesDesc') },
                            { icon: ShieldCheck, title: t('liveUpdatesTitle'), desc: t('liveUpdatesDesc') },
                            { icon: Headphones, title: t('supportTitle'), desc: t('supportDesc') }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center lg:items-start gap-4 group cursor-default"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[#5845D8]/5 flex items-center justify-center text-[#5845D8] group-hover:bg-[#5845D8] group-hover:text-white transition-all duration-300 transform group-hover:-rotate-6">
                                    <item.icon size={22} />
                                </div>
                                <div>
                                    <h4 className="font-black text-[#5845D8] text-sm uppercase tracking-widest mb-2 group-hover:text-[#5845D8] transition-colors">{item.title}</h4>
                                    <p className="text-[13px] text-[#6B7280] font-bold leading-relaxed opacity-60">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex flex-wrap justify-center lg:justify-start gap-4"
                    >
                        <img src="/app-store.svg" alt="App Store" className="h-[50px] cursor-pointer hover:scale-105 active:scale-95 transition-transform drop-shadow-md" />
                        <img src="/google-play.svg" alt="Google Play" className="h-[50px] cursor-pointer hover:scale-105 active:scale-95 transition-transform drop-shadow-md" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const TrackingSection = () => {
    const { t } = useLanguage();
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
                    <h2 className="text-4xl md:text-5xl font-bold text-[#012126] mb-6 leading-tight tracking-tight">
                        {t('realTimeTrackingTitle').split('. ').map((part, i) => (
                            <React.Fragment key={i}>
                                {part}{i === 0 ? '.' : ''} <br />
                            </React.Fragment>
                        ))}
                    </h2>
                    <p className="text-[#6B7280] text-base font-medium leading-relaxed mb-8 max-w-md">
                        {t('realTimeTrackingDesc')}
                    </p>
                    <Link to="/search" className="inline-block bg-[#5845D8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4838B5] transition-colors">
                        {t('checkLiveStatusBtn')}
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
                    <h2 className="text-4xl md:text-5xl font-black text-[#012126] mb-8">
                        {t('testimonialTitle')}
                    </h2>
                    <div className="relative">
                        <p className="text-[#012126] text-xl font-medium leading-relaxed mb-8 italic">
                            {t('testimonialQuote')}
                        </p>
                        <p className="text-[#012126] font-bold text-lg">
                            {t('testimonialAuthor')}
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-1/2">
                    <img
                        src="/assets/two_people_car.png"
                        alt="Friends in car"
                        className="rounded-3xl w-full h-auto shadow-xl"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1530685933970-53e349c5a757?auto=format&fit=crop&q=80'; }}
                    />
                </div>
            </div>
        </section>
    );
};

export default function Home() {
    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <TripTypeSection />
            <FAQSection />
            <AppPromotionSection />
            <CommunityCTA />
            <TrackingSection />
            <CarSection />
            <DiscountPromo />
            <Footer />
        </div>
    );
}

// Add keyframes for float animation in tailwind if not already present
// or add it inline if needed, but assuming global css might have it or we can add it here
// Since we can't easily add global css from here, I'll use inline styles or standard framer motion if available
// but for simplicity, the float animation can be a standard tailwind class if defined.
