import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, Calendar, Star, Plane, Shield, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

interface Trip {
    _id: string;
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    availableKg: number;
    travelMeans: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        average_rating?: number;
        total_trips?: number;
        kycStatus?: string;
        image?: string;
    }
}

const SearchPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState({ from: '', to: '' });
    const [allTrips, setAllTrips] = useState<Trip[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTravelers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/getTravelers');
            const { findUsers, gettravelers } = response.data.data;

            const mergedTrips = gettravelers.map((trip: any) => {
                const user = findUsers.find((u: any) => u._id === trip.user);
                return {
                    ...trip,
                    user: user || { firstName: 'Unknown', lastName: 'User' }
                };
            });

            setAllTrips(mergedTrips);
            setTrips(mergedTrips);
        } catch (err: any) {
            console.error('Error fetching travelers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTravelers();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const filtered = allTrips.filter(trip =>
            (trip.fromLocation?.toLowerCase().includes(searchQuery.from.toLowerCase()) || !searchQuery.from) &&
            (trip.toLocation?.toLowerCase().includes(searchQuery.to.toLowerCase()) || !searchQuery.to)
        );

        setTimeout(() => {
            setTrips(filtered);
            setIsLoading(false);
        }, 400);
    };

    return (
        <div className="pt-32 pb-32 px-6">
            <div className="max-w-4xl mx-auto flex flex-col gap-12">
                {/* Simple Search Header */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl mb-4">Find your traveler</h1>
                    <p className="text-slate-500 font-bold">Trusted people going exactly where you need.</p>
                </div>

                {/* Bold Search Bar */}
                <form onSubmit={handleSearch} className="bg-white p-4 rounded-[2.5rem] shadow-xl border-2 border-slate-50 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                        <MapPin className="text-brand-primary" size={20} />
                        <input
                            type="text"
                            placeholder="Leaving from..."
                            className="bg-transparent font-bold text-slate-900 outline-none w-full"
                            value={searchQuery.from}
                            onChange={(e) => setSearchQuery({ ...searchQuery, from: e.target.value })}
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                        <MapPin className="text-brand-accent" size={20} />
                        <input
                            type="text"
                            placeholder="Going to..."
                            className="bg-transparent font-bold text-slate-900 outline-none w-full"
                            value={searchQuery.to}
                            onChange={(e) => setSearchQuery({ ...searchQuery, to: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn-bold-primary px-10">
                        Search
                    </button>
                </form>

                {/* Results Listing */}
                <div className="flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center py-24 gap-4">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Scanning routes...</p>
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="bg-white border-2 border-slate-100 p-20 rounded-[3rem] text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                                <SearchIcon size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl mb-2">No trips found</h3>
                                <p className="text-slate-500 font-bold">Try searching for a different city.</p>
                            </div>
                        </div>
                    ) : (
                        trips.map((trip) => (
                            <div key={trip._id} className="card-bold group cursor-pointer active:scale-[0.98] transition-transform">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    {/* Route Info */}
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-6 mb-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 capitalize mb-1">Departure</span>
                                                <span className="text-2xl font-black">{trip.fromLocation}</span>
                                            </div>
                                            <div className="flex-1 h-px bg-slate-100 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-white px-3">
                                                        <ArrowRight className="text-brand-primary" size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] font-black text-slate-400 capitalize mb-1">Destination</span>
                                                <span className="text-2xl font-black">{trip.toLocation}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                                                <Calendar size={16} className="text-brand-primary" />
                                                {new Date(trip.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                                                <Shield size={16} className="text-emerald-500" />
                                                {trip.availableKg}kg space
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                                                <Plane size={16} className="text-brand-accent" />
                                                By {trip.travelMeans}
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Brief */}
                                    <div className="w-full md:w-auto md:pl-12 md:border-l-2 md:border-slate-50 flex items-center gap-4">
                                        <div className="text-right hidden md:block">
                                            <p className="font-black text-slate-900 capitalize">{trip.user.firstName} {trip.user.lastName}</p>
                                            <div className="flex items-center justify-end gap-1 text-amber-500">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-xs font-black">{trip.user.average_rating || '5.0'}</span>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xl font-black border-2 border-brand-primary/5">
                                            {trip.user.firstName.charAt(0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
