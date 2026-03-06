import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
    ChevronLeft,
    Search,
    Send,
    UserCheck,
    TrendingUp,
    Package,
    ShieldCheck,
    CreditCard,
    CheckCircle,
    ArrowRight,
    Globe
} from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#012126] hover:text-[#5845D8] transition-all group font-bold">
                    <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    <span>{t('back')}</span>
                </button>
            </div>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10" />
            </Link>
            <div className="w-20 hidden md:block"></div>
        </nav>
    );
};

export default function HowToUse() {
    const { t } = useLanguage();

    const senderSteps = [
        { icon: Search, title: t('senderStep1Title'), desc: t('senderStep1Desc'), color: 'bg-blue-50', textColor: 'text-blue-600' },
        { icon: UserCheck, title: t('senderStep2Title'), desc: t('senderStep2Desc'), color: 'bg-blue-50', textColor: 'text-blue-600' },
        { icon: CreditCard, title: t('senderStep3Title'), desc: t('senderStep3Desc'), color: 'bg-blue-50', textColor: 'text-blue-600' },
        { icon: CheckCircle, title: t('senderStep4Title'), desc: t('senderStep4Desc'), color: 'bg-blue-50', textColor: 'text-blue-600' }
    ];

    const travelerSteps = [
        { icon: Globe, title: t('travelerStep1Title'), desc: t('travelerStep1Desc'), color: 'bg-purple-50', textColor: 'text-purple-600' },
        { icon: Package, title: t('travelerStep2Title'), desc: t('travelerStep2Desc'), color: 'bg-purple-50', textColor: 'text-purple-600' },
        { icon: ShieldCheck, title: t('travelerStep3Title'), desc: t('travelerStep3Desc'), color: 'bg-purple-50', textColor: 'text-purple-600' },
        { icon: CreditCard, title: t('travelerStep4Title'), desc: t('travelerStep4Desc'), color: 'bg-purple-50', textColor: 'text-purple-600' }
    ];

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            {/* Header */}
            <header className="relative py-24 px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#5845D8]/5 rounded-full blur-[100px] -ml-32 -mt-32"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#B0891D]/5 rounded-full blur-[100px] -mr-40 -mb-40"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-6xl md:text-9xl font-black text-[#012126] mb-12 tracking-tighter leading-[0.85]">
                        How Bago <span className="opacity-20 text-gray-400">works.</span>
                    </h1>
                    <p className="text-[#6B7280] text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                        Whether you're sending a gift to a loved one or monetizing your extra luggage space, Bago makes the process seamless, secure, and stress-free.
                    </p>
                </div>
            </header>

            {/* Toggle Section */}
            <section className="px-6 md:px-12 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* For Senders */}
                        <div className="bg-white rounded-[40px] p-10 md:p-14 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                                    <Send size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-[#012126]">{t('forSenders')}</h2>
                            </div>

                            <div className="space-y-12">
                                {senderSteps.map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center flex-shrink-0 ${step.textColor} font-bold text-lg`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-[#012126] mb-2">{step.title}</h4>
                                            <p className="text-[#6B7280] font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* For Travelers */}
                        <div className="bg-white rounded-[40px] p-10 md:p-14 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-purple-50 text-purple-600 rounded-3xl">
                                    <TrendingUp size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-[#012126]">{t('forTravelers')}</h2>
                            </div>

                            <div className="space-y-12">
                                {travelerSteps.map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center flex-shrink-0 ${step.textColor} font-bold text-lg`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-[#012126] mb-2">{step.title}</h4>
                                            <p className="text-[#6B7280] font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Prohibited Items */}
            <section className="py-24 px-6 md:px-12 bg-white mt-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold inline-block mb-4">Safety First</div>
                        <h2 className="text-4xl font-black text-[#012126] mb-4 tracking-tight">{t('prohibitedItems')}</h2>
                        <p className="text-[#6B7280] font-medium leading-relaxed">
                            {t('prohibitedSubtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { name: 'Illegal Substances', icon: '🚫' },
                            { name: 'Flammable Items', icon: '🔥' },
                            { name: 'Live Animals', icon: '🐾' },
                            { name: 'Prescription Drugs', icon: '💊' },
                            { name: 'Perishable Food', icon: '🍎' },
                            { name: 'Liquid Liquids', icon: '💧' },
                            { name: 'Aerosol Sprays', icon: '💨' },
                            { name: 'Weaponry', icon: '⚔️' }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-[#f8f9fa] rounded-3xl border border-gray-100 hover:border-red-100 transition-colors">
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <p className="text-[#012126] font-semibold text-sm">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 px-6 md:px-12 bg-[#F8F6F3]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div className="bg-white p-12 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
                            <ShieldCheck className="text-[#6B5CFF] mb-8" size={48} />
                            <h3 className="text-3xl font-black text-[#012126] mb-6 tracking-tight">{t('openPackagePolicy')}</h3>
                            <p className="text-[#6B7280] font-medium leading-relaxed text-lg">
                                {t('openPackageDesc')}
                            </p>
                        </div>
                        <div className="bg-white p-12 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all">
                            <ShieldCheck className="text-[#00D094] mb-8" size={48} />
                            <h3 className="text-3xl font-black text-[#012126] mb-6 tracking-tight">{t('insuranceProtection')}</h3>
                            <p className="text-[#6B7280] font-medium leading-relaxed text-lg">
                                {t('insuranceDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="bg-black rounded-[60px] p-12 md:p-24 text-center text-white relative overflow-hidden max-w-6xl mx-auto shadow-2xl">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-[#6B5CFF]/10 rounded-full blur-[120px] -ml-48"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00D094]/10 rounded-full blur-[120px] -mr-48"></div>

                    <h2 className="text-5xl md:text-8xl font-black mb-12 relative z-10 leading-[0.9] tracking-tighter">Ready to <span className="opacity-20">get started?</span></h2>
                    <p className="text-white/50 text-xl font-medium mb-16 max-w-2xl mx-auto leading-relaxed relative z-10">
                        Join thousands of members already trusting Bago for their logistics and travel needs.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                        <Link to="/signup" className="px-16 py-6 bg-[#00D094] text-black font-black rounded-full text-2xl shadow-xl hover:scale-105 transition-all">
                            Create Account
                        </Link>
                        <Link to="/search" className="px-16 py-6 bg-white/10 border border-white/20 text-white font-black rounded-full text-2xl shadow-xl hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                            Find Routes <ArrowRight size={28} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
