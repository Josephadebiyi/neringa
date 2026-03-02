import React from 'react';
import { Link } from 'react-router-dom';
import { Apple, PlayCircle, Instagram, Twitter, MessageCircle, Package } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t-2 border-slate-50 pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-8">
                        <Link to="/" className="inline-block active:scale-95 transition-all hover:rotate-3">
                            <img src="/logo.png" alt="Bago Logo" className="w-20 h-20 object-contain" />
                        </Link>
                        <p className="text-slate-500 font-bold leading-relaxed">
                            The world's first community-powered shipping network.
                            Making global logistics social, fast, and affordable.
                        </p>
                        <div className="flex items-center gap-4">
                            <button className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-white border-2 border-transparent hover:border-brand-primary/10 rounded-xl transition-all flex items-center justify-center">
                                <Instagram size={20} />
                            </button>
                            <button className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-white border-2 border-transparent hover:border-brand-primary/10 rounded-xl transition-all flex items-center justify-center">
                                <Twitter size={20} />
                            </button>
                            <button className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-white border-2 border-transparent hover:border-brand-primary/10 rounded-xl transition-all flex items-center justify-center">
                                <MessageCircle size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Platform</h4>
                        <ul className="flex flex-col gap-4 font-bold text-slate-900">
                            <li><Link to="/search" className="hover:text-brand-primary transition-colors">Find a Traveler</Link></li>
                            <li><Link to="/add-trip" className="hover:text-brand-primary transition-colors">Post your Trip</Link></li>
                            <li><Link to="/how" className="hover:text-brand-primary transition-colors">How it works</Link></li>
                            <li><Link to="/pricing" className="hover:text-brand-primary transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    {/* Company Section */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Company</h4>
                        <ul className="flex flex-col gap-4 font-bold text-slate-900">
                            <li><Link to="/about" className="hover:text-brand-primary transition-colors">Our Story</Link></li>
                            <li><Link to="/trust" className="hover:text-brand-primary transition-colors">Trust & Safety</Link></li>
                            <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* App Section */}
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Mobile App</h4>
                        <p className="text-slate-500 font-bold mb-8 text-sm italic">
                            Available soon for iOS and Android. Join the waitlist inside the app.
                        </p>
                        <div className="flex flex-col gap-4">
                            <button className="bg-slate-900 text-white rounded-[1.25rem] px-8 py-4 flex items-center gap-4 group hover:bg-brand-primary transition-all active:scale-95 shadow-lg shadow-slate-900/10 border border-white/5">
                                <Apple size={28} fill="currentColor" />
                                <div className="text-left leading-none">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Download on the</div>
                                    <div className="text-xl font-black italic tracking-tight">App Store</div>
                                </div>
                            </button>
                            <button className="bg-slate-900 text-white rounded-[1.25rem] px-8 py-4 flex items-center gap-4 group hover:bg-brand-primary transition-all active:scale-95 shadow-lg shadow-slate-900/10 border border-white/5">
                                <PlayCircle size={28} fill="currentColor" className="text-brand-accent shrink-0" />
                                <div className="text-left leading-none">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Get it on</div>
                                    <div className="text-xl font-black italic tracking-tight">Google Play</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t-2 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-slate-400 font-bold text-sm">
                        © 2026 Bago Technologies Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 italic font-bold text-slate-500 text-xs">
                        <Package size={14} className="text-brand-primary" />
                        Proudly community owned
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
