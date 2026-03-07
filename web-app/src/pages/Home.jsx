import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, MapPin, Calendar, Package, Plane, CheckCircle, ChevronDown,
    Globe, PlusCircle, UserCircle, ArrowRight, Bus, ShieldCheck, Check,
    Smartphone, Menu, X, AlertCircle, Calculator, CreditCard, Headphones,
    Plus, Minus, Star
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import api from '../api';
import RecentTrips from '../components/RecentTrips';
import Select from 'react-select';
import { locations } from '../utils/countries';
import Footer from '../components/Footer';

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
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="flex items-center gap-2 bg-[#5845D8]/5 border border-[#5845D8]/20 px-4 py-2 rounded-full hover:bg-[#5845D8]/10 transition-all group">
                            <div className="w-7 h-7 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-xs uppercase">
                                {user?.firstName?.charAt(0) || user?.email?.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-[#012126]">Dashboard</span>
                        </Link>
                    ) : (
                        <Link to="/login" className="flex items-center gap-2 px-5 py-2 bg-[#5845D8] text-white rounded-full font-bold text-sm hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/20">
                            <UserCircle size={18} className="text-white/80" />
                            Login / Signup
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
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-4">Currency</p>
                                    <div className="flex flex-wrap gap-2">
                                        {currencies.map((c) => (
                                            <button key={c} onClick={() => { setCurrency(c); setShowMobileMenu(false); }}
                                                className={`px-3 py-2 rounded-xl border text-xs font-black transition-all ${currency === c ? 'border-[#5845D8] bg-[#5845D8] text-white' : 'border-gray-100 bg-gray-50 text-[#012126]'}`}>
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
    const navigate = useNavigate();
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
                        <div className="flex gap-2">
                            <a href="#" className="hover:opacity-80 transition-opacity hover:scale-105 transform duration-200">
                                <img src="/app-store.svg" alt="App Store" className="h-8 w-auto" />
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity hover:scale-105 transform duration-200">
                                <img src="/google-play.svg" alt="Google Play" className="h-8 w-auto" />
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
        if (origin) params.append('origin', origin.city);
        if (destination) params.append('destination', destination.city);
        if (date) params.append('date', date);
        navigate(`/search?${params.toString()}`);
    };

    const customStyles = {
        control: (b) => ({ ...b, border: 'none', boxShadow: 'none', background: 'transparent', minHeight: 'auto' }),
        valueContainer: (b) => ({ ...b, padding: '0 8px' }),
        input: (b) => ({ ...b, margin: 0, padding: 0 }),
        placeholder: (b) => ({ ...b, color: '#9CA3AF', fontSize: '14px', fontWeight: '500' }),
        singleValue: (b) => ({ ...b, color: '#012126', fontSize: '14px', fontWeight: '600' }),
        indicatorsContainer: (b) => ({ ...b, display: 'none' }),
        menu: (b) => ({ ...b, zIndex: 9999 }),
        menuPortal: (b) => ({ ...b, zIndex: 9999 }),
    };

    return (
        <div className="w-full px-6 md:px-12 max-w-[1100px] mx-auto -mt-1 mb-4 relative z-40">
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-gray-100">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch">
                    <div className="flex w-full md:w-[32%] items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                        <MapPin size={18} className="text-[#9CA3AF] mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">{t('leavingFromLabel') || 'Leaving From'}</p>
                            <Select options={locationOptions} value={origin} onChange={setOrigin}
                                placeholder={t('pickCityPlaceHolder') || 'Pick a city'}
                                styles={customStyles} isClearable menuPortalTarget={document.body} menuPosition="fixed" />
                        </div>
                    </div>
                    <div className="flex w-full md:w-[32%] items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                        <MapPin size={18} className="text-[#9CA3AF] mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">{t('goingToLabel') || 'Going To'}</p>
                            <Select options={locationOptions} value={destination} onChange={setDestination}
                                placeholder={t('pickCityPlaceHolder') || 'Pick a city'}
                                styles={customStyles} isClearable menuPortalTarget={document.body} menuPosition="fixed" />
                        </div>
                    </div>
                    <div className="flex w-full md:w-[24%] items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100">
                        <Calendar size={18} className="text-[#9CA3AF] mr-3 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 mb-0.5">{t('departureDateLabel') || 'Departure Date'}</p>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="outline-none text-sm font-semibold w-full bg-transparent text-[#012126] cursor-pointer" />
                        </div>
                    </div>
                    <button type="submit"
                        className="w-full md:w-[12%] px-6 bg-[#5845D8] text-white py-4 font-bold hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 rounded-b-2xl md:rounded-b-none md:rounded-r-2xl text-sm">
                        <Search size={18} />
                        <span className="hidden md:inline">{t('search') || 'Search'}</span>
                        <span className="md:hidden">Search</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   FEATURES SECTION (6 circular icons)
───────────────────────────────────────────── */
const FeaturesSection = () => {
    const { t } = useLanguage();

    const features = [
        { icon: ShieldCheck, title: t('featureTitleInsurance') || 'Insurance Online Payments', desc: t('featureDescInsurance') || 'With Bago your money is safe at all times. Secure payment system with guaranteed refund.', color: 'bg-[#5845D8]/10 text-[#5845D8]' },
        { icon: Package, title: t('featureTitleGuaranteed') || 'Guaranteed delivery', desc: t('featureDescGuaranteed') || 'If a traveler cancels or delivers in poor condition, we process a full refund.', color: 'bg-[#5845D8]/10 text-[#5845D8]' },
        { icon: CreditCard, title: t('featureTitleOptions') || 'Multiple Payment Options', desc: t('featureDescOptions') || 'We accept Visa, MasterCard, American Express and more options coming soon.', color: 'bg-[#5845D8]/10 text-[#5845D8]' },
        { icon: Calculator, title: t('featureTitleNoHidden') || 'No Hidden Fees', desc: t('featureDescNoHidden') || 'Machine learning calculates rates and taxes before you post. Know exactly what you pay.', color: 'bg-[#5845D8]/10 text-[#5845D8]' },
        { icon: UserCircle, title: t('featureTitleCommunity') || 'Community of Verified Senders and Travelers', desc: t('featureDescCommunity') || 'Trust is our highest priority. We ensure our community treats all members with respect.', color: 'bg-[#5845D8]/10 text-[#5845D8]' },
        { icon: Headphones, title: t('featureTitleSupport') || '24/7 support', desc: t('featureDescSupport') || 'Our customer service professionals are at your disposal to resolve any incident.', color: 'bg-[#fef2f2] text-[#ef4444]' },
    ];

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-16">
                {features.map((f, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                        <div className={`w-28 h-28 ${f.color} rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500`}>
                            <f.icon size={52} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-[17px] font-bold text-[#012126] mb-3">{f.title}</h3>
                        <p className="text-[#6B7280] text-sm font-medium leading-relaxed px-2">{f.desc}</p>
                    </div>
                ))}
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

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-10 pb-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#012126] text-center mb-10 tracking-tighter leading-[0.9]">
                {(() => {
                    const title = t('tripTypeTitle') || 'How are you shipping today?';
                    const words = title.split(' ');
                    return words.map((word, i) =>
                        i === words.length - 1
                            ? <span key={i} className="opacity-20 text-gray-400">{word}</span>
                            : <React.Fragment key={i}>{word} </React.Fragment>
                    );
                })()}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                    { icon: Plane, label: t('byFlight') || 'By flight', desc: t('byFlightDesc') || 'Fly with travelers and send your packages faster.', mode: 'flight' },
                    { icon: Bus, label: t('byBus') || 'By bus', desc: t('byBusDesc') || 'Send your packages with bus travelers.', mode: 'bus' },
                ].map((item) => (
                    <div key={item.mode}
                        onClick={() => navigate(`/search?mode=${item.mode}`)}
                        className="bg-[#f0f4f5] rounded-2xl p-7 flex items-center gap-5 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.015] group">
                        <div className="bg-white p-3.5 rounded-xl shadow-sm">
                            <item.icon size={36} className="text-[#5845D8]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-[#012126]">{item.label}</h3>
                            <p className="text-[#6B7280] font-medium text-sm mt-0.5">{item.desc}</p>
                        </div>
                        <div className="bg-[#5845D8] rounded-full p-2 group-hover:bg-[#4838B5] transition-colors">
                            <ArrowRight size={18} className="text-white" />
                        </div>
                    </div>
                ))}
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
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-0">
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
const AppSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-20">
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Phone mockup */}
                <div className="w-full md:w-5/12 flex justify-center">
                    <div className="relative">
                        <img
                            src="/mobile-mockup.png"
                            alt="Bago App"
                            className="w-[260px] md:w-[300px] h-auto drop-shadow-2xl"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                </div>
                {/* Text */}
                <div className="w-full md:w-7/12">
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-[#012126] mb-8 leading-[0.9] tracking-tighter">
                        {(() => {
                            const title = t('ourFreeAppTitle') || 'Our free app.';
                            const words = title.split(' ');
                            return words.map((word, i) =>
                                i === words.length - 1
                                    ? <span key={i} className="opacity-20 text-gray-400">{word}</span>
                                    : <React.Fragment key={i}>{word} </React.Fragment>
                            );
                        })()}
                    </h2>
                    <p className="text-[#6B7280] text-base font-medium leading-relaxed mb-8 max-w-md">
                        {t('appDescription') || 'One app for every step of your journey—global package delivery planning has never been easier! Search routes, track shipments, and message travelers on the go.'}
                    </p>
                    <div className="grid grid-cols-2 gap-6 mb-10">
                        {[
                            { label: t('mobileTrackingTitle') || 'Mobile tracking', desc: t('mobileTrackingDesc') || 'Watch your package move in real-time.' },
                            { label: t('globalRoutesTitle') || 'Global routes', desc: t('globalRoutesDesc') || 'Send anywhere from New York to Lagos.' },
                            { label: t('liveUpdatesTitle') || 'Live updates', desc: t('liveUpdatesDesc') || 'Get notified for every hand-off.' },
                            { label: t('supportTitle') || 'Human support', desc: t('supportDesc') || 'Chat with our 24/7 support team.' },
                        ].map((item, i) => (
                            <div key={i}>
                                <p className="font-black text-[#012126] text-sm mb-1">{item.label}</p>
                                <p className="text-[#6B7280] text-xs font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <a href="#" className="hover:opacity-80 transition-opacity hover:scale-105 transform duration-200">
                            <img src="/app-store.svg" alt="App Store" className="h-11 w-auto" />
                        </a>
                        <a href="#" className="hover:opacity-80 transition-opacity hover:scale-105 transform duration-200">
                            <img src="/google-play.svg" alt="Google Play" className="h-11 w-auto" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ─────────────────────────────────────────────
   COMMUNITY CTA (full-width bg image)
───────────────────────────────────────────── */
const CommunityCTA = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="w-full relative py-28 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1400"
                    alt="Global Community"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
            </div>
            <div className="relative z-10 text-center px-6">
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.9]">
                    {(() => {
                        const title = t('joinGlobalCommunity') || 'Join our global community';
                        const words = title.split(' ');
                        return words.map((word, i) =>
                            i === words.length - 1
                                ? <span key={i} className="opacity-20">{word}</span>
                                : <React.Fragment key={i}>{word} </React.Fragment>
                        );
                    })()}
                </h2>
                <div className="flex flex-col md:flex-row gap-5 justify-center">
                    <button onClick={() => navigate('/search')}
                        className="px-10 py-4 bg-[#5845D8] text-white font-bold rounded-lg text-base hover:bg-[#4838B5] transition-all min-w-[220px] shadow-lg">
                        {t('sendWithBago') || 'Send with Bago'}
                    </button>
                    <button onClick={() => navigate('/post-trip')}
                        className="px-10 py-4 bg-[#5845D8] text-white font-bold rounded-lg text-base hover:bg-[#4838B5] transition-all min-w-[220px] shadow-lg">
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
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-20">
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* phone */}
                <div className="w-full md:w-5/12 flex justify-center">
                    <img
                        src="/mobile-mockup.png"
                        alt="Bago App Mockup"
                        className="w-[260px] md:w-[300px] h-auto drop-shadow-2xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                {/* text */}
                <div className="w-full md:w-7/12">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#012126] leading-tight tracking-tight mb-6">
                        {t('realTimeTrackingTitle') || <>Real-time tracking.<br />Total peace of<br />mind.</>}
                    </h2>
                    <p className="text-[#6B7280] text-base font-medium leading-relaxed mb-8 max-w-md">
                        {t('realTimeTrackingDesc') || 'Follow your package every step of the way. From pickup to delivery, you will know exactly where your items are and when they will arrive.'}
                    </p>
                    <Link to="/search"
                        className="inline-block bg-[#5845D8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4838B5] transition-colors text-sm shadow-lg shadow-[#5845D8]/20">
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
                    <h2 className="text-4xl md:text-5xl font-black text-[#012126] mb-8">
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

/* ─────────────────────────────────────────────
   DISCOUNT PROMO BANNER
───────────────────────────────────────────── */
const DiscountPromo = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-12 pb-16">
            <div className="bg-gradient-to-r from-[#5845D8] to-[#8B5CF6] rounded-3xl p-8 md:p-12 shadow-[0_8px_40px_rgba(88,69,216,0.25)] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="z-10 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-black mb-3 flex items-center justify-center md:justify-start gap-3 tracking-tight">
                        <Smartphone className="text-white/80" size={32} />
                        {t('firstDeliveryFree') || 'Get Your First Delivery Free!'}
                    </h2>
                    <p className="text-white/85 text-sm font-medium max-w-lg leading-relaxed">
                        {t('discountPromoDesc') || 'Sign up today and get your first package delivered to any destination for free, or a 100% bonus on your first payout as a courier.'}
                    </p>
                </div>
                <div className="z-10 bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md text-center shrink-0 w-full md:w-auto">
                    <p className="text-xs font-bold text-white mb-2 uppercase tracking-widest">
                        {t('usePromoCode') || 'Use Promo Code'}
                    </p>
                    <div className="bg-white text-[#5845D8] px-8 py-4 rounded-xl font-black text-3xl tracking-wider shadow-inner">
                        BAGO10
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                        {t('validNewUsers') || 'Valid for new users only.'}
                    </p>
                </div>
            </div>
        </section>
    );
};

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
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans">
            <Navbar />
            <HeroSection />
            <StickySearch />
            <div className="h-6" />
            <RecentTrips user={user} />
            <PromoBar />
            <AppSection />
            <TripTypeSection />
            <FAQSection />
            <FeaturesSection />
            <CommunityCTA />
            <DiscountPromo />
            <Footer />
        </div>
    );
}
