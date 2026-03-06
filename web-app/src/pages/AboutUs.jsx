import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    Globe,
    ShieldCheck,
    Users,
    TrendingUp,
    Target,
    Heart
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

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32 px-6">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5845D8]/5 rounded-full blur-[100px] -mr-64 -mt-32"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-black text-[#054752] mb-8 tracking-tight">
                        Revolutionizing <br />
                        <span className="text-[#5845D8]">Logistics</span> for Everyone.
                    </h1>
                    <p className="text-xl text-[#708c91] font-medium leading-relaxed max-w-2xl mx-auto">
                        Bago connects travelers with people who need to send packages across the world.
                        We're building a more connected, efficient, and human way to ship.
                    </p>
                </div>
            </section>

            {/* Our Story */}
            <section className="bg-white py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-[#B0891D]/10 rounded-[40px] rotate-3 blur-sm"></div>
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
                            alt="Our Team"
                            className="relative rounded-[32px] shadow-2xl z-10 w-full h-[500px] object-cover"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 text-[#5845D8] font-bold mb-6 uppercase tracking-widest text-sm">
                            <span className="w-10 h-1px bg-[#5845D8]"></span>
                            Our Story
                        </div>
                        <h2 className="text-4xl font-black text-[#054752] mb-6 leading-tight">Born from a simple travel observation.</h2>
                        <p className="text-[#708c91] text-lg font-medium leading-relaxed mb-6">
                            The idea for Bago started when we noticed how much empty luggage space goes to waste every day across thousands of flights and bus routes. Meanwhile, sending a small parcel internationally remains prohibitively expensive and slow.
                        </p>
                        <p className="text-[#708c91] text-lg font-medium leading-relaxed">
                            We realized that travelers are the ultimate delivery network. By connecting these two groups, Bago creates a win-win: senders get faster, cheaper delivery, and travelers earn extra income to subsidize their journeys.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-black text-[#054752] mb-4">Our Core Values</h2>
                    <p className="text-[#708c91] font-medium">The principles that guide every feature we build.</p>
                </div>
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: ShieldCheck,
                            title: 'Trust & Safety',
                            desc: 'Every member is verified. We prioritize the security of your items and your personal data above all else.',
                            color: 'bg-blue-50 text-blue-600'
                        },
                        {
                            icon: Globe,
                            title: 'Global Community',
                            desc: 'We are building a borderless world where people help people, regardless of geography or distance.',
                            color: 'bg-green-50 text-green-600'
                        },
                        {
                            icon: TrendingUp,
                            title: 'Innovation',
                            desc: 'Using technology to solve old problems in new ways. Constant improvement is in our DNA.',
                            color: 'bg-purple-50 text-purple-600'
                        }
                    ].map((v, i) => (
                        <div key={i} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-2">
                            <div className={`w-14 h-14 ${v.color} rounded-2xl flex items-center justify-center mb-6`}>
                                <v.icon size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-[#054752] mb-4">{v.title}</h3>
                            <p className="text-[#708c91] font-medium leading-relaxed">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#054752] py-20 px-6 overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-white relative z-10">
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">50k+</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Packages Sent</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">10k+</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Verified Travelers</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">120+</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Countries Covered</div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-black mb-2">4.9/5</div>
                        <div className="text-white/60 font-medium uppercase tracking-widest text-xs">Average Rating</div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-4xl font-black text-[#054752] mb-6">Join the movement.</h2>
                    <p className="text-[#708c91] text-lg font-medium mb-10 leading-relaxed">
                        Become part of the most human-centric logistics network in the world.
                        Start sending or start earning today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup" className="px-10 py-4 bg-[#5845D8] text-white font-bold rounded-2xl shadow-lg hover:bg-[#4838B5] transition-all">
                            Create Account
                        </Link>
                        <Link to="/search" className="px-10 py-4 border-2 border-[#054752] text-[#054752] font-bold rounded-2xl hover:bg-[#054752] hover:text-white transition-all">
                            Find a Route
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
