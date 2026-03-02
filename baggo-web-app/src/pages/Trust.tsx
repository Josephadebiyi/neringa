import React from 'react';
import { ShieldCheck, UserCheck, CreditCard, HeartHandshake, Eye, Lock } from 'lucide-react';

const TrustCard: React.FC<{ icon: React.ReactNode; title: string; description: string; items: string[] }> = ({ icon, title, description, items }) => (
    <div className="card-bold">
        <div className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-slate-200">
            {icon}
        </div>
        <h3 className="text-3xl mb-6">{title}</h3>
        <p className="text-slate-500 font-bold leading-relaxed mb-8">
            {description}
        </p>
        <ul className="flex flex-col gap-4">
            {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-900">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                    {item}
                </li>
            ))}
        </ul>
    </div>
);

const Trust: React.FC = () => {
    return (
        <div className="pt-32 pb-40">
            {/* Hero */}
            <header className="px-6 mb-32 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10">
                        <ShieldCheck size={56} />
                    </div>
                    <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Safety is our priority</span>
                    <h1 className="text-5xl md:text-8xl mb-8">trust is built-in.</h1>
                    <p className="text-2xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed">
                        We've built several layers of protection so you can ship or travel with absolute peace of mind.
                    </p>
                </div>
            </header>

            {/* Core Pillars */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
                    <TrustCard
                        icon={<UserCheck size={32} />}
                        title="Member Verification"
                        description="Every individual in our community is vetted before they can interact with others."
                        items={[
                            'Government ID Verification',
                            'Phone & Email confirmation',
                            'Social Media linking',
                            'Community rating system'
                        ]}
                    />
                    <TrustCard
                        icon={<Lock size={32} />}
                        title="Secure Payments"
                        description="Our escrow system ensures that money only moves when everyone is happy."
                        items={[
                            '3D Secure credit card processing',
                            'Funds held in secure escrow',
                            'Payouts only after confirmation',
                            'Fraud detection algorithms'
                        ]}
                    />
                    <TrustCard
                        icon={<Eye size={32} />}
                        title="Transparency"
                        description="We believe in open communication and clear expectations."
                        items={[
                            'Real-time transit tracking',
                            'Direct messaging within app',
                            'Detailed traveler history',
                            'Public reviews and feedback'
                        ]}
                    />
                </div>
            </section>

            {/* Protection Banner */}
            <section className="px-6 mt-40">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[4rem] p-12 md:p-32 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-500/10 blur-[100px] rounded-full" />

                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="flex-1 text-center lg:text-left">
                            <h2 className="text-5xl md:text-7xl text-white mb-10">Bago Protection.</h2>
                            <p className="text-xl text-slate-400 font-bold mb-12 max-w-lg mx-auto lg:mx-0">
                                In the rare case that something goes wrong, we've got your back. Every shipping deal is covered by our guarantee.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-8 text-left">
                                <div className="flex flex-col gap-4">
                                    <HeartHandshake className="text-brand-primary" size={32} />
                                    <h4 className="text-white text-xl font-black">Resolution Center</h4>
                                    <p className="text-slate-500 font-bold text-sm">Dispute management tools to resolve any issues fairly and quickly.</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <CreditCard className="text-brand-primary" size={32} />
                                    <h4 className="text-white text-xl font-black">Full Refunds</h4>
                                    <p className="text-slate-500 font-bold text-sm">If your item isn't delivered, you get 100% of your money back. Period.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full max-w-sm">
                            <div className="aspect-square bg-white rounded-[3rem] p-12 border-8 border-white shadow-2xl shadow-emerald-500/10 flex items-center justify-center">
                                <img src="/logo.png" alt="Bago" className="w-32 h-32 opacity-10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldCheck size={120} className="text-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Report section */}
            <section className="px-6 mt-40 text-center">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-3xl mb-6">See something suspicious?</h3>
                    <p className="text-slate-500 font-bold mb-8">Our security team monitors the platform 24/7, but you are our eyes and ears too.</p>
                    <button className="btn-bold border-2 border-slate-900 px-10">Report an Issue</button>
                </div>
            </section>
        </div>
    );
};

export default Trust;
