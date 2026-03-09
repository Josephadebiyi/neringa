import React, { useState } from 'react';
import {
    LifeBuoy,
    MessageCircle,
    Mail,
    Phone,
    Search,
    ChevronRight,
    ExternalLink,
    Shield,
    Zap,
    Globe,
    Clock,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Support = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFaq, setActiveFaq] = useState(null);

    const faqs = [
        {
            question: "How does Bago work?",
            answer: "Bago connects people who need to send items with trust-verified travelers who have extra luggage space. This peer-to-peer approach makes shipping faster and up to 70% cheaper than traditional couriers."
        },
        {
            question: "Is my package insured?",
            answer: "Yes! Bago offers optional insurance for todos of packages. You can select your insurance level during the request phase to protect against loss or damage."
        },
        {
            question: "How do I become a traveler?",
            answer: "Simply click 'Post a Trip', verify your ID through our secure KYC process, and list your travel details. Once approved, you can start accepting package requests and earning money."
        },
        {
            question: "What items are prohibited?",
            answer: "For safety reasons, we prohibit illegal substances, hazardous materials, weapons, and items restricted by international aviation laws. See our full restricted items list for more details."
        }
    ];

    const categories = [
        { title: "Getting Started", icon: <Zap className="w-6 h-6" />, count: 12 },
        { title: "Shipping & Delivery", icon: <Globe className="w-6 h-6" />, count: 24 },
        { title: "Payments & Refunds", icon: <Clock className="w-6 h-6" />, count: 8 },
        { title: "Safety & Security", icon: <Shield className="w-6 h-6" />, count: 15 },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 bg-[#5240E8] overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-sm font-bold mb-8"
                    >
                        <LifeBuoy className="w-4 h-4" />
                        24/7 SUPPORT CENTER
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter"
                    >
                        How can we <br /> <span className="text-white/60 italic">help you today?</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto relative group"
                    >
                        <div className="absolute inset-0 bg-black/20 blur-2xl group-focus-within:bg-[#5240E8]/40 transition-all rounded-[30px]" />
                        <div className="relative flex items-center bg-white rounded-[30px] p-2 shadow-2xl border border-white/20">
                            <Search className="w-6 h-6 text-slate-400 ml-6" />
                            <input
                                type="text"
                                placeholder="Search for articles, guides, or questions..."
                                className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-4 text-slate-800 font-medium placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="bg-[#5240E8] text-white px-8 py-4 rounded-[22px] font-bold hover:bg-[#4030C8] transition-all flex items-center gap-2">
                                Search
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: FAQ & Categories */}
                    <div className="lg:col-span-2 space-y-16">

                        {/* Quick Categories */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.map((cat, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#5240E8]/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8] group-hover:bg-[#5240E8] group-hover:text-white transition-colors mb-6">
                                        {cat.icon}
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-2">{cat.title}</h3>
                                    <p className="text-slate-400 text-sm font-medium">{cat.count} articles</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Popular Questions */}
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Popular Questions</h2>
                                <button className="text-[#5240E8] font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                    View all <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {faqs.map((faq, i) => (
                                    <motion.div
                                        key={i}
                                        className="bg-white rounded-[30px] border border-slate-200 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                            className="w-full flex items-center justify-between p-8 text-left hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="text-lg font-bold text-slate-800">{faq.question}</span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeFaq === i ? 'bg-[#5240E8] text-white rotate-90' : 'bg-slate-100 text-slate-400'}`}>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {activeFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-8 pb-8"
                                                >
                                                    <div className="pt-4 border-t border-slate-100 text-slate-600 leading-relaxed font-medium">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Contact Cards */}
                    <div className="space-y-6">
                        <div className="bg-[#5240E8] p-10 rounded-[40px] text-white relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                            <MessageCircle className="w-12 h-12 mb-8 text-white/50" />
                            <h3 className="text-3xl font-black mb-4">Chat with us</h3>
                            <p className="text-white/70 font-medium mb-8 leading-relaxed">
                                Connect with our support team instantly through our internal chat for real-time assistance.
                            </p>
                            <button className="w-full bg-white text-[#5240E8] py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
                                Open Chat
                            </button>
                        </div>

                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8]">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Email Support</h4>
                                    <p className="text-slate-400 text-sm font-medium">support@sendwithbago.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5240E8]">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Call Us</h4>
                                    <p className="text-slate-400 text-sm font-medium">+1 (555) 000-0000</p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <p className="text-slate-400 text-sm font-medium mb-6">
                                    Are you a partner or business?
                                </p>
                                <div className="flex items-center gap-4 text-[#5240E8] font-bold group cursor-pointer">
                                    <span>Visit Partner Center</span>
                                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Support */}
            <section className="py-24 bg-white border-t border-slate-100 text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-[#5240E8]">
                        <Search className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-800 mb-6">Didn't find what you need?</h2>
                    <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">
                        Our global support operations are available 24/7. Whether you're tracking a package or need help with your account, we're here to help.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="bg-[#5240E8] text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[#5240E8]/30">
                            Submit Ticket
                        </button>
                        <button className="bg-slate-100 text-slate-800 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                            Security Portal
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Support;
