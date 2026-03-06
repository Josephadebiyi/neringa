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

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-[#054752] mb-4">Track your Shipment</h1>
                    <p className="text-[#708c91] font-medium text-lg">Enter your tracking number to see the real-time status of your package.</p>
                </div>

                {/* Track Input */}
                <form onSubmit={handleTrack} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-12">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="e.g. BAGO-A1B2C3D4"
                            className="w-full py-4 pl-12 pr-6 rounded-2xl bg-[#F8F6F3] text-[#054752] font-bold outline-none border-2 border-transparent focus:border-[#5845D8] transition-all"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-4 bg-[#5845D8] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Track Now'}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl text-center font-bold mb-12 animate-in fade-in duration-300">
                        {error}
                    </div>
                )}

                {shipment && (
                    <div className="animate-in slide-in-from-bottom-8 duration-500">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                    <h3 className="text-xl font-black text-[#054752] capitalize">{shipment.status}</h3>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tracking Number</p>
                                <h3 className="text-xl font-black text-[#5845D8]">{shipment.trackingNumber}</h3>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Estimated Arrival</p>
                                <h3 className="text-xl font-black text-[#054752]">
                                    {shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString() : 'Pending'}
                                </h3>
                            </div>
                        </div>

                        {/* Visual Progressbar */}
                        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-sm mb-8 overflow-x-auto">
                            <div className="min-w-[600px] relative flex justify-between">
                                {/* Track Line */}
                                <div className="absolute top-6 left-8 right-8 h-1 bg-gray-100 z-0">
                                    <div
                                        className="h-full bg-[#5845D8] transition-all duration-1000"
                                        style={{ width: `${(getStatusStep(shipment.status) / (steps.length - 1)) * 100}%` }}
                                    ></div>
                                </div>

                                {steps.map((step, i) => {
                                    const Icon = step.icon;
                                    const isCompleted = getStatusStep(shipment.status) >= i;
                                    const isCurrent = getStatusStep(shipment.status) === i;

                                    return (
                                        <div key={i} className="relative z-10 flex flex-col items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-[#5845D8] text-white' : 'bg-white text-gray-300 border-2 border-gray-100'} ${isCurrent ? 'ring-4 ring-[#5845D8]/20 scale-110' : ''}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-sm font-bold ${isCompleted ? 'text-[#054752]' : 'text-gray-400'}`}>{step.label}</p>
                                                {isCurrent && <p className="text-[10px] font-black text-[#5845D8] uppercase tracking-wider">Active</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Movements */}
                        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-xl font-black text-[#054752]">Shipment History</h3>
                            </div>
                            <div className="p-8">
                                <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                    {shipment.movementTracking?.length > 0 ? (
                                        [...shipment.movementTracking].reverse().map((move, i) => (
                                            <div key={i} className="relative pl-12">
                                                <div className="absolute left-0 top-1.5 w-[36px] h-[36px] bg-white border-2 border-[#5845D8] rounded-full flex items-center justify-center text-[#5845D8] z-10">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                                                        <h4 className="text-lg font-bold text-[#054752] capitalize">{move.status}</h4>
                                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {new Date(move.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#708c91] font-medium leading-relaxed">
                                                        <span className="text-[#054752] font-semibold">Location:</span> {move.location || 'In transit'}<br />
                                                        {move.notes && <span className="italic">"{move.notes}"</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative pl-12">
                                            <div className="absolute left-0 top-1.5 w-[36px] h-[36px] bg-white border-2 border-[#5845D8] rounded-full flex items-center justify-center text-[#5845D8] z-10">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-[#054752]">Shipment Created</h4>
                                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {new Date(shipment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[#708c91] font-medium">Bago system received the delivery request.</p>
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
                <div className="max-w-4xl mx-auto px-6 pb-20">
                    <div className="bg-[#054752] rounded-[40px] p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center flex-shrink-0">
                            <Shield size={40} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-2">Bago Protection Policy</h3>
                            <p className="text-white/70 font-medium leading-relaxed">
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
