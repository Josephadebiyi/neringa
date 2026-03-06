import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function Footer() {
    const navigate = useNavigate();
    const { t, currentLanguage, setLanguage, languages, currentLangData, currency, setCurrency, currencies, currentCurrencyData } = useLanguage();

    return (
        <footer className="bg-[#f2f2f2] pt-16 pb-12 mt-10">
            <div className="px-6 md:px-12 max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Ship with Bago</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/search" className="hover:text-[#5845D8] transition-colors">{t('home')}</Link>
                        <Link to="/track" className="hover:text-[#5845D8] transition-colors">{t('track')}</Link>
                        <Link to="/send-package" className="hover:text-[#5845D8] transition-colors">{t('sendPackageTitle')}</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Travel with Bago</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/post-trip" className="hover:text-[#5845D8] transition-colors">{t('shareRide')}</Link>
                        <Link to="/how-it-works" className="hover:text-[#5845D8] transition-colors">{t('howItWorks')}</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Find out more</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <Link to="/about" className="hover:text-[#5845D8] transition-colors">{t('about')}</Link>
                        <Link to="/help" className="hover:text-[#5845D8] transition-colors">Help Centre</Link>
                        <Link to="/terms" className="hover:text-[#5845D8] transition-colors">Terms and Conditions</Link>
                        <Link to="/privacy" className="hover:text-[#5845D8] transition-colors">Privacy Policy</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <h4 className="font-bold text-[#054752] text-md">Regional Settings</h4>

                    {/* Language Selector */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Language</label>
                        <div className="relative inline-block w-full">
                            <select
                                value={currentLanguage}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#054752] appearance-none outline-none focus:border-[#5845D8] transition-all cursor-pointer"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Currency Selector */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Currency</label>
                        <div className="relative inline-block w-full">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#054752] appearance-none outline-none focus:border-[#5845D8] transition-all cursor-pointer"
                            >
                                {currencies.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag} {c.code} ({c.symbol})</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-2">
                        <img src="/app-store.svg" alt="App Store" className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                        <img src="/google-play.svg" alt="Google Play" className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 max-w-[1240px] mx-auto border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-[12px] font-bold text-[#708c91]">
                <div className="flex items-center gap-2 mb-4 md:mb-0 grayscale opacity-70">
                    <img src="/bago_logo.png" alt="Bago" className="h-4 w-auto" />
                    <span>Bago, 2026 ©</span>
                </div>
                <div className="flex gap-8">
                    <p className="hover:text-[#054752] transition-colors cursor-default">Trusted by travelers worldwide</p>
                    <p className="hover:text-[#054752] transition-colors cursor-default">Secure Payments by Stripe</p>
                </div>
            </div>
        </footer>
    );
}
