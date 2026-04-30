import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    MapPin,
    Navigation,
    Package,
    RefreshCw,
    Route,
    ShieldCheck,
    User,
} from 'lucide-react';

const ACTIVE_STATUSES = ['accepted', 'intransit', 'in-transit', 'delivering'];

const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'accepted':
            return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        case 'intransit':
        case 'in-transit':
            return 'bg-blue-50 text-blue-700 border-blue-100';
        case 'delivering':
            return 'bg-amber-50 text-amber-700 border-amber-100';
        default:
            return 'bg-gray-50 text-gray-600 border-gray-100';
    }
};

const getTravelerVerified = (request) => {
    const traveler = request?.traveler || request?.carrier || {};
    return (
        traveler.kycStatus === 'approved' ||
        traveler.isVerified === true ||
        request?.travelerKycStatus === 'approved' ||
        request?.travelerVerified === true
    );
};

const getLatestMovement = (request) => {
    const movement = Array.isArray(request?.movementTracking) ? request.movementTracking : [];
    return movement.length ? movement[movement.length - 1] : null;
};

const getLocationText = (request) => {
    const latest = getLatestMovement(request);
    return latest?.location || request?.currentLocation || request?.lastKnownLocation || 'Waiting for traveler update';
};

const getCoordinate = (request, key) => {
    const latest = getLatestMovement(request);
    const candidates = [
        latest?.[key],
        latest?.coordinates?.[key],
        request?.[key],
        request?.currentLocation?.[key],
        request?.lastKnownLocation?.[key],
        request?.travelerLocation?.[key],
    ];
    const value = candidates.find((candidate) => candidate !== undefined && candidate !== null && candidate !== '');
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const hasCoordinates = (request) => getCoordinate(request, 'lat') !== null && getCoordinate(request, 'lng') !== null;

const getPosition = (request, index, total) => {
    const lat = getCoordinate(request, 'lat');
    const lng = getCoordinate(request, 'lng');
    if (lat !== null && lng !== null) {
        return {
            left: `${Math.min(88, Math.max(8, ((lng + 180) / 360) * 100))}%`,
            top: `${Math.min(82, Math.max(12, ((90 - lat) / 180) * 100))}%`,
        };
    }

    const count = Math.max(total, 1);
    return {
        left: `${18 + ((index % 4) * 20)}%`,
        top: `${24 + (Math.floor(index / 4) * 18) + ((index % 2) * 8)}%`,
    };
};

function TrackingMap({ shipments, selectedId, onSelect }) {
    return (
        <div className="relative min-h-[360px] md:min-h-[520px] rounded-[28px] overflow-hidden border border-gray-100 bg-[#eef2f3] shadow-sm">
            <div className="absolute inset-0 opacity-70">
                <div className="absolute inset-x-0 top-[22%] h-px bg-white/80" />
                <div className="absolute inset-x-0 top-[48%] h-px bg-white/80" />
                <div className="absolute inset-x-0 top-[74%] h-px bg-white/80" />
                <div className="absolute inset-y-0 left-[22%] w-px bg-white/80" />
                <div className="absolute inset-y-0 left-[50%] w-px bg-white/80" />
                <div className="absolute inset-y-0 left-[78%] w-px bg-white/80" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(88,69,216,0.14),transparent_28%),radial-gradient(circle_at_76%_68%,rgba(1,33,38,0.10),transparent_30%)]" />
            <div className="absolute left-5 top-5 z-10 rounded-2xl bg-white/90 px-4 py-3 shadow-sm border border-white">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Active Shipment Map</p>
                <p className="text-lg font-black text-[#012126] leading-none mt-1">{shipments.length}</p>
            </div>

            {shipments.map((shipment, index) => {
                const position = getPosition(shipment, index, shipments.length);
                const verified = getTravelerVerified(shipment);
                const selected = selectedId === shipment._id;
                return (
                    <button
                        key={shipment._id}
                        onClick={() => onSelect(shipment)}
                        className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all ${selected ? 'scale-110' : 'hover:scale-105'}`}
                        style={position}
                        title={shipment.travelerName || 'Traveler'}
                    >
                        <span className={`relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-xl ${selected ? 'bg-[#5845D8] text-white' : 'bg-white text-[#5845D8]'}`}>
                            <Navigation size={18} fill="currentColor" />
                            <span className={`absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white ${verified ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </span>
                    </button>
                );
            })}

            {shipments.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
                    <div className="max-w-sm text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                            <MapPin size={28} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-[#012126]">No active shipments</h3>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Only accepted, in transit, and delivering shipments appear here.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShipmentCard({ shipment, selected, onSelect }) {
    const verified = getTravelerVerified(shipment);
    const latest = getLatestMovement(shipment);
    const coordinateReady = hasCoordinates(shipment);

    return (
        <button
            onClick={() => onSelect(shipment)}
            className={`w-full rounded-[22px] border p-4 text-left transition-all ${selected ? 'border-[#5845D8]/30 bg-[#5845D8]/5 shadow-sm' : 'border-gray-100 bg-white hover:border-[#5845D8]/20'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${getStatusClass(shipment.status)}`}>
                            {shipment.status || 'Active'}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${verified ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            <ShieldCheck size={10} />
                            {verified ? 'Verified' : 'Unverified'}
                        </span>
                    </div>
                    <h3 className="mt-3 text-sm font-black uppercase tracking-tight text-[#012126]">
                        {shipment.originCity || shipment.package?.fromCity || 'Origin'} to {shipment.destinationCity || shipment.package?.toCity || 'Destination'}
                    </h3>
                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {shipment.trackingNumber || 'Tracking pending'}
                    </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-[#5845D8]">
                    <Package size={18} />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <div className="flex items-center gap-2">
                    <User size={12} className="text-[#5845D8]" />
                    <span className="truncate">{shipment.travelerName || 'Traveler reviewing'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-[#5845D8]" />
                    <span className="truncate">{getLocationText(shipment)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-[#5845D8]" />
                    <span>{latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : 'No checkpoint yet'}</span>
                </div>
            </div>

            {!coordinateReady && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-amber-800">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="text-[9px] font-black uppercase tracking-wider leading-relaxed">Route is visible, live pin appears when coordinates are sent.</p>
                </div>
            )}
        </button>
    );
}

export default function LiveTracking({ user }) {
    const [shipments, setShipments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isAdmin = user?.isAdmin || user?.role?.toLowerCase?.().includes('admin') || user?.permissions?.includes?.('shipments:read');

    const activeShipments = useMemo(() => (
        shipments.filter((shipment) => ACTIVE_STATUSES.includes(shipment.status?.toLowerCase?.()))
    ), [shipments]);

    const selectedShipment = activeShipments.find((shipment) => shipment._id === selected?._id) || activeShipments[0] || null;

    const fetchShipments = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const endpoint = isAdmin ? '/api/Adminbaggo/tracking/active-shipments' : '/api/bago/recentOrder';
            let data = [];
            try {
                const response = await api.get(endpoint);
                data = response.data?.data || response.data?.shipments || response.data?.requests || [];
            } catch (adminError) {
                if (!isAdmin) throw adminError;
                const fallback = await api.get('/api/bago/recentOrder');
                data = fallback.data?.data || [];
            }
            setShipments(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load active shipments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShipments();
        const interval = window.setInterval(() => fetchShipments({ silent: true }), 15000);
        return () => window.clearInterval(interval);
    }, [isAdmin]);

    useEffect(() => {
        if (!selected && activeShipments.length > 0) {
            setSelected(activeShipments[0]);
        }
    }, [activeShipments, selected]);

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <RefreshCw className="animate-spin text-[#5845D8]" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans text-[#012126]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-green-700">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Refreshes every 15 seconds
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-[#012126]">Live Tracking</h2>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {isAdmin ? 'Admin view for active traveler locations only' : 'Active shipments and traveler verification'}
                    </p>
                </div>
                <button
                    onClick={() => fetchShipments()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012126] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
                    <AlertCircle size={18} />
                    <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                <TrackingMap shipments={activeShipments} selectedId={selectedShipment?._id} onSelect={setSelected} />

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
                            <Route size={18} className="mb-3 text-[#5845D8]" />
                            <p className="text-2xl font-black leading-none text-[#012126]">{activeShipments.length}</p>
                            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Active</p>
                        </div>
                        <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
                            <CheckCircle size={18} className="mb-3 text-green-500" />
                            <p className="text-2xl font-black leading-none text-[#012126]">{activeShipments.filter(getTravelerVerified).length}</p>
                            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Verified</p>
                        </div>
                    </div>

                    <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                        {activeShipments.map((shipment) => (
                            <ShipmentCard
                                key={shipment._id}
                                shipment={shipment}
                                selected={selectedShipment?._id === shipment._id}
                                onSelect={setSelected}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
