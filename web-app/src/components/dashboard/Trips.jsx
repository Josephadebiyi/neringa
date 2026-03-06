import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plane, Calendar, MapPin, Trash2, Edit3, Plus, ChevronRight, Weight, RefreshCw, X } from 'lucide-react';
import { locations } from '../../utils/countries';
import Select from 'react-select';

export default function Trips({ user }) {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTrip, setEditingTrip] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Form states for editing
    const [fromLocation, setFromLocation] = useState(null);
    const [toLocation, setToLocation] = useState(null);
    const [departureDate, setDepartureDate] = useState('');
    const [availableKg, setAvailableKg] = useState('');
    const [travelMeans, setTravelMeans] = useState('flight');

    useEffect(() => {
        fetchMyTrips();
    }, []);

    const fetchMyTrips = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/MyTrips');
            setTrips(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch trips", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trip? All related shipment requests will be affected.')) return;
        try {
            await api.delete(`/api/bago/Trip/${id}`);
            setTrips(trips.filter(t => t._id !== id));
        } catch (err) {
            alert('Failed to delete trip');
        }
    };

    const startEditing = (trip) => {
        setEditingTrip(trip);
        setFromLocation(locationOptions.find(o => o.city === trip.fromLocation) || null);
        setToLocation(locationOptions.find(o => o.city === trip.toLocation) || null);
        setDepartureDate(new Date(trip.departureDate).toISOString().split('T')[0]);
        setAvailableKg(trip.availableKg);
        setTravelMeans(trip.travelMeans);
    };

    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const payload = {
                fromLocation: fromLocation?.city,
                toLocation: toLocation?.city,
                originCountry: fromLocation?.country,
                destinationCountry: toLocation?.country,
                departureDate,
                availableKg,
                travelMeans
            };
            const res = await api.put(`/api/bago/Trip/${editingTrip._id}`, payload);
            if (res.data.success) {
                setEditingTrip(null);
                fetchMyTrips();
            }
        } catch (err) {
            alert('Failed to update trip');
        } finally {
            setIsUpdating(false);
        }
    };

    const locationOptions = locations.map(loc => ({
        value: loc.city,
        label: `${loc.flag} ${loc.label}`,
        city: loc.city,
        country: loc.country
    }));

    if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-[#5845D8]" size={40} /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[#054752]">My Trips</h2>
                    <p className="text-gray-500 font-medium">Manage your flight and bus routes.</p>
                </div>
                <button
                    onClick={() => window.location.href = '/post-trip'}
                    className="flex items-center gap-2 bg-[#5845D8] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#4838B5] transition-all shadow-lg"
                >
                    <Plus size={20} />
                    <span>Post New Trip</span>
                </button>
            </div>

            {trips.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plane size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-[#054752] mb-2 text-center">No active trips</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">You haven't posted any routes yet. Start earning by sharing your luggage space.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trips.map(trip => (
                        <div key={trip._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#5845D8]/5 rounded-bl-[60px] -mr-6 -mt-6 group-hover:bg-[#5845D8]/10 transition-colors"></div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-2xl">
                                    <Plane size={24} className="text-[#5845D8]" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-[#054752]">{trip.fromLocation}</h4>
                                        <ChevronRight size={16} className="text-gray-300" />
                                        <h4 className="font-black text-[#054752]">{trip.toLocation}</h4>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(trip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-2xl p-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Space</p>
                                    <div className="flex items-center gap-2 text-[#054752] font-black">
                                        <Weight size={16} />
                                        <span>{trip.availableKg} KG</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Travel Mode</p>
                                    <div className="font-black text-[#5845D8] uppercase text-xs">
                                        {trip.travelMeans || 'Flight'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => startEditing(trip)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-100 rounded-xl text-sm font-bold text-[#054752] hover:bg-gray-50 transition-all"
                                >
                                    <Edit3 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteTrip(trip._id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-red-50 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Trip Modal */}
            {editingTrip && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h3 className="text-2xl font-black text-[#054752]">Edit Trip</h3>
                            <button onClick={() => setEditingTrip(null)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdateTrip} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Origin City</label>
                                    <Select
                                        options={locationOptions}
                                        value={fromLocation}
                                        onChange={setFromLocation}
                                        className="text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Arrival City</label>
                                    <Select
                                        options={locationOptions}
                                        value={toLocation}
                                        onChange={setToLocation}
                                        className="text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Departure Date</label>
                                    <input
                                        type="date"
                                        value={departureDate}
                                        onChange={(e) => setDepartureDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none text-sm font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Space (KG)</label>
                                    <input
                                        type="number"
                                        value={availableKg}
                                        onChange={(e) => setAvailableKg(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all flex items-center justify-center gap-3"
                            >
                                {isUpdating ? <RefreshCw className="animate-spin" size={20} /> : 'Update Route'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
