import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Search } from 'lucide-react';

const Hero: React.FC = () => {
    return (
        <section className="relative pt-6 px-6 z-[1]">
            <div className="max-w-7xl mx-auto">
                <div className="relative h-[80vh] md:h-[800px] w-full rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl group z-[10]">
                    {/* Background Image */}
                    <img
                        src="/hero-delivery.png"
                        alt="Bago Community"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[3s]"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-end p-8 md:p-24">
                        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
                            <h1 className="text-6xl md:text-9xl text-white mb-8 leading-[0.85] font-black italic">
                                send your<br />
                                <span className="text-brand-primary drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">package!</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 mb-12 font-bold max-w-xl leading-relaxed">
                                Find trusted travelers to deliver packages anywhere in the world.
                                <span className="text-brand-primary block mt-2">Fast, secure, and human-powered.</span>
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/search" className="btn-bold-white gap-3">
                                    <Search size={22} className="text-brand-primary" />
                                    Find a Traveler
                                </Link>
                                <Link to="/add-trip" className="btn-bold border-2 border-white/20 text-white hover:bg-white/10 gap-3">
                                    Post a Trip
                                    <ArrowRight size={22} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Search Floating Bar */}
                <div className="relative -mt-10 md:-mt-12 z-[20] px-8 md:px-20">
                    <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-2 border-slate-50 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-brand-primary/20 transition-all">
                            <MapPin className="text-brand-primary" size={20} />
                            <div className="flex flex-col flex-1">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Leaving from</span>
                                <input type="text" placeholder="Which city?" className="bg-transparent font-bold text-slate-900 outline-none w-full" />
                            </div>
                        </div>

                        <div className="flex-1 w-full flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-brand-primary/20 transition-all">
                            <MapPin className="text-brand-accent" size={20} />
                            <div className="flex flex-col flex-1">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Going to</span>
                                <input type="text" placeholder="Destination city?" className="bg-transparent font-bold text-slate-900 outline-none w-full" />
                            </div>
                        </div>

                        <button className="w-full md:w-auto btn-bold-primary px-12 py-5">
                            Search
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
