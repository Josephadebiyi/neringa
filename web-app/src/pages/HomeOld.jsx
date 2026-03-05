import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    MapPin,
    Calendar,
    Users,
    ChevronRight,
    Globe,
    PlusCircle,
    UserCircle,
    ArrowRight,
    Bus as BusIcon,
    Car,
    ShieldCheck,
    Check,
    Plane,
    Train,
    Star,
    Smartphone,
    Download
} from 'lucide-react';
import api from '../api';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>

            <div className="hidden md:flex gap-10 items-center">
                <button onClick={() => navigate('/search?mode=carpool')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">Carpool</button>
                <button onClick={() => navigate('/search?mode=bus')} className="text-[#054752] font-semibold hover:text-[#5845D8] transition-colors cursor-pointer text-[15px]">Bus</button>
            </div>

            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/search')} className="hidden md:flex items-center cursor-pointer group">
                    <Search size={22} className="text-[#054752] group-hover:text-[#5845D8]" />
                </button>

                <Link to="/post-trip" className="hidden md:flex items-center gap-2 cursor-pointer text-[#5845D8] hover:text-[#4838B5] transition-colors">
                    <PlusCircle size={22} />
                    <span className="font-semibold text-[15px]">Offer a ride</span>
                </Link>

                <div className="flex items-center gap-5">
                    <div className="hidden md:flex items-center gap-2 cursor-pointer group">
                        <Smartphone size={20} className="text-[#054752] group-hover:text-[#5845D8]" />
                        <span className="text-[#054752] text-sm font-semibold group-hover:text-[#5845D8]">Get the app</span>
                    </div>
                    <Link to="/dashboard" className="flex items-center">
                        <UserCircle size={32} className="text-[#d9d9d9] hover:text-[#054752] transition-colors" />
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const HeroSection = () => {
    const navigate = useNavigate();
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');

    const handleSearch = () => {
        if (origin && destination) {
            navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
        } else {
            navigate('/search');
        }
    };

    return (
        <section className="relative w-full max-w-[1240px] mx-auto pt-10 px-6 md:px-12">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-12">
                <div className="w-full md:w-[45%]">
                    <h1 className="text-5xl md:text-6xl font-black text-[#054752] leading-[1.1] tracking-tight">
                        Bus and carpool.<br />
                        Travel your way<br />
                        with Bago.
                    </h1>
                </div>
                <div className="w-full md:w-[50%] h-[350px] overflow-hidden rounded-2xl">
                    <img
                        src="/hero.png"
                        alt="Travelers with Bus"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Main Search Component */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex flex-col md:flex-row items-center w-full relative z-20 overflow-hidden">
                <div className="flex w-full md:w-1/4 items-center px-4 py-4 md:py-6 border-b md:border-b-0 md:border-r border-gray-100 group">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400 mr-4 group-focus-within:border-[#5845D8]"></div>
                    <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Leaving from"
                        className="outline-none text-[16px] font-medium w-full bg-transparent text-[#054752] placeholder-[#708c91]"
                    />
                </div>
                <div className="flex w-full md:w-1/4 items-center px-4 py-4 md:py-6 border-b md:border-b-0 md:border-r border-gray-100 group">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400 mr-4 group-focus-within:border-[#5845D8]"></div>
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Going to"
                        className="outline-none text-[16px] font-medium w-full bg-transparent text-[#054752] placeholder-[#708c91]"
                    />
                </div>
                <div className="flex w-full md:w-[20%] items-center px-4 py-4 md:py-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <Calendar size={20} className="text-[#708c91] mr-3" />
                    <input
                        type="text"
                        placeholder="Today"
                        readOnly
                        className="outline-none text-[16px] font-medium w-full bg-transparent text-[#054752] cursor-pointer"
                    />
                </div>
                <div className="flex w-full md:w-[20%] items-center px-4 py-4 md:py-6">
                    <Users size={20} className="text-[#708c91] mr-3" />
                    <input
                        type="text"
                        placeholder="1 passenger"
                        readOnly
                        className="outline-none text-[16px] font-medium w-full bg-transparent text-[#054752] cursor-pointer"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="w-full md:w-[15%] bg-[#5845D8] text-white py-4 md:py-6 font-bold hover:bg-[#4838B5] transition-colors"
                >
                    Search
                </button>
            </div>

            <div className="mt-4 flex items-center gap-2 px-2">
                <div className="w-5 h-5 bg-[#5845D8] rounded flex items-center justify-center">
                    <Check size={14} className="text-white" />
                </div>
                <label className="text-sm font-semibold text-[#054752]">Show stays</label>
            </div>
        </section>
    );
};

const PromoBar = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-10">
            <div className="bg-[#054752] rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Share your ride. Cut your costs.
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
                    Carpool as a driver to turn your empty seats into lower travel costs. It's simple: publish your ride and get passengers to share your fuel and toll expenses.
                </p>
                <Link to="/post-trip" className="inline-flex items-center gap-3 bg-white text-[#054752] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all group">
                    <ArrowRight size={20} className="text-[#5845D8] rotate-180 group-hover:-translate-x-1 transition-transform" />
                    <span>Share your ride</span>
                </Link>
            </div>
        </section>
    );
};

const FeaturesSection = () => {
    const features = [
        {
            icon: <MapPin size={32} className="text-[#054752]" />,
            title: "Travel everywhere",
            desc: "Explore the world your way, with a huge choice of buses and countless carpool rides."
        },
        {
            icon: <BusIcon size={32} className="text-[#054752]" />,
            title: "Your pick of rides at low prices",
            desc: "No matter where you're going, by bus or carpool, find the perfect ride from our wide range of destinations and routes at low prices."
        },
        {
            icon: <ShieldCheck size={32} className="text-[#054752]" />,
            title: "Trust who you travel with",
            desc: "We take the time to get to know each of our members and bus partners. We check reviews, profiles and IDs, so you know who you’re travelling with and can book your ride at ease on our secure platform."
        }
    ];

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                {features.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-4">
                        <div className="bg-[#f0f4f5] w-14 h-14 rounded-full flex items-center justify-center">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-black text-[#054752]">{item.title}</h3>
                        <p className="text-[#708c91] text-[15px] font-medium leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const TripTypeSection = () => {
    const navigate = useNavigate();

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#054752] text-center mb-12">How are you travelling today?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => navigate('/search?mode=bus')} className="bg-[#f0f4f5] rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <BusIcon size={40} className="text-[#5845D8]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-[#054752]">By bus</h3>
                        <p className="text-[#708c91] font-medium text-[15px]">Explore thousands of routes in Europe with incredible discounts</p>
                    </div>
                    <div className="bg-[#5845D8] rounded-full p-2">
                        <ArrowRight size={20} className="text-white" />
                    </div>
                </div>
                <div onClick={() => navigate('/search?mode=car')} className="bg-[#f0f4f5] rounded-2xl p-8 flex items-center gap-6 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <Car size={40} className="text-[#5845D8]" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-[#054752]">By carpool</h3>
                        <p className="text-[#708c91] font-medium text-[15px]">Share the costs to travel directly to your destination</p>
                    </div>
                    <div className="bg-[#5845D8] rounded-full p-2">
                        <ArrowRight size={20} className="text-white" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const RatingsSection = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16">
            <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2">
                    <img
                        src="/rating_app.png"
                        alt="App rating"
                        className="rounded-3xl w-full h-auto shadow-xl"
                    />
                </div>
                <div className="w-full md:w-1/2">
                    <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-6 leading-tight">
                        Automatic Ratings.<br />
                        More reliable<br />
                        rides.
                    </h2>
                    <p className="text-[#708c91] text-[16px] font-medium leading-relaxed mb-8">
                        We’re launching Automatic Ratings to make profiles fairer and more accurate. If no feedback is left after 14 days, smooth trips get 5 stars to reward great members. Late cancellations or no-shows will get 1 star, except for the first time. This keeps profiles accurate so you can book with more confidence!
                    </p>
                    <Link to="/search" className="inline-block bg-[#5845D8] text-white px-10 py-3 rounded-full font-bold hover:bg-[#4838B5] transition-colors">
                        Get going
                    </Link>
                </div>
            </div>
        </section>
    );
};

const CarSection = () => {
    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-16">
            <div className="flex flex-col-reverse md:flex-row items-center gap-16">
                <div className="w-full md:w-1/2">
                    <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-8">
                        Only on Bago...
                    </h2>
                    <div className="relative">
                        <p className="text-[#054752] text-xl font-medium leading-relaxed mb-8 italic">
                            “Perfect for me because I enjoy carpool AND bus! Carpool to meet new people and make the trip go faster. And Bago Bus has good prices, so you feel happy when you travel.”
                        </p>
                        <p className="text-[#054752] font-bold text-lg">
                            Anna, Bago member since 2024
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-1/2">
                    <img
                        src="/two_people_car.png"
                        alt="Friends in car"
                        className="rounded-3xl w-full h-auto"
                    />
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-[#f2f2f2] pt-16 pb-6 mt-10">
            <div className="px-6 md:px-12 max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Compare our ride options</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <a href="#" className="hover:text-[#5845D8]">London → Paris</a>
                        <a href="#" className="hover:text-[#5845D8]">Paris → London</a>
                        <a href="#" className="hover:text-[#5845D8]">Manchester → London</a>
                        <a href="#" className="hover:text-[#5845D8]">London → Brussels</a>
                        <a href="#" className="hover:text-[#5845D8]">Edinburgh → London</a>
                        <a href="#" className="hover:text-[#5845D8]">Birmingham → London</a>
                        <a href="#" className="hover:text-[#5845D8]">Popular rides on Bago</a>
                        <a href="#" className="hover:text-[#5845D8]">Our international destinations</a>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Travel with carpool</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <a href="#" className="hover:text-[#5845D8]">Carpool Granada → Malaga</a>
                        <a href="#" className="hover:text-[#5845D8]">Carpool Sevilla → Malaga</a>
                        <a href="#" className="hover:text-[#5845D8]">Carpool Sevilla → Cadiz</a>
                        <a href="#" className="hover:text-[#5845D8]">Carpool Valencia → Barcelona</a>
                        <a href="#" className="hover:text-[#5845D8]">Carpool Marbella → Malaga</a>
                        <a href="#" className="hover:text-[#5845D8]">Carpool Sevilla → Granada</a>
                        <a href="#" className="hover:text-[#5845D8]">Popular carpool rides</a>
                        <a href="#" className="hover:text-[#5845D8]">Popular carpool destinations</a>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Travel with Bago Bus</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <a href="#" className="hover:text-[#5845D8]">Bus London → Paris</a>
                        <a href="#" className="hover:text-[#5845D8]">Bus London → Lille</a>
                        <a href="#" className="hover:text-[#5845D8]">Bus London → Brussels</a>
                        <a href="#" className="hover:text-[#5845D8]">Bus London → Amsterdam</a>
                        <a href="#" className="hover:text-[#5845D8]">Bus London → Paris Roissy CDG Airport</a>
                        <a href="#" className="hover:text-[#5845D8]">Bus London → Antwerp</a>
                        <a href="#" className="hover:text-[#5845D8]">Popular Bago Bus lines</a>
                        <a href="#" className="hover:text-[#5845D8]">Popular Bago Bus destinations</a>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    <h4 className="font-bold text-[#054752] text-md">Find out more</h4>
                    <div className="flex flex-col gap-4 text-[14px] font-medium text-[#708c91]">
                        <a href="#" className="hover:text-[#5845D8]">Who we are</a>
                        <a href="#" className="hover:text-[#5845D8]">How does Bago work?</a>
                        <a href="#" className="hover:text-[#5845D8]">More on Bago Bus</a>
                        <a href="#" className="hover:text-[#5845D8]">Help Centre</a>
                        <a href="#" className="hover:text-[#5845D8]">Press</a>
                        <a href="#" className="hover:text-[#5845D8]">We're Hiring!</a>

                        <div className="mt-4">
                            <img src="/app_store_buttons.png" alt="Download on App Store and Google Play" className="h-10 w-auto cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 max-w-[1240px] mx-auto border-t border-gray-300 pt-6 flex flex-col md:flex-row justify-between items-center text-[12px] font-medium text-[#708c91]">
                <div className="flex gap-6 mb-4 md:mb-0">
                    <a href="#" className="hover:text-[#054752]">Terms and Conditions</a>
                    <a href="#" className="hover:text-[#054752]">Cookie settings</a>
                </div>
                <div className="flex items-center gap-2">
                    <img src="/bago_logo.png" alt="Bago" className="h-4 w-auto grayscale brightness-50 opacity-60" />
                    <span>Bago, 2026 ©</span>
                </div>
            </div>
        </footer>
    );
};

export default function Home() {
    return (
        <div className="min-h-screen bg-white font-sans overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <div className="h-10 md:h-0"></div>
            <PromoBar />
            <FeaturesSection />
            <TripTypeSection />
            <RatingsSection />
            <CarSection />
            <Footer />
        </div>
    );
}
