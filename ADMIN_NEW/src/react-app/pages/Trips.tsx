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
    Calendar
} from 'lucide-react';
import { getTrips, updateTripStatus, deleteTrip } from '../services/api';

interface Trip {
    _id: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    arrivalDate: string;
    availableKg: number;
    travelMeans: string;
    status: string;
    request: number;
    travelDocument?: string;
    createdAt: string;
}

export default function Trips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
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

    const handleDeleteTrip = async (tripId: string) => {
        if (!confirm('Are you sure you want to delete this trip record?')) return;

        try {
            await deleteTrip(tripId);
            fetchTrips();
        } catch (error) {
            console.error('Failed to delete trip:', error);
        }
    };

    const getTravelIcon = (means: string) => {
        switch (means.toLowerCase()) {
            case 'airplane': return <Plane className="w-4 h-4" />;
            case 'train': return <Train className="w-4 h-4" />;
            case 'car': return <Car className="w-4 h-4" />;
            case 'ship': return <Ship className="w-4 h-4" />;
            case 'bus': return <Bus className="w-4 h-4" />;
            default: return <Truck className="w-4 h-4" />;
        }
    };

    const filteredTrips = trips.filter(trip =>
        (trip.fromLocation?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (trip.toLocation?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (trip.user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (trip.user?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (trip.user?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

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
                                                        {trip.user?.firstName ? trip.user.firstName[0] : 'T'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#1e2749] text-sm">{trip.user?.firstName || 'Unknown'} {trip.user?.lastName || 'User'}</div>
                                                        <div className="text-[10px] font-bold text-gray-400">{trip.user?.email || 'No email available'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-black text-[#5240E8]">{trip.fromLocation}</div>
                                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                                        <div className="text-sm font-black text-[#5240E8]">{trip.toLocation}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-500">
                                                            {getTravelIcon(trip.travelMeans)}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1e2749]">{trip.travelMeans}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(trip.departureDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">
                                                        {trip.availableKg}kg Available
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center ${
                                                        trip.status === 'verified' || trip.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        trip.status === 'pending_admin_review' || trip.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                        trip.status === 'declined' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-gray-50 text-gray-400 border-gray-100'
                                                    }`}>
                                                        {trip.status === 'pending_admin_review' ? 'Review Required' : trip.status}
                                                    </span>
                                                    {trip.travelDocument && trip.travelDocument.trim() !== '' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const doc = trip.travelDocument!;
                                                                if (doc.startsWith('data:') || doc.startsWith('http')) {
                                                                    window.open(doc, '_blank', 'noopener,noreferrer');
                                                                } else {
                                                                    window.open(`https://${doc}`, '_blank', 'noopener,noreferrer');
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all text-center flex items-center justify-center gap-1"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            View Proof
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
                                                        onClick={() => {
                                                            const details = [
                                                                `Traveler: ${trip.user?.firstName || ''} ${trip.user?.lastName || ''}`,
                                                                `Email: ${trip.user?.email || 'N/A'}`,
                                                                `Route: ${trip.fromLocation} → ${trip.toLocation}`,
                                                                `Travel Means: ${trip.travelMeans}`,
                                                                `Available KG: ${trip.availableKg}`,
                                                                `Departure: ${new Date(trip.departureDate).toLocaleDateString()}`,
                                                                `Arrival: ${new Date(trip.arrivalDate).toLocaleDateString()}`,
                                                                `Status: ${trip.status}`,
                                                                `Requests: ${trip.request || 0}`,
                                                                `Created: ${new Date(trip.createdAt).toLocaleString()}`,
                                                                `Travel Document: ${trip.travelDocument ? 'Uploaded' : 'Not uploaded'}`,
                                                            ].join('\n');
                                                            alert(details);
                                                        }}
                                                        className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase hover:bg-gray-100"
                                                    >
                                                        Details
                                                    </button>
                                                    {(trip.status === 'pending_admin_review' || trip.status === 'pending') && (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm('Approve and verify this trip?')) return;
                                                                    const res = await updateTripStatus(trip._id, 'verified');
                                                                    if (res.success) fetchTrips();
                                                                }}
                                                                className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase hover:bg-green-100"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    const reason = prompt('Enter reason for decline:');
                                                                    if (reason === null) return;
                                                                    const res = await updateTripStatus(trip._id, 'declined', reason);
                                                                    if (res.success) fetchTrips();
                                                                }}
                                                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase hover:bg-red-100"
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteTrip(trip._id)}
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
