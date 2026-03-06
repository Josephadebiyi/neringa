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
    const [fromCountry, setFromCountry] = useState(null);
    const [toCountry, setToCountry] = useState(null);
    const [date, setDate] = useState('');

    const handleSearch = () => {
        const searchParams = new URLSearchParams();
        if (fromCountry) searchParams.append('from', fromCountry.value);
        if (toCountry) searchParams.append('to', toCountry.value);
        if (date) searchParams.append('date', date);
        navigate(`/search?${searchParams.toString()}`);
    };

    const customSelectStyles = {
        control: (base) => ({
            ...base,
            minHeight: '56px',
            borderRadius: '16px',
            border: '2px solid #E5E7EB',
            boxShadow: 'none',
            '&:hover': { borderColor: '#5845D8' }
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#5845D8' : state.isFocused ? '#F3F4F6' : 'white',
            color: state.isSelected ? 'white' : '#111827'
        })
    };

    return (
        <div className="relative bg-gradient-to-br from-[#054752] via-[#054752] to-[#032c33] text-white overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5845D8]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 px-6 md:px-12 max-w-[1240px] mx-auto py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
                            {t('heroTitle') || 'Global Package Delivery.'}
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-gray-200 font-medium">
                            {t('heroSubtitle') || 'Send packages'} <span className="font-bold text-white">{t('heroWith') || 'with courier partners.'}</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <button
                                onClick={() => navigate('/post-trip')}
                                className="group bg-white text-[#054752] px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-3 hover:scale-105"
                            >
                                <Plane size={24} />
                                {t('shareRide') || 'Post a trip'}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/send-package')}
                                className="bg-[#5845D8] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#4534B8] transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-500/30"
                            >
                                <Package size={24} />
                                Send Package
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                            <div>
                                <div className="text-3xl font-black mb-1">150+</div>
                                <div className="text-sm text-gray-300 font-medium">Countries</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black mb-1">10K+</div>
                                <div className="text-sm text-gray-300 font-medium">Active Users</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black mb-1">50K+</div>
                                <div className="text-sm text-gray-300 font-medium">Deliveries</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right - Search Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white rounded-[32px] p-8 shadow-2xl"
                    >
                        <h3 className="text-2xl font-black text-[#054752] mb-6">Find Your Route</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">
                                    {t('leavingFrom') || 'Departure Country or City'}
                                </label>
                                <Select
                                    options={locations}
                                    value={fromCountry}
                                    onChange={setFromCountry}
                                    placeholder="Select departure..."
                                    styles={customSelectStyles}
                                    className="text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">
                                    {t('goingTo') || 'Arrival Country or City'}
                                </label>
                                <Select
                                    options={locations}
                                    value={toCountry}
                                    onChange={setToCountry}
                                    placeholder="Select arrival..."
                                    styles={customSelectStyles}
                                    className="text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">
                                    {t('today') || 'Date'}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 text-gray-800 font-medium focus:outline-none focus:border-[#5845D8] transition"
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4534B8] transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-500/30"
                            >
                                <Search size={20} />
                                {t('search') || 'Search'}
                            </button>
                        </div>
                    </motion.div>
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
            icon: <Package size={32} />,
            title: t('featureTitle1') || 'Send everywhere',
            desc: t('featureDesc1') || 'Send packages safely to any city. Our delivery partners go everywhere you need.',
            color: 'bg-purple-50 text-purple-600'
        },
        {
            icon: <Plane size={32} />,
            title: t('featureTitle2') || 'Earn from luggage space',
            desc: t('featureDesc2') || 'Turn your extra luggage space into cash. A simple way to subsidize your travel costs.',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            icon: <ShieldCheck size={32} />,
            title: t('featureTitle3') || 'Trust built-in',
            desc: t('featureDesc3') || 'We verify every delivery partner and sender. Your package is in safe hands, every step of the way.',
            color: 'bg-green-50 text-green-600'
        }
    ];

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-20">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-4">Why Choose Bago?</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">The smartest way to send and earn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100"
                    >
                        <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-2xl font-black text-[#054752] mb-3">{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

// FAQ Section
const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            q: "How does Bago work?",
            a: "Bago connects travelers with people who need to send packages. Travelers post their routes and available luggage space, while senders find travelers going their route and request delivery."
        },
        {
            q: "Is my package insured?",
            a: "Yes! Every verified shipment is backed by our Insurance Protection Policy through our secure escrow system."
        },
        {
            q: "How do I get paid as a courier?",
            a: "Once you successfully deliver a package, the escrow funds are released immediately to your Bago wallet. You can withdraw via Stripe Connect or Paystack."
        },
        {
            q: "What items are prohibited?",
            a: "Prohibited items include weapons, illegal substances, hazardous materials, and perishables. Travelers have the right to inspect packages before accepting."
        }
    ];

    return (
        <section className="px-6 md:px-12 max-w-[1000px] mx-auto py-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-4">Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600">Everything you need to know</p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
                        >
                            <span className="font-bold text-[#054752] text-lg">{faq.q}</span>
                            {openIndex === idx ? <Minus size={20} className="text-[#5845D8]" /> : <Plus size={20} className="text-gray-400" />}
                        </button>
                        {openIndex === idx && (
                            <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

// CTA Section
const CTASection = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-20">
            <div className="bg-gradient-to-r from-[#5845D8] to-[#764ba2] rounded-[40px] p-12 md:p-16 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to get started?</h2>
                    <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                        Join thousands of travelers and senders worldwide. Start saving money or earning extra income today.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-white text-[#5845D8] px-10 py-4 rounded-2xl font-black text-lg hover:shadow-2xl transition-all"
                        >
                            Sign Up Free
                        </button>
                        <button
                            onClick={() => navigate('/how-it-works')}
                            className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all"
                        >
                            Learn More
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Main Home Component
export default function HomeNew() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <FAQSection />
            <CTASection />
            <Footer />
        </div>
    );
}
