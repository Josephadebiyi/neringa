import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, MapPin, Calendar, Users, Package, Plane, CheckCircle, ChevronDown,
    Globe, PlusCircle, UserCircle, ArrowRight, Bus, Car, ShieldCheck, Check,
    Smartphone, Menu, X, AlertCircle, Calculator, CreditCard, Headphones, Plus, Minus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../AuthContext';
import Select from 'react-select';
import { locations } from '../utils/countries';
import Footer from '../components/Footer';

// Navbar Component
const Navbar = () => {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData, currency, setCurrency, currencies } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0 shadow-sm">
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-10 items-center">
                <button onClick={() => navigate('/about')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('about') || 'Who we are'}
                </button>
                <button onClick={() => navigate('/how-it-works')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('howItWorks') || 'How it works'}
                </button>
                <button onClick={() => navigate('/track')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">
                    {t('track') || 'Track'}
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
                        <span className="text-sm font-medium text-[#054752]">{currentLangData?.code?.toUpperCase()}</span>
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
                                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${currentLanguage === lang.code ? 'bg-purple-50' : ''}`}
                                >
                                    <span className="text-[24px]">{lang.flag}</span>
                                    <span className="text-sm font-medium text-[#054752]">{lang.name}</span>
                                    {currentLanguage === lang.code && <Check size={16} className="ml-auto text-[#5845D8]" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Auth Buttons */}
                {!isAuthenticated ? (
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#054752] font-bold text-[15px] px-6 py-2.5 rounded-full hover:bg-gray-50 transition-all"
                        >
                            {t('login') || 'Login'}
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-[#5845D8] text-white font-bold text-[15px] px-6 py-2.5 rounded-full hover:bg-[#4534B8] transition-all shadow-lg shadow-purple-500/30"
                        >
                            {t('signup') || 'Sign up'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="hidden md:flex items-center gap-2 bg-[#5845D8] text-white font-bold text-[15px] px-6 py-2.5 rounded-full hover:bg-[#4534B8] transition-all"
                    >
                        <UserCircle size={18} />
                        {t('dashboard') || 'Dashboard'}
                    </button>
                )}

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden text-[#054752] p-2"
                >
                    {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg md:hidden z-40">
                    <div className="flex flex-col p-6 space-y-4">
                        <button onClick={() => { navigate('/about'); setShowMobileMenu(false); }} className="text-[#054752] font-semibold text-left">
                            {t('about') || 'About'}
                        </button>
                        <button onClick={() => { navigate('/how-it-works'); setShowMobileMenu(false); }} className="text-[#054752] font-semibold text-left">
                            {t('howItWorks') || 'How it works'}
                        </button>
                        <button onClick={() => { navigate('/track'); setShowMobileMenu(false); }} className="text-[#054752] font-semibold text-left">
                            {t('track') || 'Track'}
                        </button>
                        {!isAuthenticated ? (
                            <>
                                <button onClick={() => { navigate('/login'); setShowMobileMenu(false); }} className="text-[#054752] font-bold">
                                    {t('login') || 'Login'}
                                </button>
                                <button onClick={() => { navigate('/signup'); setShowMobileMenu(false); }} className="bg-[#5845D8] text-white font-bold px-6 py-3 rounded-full">
                                    {t('signup') || 'Sign up'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => { navigate('/dashboard'); setShowMobileMenu(false); }} className="bg-[#5845D8] text-white font-bold px-6 py-3 rounded-full">
                                {t('dashboard') || 'Dashboard'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

// Hero Section Component
const HeroSection = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="relative bg-white pt-8 pb-12 overflow-hidden">
            {/* Background Image with subtle overlay */}
            <div className="absolute inset-0 z-0 opacity-5">
                <img
                    src="/assets/hero_bg.png"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="relative z-10 px-6 md:px-12 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="py-12"
                    >
                        <span className="px-3 py-1 bg-[#5845D8]/5 text-[#5845D8] border border-[#5845D8]/10 rounded-full text-[10px] font-black uppercase tracking-wider mb-6 inline-block">The Future of Logistics</span>
                        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-[#054752] mb-6 tracking-tight leading-[1.1]">
                            Move stuff. <br />
                            <span className="text-[#5845D8]">Make money.</span>
                        </h1>
                        <p className="text-[#708c91] text-base md:text-lg font-medium mb-8 max-w-md leading-relaxed">
                            Join the world's most human-centric logistics network. Send packages faster or earn while you travel.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-8 py-3.5 bg-[#5845D8] text-white font-bold rounded-xl text-[15px] shadow-lg shadow-[#5845D8]/20 hover:shadow-[#5845D8]/40 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                Get started free
                                <ArrowRight size={20} />
                            </button>
                            <button
                                onClick={() => navigate('/how-it-works')}
                                className="px-8 py-3.5 bg-white border-2 border-gray-100 text-[#054752] font-bold rounded-xl text-[15px] hover:border-[#5845D8]/30 hover:bg-gray-50 transition-all"
                            >
                                How it works
                            </button>
                        </div>

                        {/* App Store Buttons In Hero */}
                        <div className="flex items-center gap-4">
                            <a href="#" className="hover:scale-105 transition-transform duration-300">
                                <img src="/app-store.svg" alt="App Store" className="h-9 w-auto" />
                            </a>
                            <a href="#" className="hover:scale-105 transition-transform duration-300">
                                <img src="/google-play.svg" alt="Google Play" className="h-9 w-auto" />
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="relative hidden lg:block"
                    >
                        <div className="rounded-[40px] overflow-hidden shadow-2xl border-4 border-white group relative">
                            <img
                                src="/assets/hero_bago_group.png"
                                alt="Premium Traveler Bago"
                                className="w-full h-auto object-cover scale-100 group-hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// Search Section (Below Hero)
const SearchSection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [fromCountry, setFromCountry] = useState(null);
    const [toCountry, setToCountry] = useState(null);
    const [date, setDate] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (fromCountry) params.append('origin', fromCountry.label);
        if (toCountry) params.append('destination', toCountry.label);
        if (date) params.append('date', date);
        navigate(`/search?${params.toString()}`);
    };

    const customSelectStyles = {
        control: (base) => ({
            ...base,
            border: 'none',
            boxShadow: 'none',
            background: 'transparent',
            minHeight: 'auto',
            padding: '2px 0',
        }),
        placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }),
        singleValue: (base) => ({ ...base, color: '#054752', fontSize: '12px', fontWeight: '700' }),
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
    };

    return (
        <div className="relative z-20 px-6 md:px-12 max-w-[1100px] mx-auto -mt-8 mb-16">
            <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-2 md:p-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                    <div className="group flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-[#5845D8]/5 flex items-center justify-center text-[#5845D8]">
                            <MapPin size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Leaving From</p>
                            <Select
                                options={locations}
                                value={fromCountry}
                                onChange={setFromCountry}
                                placeholder="Departure City"
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>
                    </div>

                    <div className="group flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-[#5845D8]/5 flex items-center justify-center text-[#5845D8]">
                            <MapPin size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">Going To</p>
                            <Select
                                options={locations}
                                value={toCountry}
                                onChange={setToCountry}
                                placeholder="Arrival City"
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>
                    </div>

                    <div className="group flex items-center gap-3 px-5 py-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-[#5845D8]/5 flex items-center justify-center text-[#5845D8]">
                            <Calendar size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">When</p>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-transparent font-bold text-[#054752] text-[12px] outline-none cursor-pointer"
                                placeholder="Select date"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-3 md:py-0 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5845D8]/10"
                    >
                        <Search size={18} />
                        Search Routes
                    </button>
                </div>
            </div>
        </div>
    );
};

// Features Section
const FeaturesSection = () => {
    const { t } = useLanguage();
    const features = [
        {
            icon: ShieldCheck,
            title: 'Insurance Online Payments',
            desc: 'With Bago your money is safe at all times. Bago uses a secure payment system and you have a guaranteed refund.',
            color: 'bg-purple-50 text-[#5845D8]'
        },
        {
            icon: Package,
            title: 'Guaranteed Delivery',
            desc: 'If a traveler cancels your order or delivers an item in poor condition, we will process a full refund and find a new route.',
            color: 'bg-indigo-50 text-[#5845D8]'
        },
        {
            icon: CreditCard,
            title: 'Multiple Payment Options',
            desc: 'We accept a variety of payment methods such as Visa, MasterCard and American Express, with more options available soon.',
            color: 'bg-blue-50 text-[#5845D8]'
        },
        {
            icon: Calculator,
            title: 'No Hidden Fees',
            desc: 'Total transparency. Bago uses smart logic to calculate applicable rates and taxes before you post your order.',
            color: 'bg-violet-50 text-[#5845D8]'
        },
        {
            icon: UserCircle,
            title: 'Verified Community',
            desc: 'At Bago, trust is our highest priority. We work hard to ensure that our community treats all its members with respect.',
            color: 'bg-fuchsia-50 text-[#5845D8]'
        },
        {
            icon: Headphones,
            title: '24/7 Support',
            desc: 'Our team of customer service professionals are at your disposal to resolve any incident that may arise.',
            color: 'bg-slate-50 text-[#5845D8]'
        }
    ];

    return (
        <section className="px-6 md:px-12 max-w-[1200px] mx-auto py-16 mb-4">
            <div className="text-center mb-12">
                <span className="px-3 py-1 bg-[#5845D8]/5 text-[#5845D8] rounded-full text-[9px] font-black uppercase tracking-[2px] mb-3 inline-block">The Bago Guarantee</span>
                <h2 className="text-3xl md:text-[40px] font-bold text-[#054752] mb-4 tracking-tight">Safe, secure and seamless.</h2>
                <p className="text-base text-[#708c91] max-w-xl mx-auto font-medium">We've built a platform based on trust and reliability.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="group bg-white rounded-[32px] p-8 border border-gray-100 hover:border-[#5845D8]/20 transition-all duration-500 hover:shadow-[0_15px_35px_-12px_rgba(0,0,0,0.08)] relative overflow-hidden"
                    >
                        <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:scale-110 duration-500`}>
                            <feature.icon size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-[#054752] mb-3 relative z-10 tracking-tight">{feature.title}</h3>
                        <p className="text-[#708c91] leading-relaxed font-medium text-sm relative z-10">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

// FAQ Section
const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(0);
    const navigate = useNavigate();

    const faqs = [
        {
            q: "How does Bago work?",
            a: "Bago connects travelers with people who need to send packages. Travelers post routes and available space, while senders find matches and ship via our secure platform."
        },
        {
            q: "Is my package insured?",
            a: "Absolutely! Every verified shipment is backed by our Insurance Protection Policy and processed through our secure escrow system for total peace of mind."
        },
        {
            q: "How do I get paid as a courier?",
            a: "Upon successful delivery and recipient confirmation, funds are released to your Bago wallet immediately. You can withdraw to your bank via Stripe or Paystack."
        },
        {
            q: "What items can I send?",
            a: "You can send almost anything—clothing, electronics, gifts, documents—as long as they are not illegal, hazardous, or prohibited by international laws."
        }
    ];

    return (
        <section className="bg-black py-20 px-6 md:px-12 mt-12 rounded-t-[48px]">
            <div className="max-w-[1240px] mx-auto flex flex-col xl:flex-row gap-16">
                <div className="flex-1">
                    <span className="px-3 py-1 bg-white/10 text-white/50 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Help Center</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 leading-[1.1] tracking-tight">
                        Here are Answers Related to <span className="text-[#5845D8]">Bago Services.</span>
                    </h2>

                    <div className="mt-12 relative w-full h-[400px] overflow-hidden rounded-[32px] group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                        <img
                            src="/assets/traveler_join.png"
                            alt="Join our community"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute bottom-10 left-10 z-20 max-w-sm">
                            <h3 className="text-2xl font-bold text-white mb-6 leading-tight">Join us in building the rails that will power the future of logistics.</h3>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-8 py-3.5 bg-[#5845D8] text-white font-bold rounded-xl shadow-lg hover:shadow-[#5845D8]/30 transition-all flex items-center gap-2 text-sm"
                            >
                                Get started free
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 pt-10">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className={`rounded-2xl border transition-all cursor-pointer ${openIndex === idx ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 hover:border-white/20'}`}
                            onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                        >
                            <div className="px-8 py-6 flex items-center justify-between gap-4">
                                <h4 className="text-lg font-bold text-white/90 leading-tight tracking-tight">{faq.q}</h4>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${openIndex === idx ? 'bg-[#5845D8] text-white rotate-180' : 'bg-white/10 text-white'}`}>
                                    {openIndex === idx ? <Minus size={16} /> : <Plus size={16} />}
                                </div>
                            </div>
                            <AnimatePresence>
                                {openIndex === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-8 pb-6 text-white/50 text-sm font-medium leading-relaxed max-w-lg">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Brands/Partners Section
const BrandsSection = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16 bg-white">
            <div className="text-center mb-12">
                <span className="px-3 py-1 bg-[#5845D8]/5 text-[#5845D8] border border-[#5845D8]/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Partnership</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#054752] mt-6 leading-[1.1] tracking-tight">
                    Built in <span className="opacity-20 border-b-4 border-gray-100 italic">partnership</span> with <br className="hidden md:block" /> top global logistics networks.
                </h2>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-30 grayscale filter invert-[0.1]">
                <div className="text-xl md:text-2xl font-black italic tracking-tighter text-[#054752]">DHL EXPRESS</div>
                <div className="text-xl md:text-2xl font-black italic tracking-tighter text-[#054752]">FEDEX GLOBAL</div>
                <div className="text-xl md:text-2xl font-black italic tracking-tighter text-[#054752]">UPS LOGISTICS</div>
                <div className="text-xl md:text-2xl font-black italic tracking-tighter text-[#054752]">AIR FRANCE</div>
                <div className="text-xl md:text-2xl font-black italic tracking-tighter text-[#054752]">EMIRATES SKY</div>
            </div>
        </section>
    );
};

// Main Home Component
export default function HomeNew() {
    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans selection:bg-[#5845D8] selection:text-white">
            <Navbar />
            <HeroSection />
            <SearchSection />
            <FeaturesSection />
            <FAQSection />
            <BrandsSection />
            <Footer />
        </div>
    );
}
