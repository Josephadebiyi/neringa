import React from 'react';
import { Shield, Plane, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview({ user, kycStatus, handleStartKyc, fetchKycStatus }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KYC Card */}
                {kycStatus !== 'approved' && (
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-bl-[80px] -mr-10 -mt-10 group-hover:bg-[#5845D8]/10 transition-all"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="font-black text-[#054752] flex items-center gap-3 text-lg uppercase tracking-tight">
                                <Shield size={24} className="text-[#5845D8]" /> Verification
                            </h3>
                        </div>

                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            {kycStatus === 'pending' || kycStatus === 'processing' ? (
                                <div className="flex items-center gap-4 text-amber-600 bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50">
                                    <Clock size={32} className="animate-pulse" />
                                    <div>
                                        <p className="font-black uppercase tracking-widest text-xs">Under Review</p>
                                        <p className="text-sm font-bold opacity-80">Hang tight! Reviewing docs.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">You need to verify your identity to post trips or request deliveries securely.</p>
                                    <button onClick={handleStartKyc} className="w-full bg-[#5845D8] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#5845D8]/20 hover:scale-[1.02] transition-all active:scale-95">
                                        Verify Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className={`${kycStatus === 'approved' ? 'md:col-span-3' : 'md:col-span-2'} grid grid-cols-1 sm:grid-cols-2 gap-6`}>
                    <Link to="/post-trip" className="bg-[#5845D8] p-8 rounded-[32px] text-white shadow-xl shadow-[#5845D8]/20 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all h-full flex flex-col justify-between">
                        <div className="absolute -right-4 -top-4 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                        <div>
                            <Plane size={40} className="mb-6 text-white/90" />
                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Post a Trip</h3>
                            <p className="text-white/70 text-sm font-medium leading-relaxed">Monetize your empty luggage space and earn on the go.</p>
                        </div>
                        <div className="font-black text-white mt-8 flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-widest text-xs">
                            Get Started <span>→</span>
                        </div>
                    </Link>

                    <Link to="/send-package" className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative group cursor-pointer hover:shadow-lg transition-all border-b-4 border-b-gray-50 overflow-hidden flex flex-col justify-between">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gray-50 rounded-bl-[60px] -mr-6 -mt-6 group-hover:bg-[#5845D8]/5 transition-all"></div>
                        <div>
                            <Package size={40} className="mb-6 text-[#5845D8]" />
                            <h3 className="text-2xl font-black text-[#054752] mb-2 uppercase tracking-tight">Send Package</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">Find a trusted traveler heading to your destination.</p>
                        </div>
                        <div className="font-black text-[#5845D8] mt-8 flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-widest text-xs">
                            Find Traveler <span>→</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Completed', value: '0', icon: CheckCircle, color: 'text-green-500' },
                    { label: 'In Transit', value: '0', icon: Clock, color: 'text-blue-500' },
                    { label: 'Total Earned', value: '$0.00', icon: Shield, color: 'text-[#5845D8]' },
                    { label: 'Rating', value: 'N/A', icon: AlertCircle, color: 'text-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                        <div className={`mx-auto w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-2xl font-black text-[#054752]">{stat.value}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
