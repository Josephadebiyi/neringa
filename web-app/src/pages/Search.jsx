import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search as SearchIcon,
    MapPin,
    Calendar,
    Users,
    Star,
    ArrowRight,
    Filter,
    SlidersHorizontal,
    Package,
    Plane,
    UserCircle,
    ChevronLeft,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../api';
import Select from 'react-select';
import { locations } from '../utils/countries';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="lg:hidden">
                    <ChevronLeft size={24} className="text-[#054752]" />
                </button>
                <Link to="/" className="flex items-center">
                    <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
                </Link>
            </div>

            <div className="flex items-center gap-5">
                <Link to="/login" className="flex items-center">
                    <UserCircle size={32} className="text-[#d9d9d9] hover:text-[#054752] transition-colors" />
                </Link>
            </div>
        </nav>
    );
};

const TripCard = ({ trip }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleBookingClick = async () => {
        if (!isAuthenticated) {
            localStorage.setItem('pending_booking', JSON.stringify({ trip }));
            navigate('/signup');
            return;
        }

        try {
            const response = await api.get('/api/bago/getKyc');
            const kycStatus = response.data.data?.kyc;
            if (kycStatus) {
                navigate(`/send-package`, { state: { trip } });
            } else {
                localStorage.setItem('pending_booking', JSON.stringify({ trip }));
                navigate('/dashboard', { state: { message: 'Please complete KYC via Didit to send packages' } });
            }
        } catch (error) {
            console.error('Failed to verify KYC', error);
            navigate('/dashboard');
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-lg">
                            {trip.firstName?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <h3 className="font-bold text-[#054752] text-lg">{trip.firstName || 'Traveler'}</h3>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-medium text-gray-600">{trip.rating || '5.0'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-[#5845D8]" />
                            <span className="font-semibold text-[#054752]">{trip.origin || trip.originCity}</span>
                            <ArrowRight size={16} className="text-gray-400" />
                            <span className="font-semibold text-[#054752]">{trip.destination || trip.destinationCity}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <span>{trip.departureDate ? new Date(trip.departureDate).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            {trip.transportMode && (
                                <div className="flex items-center gap-2">
                                    <Plane size={16} className="text-gray-400" />
                                    <span className="capitalize">{trip.transportMode}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500">Available space</p>
                            <p className="font-bold text-[#054752]">{trip.availableWeight || '5'} kg</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Fixed rate</p>
                            <p className="font-bold text-[#5845D8] text-xl">Platform Standard</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleBookingClick}
                className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-semibold hover:bg-[#4838B5] transition-colors flex items-center justify-center gap-2 group-hover:gap-3"
            >
                Send Shipping Request
                <Package size={18} />
            </button>
        </div>
    );
};

const FilterPanel = ({ filters, setFilters, onApply }) => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
            <h3 className="font-bold text-[#054752] text-lg mb-6 flex items-center gap-2">
                <SlidersHorizontal size={20} />
                Filters
            </h3>

            <div className="space-y-6">
                {/* Date Range */}
                <div>
                    <label className="block text-sm font-semibold text-[#054752] mb-2">Travel Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    />
                </div>

                {/* Transport Mode */}
                <div>
                    <label className="block text-sm font-semibold text-[#054752] mb-2">Transport Mode</label>
                    <select
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                        value={filters.transportMode}
                        onChange={(e) => setFilters({ ...filters, transportMode: e.target.value })}
                    >
                        <option value="">All modes</option>
                        <option value="air">Air</option>
                        <option value="bus">Bus</option>
                        <option value="car">Car</option>
                        <option value="train">Train</option>
                        <option value="ship">Ship</option>
                    </select>
                </div>

                {/* Price Range */}
                <div>
                    <label className="block text-sm font-semibold text-[#054752] mb-2">Max Price per kg</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="w-full"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>$0</span>
                        <span className="font-semibold text-[#5845D8]">${filters.maxPrice}</span>
                        <span>$100</span>
                    </div>
                </div>

                {/* Weight Needed */}
                <div>
                    <label className="block text-sm font-semibold text-[#054752] mb-2">Weight Needed (kg)</label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                        value={filters.weight}
                        onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
                        placeholder="e.g., 5"
                    />
                </div>

                <button
                    onClick={onApply}
                    className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-semibold hover:bg-[#4838B5] transition-colors"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default function Search() {
    const [searchParams] = useSearchParams();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);

    const locationOptions = locations.map(loc => ({
        value: loc.city,
        label: (
            <div className="flex items-center gap-2">
                <span>{loc.flag}</span>
                <span>{loc.label}</span>
            </div>
        ),
        city: loc.city,
        country: loc.country,
        flag: loc.flag
    }));

    const initialOrigin = searchParams.get('origin')
        ? locationOptions.find(o => o.city === searchParams.get('origin')) || { value: searchParams.get('origin'), label: searchParams.get('origin'), city: searchParams.get('origin') }
        : null;

    const initialDestination = searchParams.get('destination')
        ? locationOptions.find(o => o.city === searchParams.get('destination')) || { value: searchParams.get('destination'), label: searchParams.get('destination'), city: searchParams.get('destination') }
        : null;

    const [filters, setFilters] = useState({
        origin: initialOrigin,
        destination: initialDestination,
        date: searchParams.get('date') || '',
        transportMode: '',
        maxPrice: 50,
        weight: ''
    });

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/bago/getTravelers');
            if (response.data.success) {
                const { gettravelers, findUsers } = response.data.data;

                // Map and join traveler info
                const joinedTrips = gettravelers.map(trip => {
                    const traveler = findUsers.find(u => u._id === trip.user);
                    return {
                        ...trip,
                        firstName: traveler?.name || traveler?.firstName || 'Traveler',
                        origin: trip.fromLocation,
                        destination: trip.toLocation,
                        departureDate: trip.departureDate,
                        availableWeight: trip.availableKg,
                        transportMode: trip.travelMeans,
                        rating: traveler?.rating || (4.5 + Math.random() * 0.5).toFixed(1) // Fallback rating
                    };
                });

                // Filter based on search params
                let filtered = joinedTrips;
                if (filters.origin) {
                    filtered = filtered.filter(t =>
                        t.origin.toLowerCase().includes(filters.origin.city.toLowerCase())
                    );
                }
                if (filters.destination) {
                    filtered = filtered.filter(t =>
                        t.destination.toLowerCase().includes(filters.destination.city.toLowerCase())
                    );
                }
                if (filters.weight) {
                    filtered = filtered.filter(t => t.availableWeight >= parseFloat(filters.weight));
                }
                if (filters.transportMode) {
                    filtered = filtered.filter(t => t.transportMode === filters.transportMode);
                }

                setTrips(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch trips:', error);
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchTrips();
    };

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-8">
                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-[#054752] mb-2">
                        Available Travelers
                    </h1>
                    <p className="text-[#708c91] font-medium">
                        {filters.origin && filters.destination
                            ? `${filters.origin.city} → ${filters.destination.city}`
                            : 'Find travelers to deliver your package'}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">From (City/Country)</label>
                            <Select
                                options={locationOptions}
                                value={filters.origin}
                                onChange={(val) => setFilters({ ...filters, origin: val })}
                                placeholder="Departure location"
                                className="w-full text-sm font-medium"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderRadius: '12px',
                                        borderColor: '#E5E7EB',
                                        padding: '4px',
                                        '&:hover': { borderColor: '#5845D8' }
                                    })
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">To (City/Country)</label>
                            <Select
                                options={locationOptions}
                                value={filters.destination}
                                onChange={(val) => setFilters({ ...filters, destination: val })}
                                placeholder="Arrival location"
                                className="w-full text-sm font-medium"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        borderRadius: '12px',
                                        borderColor: '#E5E7EB',
                                        padding: '4px',
                                        '&:hover': { borderColor: '#5845D8' }
                                    })
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">Weight (kg)</label>
                            <input
                                type="number"
                                placeholder="e.g. 5"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                value={filters.weight}
                                onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleApplyFilters}
                                className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-bold hover:bg-[#4838B5] transition-colors shadow-md h-[50px] flex items-center justify-center gap-2"
                            >
                                <SearchIcon size={20} />
                                Find Travelers
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="hidden lg:block lg:col-span-1">
                        <FilterPanel
                            filters={filters}
                            setFilters={setFilters}
                            onApply={handleApplyFilters}
                        />
                    </div>

                    {/* Trip Listings */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5845D8]"></div>
                            </div>
                        ) : trips.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {trips.map((trip) => (
                                    <TripCard key={trip._id} trip={trip} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No trips found</h3>
                                <p className="text-gray-500 mb-6">
                                    Try adjusting your search criteria or check back later.
                                </p>
                                <Link
                                    to="/post-trip"
                                    className="inline-block bg-[#5845D8] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#4838B5] transition-colors"
                                >
                                    Post Your Trip
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Filters Button */}
                <button className="lg:hidden fixed bottom-24 right-6 bg-[#5845D8] text-white p-4 rounded-full shadow-lg hover:bg-[#4838B5] transition-colors z-10">
                    <Filter size={24} />
                </button>
            </div>
        </div>
    );
}
