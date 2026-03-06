import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
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
    const { t } = useLanguage();
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8] transition-all font-bold text-xs">
                <ChevronLeft size={20} />
                <span>{t('back')}</span>
            </button>
            <Link to="/">
                <img src="/bago_logo.png" alt="Bago" className="h-7 md:h-8" />
            </Link>
            <div className="w-16 hidden md:block"></div>
        </nav>
    );
};

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-50 last:border-0 font-sans">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex justify-between items-center text-left group"
            >
                <span className="text-sm font-bold text-[#012126] group-hover:text-[#5845D8] transition-colors uppercase tracking-tight">{question}</span>
                <ChevronDown size={16} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pb-5 animate-in slide-in-from-top-2 duration-300 px-1">
                    <p className="text-[11px] text-[#6B7280] leading-relaxed font-bold uppercase tracking-wider opacity-80">{answer}</p>
                </div>
            )}
        </div>
    );
};

export default function HelpCenter() {
    const { t } = useLanguage();

    const categories = [
        { icon: Package, title: t('shippingGuide'), color: 'bg-blue-50 text-blue-600', link: '#shipping' },
        { icon: CreditCard, title: t('paymentPricing'), color: 'bg-green-50 text-green-600', link: '#payments' },
        { icon: Shield, title: t('safetyTrust'), color: 'bg-purple-50 text-purple-600', link: '#security' },
        { icon: HelpCircle, title: t('accountSettings'), color: 'bg-orange-50 text-orange-600', link: '#general' }
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
            <div className="bg-[#012126] py-16 px-6 text-center text-white relative overflow-hidden font-sans">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="max-w-2xl mx-auto relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black mb-5 tracking-tight">{t('helpCenterTitle')}</h1>
                    <div className="relative max-w-lg mx-auto">
                        <input
                            type="text"
                            placeholder={t('searchHelp')}
                            className="w-full py-3.5 pl-11 pr-6 rounded-xl bg-white text-[#012126] font-bold text-xs outline-none shadow-xl border-none focus:ring-2 focus:ring-[#5845D8]/20 transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    </div>
                </div>
            </div>

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-12 font-sans">
                {/* Categories */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
                    {categories.map((cat, i) => (
                        <Link key={i} to={cat.link} className="bg-white p-6 rounded-[24px] border border-gray-100 hover:border-[#5845D8] hover:shadow-xl transition-all group group shadow-sm">
                            <div className={`w-12 h-12 ${cat.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                                <cat.icon size={22} />
                            </div>
                            <h3 className="text-sm font-black text-[#012126] uppercase tracking-tight">{cat.title}</h3>
                            <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1 group-hover:text-[#5845D8] transition-colors uppercase tracking-widest">
                                EXPLORE ARTICLES <ArrowRight size={10} />
                            </p>
                        </Link>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <HelpCircle size={20} className="text-[#5845D8]" />
                            <h2 className="text-xl font-black text-[#012126] uppercase tracking-tight">Support Topics</h2>
                        </div>
                        <div className="bg-white rounded-[32px] p-6 md:p-10 border border-gray-100 shadow-sm">
                            {faqs.map((faq, i) => (
                                <FAQItem key={i} {...faq} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="bg-[#5845D8] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl sticky top-24 border border-[#5845D8]">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mb-16"></div>
                            <h3 className="text-lg font-black mb-3 tracking-tight uppercase">Still need help?</h3>
                            <p className="text-white/60 font-bold text-[11px] mb-8 leading-relaxed uppercase tracking-wider">
                                Our support team is available 24/7 to assist you with any questions or issues.
                            </p>
                            <div className="space-y-3">
                                <a href="mailto:support@sendwithbago.com" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-black text-[10px] uppercase tracking-widest border border-white/5">
                                    <Mail size={18} />
                                    <span>Support Email</span>
                                </a>
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-40 border border-transparent">
                                    <Smartphone size={18} />
                                    <span>In-app Chat</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support CTA */}
            <section className="bg-white py-20 mb-12 font-sans border-y border-gray-50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="w-16 h-16 bg-purple-50 text-[#5845D8] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <MessageCircle size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-[#012126] mb-3 tracking-tight">Chat with our Bago Assistants</h2>
                    <p className="text-[#6B7280] text-xs font-bold mb-10 uppercase tracking-widest opacity-70 leading-relaxed max-w-xl mx-auto">
                        Our AI-powered help assistants can answer most questions instantly about routes, pricing, and guidelines.
                    </p>
                    <Link to="/search" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#5845D8] text-white font-black text-[10px] uppercase tracking-[1.5px] rounded-xl hover:shadow-xl transition-all shadow-md shadow-[#5845D8]/20">
                        Get Started <ArrowRight size={14} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
