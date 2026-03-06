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
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#054752] hover:text-[#5845D8] transition-all group font-bold text-xs">
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
                    <h1 className="text-5xl md:text-7xl font-black text-[#054752] mb-10 tracking-tighter leading-[0.9]">
                        Re-imagine <span className="opacity-15 text-gray-400">logistics.</span>
                    </h1>
                    <p className="text-sm md:text-base text-[#708c91] font-bold leading-relaxed max-w-xl mx-auto uppercase tracking-wide">
                        We're building the most human-centric logistics network in the world. Bago connects travelers with people who need to send packages globally.
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
                        <h2 className="text-2xl md:text-3xl font-black text-[#054752] mb-6 leading-tight tracking-tight">{t('storyTitle')}</h2>
                        <p className="text-[#708c91] text-xs font-bold leading-relaxed mb-4 uppercase tracking-wider opacity-80">
                            {t('storyDesc1')}
                        </p>
                        <p className="text-[#708c91] text-xs font-bold leading-relaxed uppercase tracking-wider opacity-80">
                            {t('storyDesc2')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6 md:px-12 font-sans">
                <div className="max-w-[1240px] mx-auto text-center mb-16">
                    <h2 className="text-2xl font-black text-[#054752] mb-3 tracking-tight">{t('coreValues')}</h2>
                    <p className="text-[#708c91] font-bold text-xs uppercase tracking-widest">The principles that guide every feature we build.</p>
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
                            <h3 className="text-xl font-black text-[#054752] mb-4 tracking-tight">{v.title}</h3>
                            <p className="text-[#708c91] font-bold leading-relaxed text-[11px] uppercase tracking-wider opacity-70">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#054752] py-16 px-6 overflow-hidden relative font-sans">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center text-white relative z-10">
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">50k+</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">Packages Sent</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">10k+</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">Verified Travelers</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">120+</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">Countries Covered</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black mb-1 tracking-tight">4.9/5</div>
                        <div className="text-white/40 font-black uppercase tracking-[2px] text-[9px]">Average Rating</div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center font-sans">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl font-black text-[#054752] mb-5 tracking-tight">Join the movement.</h2>
                    <p className="text-[#708c91] text-xs font-bold mb-10 leading-relaxed uppercase tracking-widest opacity-80">
                        Become part of the most human-centric logistics network in the world.
                        Start sending or start earning today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup" className="px-10 py-4 bg-[#00D094] text-[#054752] font-black rounded-xl shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-widest">
                            {t('signup')}
                        </Link>
                        <Link to="/search" className="px-10 py-4 border border-[#054752] text-[#054752] font-black rounded-xl hover:bg-[#054752] hover:text-white transition-all text-sm uppercase tracking-widest">
                            {t('search')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
