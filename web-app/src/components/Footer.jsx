import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function Footer() {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData, currency, setCurrency, currencies, currentCurrencyData } = useLanguage();

    return (
        <footer className="bg-white text-[#054752] pt-24 pb-12 mt-20 relative overflow-hidden border-t border-gray-100">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#5845D8]/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
            <div className="px-6 md:px-12 max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-16 mb-24 relative z-10">
                <div className="lg:col-span-1">
                    <Link to="/" className="flex items-center mb-8">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10" />
                    </Link>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-xs mb-6">
                        Building the most human-centric logistics network in the world. Ship fast, send anywhere.
                    </p>

                    {/* App Store Buttons */}
                    <div className="flex flex-col gap-3 mt-6">
                        <a href="#" className="block">
                            <img src="/app-store.svg" alt="Download on App Store" className="h-10 hover:opacity-80 transition" />
                        </a>
                        <a href="#" className="block">
                            <img src="/google-play.svg" alt="Get it on Google Play" className="h-10 hover:opacity-80 transition" />
                        </a>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <h4 className="font-black text-[#054752] text-lg uppercase tracking-widest text-[12px] opacity-40">Ship with Bago</h4>
                    <div className="flex flex-col gap-4 text-[15px] font-bold text-gray-600">
                        <Link to="/search" className="hover:text-[#5845D8] transition-colors">{t('home')}</Link>
                        <Link to="/track" className="hover:text-[#5845D8] transition-colors">{t('track')}</Link>
                        <Link to="/send-package" className="hover:text-[#5845D8] transition-colors">{t('sendPackageTitle')}</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <h4 className="font-black text-[#054752] text-lg uppercase tracking-widest text-[12px] opacity-40">Travel with Bago</h4>
                    <div className="flex flex-col gap-4 text-[15px] font-bold text-gray-600">
                        <Link to="/post-trip" className="hover:text-[#5845D8] transition-colors">{t('shareRide')}</Link>
                        <Link to="/how-it-works" className="hover:text-[#5845D8] transition-colors">{t('howItWorks')}</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <h4 className="font-black text-[#054752] text-lg uppercase tracking-widest text-[12px] opacity-40">Find out more</h4>
                    <div className="flex flex-col gap-4 text-[15px] font-bold text-gray-600">
                        <Link to="/about" className="hover:text-[#5845D8] transition-colors">{t('about')}</Link>
                        <Link to="/help" className="hover:text-[#5845D8] transition-colors">Help Centre</Link>
                        <Link to="/terms" className="hover:text-[#5845D8] transition-colors">Terms and Conditions</Link>
                        <Link to="/privacy" className="hover:text-[#5845D8] transition-colors">Privacy Policy</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-8">
                    <h4 className="font-black text-[#054752] text-lg uppercase tracking-widest text-[12px] opacity-40">Settings</h4>

                    <div className="flex flex-col gap-4">
                        <div className="relative inline-block w-full">
                            <select
                                value={currentLanguage}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-[#054752] appearance-none outline-none focus:border-[#5845D8] transition-all cursor-pointer"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code} className="bg-white text-[#054752]">{lang.flag} {lang.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative inline-block w-full">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-[#054752] appearance-none outline-none focus:border-[#5845D8] transition-all cursor-pointer"
                            >
                                {currencies.map(c => (
                                    <option key={c.code} value={c.code} className="bg-white text-[#054752]">{c.flag} {c.code} ({c.symbol})</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 max-w-[1400px] mx-auto border-t border-gray-100 pt-12 flex flex-col md:flex-row justify-between items-center text-[13px] font-bold text-gray-400 relative z-10">
                <div className="flex items-center gap-4 mb-6 md:mb-0">
                    <div className="h-6 w-px bg-gray-100 hidden md:block"></div>
                    <span>Bago Network, 2026 © All rights reserved.</span>
                </div>
                <div className="flex flex-wrap justify-center gap-10">
                    <p className="hover:text-[#054752] transition-colors cursor-default">Global Logistics Network</p>
                    <p className="hover:text-[#054752] transition-colors cursor-default">Secure Payments by Stripe & Paystack</p>
                    <p className="text-[#5845D8]">Secure System Active</p>
                </div>
            </div>
        </footer>
    );
}
