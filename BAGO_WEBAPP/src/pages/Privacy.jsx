import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, Lock, Eye, Database, Globe } from 'lucide-react';

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

export default function Privacy() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-6 font-sans">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-3xl font-black text-[#012126] mb-3 tracking-tight">{t('privacyPolicy')}</h1>
                    <p className="text-[#6B7280] font-bold text-[10px] uppercase tracking-[2px] opacity-60">Last Updated: March 6, 2026</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#B0891D]/5 rounded-bl-[60px]"></div>

                    <div className="prose prose-slate max-w-none space-y-12">
                        <section className="bg-green-50/20 -mx-8 md:-mx-12 p-8 md:p-12 border-b border-green-50/50">
                            <div className="flex items-center gap-2.5 mb-5 text-green-600">
                                <Globe size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('gdprCompliance')}</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80 px-2 lg:px-4">
                                {t('gdprDesc')}
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-2.5 mb-5 text-[#012126]">
                                <Database size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('informationCollect')}</h2>
                            </div>
                            <div className="space-y-5 px-2 lg:px-4">
                                <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80">
                                    {t('infoCollectIntro')}
                                </p>
                                <ul className="text-[#6B7280] leading-relaxed font-bold space-y-3 list-none p-0">
                                    {[
                                        { label: t('identityDataLabel'), value: t('identityDataDesc') },
                                        { label: t('contactDataLabel'), value: t('contactDataDesc') },
                                        { label: t('travelDataLabel'), value: t('travelDataDesc') },
                                        { label: t('financialDataLabel'), value: t('financialDataDesc') }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-[11px] uppercase tracking-wide opacity-70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0"></span>
                                            <span className="flex flex-col">
                                                <span className="text-[#012126] font-black">{item.label}</span>
                                                <span>{item.value}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2.5 mb-5 text-[#5845D8]">
                                <Lock size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('useOfData')}</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80 px-2 lg:px-4">
                                {t('useOfDataDesc')}
                            </p>
                        </section>

                        <section className="bg-yellow-50/40 -mx-8 md:-mx-12 p-8 md:p-12 border-y border-yellow-50/50">
                            <div className="flex items-center gap-2.5 mb-5 text-[#B0891D]">
                                <Eye size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">{t('dataRights')}</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[11px] mb-6 uppercase tracking-widest px-2 lg:px-4">
                                {t('dataRightsIntro')}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 lg:px-4">
                                {[
                                    { title: t('rightAccessTitle'), desc: t('rightAccessDesc') },
                                    { title: t('rightErasureTitle'), desc: t('rightErasureDesc') },
                                    { title: t('rightRectificationTitle'), desc: t('rightRectificationDesc') },
                                    { title: t('rightPortabilityTitle'), desc: t('rightPortabilityDesc') }
                                ].map((right, i) => (
                                    <div key={i} className="flex flex-col p-4 bg-white/50 rounded-2xl border border-yellow-100/50 hover:border-yellow-200 transition-colors">
                                        <span className="font-black text-[#012126] text-[10px] uppercase tracking-widest mb-1">{right.title}</span>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter line-clamp-2 leading-tight">{right.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="px-2 lg:px-4">
                            <h2 className="text-base font-black text-[#012126] mb-4 uppercase tracking-tight">{t('dataSecurity')}</h2>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-70">
                                {t('dataSecurityDesc')}
                            </p>
                        </section>

                        <section className="pt-8 border-t border-gray-100 text-center">
                            <p className="text-[#6B7280] font-black text-[10px] uppercase tracking-[2px]">
                                {t('exerciseRights')}
                                <a href="mailto:privacy@sendwithbago.com" className="text-[#5845D8] ml-2 underline hover:text-[#4838B5] transition-colors">{t('contactOfficer')}</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
