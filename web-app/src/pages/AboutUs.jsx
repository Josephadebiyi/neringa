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
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#054752] hover:text-[#5845D8] transition-all group font-bold">
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

export default function AboutUs() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <section className="relative overflow-hidden pt-24 pb-32 px-6 max-w-[1400px] mx-auto">
                <div className="text-center relative z-10">
                    <h1 className="text-6xl md:text-9xl font-black text-[#054752] mb-12 tracking-tighter leading-[0.85]">
                        Re-imagine <span className="opacity-20 text-gray-400">logistics.</span>
                    </h1>
                    <p className="text-xl text-[#708c91] font-medium leading-relaxed max-w-2xl mx-auto">
                        We're building the most human-centric logistics network in the world. Bago connects travelers with people who need to send packages globally.
                    </p>
                </div>
            </section>

            {/* Our Story */}
            <section className="bg-white py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <img
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"
                            alt="Our Team"
                            className="relative rounded-[50px] shadow-2xl z-10 w-full h-[600px] object-cover"
                        />
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#00D094] rounded-full blur-2xl opacity-30"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 text-[#5845D8] font-bold mb-6 uppercase tracking-widest text-sm">
                            <span className="w-10 h-[1px] bg-[#5845D8]"></span>
                            {t('ourStory')}
                        </div>
                        <h2 className="text-4xl font-black text-[#054752] mb-6 leading-tight">{t('storyTitle')}</h2>
                        <p className="text-[#708c91] text-lg font-medium leading-relaxed mb-6">
                            {t('storyDesc1')}
                        </p>
                        <p className="text-[#708c91] text-lg font-medium leading-relaxed">
                            {t('storyDesc2')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-black text-[#054752] mb-4">{t('coreValues')}</h2>
                    <p className="text-[#708c91] font-medium">The principles that guide every feature we build.</p>
                </div>
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        {
                            icon: ShieldCheck,
                            title: t('trustSafety'),
                            desc: t('trustDesc'),
                            color: 'bg-blue-50 text-blue-600'
                        },
                        {
                            icon: Globe,
                            title: t('globalCommunity'),
                            desc: t('globalDesc'),
                            color: 'bg-[#00D094]/10 text-[#00D094]'
                        },
                        {
                            icon: TrendingUp,
                            title: t('innovation'),
                            desc: t('innovationDesc'),
                            color: 'bg-purple-50 text-purple-600'
                        }
                    ].map((v, i) => (
                        <div key={i} className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-3">
                            <div className={`w-16 h-16 ${v.color} rounded-2xl flex items-center justify-center mb-8`}>
                                <v.icon size={36} />
                            </div>
                            <h3 className="text-3xl font-black text-[#054752] mb-6 tracking-tight">{v.title}</h3>
                            <p className="text-[#708c91] font-medium leading-relaxed text-lg">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#054752] py-20 px-6 overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-white relative z-10">
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">50k+</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Packages Sent</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">10k+</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Verified Travelers</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">120+</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Countries Covered</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">4.9/5</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Average Rating</div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-4xl font-black text-[#054752] mb-6">Join the movement.</h2>
                    <p className="text-[#708c91] text-lg font-medium mb-10 leading-relaxed">
                        Become part of the most human-centric logistics network in the world.
                        Start sending or start earning today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/signup" className="px-12 py-5 bg-[#00D094] text-[#054752] font-black rounded-full shadow-xl hover:scale-105 transition-all text-xl">
                            {t('signup')}
                        </Link>
                        <Link to="/search" className="px-12 py-5 border-2 border-[#054752] text-[#054752] font-black rounded-full hover:bg-[#054752] hover:text-white transition-all text-xl">
                            {t('search')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
