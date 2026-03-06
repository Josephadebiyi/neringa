import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Plane, Shield, ArrowRight } from 'lucide-react';

export default function HomeSimple() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center">
                <Link to="/" className="text-2xl font-black text-[#054752]">
                    BAGO
                </Link>
                <div className="flex gap-4">
                    <Link to="/about" className="text-gray-600 hover:text-[#054752] font-medium">About</Link>
                    <Link to="/how-it-works" className="text-gray-600 hover:text-[#054752] font-medium">How it Works</Link>
                    <Link to="/login" className="px-6 py-2 bg-[#054752] text-white rounded-full font-bold hover:bg-black transition">Login</Link>
                    <Link to="/signup" className="px-6 py-2 bg-[#5845D8] text-white rounded-full font-bold hover:bg-[#4534B8] transition">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-[#054752] to-[#032c33] text-white py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        Global Package<br/>Delivery.
                    </h1>
                    <p className="text-2xl md:text-3xl mb-8 text-gray-200">
                        Send packages <span className="font-bold">with courier partners.</span>
                    </p>
                    <div className="flex gap-4 mb-12">
                        <Link
                            to="/send-package"
                            className="px-8 py-4 bg-[#5845D8] text-white rounded-2xl font-bold hover:bg-[#4534B8] transition flex items-center gap-2"
                        >
                            <Package size={20} />
                            Send a Package
                        </Link>
                        <Link
                            to="/post-trip"
                            className="px-8 py-4 bg-white text-[#054752] rounded-2xl font-bold hover:bg-gray-100 transition flex items-center gap-2"
                        >
                            <Plane size={20} />
                            Post a Trip
                        </Link>
                    </div>

                    {/* Search Box */}
                    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">From</label>
                                <input
                                    type="text"
                                    placeholder="Departure city"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5845D8]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">To</label>
                                <input
                                    type="text"
                                    placeholder="Arrival city"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5845D8]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5845D8]"
                                />
                            </div>
                        </div>
                        <Link
                            to="/search"
                            className="mt-4 w-full bg-[#5845D8] text-white py-4 rounded-2xl font-bold hover:bg-[#4534B8] transition flex items-center justify-center gap-2"
                        >
                            Search <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-[#5845D8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-[#5845D8]" size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-[#054752] mb-3">Send Everywhere</h3>
                        <p className="text-gray-600">Send packages safely to any city. Our delivery partners go everywhere you need.</p>
                    </div>
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-[#5845D8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plane className="text-[#5845D8]" size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-[#054752] mb-3">Earn from Luggage</h3>
                        <p className="text-gray-600">Turn your extra luggage space into cash. A simple way to subsidize your travel costs.</p>
                    </div>
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-[#5845D8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="text-[#5845D8]" size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-[#054752] mb-3">Trust Built-in</h3>
                        <p className="text-gray-600">We verify every delivery partner and sender. Your package is in safe hands.</p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#F8F6F3] py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-[#054752] mb-6">Ready to get started?</h2>
                    <p className="text-xl text-gray-600 mb-8">Join thousands of travelers and senders worldwide.</p>
                    <div className="flex gap-4 justify-center">
                        <Link to="/signup" className="px-8 py-4 bg-[#5845D8] text-white rounded-2xl font-bold hover:bg-[#4534B8] transition">
                            Sign Up Now
                        </Link>
                        <Link to="/how-it-works" className="px-8 py-4 bg-white text-[#054752] border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition">
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#054752] text-white py-12 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-2xl font-black mb-4">BAGO</h3>
                        <p className="text-gray-300">Fast & affordable international package delivery.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">Company</h4>
                        <div className="space-y-2">
                            <Link to="/about" className="block text-gray-300 hover:text-white">About Us</Link>
                            <Link to="/how-it-works" className="block text-gray-300 hover:text-white">How it Works</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">Support</h4>
                        <div className="space-y-2">
                            <Link to="/help" className="block text-gray-300 hover:text-white">Help Center</Link>
                            <Link to="/track" className="block text-gray-300 hover:text-white">Track Shipment</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-3">Legal</h4>
                        <div className="space-y-2">
                            <Link to="/terms" className="block text-gray-300 hover:text-white">Terms</Link>
                            <Link to="/privacy" className="block text-gray-300 hover:text-white">Privacy</Link>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
                    <p>&copy; 2024 Bago. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
