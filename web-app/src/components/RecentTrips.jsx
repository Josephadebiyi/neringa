import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plane, Bus, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DUMMY_TRIPS = [
    {
        _id: '1',
        origin: 'New York, USA',
        destination: 'London, UK',
        departureDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        transportMode: 'air',
        weightCapacity: 15,
        pricePerKg: 12
    },
    {
        _id: '2',
        origin: 'Paris, France',
        destination: 'Berlin, Germany',
        departureDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        transportMode: 'bus',
        weightCapacity: 50,
        pricePerKg: 8
    },
    {
        _id: '3',
        origin: 'Toronto, Canada',
        destination: 'Dubai, UAE',
        departureDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        transportMode: 'air',
        weightCapacity: 25,
        pricePerKg: 15
    }
];

const RecentTrips = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchRecentTrips = async () => {
            try {
                const response = await api.get('/api/bago/getTravelers');
                const travelersData = response.data?.data?.gettravelers;

                if (response.data?.success && Array.isArray(travelersData)) {
                    // Sort by newest first
                    const sorted = [...travelersData].reverse();

                    if (user?.country) {
                        const userCountryTrips = sorted.filter(t =>
                            (t.fromLocation && t.fromLocation.toLowerCase().includes(user.country.toLowerCase())) ||
                            (t.toLocation && t.toLocation.toLowerCase().includes(user.country.toLowerCase()))
                        ).slice(0, 3);
                        setTrips(userCountryTrips.length > 0 ? userCountryTrips : sorted.slice(0, 3));
                    } else {
                        setTrips(sorted.slice(0, 3));
                    }
                } else {
                    setTrips([]);
                }
            } catch (error) {
                console.error('Failed to fetch recent trips', error);
                setTrips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentTrips();
    }, [user]);

    if (loading || trips.length === 0) return null;

    return (
        <section className="px-6 md:px-12 max-w-[1240px] mx-auto py-12">
            <h2 className="text-3xl font-black text-[#012126] mb-8">
                {user?.country ? `Recent Delivery Routes near ${user.country}` : 'Recent Delivery Routes'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trips.map(trip => (
                    <div key={trip._id} onClick={() => navigate(`/search?origin=${trip.fromLocation}&destination=${trip.toLocation}`)} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-[#5845D8]/10 p-3 rounded-xl text-[#5845D8]">
                                {trip.travelMeans === 'bus' ? <Bus size={24} /> : <Plane size={24} />}
                            </div>
                            <span className="text-[#5845D8] font-black text-lg">Active</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-[#012126] truncate max-w-[120px]">{trip.fromLocation.split(',')[0]}</h3>
                            <ArrowRight size={16} className="text-[#6B7280] flex-shrink-0" />
                            <h3 className="text-lg font-bold text-[#012126] truncate max-w-[120px]">{trip.toLocation.split(',')[0]}</h3>
                        </div>
                        <p className="text-[#6B7280] text-sm font-medium mb-4">
                            {new Date(trip.departureDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Capacity: {trip.availableKg}kg</span>
                            <span className="text-[#5845D8] font-bold group-hover:underline">View Details</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default RecentTrips;
