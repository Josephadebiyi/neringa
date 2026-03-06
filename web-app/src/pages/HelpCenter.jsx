import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    Search,
    MessageCircle,
    FileText,
    HelpCircle,
    Shield,
    CreditCard,
    Package,
    ChevronDown,
    ArrowRight,
    Mail,
    Smartphone
} from 'lucide-react';

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

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left group"
            >
                <span className="text-lg font-bold text-[#054752] group-hover:text-[#5845D8] transition-colors">{question}</span>
                <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[#708c91] leading-relaxed font-medium">{answer}</p>
                </div>
            )}
        </div>
    );
};

export default function HelpCenter() {
    const categories = [
        { icon: Package, title: 'Shipping & Delivery', color: 'bg-blue-50 text-blue-600', link: '#shipping' },
        { icon: CreditCard, title: 'Payments & Fees', color: 'bg-green-50 text-green-600', link: '#payments' },
        { icon: Shield, title: 'Security & Verification', color: 'bg-purple-50 text-purple-600', link: '#security' },
        { icon: HelpCircle, title: 'General Info', color: 'bg-orange-50 text-orange-600', link: '#general' }
    ];

    const faqs = [
        {
            category: 'Shipping',
            question: "What is Bago's 'Open Package Policy'?",
            answer: "For the safety of our travelers and the platform, Bago enforces an Open Package Policy. Travelers have the absolute right to inspect the contents of any package they carry. Senders must keep items unsealed or be prepared to open them for inspection at the point of handover. This ensures no prohibited or illegal items are transported."
        },
        {
            category: 'Shipping',
            question: "What happens if a package is damaged or lost?",
            answer: "Bago provides a basic 'Insurance Protection Policy' for verified transactions. If an item is lost or damage is proven to be the traveler's fault, our escrow system can facilitate refunds. We recommend travelers take photos of the item during pickup and delivery to ensure protection for both parties."
        },
        {
            category: 'Payments',
            question: "How does the Escrow system work?",
            answer: "When a sender pays for a delivery, the funds are securely held by Bago's escrow service. The traveler only receives the payment once the sender confirms receipt or the traveler provides verified proof of delivery. This protects both users from fraud."
        },
        {
            category: 'Security',
            question: "Why do I need to verify my identity?",
            answer: "Security is our top priority. By requiring KYC (Know Your Customer) verification through Didit, we ensure that every person on the platform is who they say they are. This builds a trusted community of real travelers and real senders."
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            {/* Hero Search */}
            <div className="bg-[#054752] py-20 px-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="max-w-3xl mx-auto relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-6">How can we help?</h1>
                    <div className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="Search for articles, topics..."
                            className="w-full py-4 pl-12 pr-6 rounded-2xl bg-white text-[#054752] font-medium outline-none shadow-lg"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>
            </div>

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-16">
                {/* Categories */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {categories.map((cat, i) => (
                        <Link key={i} to={cat.link} className="bg-white p-8 rounded-[32px] border border-gray-100 hover:border-[#5845D8] hover:shadow-xl transition-all group group">
                            <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <cat.icon size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-[#054752]">{cat.title}</h3>
                            <p className="text-gray-400 text-sm mt-2 flex items-center gap-1 group-hover:text-[#5845D8] transition-colors">
                                View Articles <ArrowRight size={14} />
                            </p>
                        </Link>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-black text-[#054752] mb-8">Frequently Asked Questions</h2>
                        <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-sm">
                            {faqs.map((faq, i) => (
                                <FAQItem key={i} {...faq} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="bg-[#5845D8] rounded-[40px] p-10 text-white relative overflow-hidden shadow-xl sticky top-24">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mb-16"></div>
                            <h3 className="text-2xl font-black mb-4">Still need help?</h3>
                            <p className="text-white/70 font-medium mb-8 leading-relaxed">
                                Our support team is available 24/7 to assist you with any questions or issues.
                            </p>
                            <div className="space-y-4">
                                <a href="mailto:support@sendwithbago.com" className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all font-bold">
                                    <Mail size={24} />
                                    <span>Email Support</span>
                                </a>
                                <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl font-bold opacity-60">
                                    <Smartphone size={24} />
                                    <span>In-app Chat (Coming Soon)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support CTA */}
            <section className="bg-white py-24 mb-12">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="w-20 h-20 bg-purple-50 text-[#5845D8] rounded-full flex items-center justify-center mx-auto mb-8">
                        <MessageCircle size={36} />
                    </div>
                    <h2 className="text-3xl font-black text-[#054752] mb-4">Chat with our Bago Assistants</h2>
                    <p className="text-[#708c91] text-lg font-medium mb-10">
                        Our AI-powered help assistants can answer most questions instantly about routes, pricing, and guidelines.
                    </p>
                    <Link to="/search" className="inline-flex items-center gap-2 px-8 py-4 bg-[#5845D8] text-white font-black rounded-2xl hover:shadow-lg transition-all">
                        Get Started <ArrowRight size={20} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
