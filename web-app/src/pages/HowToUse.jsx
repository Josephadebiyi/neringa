import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    Search,
    Send,
    UserCheck,
    TrendingUp,
    Package,
    ShieldCheck,
    CreditCard,
    CheckCircle,
    ArrowRight,
    Globe
} from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#054752] hover:text-[#5845D8] transition-all group font-bold">
                    <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </button>
            </div>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10" />
            </Link>
            <div className="w-20 hidden md:block"></div>
        </nav>
    );
};

export default function HowToUse() {
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            {/* Header */}
            <header className="relative py-24 px-6 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#5845D8]/5 rounded-full blur-[100px] -ml-32 -mt-32"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#B0891D]/5 rounded-full blur-[100px] -mr-40 -mb-40"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-5xl md:text-7xl font-black text-[#054752] mb-6 tracking-tight">How <span className="text-[#5845D8]">Bago</span> Works.</h1>
                    <p className="text-[#708c91] text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                        Whether you're sending a gift to a loved one or monetizing your extra luggage space,
                        Bago makes the process seamless, secure, and stress-free.
                    </p>
                </div>
            </header>

            {/* Toggle Section */}
            <section className="px-6 md:px-12 py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                        {/* For Senders */}
                        <div className="bg-white rounded-[40px] p-10 md:p-14 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl">
                                    <Send size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-[#054752]">For Senders</h2>
                            </div>

                            <div className="space-y-12">
                                {[
                                    { icon: Search, title: 'Search for a route', desc: 'Enter your departure and arrival cities, along with your preferred delivery date.' },
                                    { icon: UserCheck, title: 'Choose your traveler', desc: 'Browse verified travelers on that route and select the one that fits your needs.' },
                                    { icon: CreditCard, title: 'Secure payment', desc: 'Our escrow system holds your payment until the package is successfully delivered.' },
                                    { icon: CheckCircle, title: 'Track and receive', desc: 'Stay updated through real-time notifications until your package reaches its destination.' }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-[#054752] mb-2">{step.title}</h4>
                                            <p className="text-[#708c91] font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* For Travelers */}
                        <div className="bg-white rounded-[40px] p-10 md:p-14 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-purple-50 text-purple-600 rounded-3xl">
                                    <TrendingUp size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-[#054752]">For Travelers</h2>
                            </div>

                            <div className="space-y-12">
                                {[
                                    { icon: Globe, title: 'Post your trip', desc: "Share your travel route (flight or bus) and indicate how much weight you can carry." },
                                    { icon: Package, title: 'Accept requests', desc: "Receive delivery requests from senders and chat with them to confirm details." },
                                    { icon: ShieldCheck, title: 'Verified pickup', desc: "Meet the sender, verify the package contents, and mark the delivery as started." },
                                    { icon: CreditCard, title: 'Get paid instantly', desc: "Once delivered, the escrow funds are released immediately to your Bago wallet." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600 font-bold text-lg">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-[#054752] mb-2">{step.title}</h4>
                                            <p className="text-[#708c91] font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Prohibited Items */}
            <section className="py-24 px-6 md:px-12 bg-white mt-12">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="bg-red-50 text-red-600 px-6 py-2 rounded-full font-bold inline-block mb-4">Safety First</div>
                        <h2 className="text-4xl font-black text-[#054752] mb-4 tracking-tight">Prohibited Items</h2>
                        <p className="text-[#708c91] font-medium leading-relaxed">
                            To ensure the safety of our travelers and compliance with international laws,
                            the following items are strictly prohibited from the Bago network.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { name: 'Illegal Substances', icon: '🚫' },
                            { name: 'Flammable Items', icon: '🔥' },
                            { name: 'Live Animals', icon: '🐾' },
                            { name: 'Prescription Drugs', icon: '💊' },
                            { name: 'Perishable Food', icon: '🍎' },
                            { name: 'Liquid Liquids', icon: '💧' },
                            { name: 'Aerosol Sprays', icon: '💨' },
                            { name: 'Weaponry', icon: '⚔️' }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-[#f8f9fa] rounded-3xl border border-gray-100 hover:border-red-100 transition-colors">
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <p className="text-[#054752] font-semibold text-sm">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Safety Policies */}
            <section className="py-24 px-6 md:px-12 bg-[#F8F6F3]">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                            <ShieldCheck className="text-[#5845D8] mb-6" size={40} />
                            <h3 className="text-2xl font-black text-[#054752] mb-4">Open Package Policy</h3>
                            <p className="text-[#708c91] font-medium leading-relaxed">
                                Our community is built on trust. For safety reasons, Bago maintains an <strong>Open Package Policy</strong>. Travelers have the right to inspect package contents during pickup. Senders must keep items unsealed until inspected by the traveler to ensure compliance with our safety guidelines.
                            </p>
                        </div>
                        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                            <ShieldCheck className="text-[#5845D8] mb-6" size={40} />
                            <h3 className="text-2xl font-black text-[#054752] mb-4">Insurance Protection</h3>
                            <p className="text-[#708c91] font-medium leading-relaxed">
                                Every verified shipment is backed by our <strong>Insurance Protection Policy</strong>. Our escrow system holds payments securely, and in the rare event of loss or damage, Bago mediates the dispute to ensure fair resolution and refunds where applicable.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="bg-[#054752] rounded-[50px] p-12 md:p-24 text-center text-white relative overflow-hidden max-w-6xl mx-auto shadow-2xl">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48"></div>

                    <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 leading-tight">Ready to get started?</h2>
                    <p className="text-white/70 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
                        Join thousands of members already trusting Bago for their logistics and travel needs.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                        <Link to="/signup" className="px-14 py-5 bg-white text-[#054752] font-black rounded-[2rem] text-xl shadow-xl hover:scale-105 transition-all">
                            Create Account
                        </Link>
                        <Link to="/post-trip" className="px-14 py-5 bg-[#5845D8] text-white font-black rounded-[2rem] text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                            Post Trip <ArrowRight size={24} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
