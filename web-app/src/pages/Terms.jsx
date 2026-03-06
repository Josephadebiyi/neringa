import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Shield, Scale, Package, ShieldCheck } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8] transition-all font-bold text-xs">
                <ChevronLeft size={20} />
                <span>Back</span>
            </button>
            <Link to="/">
                <img src="/bago_logo.png" alt="Bago" className="h-7 md:h-8" />
            </Link>
            <div className="w-16 hidden md:block"></div>
        </nav>
    );
};

export default function Terms() {
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-6 font-sans">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-3xl font-black text-[#012126] mb-3 tracking-tight">Terms & Conditions</h1>
                    <p className="text-[#6B7280] font-bold text-[10px] uppercase tracking-[2px] opacity-60">Last Updated: March 6, 2026</p>
                </div>

                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#5845D8]/5 rounded-bl-[60px]"></div>

                    <div className="prose prose-slate max-w-none space-y-12">
                        <section>
                            <div className="flex items-center gap-2.5 mb-5 text-[#5845D8]">
                                <Scale size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">1. Acceptance of Terms</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80 px-2 lg:px-4">
                                By accessing or using the Bago platform ("Bago", "we", "us", or "our"), you agree to comply with and be bound by these Terms and Conditions. These terms govern your use of our website, mobile application, and related services. If you do not agree to these terms, you must not use the platform.
                            </p>
                        </section>

                        <section className="bg-blue-50/40 -mx-8 md:-mx-12 p-8 md:p-12 border-y border-blue-50/50">
                            <div className="flex items-center gap-2.5 mb-5 text-blue-600">
                                <Package size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">2. Open Package Policy</h2>
                            </div>
                            <p className="text-[#012126] leading-relaxed font-black text-[11px] mb-5 uppercase tracking-widest px-2 lg:px-4">
                                Safety and compliance are our non-negotiable standards.
                            </p>
                            <ul className="text-[#6B7280] leading-relaxed font-bold space-y-3 list-none p-0 px-2 lg:px-4">
                                {['Travelers have the absolute right and obligation to inspect the contents of any package they agree to transport.',
                                    'Senders MUST hand over items in an unsealed condition or open them in the presence of the traveler.',
                                    'Travelers are encouraged to take photos of the package contents during the handover as proof of condition.',
                                    'Any refusal by a sender to allow inspection is grounds for immediate cancellation of the trip and possible account suspension.'].map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-[11px] uppercase tracking-wide opacity-70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-2.5 mb-5 text-amber-600">
                                <ShieldCheck size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">3. Verification (KYC)</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-80 px-2 lg:px-4">
                                Bago uses third-party verification services to ensure the integrity of our community. Users must provide valid government-issued ID and biometric verification. We reserve the right to limit access to features until verification is complete.
                                <br /><br />
                                <strong className="text-[#012126] font-black">Duplicate Accounts:</strong> Users are permitted only one verified account. Attempting to create multiple identities or bypass security checks will result in a permanent ban.
                            </p>
                        </section>

                        <section className="bg-purple-50/40 -mx-8 md:-mx-12 p-8 md:p-12 border-y border-purple-50/50 text-[12px]">
                            <div className="flex items-center gap-2.5 mb-5 text-purple-600">
                                <Shield size={18} />
                                <h2 className="text-base font-black m-0 tracking-tight uppercase">4. Protection Policy</h2>
                            </div>
                            <p className="text-[#6B7280] leading-relaxed font-bold uppercase tracking-wide opacity-80 px-2 lg:px-4 mb-5">
                                Bago provides a standard protection layer for all verified transactions completed through our platform:
                            </p>
                            <ul className="text-[#6B7280] leading-relaxed font-bold space-y-3 list-none p-0 px-2 lg:px-4">
                                {['Funds are never released to a traveler until delivery is confirmed via Escrow.',
                                    'Our team will mediate cases of loss or damage via Dispute Resolution.',
                                    'Once delivery is confirmed, travelers are paid immediately to their Bago wallet.'].map((item, idx) => (
                                        <li key={idx} className="flex gap-3 text-[11px] uppercase tracking-wide opacity-70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 flex-shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                            </ul>
                        </section>

                        <section className="px-2 lg:px-4">
                            <h2 className="text-base font-black text-[#012126] mb-4 uppercase tracking-tight">5. Prohibitions</h2>
                            <p className="text-[#6B7280] leading-relaxed font-bold text-[12px] uppercase tracking-wide opacity-70">
                                Users are strictly prohibited from shipping illegal drugs, flammable liquids, weapons, counterfeit goods, or any items restricted by customs laws. It is the responsibility of users to be aware of local regulations.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-gray-50 text-center">
                            <p className="text-[#6B7280] font-black text-[10px] uppercase tracking-[2px]">
                                Questions?
                                <Link to="/help" className="text-[#5845D8] ml-2 underline hover:text-[#4838B5] transition-colors">Help Center</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
