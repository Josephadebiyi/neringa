import React from 'react';
import { Package, Plane, CheckCircle2, ShieldCheck, MapPin, MessageSquare, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const Step: React.FC<{ number: string; title: string; description: string; icon: React.ReactNode; reverse?: boolean }> = ({ number, title, description, icon, reverse }) => (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24 mb-32`}>
        <div className="flex-1 w-full">
            <div className="relative aspect-square bg-slate-50 rounded-[3rem] border-2 border-slate-100 flex items-center justify-center p-12 group overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <span className="text-9xl font-black text-slate-100 group-hover:text-brand-primary/10 transition-colors leading-none tracking-tighter">{number}</span>
                </div>
                <div className="relative z-10 w-32 h-32 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                {/* Decorative blobs */}
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
            </div>
        </div>
        <div className="flex-1 text-center md:text-left">
            <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Step {number}</span>
            <h3 className="text-4xl md:text-6xl mb-6 text-slate-900 leading-tight">{title}</h3>
            <p className="text-xl text-slate-500 font-bold leading-relaxed mb-8">
                {description}
            </p>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span>Real-time tracking included</span>
                </div>
                <div className="flex items-center gap-3 text-slate-900 font-bold">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span>Secure payment escrow</span>
                </div>
            </div>
        </div>
    </div>
);

const HowItWorks: React.FC = () => {
    return (
        <div className="pt-32 pb-40">
            {/* Header */}
            <header className="px-6 mb-32 text-center">
                <div className="max-w-4xl mx-auto">
                    <span className="text-brand-accent font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">The Logistics Revolution</span>
                    <h1 className="text-5xl md:text-8xl mb-8">how it works.</h1>
                    <p className="text-2xl text-slate-500 font-bold max-w-2xl mx-auto">
                        We've simplified international shipping by connecting people with extra space to those who need to send items.
                    </p>
                </div>
            </header>

            {/* Steps Section */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto">
                    <Step
                        number="01"
                        title="Find a verified traveler."
                        description="Browse hundreds of travelers heading your way. See their ratings, past deliveries, and flight details. Filter by date, destination, and weight capacity."
                        icon={<Plane size={64} />}
                    />
                    <Step
                        number="02"
                        title="Book and chat."
                        description="Send a booking request with your item details. Chat directly with the traveler to coordinate the drop-off and delivery details. Our AI helps clarify shipping rules."
                        icon={<MessageSquare size={64} />}
                        reverse
                    />
                    <Step
                        number="03"
                        title="Secure payment."
                        description="Pay safely through our platform. We hold your payment in a secure escrow account and only release it when the item is confirmed delivered."
                        icon={<CreditCard size={64} />}
                    />
                    <Step
                        number="04"
                        title="Track and receive."
                        description="Get live updates as your package moves across borders. Meet your traveler at the destination or arrange a local drop-off point. Confirm delivery to close the deal."
                        icon={<Package size={64} />}
                        reverse
                    />
                </div>
            </section>

            {/* Why it works */}
            <section className="px-6 mt-20">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-24 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/10 blur-[100px] rounded-full translate-x-1/2" />

                    <div className="relative text-center mb-20">
                        <h2 className="text-4xl md:text-7xl text-white mb-6">built on trust.</h2>
                        <p className="text-xl text-slate-400 font-bold max-w-2xl mx-auto">Our multi-layered security system ensures every shipment is safe and every traveler is verified.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {[
                            { title: 'ID Verification', desc: 'Every member must verify their identity with a government-issued ID.', icon: <ShieldCheck className="text-brand-primary" /> },
                            { title: 'Item Insurance', desc: 'Eligible items are covered by Bago Protection up to $500.', icon: <Package className="text-brand-primary" /> },
                            { title: '24/7 Support', desc: 'Our dedicated support team is always ready to help you mid-transit.', icon: <MapPin className="text-brand-primary" /> },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 border-2 border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    {item.icon}
                                </div>
                                <h4 className="text-xl text-white mb-4">{item.title}</h4>
                                <p className="text-slate-400 font-bold text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 mt-40 text-center">
                <h2 className="text-4xl md:text-6xl mb-12">Ready to ship?</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                    <Link to="/signup" className="btn-bold-primary px-12 py-6">Join Bago Today</Link>
                    <Link to="/search" className="btn-bold border-2 border-slate-100 hover:bg-slate-50 px-12 py-6">Browse Travelers</Link>
                </div>
            </section>
        </div>
    );
};

export default HowItWorks;
