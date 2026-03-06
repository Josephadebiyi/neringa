import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Lock, Eye, Database, Globe } from 'lucide-react';

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

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />
            <div className="max-w-4xl mx-auto py-16 px-6">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-[#054752] mb-4">Privacy Policy</h1>
                    <p className="text-[#708c91] font-medium leading-relaxed">Last Updated: March 6, 2026</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 md:p-14 shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#B0891D]/5 rounded-bl-[100px]"></div>

                    <div className="prose prose-slate max-w-none space-y-10">
                        <section className="bg-green-50/30 -mx-8 md:-mx-14 p-8 md:p-14 border-b border-green-100">
                            <div className="flex items-center gap-3 mb-4 text-green-600">
                                <Globe size={24} />
                                <h2 className="text-2xl font-black m-0">GDPR Compliance</h2>
                            </div>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                At Bago, we are committed to protecting your privacy in accordance with the General Data Protection Regulation (GDPR) and other global privacy standards. This policy explains how we collect, use, and share your data when you use our platform.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4 text-[#054752]">
                                <Database size={24} />
                                <h2 className="text-2xl font-black m-0">1. Information We Collect</h2>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[#708c91] leading-relaxed font-medium">
                                    We collect information that you provide to us directly, including:
                                </p>
                                <ul className="text-[#708c91] leading-relaxed font-medium space-y-2 list-disc pl-5">
                                    <li><strong>Identity Data:</strong> Name, date of birth, and government-issued ID for KYC verification.</li>
                                    <li><strong>Contact Data:</strong> Email address, phone number, and mailing address.</li>
                                    <li><strong>Travel Data:</strong> Flight details, bus tickets, origins, and destinations.</li>
                                    <li><strong>Financial Data:</strong> Bank account details and payment information (handled by secure partners like Stripe and Paystack).</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4 text-[#5845D8]">
                                <Lock size={24} />
                                <h2 className="text-2xl font-black m-0">2. How We Use Your Data</h2>
                            </div>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                We use your data to facilitate peer-to-peer shipping, process payments, prevent fraud, and comply with legal obligations. Your identity data is shared with our verification partner (Didit) for the sole purpose of ensuring platform security.
                            </p>
                        </section>

                        <section className="bg-yellow-50/50 -mx-8 md:-mx-14 p-8 md:p-14 border-y border-yellow-100">
                            <div className="flex items-center gap-3 mb-4 text-[#B0891D]">
                                <Eye size={24} />
                                <h2 className="text-2xl font-black m-0">3. Your Data Rights</h2>
                            </div>
                            <p className="text-[#708c91] leading-relaxed font-medium mb-4">
                                Under GDPR, you have the following rights regarding your personal data:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { title: 'Right to Access', desc: 'Request a copy of your personal data.' },
                                    { title: 'Right to Erasure', desc: "Request the deletion of your account and data ('Right to be forgotten')." },
                                    { title: 'Right to Rectification', desc: 'Correct any inaccurate information.' },
                                    { title: 'Right to Portability', desc: 'Transfer your data to another service.' }
                                ].map((right, i) => (
                                    <li key={i} className="flex flex-col p-4 bg-white rounded-2xl border border-yellow-100">
                                        <span className="font-bold text-[#054752]">{right.title}</span>
                                        <span className="text-xs text-gray-500">{right.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-[#054752] mb-4">4. Data Security</h2>
                            <p className="text-[#708c91] leading-relaxed font-medium">
                                We implement industry-standard encryption (SSL/TLS) and security protocols to protect your data. Payment information is never stored directly on our servers; it is managed by PCI-compliant payment processors.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-gray-100 text-center">
                            <p className="text-[#708c91] font-bold">
                                Want to exercise your data rights?
                                <a href="mailto:privacy@sendwithbago.com" className="text-[#5845D8] ml-2 underline">Email our Privacy Officer</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
