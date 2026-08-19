import { useEffect, useState } from 'react';
import {
    Search,
    Truck,
    Loader2,
    Filter,
    ArrowRight,
    Plane,
    Train,
    Car,
    Ship,
    Bus,
    Trash2,
    LayoutGrid,
    Calendar,
    X,
    TrendingUp,
    Pencil,
    Check
} from 'lucide-react';
import { getTrips, updateTripStatus, deleteTrip, updateTripPrice, deleteSingleTrip, updateSingleTripStatus } from '../services/api';
import JourneyMap from '../components/JourneyMap';

interface TripDate {
    id: string;
    departureDate: string;
    arrivalDate: string;
    status: string;
    availableKg?: number;
}

interface Trip {
    _id: string;
    tripNumber?: string;
    batchId?: string;
    dateCount?: number;
    dates?: TripDate[];
    tripIds?: string[];
    soldShipments?: unknown[];
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        accountType?: string;
        companyName?: string;
        tradingName?: string;
    };
    fromLocation: string;
    fromCountry?: string;
    toLocation: string;
    toCountry?: string;
    departureDate: string;
    arrivalDate: string;
    availableKg: number;
    soldKg?: number;
    travelMeans: string;
    status: string;
    request: number;
    travelDocument?: string;
    createdAt: string;
    currency?: string;
    pricePerKg?: number;
    travelerEarnings?: number;
    grossSales?: number;
    payoutStatus?: string;
    bookingStatusSummary?: string;
    activeShipmentCount?: number;
}

function businessName(user: Trip['user']): string | null {
    if (!user || user.accountType !== 'company') return null;
    return user.tradingName || user.companyName || null;
}

