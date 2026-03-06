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

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />
            <div className="max-w-4xl mx-auto py-16 px-6">
                <h1 className="text-4xl font-black text-[#054752] mb-8">Privacy Policy</h1>
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 prose prose-slate max-w-none">
                    <p className="text-[#708c91] font-medium leading-relaxed">Last Updated: March 6, 2026</p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">1. Information We Collect</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        We collect information you provide directly to us when you create an account, including your email, name (from KYC), and contact details. We also collect information from third-party identity verification services to ensure the security of our platform.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">2. How We Use Your Information</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-[#708c91] mb-6 space-y-2">
                        <li>Facilitate connections between Senders and Travelers.</li>
                        <li>Verify your identity and maintain a secure community.</li>
                        <li>Process payments and payouts.</li>
                        <li>Send you updates, security alerts, and support messages.</li>
                        <li>Improve and optimize our platform.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">3. Data Sharing</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        We do not sell your personal data. We share information only in necessary circumstances:
                        - With other users to facilitate a delivery (e.g., sharing a Sender's phone number with a Traveler).
                        - With payment processors to handle transactions.
                        - With legal authorities if required by law.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">4. Data Security</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        We implement industry-standard security measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">5. Cookies and Tracking</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Bago uses cookies and similar technologies to enhance your experience, remember your preferences, and analyze how our service is used.
                    </p>

                    <h2 className="text-2xl font-bold text-[#054752] mt-8 mb-4">6. Your Rights</h2>
                    <p className="text-[#708c91] leading-relaxed mb-6">
                        Depending on your location, you may have rights to access, correct, or delete your personal data. Please contact us at support@bago.com to exercise these rights.
                    </p>
                </div>
            </div>
        </div>
    );
}
