import React from 'react';
import Hero from '../components/home/Hero';
import { Package, ShieldCheck, Globe2, Zap, Star, Apple, PlayCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; color: string }> = ({ icon, title, description, color }) => (
    <div className="card-bold group">
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 border-2 border-slate-50 shadow-sm ${color}`}>
            {icon}
        </div>
        <h3 className="text-2xl mb-4 group-hover:text-brand-primary transition-colors">{title}</h3>
        <p className="text-slate-500 font-bold leading-relaxed">
            {description}
        </p>
    </div>
);

const Home: React.FC = () => {
    return (
        <div className="flex flex-col gap-32 pb-40">
            <Hero />

            {/* Trusted Stats */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Users', value: '12K+', icon: <Star className="text-amber-400" size={16} /> },
                        { label: 'Countries', value: '45+', icon: <Globe2 className="text-brand-secondary" size={16} /> },
                        { label: 'Routes Today', value: '800+', icon: <Zap className="text-brand-accent" size={16} /> },
                        { label: 'Secure Deliveries', value: '50K+', icon: <ShieldCheck className="text-emerald-500" size={16} /> },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border-2 border-slate-50 p-6 rounded-3xl flex flex-col items-center text-center gap-2">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                {stat.icon}
                                {stat.label}
                            </div>
                            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Bago? */}
            <section className="px-6 relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 rounded-l-[10rem] -z-10" />
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-20">
                        <div className="max-w-xl">
                            <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block underline decoration-brand-primary/20 underline-offset-8">Core Innovation</span>
                            <h2 className="text-6xl md:text-8xl mb-10">social shipping<br /><span className="text-brand-primary italic">is here.</span></h2>
                            <p className="text-2xl text-slate-500 font-bold leading-relaxed">
                                We leverage millions of empty suitcases flying everyday to make global logistics
                                <span className="text-slate-900 mx-2 font-black italic">10x faster</span>
                                and
                                <span className="text-slate-900 mx-2 font-black italic">3x cheaper</span> than traditional carriers.
                            </p>
                        </div>
                        <Link to="/signup" className="btn-bold-primary px-12 py-6 rounded-2xl group">
                            Start Shipping
                            <ArrowRight size={20} className="inline ml-3 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-40">
                        <FeatureCard
                            icon={<Package size={28} className="text-brand-primary" />}
                            color="bg-brand-primary/5"
                            title="Zero Complexity"
                            description="Book a trip, drop off your package, and track it in real-time. No paperwork, no queues."
                        />
                        <FeatureCard
                            icon={<Zap size={28} className="text-brand-accent" />}
                            color="bg-brand-accent/5"
                            title="Ultra Fast"
                            description="Same-day international delivery is now possible through direct traveler routes."
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={28} className="text-emerald-500" />}
                            color="bg-emerald-50"
                            title="100% Secure"
                            description="Payments are held in escrow until your package is safely handed over."
                        />
                    </div>

                    <div className="aspect-[21/9] w-full bg-slate-100 rounded-[4rem] overflow-hidden relative shadow-2xl">
                        <img src="/community.png" className="w-full h-full object-cover" alt="Bago Community" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent flex items-center p-12 md:p-24">
                            <div className="max-w-xl">
                                <h3 className="text-5xl md:text-7xl text-white mb-6">people powered.</h3>
                                <p className="text-xl text-white/80 font-bold italic">Building the world's most human-centric shipping network, one flight at a time.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEW Download Section */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                    <div className="flex-1 text-center lg:text-left">
                        <span className="text-brand-accent font-black uppercase tracking-[0.3em] text-[10px] mb-4 block underline decoration-brand-accent/30 underline-offset-4">Coming Soon</span>
                        <h2 className="text-6xl md:text-8xl mb-8">The App is ready.<br /><span className="text-brand-accent italic">Are you?</span></h2>
                        <p className="text-xl md:text-2xl text-slate-500 font-bold mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed italic">
                            Get the full Bago experience on your phone. Real-time tracking,
                            instant messaging, and easy payments in your pocket.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button className="bg-slate-900 text-white rounded-[1.25rem] px-10 py-5 flex items-center gap-4 hover:bg-brand-primary transition-all active:scale-95 shadow-2xl shadow-slate-900/20 border border-white/5">
                                <Apple size={36} fill="currentColor" />
                                <div className="text-left leading-none">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1.5">Download on the</div>
                                    <div className="text-2xl font-black italic tracking-tight">App Store</div>
                                </div>
                            </button>
                            <button className="bg-slate-900 text-white rounded-[1.25rem] px-10 py-5 flex items-center gap-4 hover:bg-brand-primary transition-all active:scale-95 shadow-2xl shadow-slate-900/20 border border-white/5">
                                <PlayCircle size={36} fill="currentColor" className="text-brand-accent shrink-0" />
                                <div className="text-left leading-none">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1.5">Get it on</div>
                                    <div className="text-2xl font-black italic tracking-tight">Google Play</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full max-w-lg">
                        <div className="relative aspect-[9/16] bg-slate-100 rounded-[5rem] border-[12px] border-slate-900 shadow-[0_60px_120px_rgba(0,0,0,0.2)] overflow-hidden">
                            <img src="/app-preview.png" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="App Preview" />
                            {/* Reflection glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                    </div>
                </div>
            </section>

            {/* CTA Banner Bolder */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />

                    <div className="relative p-12 md:p-32 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl text-center md:text-left">
                            <h2 className="text-5xl md:text-8xl text-white mb-8">Ready to move?<br /><span className="text-brand-primary italic">Let's go.</span></h2>
                            <p className="text-xl text-slate-400 font-bold mb-12">Join the world's most innovative shipping community today.</p>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link to="/signup" className="btn-bold-primary px-12 py-6">Get Started</Link>
                                <Link to="/search" className="btn-bold border-2 border-white/20 text-white hover:bg-white/5 px-12">Search Trips</Link>
                            </div>
                        </div>

                        <div className="relative hidden lg:block">
                            <div className="w-80 h-80 bg-brand-primary/10 rounded-[3rem] border-2 border-white/5 p-8 animate-float">
                                <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center">
                                    <Package className="text-brand-primary/40" size={120} />
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-accent/20 rounded-[2rem] border-2 border-white/5 p-4 animate-float [animation-delay:1s]">
                                <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center">
                                    <Zap className="text-brand-accent/40" size={40} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
