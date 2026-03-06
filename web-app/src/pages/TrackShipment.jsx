import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
    Search,
    ChevronLeft,
    Package,
    MapPin,
    Calendar,
    Clock,
    CheckCircle,
    Truck,
    ArrowRight,
    RefreshCw,
    Shield
} from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#054752] hover:text-[#5845D8] transition-all font-bold text-xs">
                <ChevronLeft size={20} />
                <span>Back</span>
            </button>
            <Link to="/">
                <img src="/bago_logo.png" alt="Bago" className="h-7 md:h-8" />
            </Link>
            <div className="w-16 hidden md:block"></div>
        </nav>
    );
};

export default function TrackShipment() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTrack = async (e) => {
        if (e) e.preventDefault();
        if (!trackingNumber.trim()) return;

        setLoading(true);
        setError(null);
        setShipment(null);

        try {
            const response = await api.get(`/api/bago/track/${trackingNumber.trim().toUpperCase()}`);
            if (response.data.success) {
                setShipment(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Shipment not found. Please check your tracking number.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const stages = ['pending', 'accepted', 'intransit', 'delivering', 'completed'];
        return stages.indexOf(status);
    };

    const steps = [
        { label: 'Requested', status: 'pending', icon: Package },
        { label: 'Accepted', status: 'accepted', icon: CheckCircle },
        { label: 'In Transit', status: 'intransit', icon: Truck },
        { label: 'Out for Delivery', status: 'delivering', icon: MapPin },
        { label: 'Completed', status: 'completed', icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-4xl mx-auto px-6 py-12 font-sans">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-[#054752] mb-3 tracking-tight">Track Shipment</h1>
                    <p className="text-[#708c91] font-bold text-sm max-w-lg mx-auto leading-relaxed">Enter your tracking number to see the real-time status of your package.</p>
                </div>

                {/* Track Input */}
                <form onSubmit={handleTrack} className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 mb-10">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input
                            type="text"
                            placeholder="e.g. BAGO-A1B2C3D4"
                            className="w-full py-3 pl-11 pr-6 rounded-xl bg-gray-50 text-[#054752] font-bold text-xs outline-none border border-transparent focus:border-[#5845D8] focus:bg-white transition-all"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-[#5845D8] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-70"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Track Now'}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 border border-red-50 text-red-600 p-4 rounded-2xl text-center font-bold text-xs mb-10 animate-in fade-in duration-300">
                        {error}
                    </div>
                )}

                {shipment && (
                    <div className="animate-in slide-in-from-bottom-8 duration-500">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                                    <Truck size={64} className="text-[#054752]" />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-0.5">Current Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></span>
                                    <h3 className="text-base font-black text-[#054752] capitalize">{shipment.status}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                                    <Package size={64} className="text-[#5845D8]" />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-0.5">Tracking Number</p>
                                <h3 className="text-base font-black text-[#5845D8]">{shipment.trackingNumber}</h3>
                            </div>
                            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                                    <Calendar size={64} className="text-[#054752]" />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-0.5">Estimated Arrival</p>
                                <h3 className="text-base font-black text-[#054752]">
                                    {shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString() : 'Pending'}
                                </h3>
                            </div>
                        </div>

                        {/* Visual Progressbar */}
                        <div className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-sm mb-8 overflow-x-auto">
                            <div className="min-w-[600px] relative flex justify-between">
                                {/* Track Line */}
                                <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-50 z-0">
                                    <div
                                        className="h-full bg-[#5845D8] transition-all duration-1000 shadow-[0_0_10px_rgba(88,69,216,0.2)]"
                                        style={{ width: `${(getStatusStep(shipment.status) / (steps.length - 1)) * 100}%` }}
                                    ></div>
                                </div>

                                {steps.map((step, i) => {
                                    const Icon = step.icon;
                                    const isCompleted = getStatusStep(shipment.status) >= i;
                                    const isCurrent = getStatusStep(shipment.status) === i;

                                    return (
                                        <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${isCompleted ? 'bg-[#5845D8] text-white' : 'bg-white text-gray-200 border border-gray-50'} ${isCurrent ? 'ring-4 ring-[#5845D8]/10 scale-105' : ''}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[11px] font-black tracking-tight ${isCompleted ? 'text-[#054752]' : 'text-gray-300'}`}>{step.label}</p>
                                                {isCurrent && <p className="text-[8px] font-black text-[#5845D8] uppercase tracking-[1.5px] mt-0.5 animate-bounce">Active</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Movements */}
                        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="text-sm font-black text-[#054752] uppercase tracking-[2px] ml-1">Shipment History</h3>
                            </div>
                            <div className="p-8">
                                <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                                    {shipment.movementTracking?.length > 0 ? (
                                        [...shipment.movementTracking].reverse().map((move, i) => (
                                            <div key={i} className="relative pl-12">
                                                <div className="absolute left-0 top-1.5 w-[34px] h-[34px] bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#5845D8] z-10 shadow-sm group hover:border-[#5845D8] transition-all">
                                                    <Clock size={14} className="group-hover:rotate-12 transition-transform" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
                                                        <h4 className="text-sm font-bold text-[#054752] capitalize">{move.status}</h4>
                                                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {new Date(move.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#708c91] font-semibold text-xs leading-relaxed">
                                                        <span className="text-[#054752] font-black uppercase text-[10px] tracking-widest mr-1 opacity-70">Location:</span> {move.location || 'In transit'}<br />
                                                        {move.notes && <span className="italic mt-1 block font-medium">"{move.notes}"</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative pl-12">
                                            <div className="absolute left-0 top-1.5 w-[34px] h-[34px] bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#5845D8] z-10 shadow-sm">
                                                <Clock size={14} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h4 className="text-sm font-bold text-[#054752]">Shipment Created</h4>
                                                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        {new Date(shipment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[#708c91] font-semibold text-xs">Bago system received the delivery request.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Safety Banner */}
            {!shipment && !loading && (
                <div className="max-w-4xl mx-auto px-6 pb-20 font-sans">
                    <div className="bg-[#054752] rounded-[32px] p-8 md:p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                            <Shield size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black mb-1.5 tracking-tight uppercase">Bago Protection Policy</h3>
                            <p className="text-white/60 font-bold text-xs leading-relaxed max-w-xl">
                                Every shipment on our platform is protected by Bago's escrow and insurance system.
                                We guarantee safe delivery or a full refund.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
