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
        <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h2 className="text-lg font-black text-[#012126] tracking-tight uppercase">My Trips</h2>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">Manage your flight and bus routes.</p>
                </div>
                <button
                    onClick={() => window.location.href = '/post-trip'}
                    className="flex items-center gap-2 bg-[#5845D8] text-white px-4 py-2.5 rounded-xl font-black hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/20 text-[10px] uppercase tracking-widest"
                >
                    <Plus size={14} />
                    <span>Post New Trip</span>
                </button>
            </div>

            {trips.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Plane size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#012126] mb-1.5 text-center uppercase tracking-tight">No active trips</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto mb-8 font-bold uppercase tracking-wider opacity-60 leading-relaxed">You haven't posted any routes yet. Start earning by sharing luggage space.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {trips.map(trip => (
                        <div key={trip._id} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#5845D8]/5 rounded-bl-[50px] -mr-5 -mt-5 group-hover:bg-[#5845D8]/10 transition-colors"></div>

                            <div className="flex items-center gap-4 mb-5 relative z-10">
                                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                                    <Plane size={18} className="text-[#5845D8]" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-black text-[#012126] text-xs uppercase tracking-tight">{trip.fromLocation}</h4>
                                        <ChevronRight size={12} className="text-gray-300" />
                                        <h4 className="font-black text-[#012126] text-xs uppercase tracking-tight">{trip.toLocation}</h4>
                                    </div>
                                    <p className="text-[9px] font-black text-gray-400 flex items-center gap-1 mt-1 uppercase tracking-widest opacity-70">
                                        <Calendar size={9} />
                                        {new Date(trip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-5 bg-gray-50/50 rounded-xl p-3.5 relative z-10 border border-gray-50">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Available Space</p>
                                    <div className="flex items-center gap-1.5 text-[#012126] font-black text-xs uppercase tracking-tighter">
                                        <Weight size={12} className="text-[#5845D8]/60" />
                                        <span>{trip.availableKg} KG</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Travel Mode</p>
                                    <div className="font-black text-[#5845D8] uppercase text-[10px] tracking-widest">
                                        {trip.travelMeans || 'Flight'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 relative z-10">
                                <button
                                    onClick={() => startEditing(trip)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-100 rounded-xl text-[10px] font-black text-[#012126] uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    <Edit3 size={14} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteTrip(trip._id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-50 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Trip Modal */}
            {editingTrip && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 font-sans">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">Edit Trip</h3>
                            <button onClick={() => setEditingTrip(null)} className="p-1.5 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateTrip} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Origin City</label>
                                    <Select
                                        options={locationOptions}
                                        value={fromLocation}
                                        onChange={setFromLocation}
                                        className="text-xs font-bold"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: '12px',
                                                padding: '2px',
                                                borderColor: '#f3f4f6',
                                                boxShadow: 'none',
                                                '&:hover': { borderColor: '#5845D8' }
                                            })
                                        }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Arrival City</label>
                                    <Select
                                        options={locationOptions}
                                        value={toLocation}
                                        onChange={setToLocation}
                                        className="text-xs font-bold"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: '12px',
                                                padding: '2px',
                                                borderColor: '#f3f4f6',
                                                boxShadow: 'none',
                                                '&:hover': { borderColor: '#5845D8' }
                                            })
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Departure Date</label>
                                    <input
                                        type="date"
                                        value={departureDate}
                                        onChange={(e) => setDepartureDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Space (KG)</label>
                                    <input
                                        type="number"
                                        value={availableKg}
                                        onChange={(e) => setAvailableKg(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                {isUpdating ? <RefreshCw className="animate-spin" size={16} /> : 'Update Route'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
