import React from 'react';
import { Check, Zap, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingCard: React.FC<{
    tier: string;
    price: string;
    description: string;
    features: string[];
    popular?: boolean;
    buttonText: string;
    buttonLink: string;
}> = ({ tier, price, description, features, popular, buttonText, buttonLink }) => (
    <div className={`relative p-12 rounded-[3rem] border-2 transition-all duration-500 hover:-translate-y-2 ${popular
            ? 'bg-slate-900 border-slate-900 text-white shadow-[0_40px_80px_rgba(0,0,0,0.15)]'
            : 'bg-white border-slate-50 text-slate-900'
        }`}>
        {popular && (
            <div className="absolute top-0 right-12 -translate-y-1/2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full">
                Most Popular
            </div>
        )}
        <div className="mb-12">
            <h3 className="text-2xl font-black mb-4">{tier}</h3>
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-6xl font-black">{price}</span>
                {price !== 'Free' && <span className={`text-sm font-bold opacity-60`}>/ shipment</span>}
            </div>
            <p className={`font-bold leading-relaxed ${popular ? 'text-slate-400' : 'text-slate-500'}`}>
                {description}
            </p>
        </div>

        <ul className="flex flex-col gap-6 mb-12">
            {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${popular ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-primary/10 text-brand-primary'}`}>
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{feature}</span>
                </li>
            ))}
        </ul>

        <Link
            to={buttonLink}
            className={`w-full block text-center py-6 rounded-2xl font-black transition-all ${popular
                    ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                    : 'bg-slate-900 text-white hover:bg-brand-primary'
                }`}
        >
            {buttonText}
        </Link>
    </div>
);

const Pricing: React.FC = () => {
    return (
        <div className="pt-32 pb-40">
            {/* Header */}
            <header className="px-6 mb-32 text-center">
                <div className="max-w-4xl mx-auto">
                    <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Transparent fees</span>
                    <h1 className="text-5xl md:text-8xl mb-8">simple pricing.</h1>
                    <p className="text-2xl text-slate-500 font-bold max-w-2xl mx-auto">
                        No hidden fees. No complicated weight charts. Just simple, flat-rate shipping powered by travelers.
                    </p>
                </div>
            </header>

            {/* Pricing Grid */}
            <section className="px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <PricingCard
                        tier="Free to Join"
                        price="Free"
                        description="Start browsing travelers and planning your next shipment."
                        buttonText="Get Started"
                        buttonLink="/signup"
                        features={[
                            'Browse active travelers',
                            'Post up to 3 trip requests',
                            'Standard response time',
                            'Community support'
                        ]}
                    />
                    <PricingCard
                        tier="Standard Ship"
                        price="$15"
                        popular
                        description="The perfect balance of speed and affordability for every items."
                        buttonText="Start Shipping"
                        buttonLink="/signup"
                        features={[
                            'Everything in Free',
                            'Instant chat with travelers',
                            'Real-time delivery tracking',
                            '$200 insurance coverage',
                            'Verified traveler guarantee'
                        ]}
                    />
                    <PricingCard
                        tier="Pro Shipper"
                        price="$45"
                        description="For frequent shippers and businesses moving items regularly."
                        buttonText="Go Pro"
                        buttonLink="/signup"
                        features={[
                            'Everything in Standard',
                            'Unlimited monthly shipments',
                            'Priority 24/7 support',
                            '$1,000 insurance coverage',
                            'Dedicated account manager'
                        ]}
                    />
                </div>
            </section>

            {/* Additional Value */}
            <section className="px-6 mt-40">
                <div className="max-w-7xl mx-auto border-t-2 border-slate-50 pt-32 grid md:grid-cols-3 gap-16">
                    <div className="flex flex-col gap-6">
                        <div className="w-16 h-16 bg-brand-primary/5 rounded-3xl flex items-center justify-center text-brand-primary">
                            <Shield size={32} />
                        </div>
                        <h4 className="text-2xl font-black">Secure Escrow</h4>
                        <p className="text-slate-500 font-bold leading-relaxed">Your money stays in our secure account. We only release it to the traveler when you confirm delivery.</p>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="w-16 h-16 bg-brand-accent/5 rounded-3xl flex items-center justify-center text-brand-accent">
                            <Zap size={32} />
                        </div>
                        <h4 className="text-2xl font-black">Zero Hidden Fees</h4>
                        <p className="text-slate-500 font-bold leading-relaxed">The price you see is the price you pay. No handling fees, no processing surcharges, nothing.</p>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500">
                            <Globe size={32} />
                        </div>
                        <h4 className="text-2xl font-black">Global Support</h4>
                        <p className="text-slate-500 font-bold leading-relaxed">Our multi-lingual support team is available 24/7 to resolve any issues during transit.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Pricing;
