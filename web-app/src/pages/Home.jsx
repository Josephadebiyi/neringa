import React, { useState, useEffect } from 'react';
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
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import api from '../api';
import RecentTrips from '../components/RecentTrips';

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
                <button onClick={() => navigate('/search?mode=carpool')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('carpool')}
                </button>
                <button onClick={() => navigate('/search?mode=bus')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('bus')}
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
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden flex items-center"
                >
                    {showMobileMenu ? <X size={24} className="text-[#054752]" /> : <Menu size={24} className="text-[#054752]" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {
                showMobileMenu && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-40">
                        <div className="px-6 py-4 space-y-4">
                            <button onClick={() => navigate('/search?mode=carpool')} className="block w-full text-left text-[#054752] font-semibold py-2">
                                {t('carpool')}
                            </button>
                            <button onClick={() => navigate('/search?mode=bus')} className="block w-full text-left text-[#054752] font-semibold py-2">
                                {t('bus')}
                            </button>
                            <Link to="/post-trip" className="block text-[#5845D8] font-semibold py-2">
                                {t('offerRide')}
                            </Link>

                            {/* Mobile Language Selector */}
                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Language</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setShowMobileMenu(false);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${currentLanguage === lang.code
                                                ? 'border-[#5845D8] bg-purple-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="text-[20px]">{lang.flag}</span>
                                            <span className="text-sm font-medium">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
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

    const [originCountry, setOriginCountry] = useState('');
    const [originCity, setOriginCity] = useState('');
    const [destinationCountry, setDestinationCountry] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.country_name) {
                    // Check if detected country is in our list, otherwise keep it empty or add it
                    setOriginCountry(data.country_name);
                }
                if (data.city) {
                    setOriginCity(data.city);
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
        if (originCity) params.append('origin', originCity);
        if (destinationCity) params.append('destination', destinationCity);
        if (date) params.append('date', date);

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="sticky top-[75px] z-50 w-full px-6 md:px-12 max-w-[1240px] mx-auto">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col relative overflow-hidden -mt-8 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch w-full">
                    <div className="flex w-full md:w-1/5 items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100 group">
                        <MapPin size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <select
                            value={originCountry}
                            onChange={(e) => setOriginCountry(e.target.value)}
                            className="outline-none text-sm font-medium w-full bg-transparent text-[#054752] appearance-none cursor-pointer"
                            required
                        >
                            <option value="" disabled>Departure Country</option>
                            {BAGO_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            {originCountry && !BAGO_COUNTRIES.includes(originCountry) && <option value={originCountry}>{originCountry}</option>}
                        </select>
                    </div>
                    <div className="flex w-full md:w-1/5 items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100 group">
                        <MapPin size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <input
                            type="text"
                            value={originCity}
                            onChange={(e) => setOriginCity(e.target.value)}
                            placeholder="Departure City"
                            className="outline-none text-sm font-medium w-full bg-transparent text-[#054752] placeholder-[#708c91]"
                            required
                        />
                    </div>
                    <div className="flex w-full md:w-1/5 items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100 group">
                        <MapPin size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <select
                            value={destinationCountry}
                            onChange={(e) => setDestinationCountry(e.target.value)}
                            className="outline-none text-sm font-medium w-full bg-transparent text-[#054752] appearance-none cursor-pointer"
                            required
                        >
                            <option value="" disabled>Destination Country</option>
                            {BAGO_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex w-full md:w-1/5 items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100 group">
                        <MapPin size={20} className="text-[#708c91] mr-3 flex-shrink-0" />
                        <input
                            type="text"
                            value={destinationCity}
                            onChange={(e) => setDestinationCity(e.target.value)}
                            placeholder="Destination City"
                            className="outline-none text-sm font-medium w-full bg-transparent text-[#054752] placeholder-[#708c91]"
                            required
                        />
                    </div>
                    <div className="flex w-full md:w-1/5 items-center px-4 py-4 border-b md:border-b-0 md:border-r border-gray-100">
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
                        className="w-full md:w-auto px-8 bg-[#5845D8] text-white py-4 font-bold hover:bg-[#4838B5] transition-all hover:shadow-lg flex items-center justify-center gap-2"
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
            <div className="bg-[#0b4d4a] rounded-3xl p-10 md:p-14 text-center shadow-lg relative overflow-hidden">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Earn from your travels.</h2>
                <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
                    Help others send packages while you travel by bus or flight. It's simple: publish your trip, deliver the package, and earn money for your luggage space.
                </p>
                <Link to="/post-trip" className="inline-flex items-center gap-3 bg-white text-[#054752] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all">
                    <span>Post my trip</span>
                </Link>
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <div className="flex flex-col gap-4">
                    <div className="bg-[#f0f4f5] p-3 rounded-xl inline-block w-fit">
                        <Package size={28} className="text-[#5845D8]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#054752]">Deliver your packages safely</h3>
                    <p className="text-[#708c91] font-medium leading-relaxed">Send packages safely to any city. Our travelers go everywhere you need.</p>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-[#f0f4f5] p-3 rounded-xl inline-block w-fit">
                        <CheckCircle size={28} className="text-[#5845D8]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#054752]">Trusted Travelers</h3>
                    <p className="text-[#708c91] font-medium leading-relaxed">We verify every traveler and sender. Your package is in safe hands, every step of the way.</p>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-[#f0f4f5] p-3 rounded-xl inline-block w-fit">
                        <Plane size={28} className="text-[#5845D8]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#054752]">Luggage Space</h3>
                    <p className="text-[#708c91] font-medium leading-relaxed">Turn your extra luggage space into cash. A simple way to subsidize your travel costs.</p>
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

const RatingsSection = () => {
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16">
            <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2">
                    <img
                        src="/rating_app.png"
                        alt="App rating"
                        className="rounded-3xl w-full h-auto shadow-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>
                <div className="w-full md:w-1/2">
                    <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-6 leading-tight">
                        {t('ratingsTitle')}<br />
                        {t('ratingsSubtitle')}<br />
                        {t('ratingsSubtitle2')}
                    </h2>
                    <p className="text-[#708c91] text-[16px] font-medium leading-relaxed mb-8">
                        {t('ratingsDesc')}
                    </p>
                    <Link to="/search" className="inline-block bg-[#5845D8] text-white px-10 py-3 rounded-full font-bold hover:bg-[#4838B5] transition-colors shadow-lg hover:shadow-xl">
                        {t('getGoing')}
                    </Link>
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
                    <div className="w-full max-w-[300px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border-[8px] border-gray-900 border-b-[12px] transform transition-transform hover:-translate-y-2 duration-500">
                        {/* Dynamic Island Notch */}
                        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-30">
                            <div className="w-24 h-6 bg-black rounded-b-[1.2rem] border border-black text-center flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-[#1b1c1e] relative right-3 shadow-inner"></span>
                            </div>
                        </div>

                        {/* Top Header Section */}
                        <div className="bg-[#5845D8] pt-12 pb-14 px-5 text-center z-20 shadow-sm relative rounded-b-[2rem]">
                            <div className="absolute top-10 left-5">
                                <ArrowRight className="text-white rotate-180" size={18} />
                            </div>
                            <h3 className="text-white text-sm font-bold opacity-100 mb-6">Delivery Status</h3>

                            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-3 backdrop-blur-sm shadow-inner">
                                <Package size={28} className="text-[#FFD166]" />
                            </div>
                            <h4 className="text-white font-extrabold text-lg mb-0.5">Nintendo Switch Oled</h4>
                            <p className="text-white/80 text-[11px] font-medium">Order ID: JB39029910020</p>
                        </div>

                        {/* Overlapping Card Section */}
                        <div className="flex-1 bg-white pt-6 px-6 overflow-hidden -mt-8 z-20 relative rounded-3xl shadow-[0_-8px_20px_rgba(0,0,0,0.1)] mx-3 mb-4 flex flex-col">
                            <div className="mb-5">
                                <h5 className="font-extrabold text-[#054752] text-xs mb-2">Status Order</h5>
                                <div className="bg-[#85e0a3]/30 text-[#2fa554] text-[10px] font-bold px-3 py-1.5 rounded-full w-fit">In Delivery Courier</div>
                            </div>

                            {/* Status Timeline */}
                            <div className="relative border-l-2 border-gray-100 ml-2.5 mt-2 space-y-6 flex-1">
                                <div className="relative pl-6">
                                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-[#5845D8] border-2 border-white shadow-sm"></div>
                                    <p className="text-[11px] font-extrabold text-[#054752] leading-none mb-1.5">Request Accepted</p>
                                    <p className="text-[9px] text-gray-400 font-medium">10:00 am • Feb 2th 2023</p>
                                </div>
                                <div className="relative pl-6">
                                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-[#5845D8] border-2 border-white shadow-sm"></div>
                                    <p className="text-[11px] font-extrabold text-[#054752] leading-none mb-1.5">Parcel Picked</p>
                                    <p className="text-[9px] text-gray-400 font-medium">10:30 am • Feb 2th 2023</p>
                                </div>
                                <div className="relative pl-6 before:content-[''] before:absolute before:left-[1px] before:top-4 before:-bottom-6 before:w-[2px] before:bg-gradient-to-b before:from-[#5845D8] before:to-gray-100">
                                    <div className="absolute -left-[8px] top-0 w-3.5 h-3.5 rounded-full bg-[#5845D8] border-2 border-white shadow-sm z-10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    </div>
                                    <p className="text-[11px] font-extrabold text-[#054752] leading-none mb-1.5">On The Way</p>
                                    <p className="text-[9px] text-gray-400 font-medium">11:00 am • Feb 2th 2023</p>
                                </div>
                                <div className="relative pl-6 opacity-40">
                                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-gray-200 border-2 border-white shadow-sm z-10"></div>
                                    <p className="text-[11px] font-extrabold text-gray-500 leading-none mb-1.5">Delivered</p>
                                    <p className="text-[9px] text-gray-400 font-medium">Pending</p>
                                </div>
                            </div>
                        </div>
                    </div>
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
            <RatingsSection />
            <TrackingSection />
            <CarSection />
            <DiscountPromo />
            <Footer />
        </div>
    );
}