function formatDateRange(dates?: TripDate[]): string {
    if (!dates || dates.length < 2) return '';
    const first = new Date(dates[0].departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const last = new Date(dates[dates.length - 1].departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${first} – ${last}`;
}

function formatPayoutStatus(raw: string | undefined): string {
    switch ((raw || '').trim().toLowerCase()) {
        case 'paid': return 'Paid out';
        case 'partially_paid': return 'Partially paid';
        case 'pending': return 'Pending';
        default: return raw || 'Pending';
    }
}

export default function Trips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [detailTrip, setDetailTrip] = useState<Trip | null>(null);
    const [editingPrice, setEditingPrice] = useState(false);
    const [priceDraft, setPriceDraft] = useState('');
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceError, setPriceError] = useState<string | null>(null);
    const limit = 20;

    const toggleSelection = (tripId: string) => {
        setSelectedTrips(prev =>
            prev.includes(tripId)
                ? prev.filter(id => id !== tripId)
                : [...prev, tripId]
        );
    };

    const toggleAll = () => {
        if (selectedTrips.length === trips.length) {
            setSelectedTrips([]);
        } else {
            setSelectedTrips(trips.map(t => t._id));
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [currentPage]);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const data = await getTrips(currentPage, limit);
            if (data.success && Array.isArray(data.data)) {
                setTrips(data.data);
                setTotalCount(data.totalCount || data.data.length);
            }
        } catch (error) {
            console.error('Failed to fetch trips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedTrips.length) return;
        if (!confirm(`Are you sure you want to delete ${selectedTrips.length} selected trips?`)) return;

        try {
            setLoading(true);
            for (const id of selectedTrips) {
                await deleteTrip(id);
            }
            setSelectedTrips([]);
            fetchTrips();
        } catch (error) {
            console.error('Failed to delete trips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (tripId: string, dateCount?: number) => {
        const note = (dateCount ?? 1) > 1 ? ` and all ${dateCount} dates in it` : '';
        if (!confirm(`Are you sure you want to delete this trip record${note}?`)) return;

        try {
            await deleteTrip(tripId);
            fetchTrips();
        } catch (error) {
            console.error('Failed to delete trip:', error);
        }
    };

    const handleRemoveSingleDate = async (dateId: string) => {
        if (!confirm('Remove this date from the posting? This deletes just this one date, keeping the rest.')) return;
        try {
            await deleteSingleTrip(dateId);
            setDetailTrip(prev => prev ? {
                ...prev,
                dates: prev.dates?.filter(d => d.id !== dateId),
                dateCount: (prev.dateCount ?? 1) - 1,
            } : prev);
            fetchTrips();
        } catch (error) {
            console.error('Failed to remove date:', error);
        }
    };

    const handleSingleDateStatus = async (dateId: string, status: 'active' | 'declined', reason?: string) => {
        try {
            const res = await updateSingleTripStatus(dateId, status, reason);
            if (!res?.success) throw new Error(res?.message || 'Could not update this date.');
            setDetailTrip(prev => prev ? {
                ...prev,
                dates: prev.dates?.map(d => d.id === dateId ? { ...d, status } : d),
            } : prev);
            fetchTrips();
        } catch (error) {
            console.error('Failed to update date status:', error);
            setActionError(error instanceof Error ? error.message : 'Could not update this date.');
        }
    };

    const handleTripStatusUpdate = async (tripId: string, status: string, reason?: string) => {
        try {
            setActionError(null);
            const res = await updateTripStatus(tripId, status, reason);
            if (!res?.success) {
                throw new Error(res?.message || 'Trip status could not be updated.');
            }
            await fetchTrips();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Trip status could not be updated.';
            setActionError(message);
            console.error('Failed to update trip status:', error);
        }
    };

    const startEditingPrice = () => {
        if (!detailTrip) return;
        setPriceDraft(String(detailTrip.pricePerKg ?? ''));
        setPriceError(null);
        setEditingPrice(true);
    };

    const handleSavePrice = async () => {
        if (!detailTrip) return;
        const nextPrice = parseFloat(priceDraft);
        if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
            setPriceError('Enter a valid price greater than 0.');
            return;
        }
        try {
            setPriceSaving(true);
            setPriceError(null);
            const res = await updateTripPrice(detailTrip._id, nextPrice, detailTrip.currency);
            if (!res?.success) {
                throw new Error(res?.message || 'Price could not be updated.');
            }
            setDetailTrip(res.data);
            setTrips(prev => prev.map(t => (t._id === detailTrip._id ? res.data : t)));
            setEditingPrice(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Price could not be updated.';
            setPriceError(message);
        } finally {
            setPriceSaving(false);
        }
    };

    const getTravelIcon = (means: string) => {
        switch ((means ?? '').toLowerCase()) {
            case 'airplane': return <Plane className="w-4 h-4" />;
            case 'train': return <Train className="w-4 h-4" />;
            case 'car': return <Car className="w-4 h-4" />;
            case 'ship': return <Ship className="w-4 h-4" />;
            case 'bus': return <Bus className="w-4 h-4" />;
            default: return <Truck className="w-4 h-4" />;
        }
    };

    const filteredTrips = trips.filter(trip => {
        const term = searchTerm.toLowerCase();
        return (
            (trip.fromLocation?.toLowerCase() || '').includes(term) ||
            (trip.toLocation?.toLowerCase() || '').includes(term) ||
            (trip.user?.email?.toLowerCase() || '').includes(term) ||
            (trip.user?.firstName?.toLowerCase() || '').includes(term) ||
            (trip.user?.lastName?.toLowerCase() || '').includes(term) ||
            (trip.tripNumber?.toLowerCase() || '').includes(term) ||
            (businessName(trip.user)?.toLowerCase() || '').includes(term)
        );
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
                        Listed Trips
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Global traveler inventory and logistics availability</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-[#5240E8]" />
                        <span className="text-xs font-black text-[#1e2749]">{totalCount} Total Routes</span>
                    </div>
                </div>
                {selectedTrips.length > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        className="bg-red-50 text-red-600 px-6 py-2 rounded-2xl border border-red-100 shadow-sm flex items-center gap-2 hover:bg-red-100 transition-all animate-in slide-in-from-right duration-300"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Delete Selected ({selectedTrips.length})</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            {actionError && (
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                    <span>{actionError}</span>
                    <button type="button" onClick={() => setActionError(null)} className="text-red-400 hover:text-red-700">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by city, country or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 focus:border-[#5240E8] outline-none shadow-sm transition-all font-medium"
                    />
                </div>
                <button className="p-3.5 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#5240E8] transition-all shadow-sm">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Trips Table */}
            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-12 h-12 text-[#5240E8] animate-spin" />
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Scanning Global Routes...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="py-5 px-8 w-4">
                                        <input
                                            type="checkbox"
                                            checked={trips.length > 0 && selectedTrips.length === trips.length}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-gray-300 text-[#5240E8] focus:ring-[#5240E8]"
                                        />
                                    </th>
                                    <th className="py-5 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Traveler</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Trip Details</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTrips.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-gray-400 font-bold italic">No listed trips found.</td>
                                    </tr>
                                ) : (
                                    filteredTrips.map((trip) => (
                                        <tr key={trip._id} className={`group hover:bg-gray-50/30 transition-colors ${selectedTrips.includes(trip._id) ? 'bg-blue-50/20' : ''}`}>
                                            <td className="py-5 px-8">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTrips.includes(trip._id)}
                                                    onChange={() => toggleSelection(trip._id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-[#5240E8] focus:ring-[#5240E8]"
                                                />
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#1e2749] font-black text-xs">
                                                        {(businessName(trip.user) || trip.user?.firstName || 'T')[0]}
                                                    </div>
                                                    <div>
                                                        {businessName(trip.user) ? (
                                                            <>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-[#1e2749] text-sm">{businessName(trip.user)}</span>
                                                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[8px] font-black uppercase">Business</span>
                                                                </div>
                                                                <div className="text-[10px] font-bold text-gray-400">{trip.user?.firstName} {trip.user?.lastName} · {trip.user?.email || 'No email available'}</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-bold text-[#1e2749] text-sm">{trip.user?.firstName || 'Unknown'} {trip.user?.lastName || 'User'}</div>
                                                                <div className="text-[10px] font-bold text-gray-400">{trip.user?.email || 'No email available'}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="space-y-1.5">
                                                    {trip.tripNumber && (
                                                        <div className="text-[9px] font-mono font-bold text-gray-400">#{trip.tripNumber}</div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-black text-[#5240E8]">{trip.fromLocation}</div>
                                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                                        <div className="text-sm font-black text-[#5240E8]">{trip.toLocation}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-500">
                                                            {getTravelIcon(trip.travelMeans)}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1e2749]">{trip.travelMeans}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {(trip.dateCount ?? 1) > 1 ? formatDateRange(trip.dates) : new Date(trip.departureDate).toLocaleDateString()}
                                                        </span>
                                                        {(trip.dateCount ?? 1) > 1 && (
                                                            <span className="px-1.5 py-0.5 bg-[#5240E8]/10 text-[#5240E8] rounded-md text-[9px] font-black">
                                                                ×{trip.dateCount} dates
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">
                                                            {trip.availableKg}kg Available
                                                        </div>
                                                        {Array.isArray(trip.soldShipments) && trip.soldShipments.length > 0 && (
                                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">
                                                                {trip.soldShipments.length} booking{trip.soldShipments.length > 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center ${
                                                        trip.status === 'verified' || trip.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        trip.status === 'pending_admin_review' || trip.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                        trip.status === 'declined' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        trip.status === 'mixed' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-gray-50 text-gray-400 border-gray-100'
                                                    }`}>
                                                        {trip.status === 'pending_admin_review' || trip.status === 'pending'
                                                            ? 'Pending'
                                                            : trip.status === 'verified' || trip.status === 'active'
                                                                ? 'Live'
                                                                : trip.status === 'mixed'
                                                                    ? 'Mixed'
                                                                    : trip.status}
                                                    </span>
                                                    {trip.travelDocument && trip.travelDocument.trim() !== '' && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                const doc = trip.travelDocument!;
                                                                const url = doc.startsWith('data:') || doc.startsWith('http') ? doc : `https://${doc}`;
                                                                try {
                                                                    const resp = await fetch(url);
                                                                    const blob = await resp.blob();
                                                                    const mime = blob.type || '';
                                                                    const ext = mime.includes('pdf') ? 'pdf'
                                                                        : mime.includes('png') ? 'png'
                                                                        : mime.includes('webp') ? 'webp'
                                                                        : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg'
                                                                        : url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
                                                                    const blobUrl = URL.createObjectURL(blob);
                                                                    const a = document.createElement('a');
                                                                    a.href = blobUrl;
                                                                    a.download = `travel-proof-${trip._id}.${ext}`;
                                                                    a.click();
                                                                    URL.revokeObjectURL(blobUrl);
                                                                } catch {
                                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all text-center flex items-center justify-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                            Download Proof
                                                        </button>
                                                    )}
                                                    {(!trip.travelDocument || trip.travelDocument.trim() === '') && (
                                                        <span className="text-[10px] font-bold text-red-400 text-center">No proof uploaded</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <div className="flex justify-end gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => { setDetailTrip(trip); setEditingPrice(false); setPriceError(null); }}
                                                        className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase hover:bg-gray-100"
                                                    >
                                                        Details
                                                    </button>
                                                    {(trip.status === 'pending_admin_review' || trip.status === 'pending' || trip.status === 'mixed') && (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    const note = (trip.dateCount ?? 1) > 1 ? ` (all ${trip.dateCount} dates)` : '';
                                                                    if (!confirm(`Approve and verify this trip${note}?`)) return;
                                                                    await handleTripStatusUpdate(trip._id, 'active');
                                                                }}
                                                                className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase hover:bg-green-100"
                                                            >
                                                                Approve{(trip.dateCount ?? 1) > 1 ? ' All' : ''}
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    const reason = prompt('Enter reason for decline:');
                                                                    if (reason === null) return;
                                                                    await handleTripStatusUpdate(trip._id, 'declined', reason);
                                                                }}
                                                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-100"
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteTrip(trip._id, trip.dateCount)}
                                                        className="p-2.5 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Trip Detail Modal */}
            {detailTrip && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-black text-[#1e2749]">
                                    {detailTrip.fromLocation} → {detailTrip.toLocation}
                                    {detailTrip.tripNumber && <span className="ml-2 text-[10px] font-mono font-bold text-gray-400 align-middle">#{detailTrip.tripNumber}</span>}
                                </h3>
                                <p className="text-xs font-bold text-gray-400 mt-0.5">
                                    {businessName(detailTrip.user)
                                        ? `${businessName(detailTrip.user)} (${detailTrip.user?.firstName} ${detailTrip.user?.lastName})`
                                        : `${detailTrip.user?.firstName} ${detailTrip.user?.lastName}`} · {detailTrip.user?.email}
                                </p>
                            </div>
                            <button onClick={() => setDetailTrip(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Price per kg — most important, shown prominently */}
                            <div className="flex items-center gap-4 bg-[#5240E8]/5 border border-[#5240E8]/20 rounded-2xl p-4">
                                <div className="flex-1">
                                    <p className="text-[9px] font-black text-[#5240E8]/60 uppercase tracking-widest">Price per kg</p>
                                    {editingPrice ? (
                                        <div className="mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-[#5240E8]/70">{detailTrip.currency || 'USD'}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={priceDraft}
                                                    onChange={(e) => setPriceDraft(e.target.value)}
                                                    className="w-28 px-2 py-1 rounded-lg border border-[#5240E8]/30 text-lg font-black text-[#5240E8] focus:outline-none focus:ring-2 focus:ring-[#5240E8]/30"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleSavePrice}
                                                    disabled={priceSaving}
                                                    className="p-1.5 bg-[#5240E8] text-white rounded-lg hover:bg-[#5240E8]/90 disabled:opacity-50"
                                                >
                                                    {priceSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => { setEditingPrice(false); setPriceError(null); }}
                                                    disabled={priceSaving}
                                                    className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {priceError && <p className="text-[10px] font-bold text-red-600 mt-1">{priceError}</p>}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-2xl font-black text-[#5240E8]">
                                                {detailTrip.currency || 'USD'} {Number(detailTrip.pricePerKg || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                <span className="text-sm font-bold text-[#5240E8]/50 ml-1">/ kg</span>
                                            </p>
                                            <button
                                                onClick={startEditingPrice}
                                                className="p-1.5 text-[#5240E8]/50 hover:text-[#5240E8] hover:bg-[#5240E8]/10 rounded-lg transition-colors"
                                                title="Edit price per kg"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Available</p>
                                    <p className="text-lg font-black text-gray-800 mt-0.5">{detailTrip.availableKg} <span className="text-sm font-bold text-gray-400">kg</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sold</p>
                                    <p className="text-lg font-black text-gray-800 mt-0.5">{detailTrip.soldKg ?? 0} <span className="text-sm font-bold text-gray-400">kg</span></p>
                                </div>
                            </div>

                            {(detailTrip.dateCount ?? 1) > 1 && Array.isArray(detailTrip.dates) && (
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Dates in this posting ({detailTrip.dates.length})
                                    </p>
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                        {detailTrip.dates.map((d) => (
                                            <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-800">{new Date(d.departureDate).toLocaleDateString()}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                                        d.status === 'active' || d.status === 'verified' ? 'bg-green-100 text-green-700' :
                                                        d.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {d.status === 'pending_admin_review' ? 'pending' : d.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {(d.status === 'pending_admin_review' || d.status === 'pending') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleSingleDateStatus(d.id, 'active')}
                                                                className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase hover:bg-green-100"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Enter reason for decline:');
                                                                    if (reason === null) return;
                                                                    handleSingleDateStatus(d.id, 'declined', reason);
                                                                }}
                                                                className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase hover:bg-red-100"
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveSingleDate(d.id)}
                                                        className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Remove this date"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <JourneyMap
                                fromCity={detailTrip.fromLocation}
                                fromCountry={detailTrip.fromCountry || ''}
                                toCity={detailTrip.toLocation}
                                toCountry={detailTrip.toCountry || ''}
                                travelMeans={detailTrip.travelMeans}
                                status={detailTrip.status}
                                departureDate={detailTrip.departureDate}
                                arrivalDate={detailTrip.arrivalDate}
                            />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    { label: 'Status',          value: detailTrip.status },
                                    { label: 'Travel means',    value: detailTrip.travelMeans },
                                    { label: 'Departure',       value: new Date(detailTrip.departureDate).toLocaleDateString() },
                                    { label: 'Arrival',         value: new Date(detailTrip.arrivalDate).toLocaleDateString() },
                                    { label: 'Requests',        value: String(detailTrip.request || 0) },
                                    { label: 'Payout',          value: formatPayoutStatus(detailTrip.payoutStatus) },
                                    { label: 'Travel doc',      value: detailTrip.travelDocument ? 'Uploaded ✓' : 'Not uploaded' },
                                    { label: 'Created',         value: new Date(detailTrip.createdAt).toLocaleString() },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                        <p className="text-xs font-bold text-[#1e2749]">{value}</p>
                                    </div>
                                ))}
                            </div>
                            {detailTrip.travelerEarnings != null && detailTrip.travelerEarnings > 0 && (
                                <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-100">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-black text-green-700">
                                        Traveler earned {detailTrip.currency || 'USD'} {Number(detailTrip.travelerEarnings).toFixed(2)} · Payout: {formatPayoutStatus(detailTrip.payoutStatus)}
                                    </span>
                                </div>
                            )}

                            {/* Sold shipments / bookings on this trip */}
                            {Array.isArray((detailTrip as any).soldShipments) && (detailTrip as any).soldShipments.length > 0 && (
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Bookings on this trip ({(detailTrip as any).soldShipments.length})</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {(detailTrip as any).soldShipments.map((sh: any) => (
                                            <div key={sh.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 truncate">{sh.packageTitle || sh.packageDescription || 'Package'}</p>
                                                    <p className="text-[10px] text-gray-400">Sender: {sh.senderName || '—'} · {sh.packageWeight ? `${sh.packageWeight} kg` : ''}</p>
                                                    {sh.trackingNumber && <p className="text-[9px] font-mono text-indigo-400 mt-0.5">{sh.trackingNumber}</p>}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                                        sh.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        sh.status === 'intransit' || sh.status === 'delivering' ? 'bg-blue-100 text-blue-700' :
                                                        sh.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>{sh.status}</span>
                                                    {sh.amount && <p className="text-[10px] font-black text-gray-700 mt-1">{sh.currency || ''} {Number(sh.amount).toLocaleString()}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white px-8 py-4 rounded-[24px] border border-gray-100 shadow-sm mt-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Showing {filteredTrips.length} of {totalCount} trips
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => (prev * limit < totalCount ? prev + 1 : prev))}
                        disabled={currentPage * limit >= totalCount || loading}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
