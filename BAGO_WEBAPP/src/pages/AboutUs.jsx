import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
    ChevronLeft,
    Globe,
    ShieldCheck,
    Users,
    TrendingUp,
    Target,
    Heart
} from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    return (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8] transition-all group font-bold text-xs">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>{t('back')}</span>
                </button>
            </div>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-7 md:h-8" />
            </Link>
            <div className="w-16 hidden md:block"></div>
        </nav>
    );
};

export default function AboutUs() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <section className="relative overflow-hidden pt-16 pb-24 px-6 max-w-[1240px] mx-auto font-sans">
                <div className="text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-black text-[#012126] mb-10 tracking-tighter leading-[0.9]">
                        {t('reimagineLogistics').split(' ').map((word, i) => word.toLowerCase() === 'logistics.' ? <span key={i} className="opacity-15 text-gray-400">{word}</span> : <React.Fragment key={i}>{word} </React.Fragment>)}
                    </h1>
                    <p className="text-sm md:text-base text-[#6B7280] font-bold leading-relaxed max-w-xl mx-auto uppercase tracking-wide">
                        {t('aboutSummary')}
                    </p>
                </div>
            </section>

            {/* Our Story */}
            <section className="bg-white py-20 px-6 md:px-12 font-sans">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <img
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"
                            alt="Our Team"
                            className="relative rounded-[40px] shadow-xl z-10 w-full h-[450px] object-cover"
                        />
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#00D094] rounded-full blur-3xl opacity-20"></div>
                    </div>
                    <div className="px-4">
                        <div className="flex items-center gap-2 text-[#5845D8] font-black mb-4 uppercase tracking-[3px] text-[10px]">
                            <span className="w-8 h-[2px] bg-[#5845D8]"></span>
                            {t('ourStory')}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#012126] mb-6 leading-tight tracking-tight">{t('storyTitle')}</h2>
                        <p className="text-[#6B7280] text-xs font-bold leading-relaxed mb-4 uppercase tracking-wider opacity-80">
                            {t('storyDesc1')}
                        </p>
                        <p className="text-[#6B7280] text-xs font-bold leading-relaxed uppercase tracking-wider opacity-80">
                            {t('storyDesc2')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Founders */}
            <section className="bg-[#EEF8FB] py-20 px-6 md:px-12 font-sans">
                <div className="max-w-[1240px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center mb-14">
                        <div>
                            <div className="flex items-center gap-2 text-[#5845D8] font-black mb-4 uppercase tracking-[3px] text-[10px]">
                                <span className="w-8 h-[2px] bg-[#5845D8]"></span>
                                Founders
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-[#012126] tracking-tighter leading-[0.95] mb-7">
                                Built by brothers with one shared mission
                            </h2>
                            <div className="space-y-5 text-[#667085] text-sm md:text-base font-bold leading-relaxed">
                                <p>
                                    Bago was founded to make international delivery feel closer, safer and more human.
                                    The company is led by twin brothers who combine product vision, operational discipline
                                    and engineering craft to build a trusted logistics network for everyday people.
                                </p>
                                <p>
                                    Together, Solomon and Joseph are shaping Bago into a platform where verified travelers,
                                    senders and small businesses can move goods across borders with confidence.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[32px] bg-white p-4 shadow-sm border border-white">
                            <img
                                src="/assets/bago-market-community.jpg"
                                alt="Bago community"
                                className="w-full h-[280px] md:h-[420px] object-cover rounded-[24px]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-start">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {[
                                {
                                    initials: 'SK',
                                    name: 'Solomon Kehinde Olukayode Ogunsanya',
                                    role: 'CEO & Co-founder',
                                    accent: 'from-[#5845D8] to-[#7C6FFF]',
                                },
                                {
                                    initials: 'JT',
                                    name: 'Joseph Taiwo Adebiyi Ogunsanya',
                                    role: 'CTO & Co-founder',
                                    accent: 'from-[#00D094] to-[#00B8D9]',
                                },
                            ].map((founder) => (
                                <article key={founder.role} className="bg-white rounded-[28px] p-5 border border-white shadow-sm">
                                    <div className={`h-56 rounded-[22px] bg-gradient-to-br ${founder.accent} relative overflow-hidden flex items-center justify-center mb-5`}>
                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-black/10" />
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full" />
                                        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/15 rounded-full" />
                                        <div className="w-24 h-24 rounded-full bg-white/20 border border-white/30 backdrop-blur flex items-center justify-center text-white text-3xl font-black tracking-tight">
                                            {founder.initials}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-[#5845D8] uppercase tracking-[0.18em] mb-2">
                                        {founder.role}
                                    </p>
                                    <h3 className="text-lg font-black text-[#012126] leading-tight tracking-tight">
                                        {founder.name}
                                    </h3>
                                </article>
                            ))}
                        </div>

                        <div className="pt-2 lg:pt-4">
                            <h3 className="text-3xl md:text-5xl font-black text-[#012126] tracking-tighter leading-tight mb-8">
                                Our <span className="text-[#1683D8]">leadership team</span>
                            </h3>
                            <div className="space-y-6 text-[#667085] text-sm md:text-base font-bold leading-relaxed">
                                <p>
                                    <span className="text-[#1683D8] font-black">Solomon Kehinde Olukayode Ogunsanya</span>,
                                    our CEO, leads Bago's company vision, partnerships and market strategy.
                                </p>
                                <p>
                                    <span className="text-[#1683D8] font-black">Joseph Taiwo Adebiyi Ogunsanya</span>,
                                    our CTO, leads the technology, infrastructure and product systems behind Bago's
                                    trusted shipping experience.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                                    {[
                                        { icon: Target, label: 'Mission-led' },
                                        { icon: ShieldCheck, label: 'Trust-first' },
                                        { icon: Heart, label: 'Community-built' },
                                    ].map(({ icon: Icon, label }) => (
                                        <div key={label} className="rounded-[18px] bg-white px-4 py-4 border border-white shadow-sm">
                                            <Icon size={18} className="text-[#5845D8] mb-3" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#012126]">
                                                {label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6 md:px-12 font-sans">
                <div className="max-w-[1240px] mx-auto text-center mb-16">
                    <h2 className="text-2xl font-black text-[#012126] mb-3 tracking-tight">{t('coreValues')}</h2>
                    <p className="text-[#6B7280] font-bold text-xs uppercase tracking-widest">{t('coreValuesSubtitle')}</p>
                </div>
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: ShieldCheck,
                            title: t('trustSafety'),
                            desc: t('trustDesc'),
                            color: 'bg-blue-50 text-blue-500'
                        },
                        {
                            icon: Globe,
                            title: t('globalCommunity'),
                            desc: t('globalDesc'),
                            color: 'bg-[#00D094]/5 text-[#00D094]'
                        },
                        {
                            icon: TrendingUp,
                            title: t('innovation'),
                            desc: t('innovationDesc'),
                            color: 'bg-purple-50 text-purple-500'
                        }
                    ].map((v, i) => (
                        <div key={i} className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-2">
                            <div className={`w-14 h-14 ${v.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm`}>
                                <v.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black text-[#012126] mb-4 tracking-tight">{v.title}</h3>
                            <p className="text-[#6B7280] font-bold leading-relaxed text-[11px] uppercase tracking-wider opacity-70">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#012126] py-16 px-6 overflow-hidden relative font-sans">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center text-white relative z-10">
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">50k+</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">{t('packagesSent')}</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">10k+</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">{t('verifiedTravelers')}</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">120+</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">{t('countriesCovered')}</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">4.9/5</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">{t('averageRating')}</div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center font-sans">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl font-black text-[#012126] mb-5 tracking-tight">{t('joinMovement')}</h2>
                    <p className="text-[#6B7280] text-xs font-bold mb-10 leading-relaxed uppercase tracking-widest opacity-80">
                        {t('joinMovementDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup" className="px-10 py-4 bg-[#00D094] text-[#012126] font-black rounded-xl shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-widest">
                            {t('signup')}
                        </Link>
                        <Link to="/search" className="px-10 py-4 border border-[#012126] text-[#012126] font-black rounded-xl hover:bg-[#012126] hover:text-white transition-all text-sm uppercase tracking-widest">
                            {t('search')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
