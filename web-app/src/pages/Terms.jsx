import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

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
                <h1 className="text-4xl font-black text-[#054752] mb-8">Terms and Conditions</h1>
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 prose prose-slate max-w-none">
                    <p className="text-[#708c91] font-medium leading-relaxed">Last Updated: March 6, 2026</p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        By accessing or using the Bago platform ("Bago", "we", "us", or "our"), you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the platform.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">2. Description of Service</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Bago provides a peer-to-peer platform that connects individuals who wish to send items ("Senders") with travelers who have extra luggage space ("Travelers"). Bago does not provide logistics or shipping services itself; we are an intermediary connecting users.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">3. User Verification</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        To maintain trust and safety, Bago requires users to undergo identity verification (KYC). You agree to provide accurate, current, and complete information during the verification process. Bago reserves the right to suspend or terminate accounts that provide false information.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">4. Prohibited Items</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Senders and Travelers are strictly prohibited from using Bago to transport illegal substances, hazardous materials, weapons, live animals, perishable foods (unless specifically agreed), or any items prohibited by the laws of the origin or destination countries. A full list of prohibited items is available on our "How it Works" page.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">5. Payments and Fees</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Bago uses secure payment gateways to handle transactions. Senders pay for the delivery upfront; funds are held in escrow and released to the Traveler only upon successful delivery confirmation. Bago charges a service fee for facilitating the connection.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">6. Liability and Insurance</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Bago is not responsible for the contents of packages, delays in delivery, or loss/damage to items during transit. Users interact at their own risk. We encourage users to inspect items before accepting them and to report any issues immediately to our support team.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">7. Termination</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Bago reserves the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </div>
            </div>
        </div>
    );
}
