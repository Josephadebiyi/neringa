import React from 'react';
import { Heart, Globe, Users, Zap } from 'lucide-react';

const About: React.FC = () => {
    return (
        <div className="pt-32 pb-40">
            {/* Mission Hero */}
            <header className="px-6 mb-32">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
                    <div className="flex-1">
                        <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block underline decoration-brand-primary/30 underline-offset-8">Our Mission</span>
                        <h1 className="text-5xl md:text-8xl mb-12">the world is<br /><span className="text-brand-primary italic">your carrier.</span></h1>
                        <p className="text-2xl text-slate-500 font-bold leading-relaxed mb-12 max-w-xl">
                            We're on a mission to build the world's most human-centric shipping network,
                            making the globe more connected and logistics more accessible to everyone.
                        </p>
                        <div className="flex items-center gap-12 border-t-2 border-slate-50 pt-12">
                            <div>
                                <div className="text-4xl font-black text-slate-900 mb-1">2026</div>
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Founded</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black text-slate-900 mb-1">12K+</div>
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Members</div>
                            </div>
                            <div>
                                <div className="text-4xl font-black text-slate-900 mb-1">45+</div>
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Countries</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 relative w-full aspect-square bg-slate-50 rounded-[4rem] overflow-hidden shadow-2xl">
                        <img src="/community.png" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="About Bago" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent flex items-end p-12">
                            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border-2 border-white max-w-xs text-center">
                                <Heart className="text-brand-primary mx-auto mb-4 saturate-150" size={40} fill="currentColor" />
                                <h3 className="text-xl font-black mb-2 leading-tight">Born from a simple idea.</h3>
                                <p className="text-xs text-slate-500 font-bold">Why empty suitcases when people need items from across the world?</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Sections */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-32">
                    <div>
                        <h2 className="text-4xl md:text-6xl mb-12 leading-tight">rethinking the journey.</h2>
                        <div className="flex flex-col gap-12">
                            <div className="flex gap-8">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">1</div>
                                <div>
                                    <h4 className="text-2xl font-black mb-4">Community First</h4>
                                    <p className="text-slate-500 font-bold leading-relaxed">We believe in the power of people helping people. Bago isn't just a platform; it's a global community of travelers and shippers building trust across borders.</p>
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">2</div>
                                <div>
                                    <h4 className="text-2xl font-black mb-4">Sustainable Shipping</h4>
                                    <p className="text-slate-500 font-bold leading-relaxed">By utilizing existing flight routes, we reduce the carbon footprint of individual small-item shipping by up to 80% compared to traditional logistics.</p>
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0">3</div>
                                <div>
                                    <h4 className="text-2xl font-black mb-4">Speed of Life</h4>
                                    <p className="text-slate-500 font-bold leading-relaxed">Traditional shipping is trapped in warehouses. We move at the speed of travel, often delivering items faster than any express service could dream of.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative flex flex-col justify-center overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full" />
                        <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] mb-8 block">The Vision</span>
                        <blockquote className="text-3xl md:text-5xl font-black italic mb-12 leading-tight">
                            "We are building a world where geography is no longer a barrier to the things you need and love."
                        </blockquote>
                        <div>
                            <p className="text-xl font-black">Joseph Adebiyi</p>
                            <p className="text-brand-primary font-bold uppercase tracking-widest text-xs">Founder & CEO</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="px-6 mt-40">
                <div className="max-w-7xl mx-auto border-t-2 border-slate-50 pt-32">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-7xl mb-6 font-black">our values.</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Radical Trust', desc: 'We build systems that make trusting a stranger safe and intuitive.', icon: Users },
                            { title: 'Extreme Efficiency', desc: 'No warehouses. No trucks. Just the direct route.', icon: Zap },
                            { title: 'Global Empathy', desc: 'We connect cultures and people, one package at a time.', icon: Globe },
                        ].map((value, i) => (
                            <div key={i} className="card-bold text-center">
                                <div className="w-20 h-20 bg-brand-primary/5 text-brand-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-slate-50 shadow-sm">
                                    <value.icon size={40} />
                                </div>
                                <h5 className="text-2xl mb-4">{value.title}</h5>
                                <p className="text-slate-500 font-bold leading-relaxed">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
