import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Shield, Scale, Package, ShieldCheck } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#054752] hover:text-[#5845D8] transition-all font-bold">
                <ChevronLeft size={24} />
                <span>Back</span>
            </button>
            <Link to="/">
                <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10" />
            </Link>
            <div className="w-20 hidden md:block"></div>
        </nav>
    );
};

export default function Terms() {
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />
            <div className="max-w-4xl mx-auto py-16 px-6">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-[#054752] mb-4">Terms and Conditions</h1>
                    <p className="text-[#708c91] font-medium leading-relaxed">Last Updated: March 6, 2026</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 md:p-14 shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-bl-[100px]"></div>

                    <div className="prose prose-slate max-w-none space-y-10">
                        <section>
                            <div className="flex items-center gap-3 mb-4 text-[#5845D8]">
                                <Scale size={24} />
                                <h2 className="text-2xl font-black m-0">1. Acceptance of Terms</h2>
                            </div>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                By accessing or using the Bago platform ("Bago", "we", "us", or "our"), you agree to comply with and be bound by these Terms and Conditions. These terms govern your use of our website, mobile application, and related services. If you do not agree to these terms, you must not use the platform.
                            </p>
                        </section>

                        <section className="bg-blue-50/50 -mx-8 md:-mx-14 p-8 md:p-14 border-y border-blue-100">
                            <div className="flex items-center gap-3 mb-4 text-blue-600">
                                <Package size={24} />
                                <h2 className="text-2xl font-black m-0">2. Open Package Policy</h2>
                            </div>
                            <p className="text-[#054752] leading-relaxed font-bold mb-4">
                                Safety and compliance are our non-negotiable standards.
                            </p>
                            <ul className="text-[#708c91] leading-relaxed font-medium space-y-2 list-disc pl-5">
                                <li>Travelers have the absolute right and obligation to inspect the contents of any package they agree to transport.</li>
                                <li>Senders MUST hand over items in an unsealed condition or open them in the presence of the traveler.</li>
                                <li>Travelers are encouraged to take photos of the package contents during the handover as proof of condition.</li>
                                <li>Any refusal by a sender to allow inspection is grounds for immediate cancellation of the trip and possible account suspension.</li>
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4 text-[#B0891D]">
                                <ShieldCheck size={24} />
                                <h2 className="text-2xl font-black m-0">3. User Verification (KYC)</h2>
                            </div>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                Bago uses third-party verification services to ensure the integrity of our community.
                                Users must provide valid government-issued ID and biometric verification.
                                We reserve the right to limit access to features (such as payouts or trip posting) until verification is complete.
                                <br /><br />
                                <strong>Duplicate Accounts:</strong> Users are permitted only one verified account. Attempting to create multiple identities or bypass security checks will result in a permanent ban.
                            </p>
                        </section>

                        <section className="bg-purple-50/50 -mx-8 md:-mx-14 p-8 md:p-14 border-y border-purple-100">
                            <div className="flex items-center gap-3 mb-4 text-purple-600">
                                <Shield size={24} />
                                <h2 className="text-2xl font-black m-0">4. Insurance & Protection Policy</h2>
                            </div>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                Bago provides a standard protection layer for all verified transactions completed through our platform:
                            </p>
                            <ul className="text-[#708c91] leading-relaxed font-medium space-y-2 list-disc pl-5 mt-4">
                                <li><strong>Escrow Protection:</strong> Funds are never released to a traveler until delivery is confirmed.</li>
                                <li><strong>Dispute Resolution:</strong> Our team will mediate cases of loss or damage. If a traveler is found at fault, the escrow amount will be refunded to the sender.</li>
                                <li><strong>Traveler Compensation:</strong> Once a delivery is confirmed, travelers are paid out immediately to their Bago wallet, ensuring they aren't left waiting for their earnings.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#054752] mb-4">5. Prohibited Items</h2>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                Users are strictly prohibited from shipping illegal drugs, flammable liquids, weapons, counterfeit goods, or any items restricted by the customs laws of the origin and destination countries. It is the responsibility of both sender and traveler to be aware of local regulations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#054752] mb-4">6. Payments and Fees</h2>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                Bago charges a service fee for facilitating the transaction. All prices are calculated based on weight, distance, and urgency. International transactions are subject to currency conversion rates provided in the app.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-gray-100 text-center">
                            <p className="text-[#708c91] font-bold">
                                Questions about our terms?
                                <Link to="/help" className="text-[#5845D8] ml-2 underline">Visit our Help Center</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
