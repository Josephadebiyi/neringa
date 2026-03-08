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
import { API_BASE_URL } from '../config/api';

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
    createdAt: string;
}

export default function Trips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20;

    useEffect(() => {
        fetchTrips();
    }, [currentPage]);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(
                `${API_BASE_URL}/admin-trips?page=${currentPage}&limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) window.location.href = '/';
                throw new Error('Failed to fetch trips');
            }

            const data = await response.json();
            if (data.success) {
                setTrips(data.data);
                setTotalCount(data.totalCount);
            }
        } catch (error) {
            console.error('Failed to fetch trips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (tripId: string) => {
        if (!confirm('Are you sure you want to delete this trip record?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin-trips/${tripId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchTrips();
            }
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
        trip.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Traveler</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Route</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Details</th>
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
                                        <tr key={trip._id} className="group hover:bg-gray-50/30 transition-colors">
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#1e2749] font-black text-xs">
                                                        {trip.user.firstName ? trip.user.firstName[0] : 'T'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#1e2749] text-sm">{trip.user.firstName} {trip.user.lastName}</div>
                                                        <div className="text-[10px] font-bold text-gray-400">{trip.user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-black text-[#1e2749]">{trip.fromLocation}</div>
                                                    <ArrowRight className="w-3 h-3 text-gray-300" />
                                                    <div className="text-sm font-black text-[#1e2749]">{trip.toLocation}</div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(trip.departureDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-500">
                                                            {getTravelIcon(trip.travelMeans)}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1e2749]">{trip.travelMeans}</span>
                                                    </div>
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">
                                                        {trip.availableKg}kg Available
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${trip.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    trip.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-gray-50 text-gray-400 border-gray-100 text-gray-400'
                                                    }`}>
                                                    {trip.status}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <button
                                                    onClick={() => handleDeleteTrip(trip._id)}
                                                    className="p-2.5 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
