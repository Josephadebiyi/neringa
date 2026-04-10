import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, Shield, Scale, Package, ShieldCheck } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8] transition-all font-bold text-xs">
                <ChevronLeft size={20} />
                <span>{t('back')}</span>
            </button>
            <Link to="/">
                <img src="/bago_logo.png" alt="Bago" className="h-7 md:h-8" />
            </Link>
            <div className="w-16 hidden md:block"></div>
        </nav>
    );
};

export default function Terms() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-6 font-sans">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-3xl font-black text-[#012126] mb-3 tracking-tight">{t('termsConditions')}</h1>
                    <p className="text-[#6B7280] font-bold text-[10px] uppercase tracking-[2px] opacity-60">Last Updated: March 6, 2026</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#5845D8]/5 rounded-bl-[60px]"></div>

                    <div className="prose prose-slate max-w-none space-y-12">
                        <section>
                            <div className="flex items-center gap-2.5 mb-5 text-[#5845D8]">
                                <Scale size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('acceptanceTerms')}</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80 px-2 lg:px-4">
                                {t('acceptanceDesc')}
                            </p>
                        </section>

                        <section className="bg-blue-50/40 -mx-8 md:-mx-12 p-8 md:p-12 border-y border-blue-50/50">
                            <div className="flex items-center gap-2.5 mb-5 text-blue-600">
                                <Package size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('openPackagePolicy')}</h2>
                            </div>
                            <p className="text-[#012126] leading-relaxed font-black text-[11px] mb-5 uppercase tracking-widest px-2 lg:px-4">
                                {t('safetyCompliance')}
                            </p>
                            <ul className="text-[#6B7280] leading-relaxed font-bold space-y-3 list-none p-0 px-2 lg:px-4">
                                {[t('openPackageDesc1'),
                                t('openPackageDesc2'),
                                t('openPackageDesc3'),
                                t('openPackageDesc4')].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-[11px] uppercase tracking-wide opacity-70">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-2.5 mb-5 text-amber-600">
                                <ShieldCheck size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('verificationKYC')}</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80 px-2 lg:px-4">
                                {t('verificationDesc')}
                                <br /><br />
                                <strong className="text-[#012126] font-black">Duplicate Accounts:</strong> {t('duplicateAccounts')}
                            </p>
                        </section>

                        <section className="bg-purple-50/40 -mx-8 md:-mx-12 p-8 md:p-12 border-y border-purple-50/50 text-[12px]">
                            <div className="flex items-center gap-2.5 mb-5 text-purple-600">
                                <Shield size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('protectionPolicy')}</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold uppercase tracking-wide opacity-80 px-2 lg:px-4 mb-5">
                                {t('protectionDesc')}
                            </p>
                            <ul className="text-[#6B7280] leading-relaxed font-bold space-y-3 list-none p-0 px-2 lg:px-4">
                                {[t('protectionPolicy1'),
                                t('protectionPolicy2'),
                                t('protectionPolicy3')].map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-[11px] uppercase tracking-wide opacity-70">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="px-2 lg:px-4">
                            <h2 className="text-base font-black text-[#012126] mb-4 uppercase tracking-tight">{t('prohibitions')}</h2>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-70">
                                {t('prohibitionsDesc')}
                            </p>
                        </section>

                        <section className="pt-8 border-t border-gray-100 text-center">
                            <p className="text-[#6B7280] font-black text-[10px] uppercase tracking-[2px]">
                                {t('questions')}
                                <Link to="/help" className="text-[#5845D8] ml-2 underline hover:text-[#4838B5] transition-colors">{t('questionsHelpCenter')}</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
