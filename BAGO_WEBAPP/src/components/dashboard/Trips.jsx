import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plane, Calendar, Trash2, Edit3, Plus, ChevronRight, Weight, RefreshCw, X, ChevronDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import JourneyMap from '../JourneyMap';

function formatPayoutStatus(raw) {
    switch ((raw || '').trim().toLowerCase()) {
        case 'paid': return 'Paid out';
        case 'partially_paid': return 'Partially paid';
        case 'pending': return 'Pending';
        default: return raw || 'Pending';
    }
}

export default function Trips() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTrip, setEditingTrip] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [expandedTripId, setExpandedTripId] = useState(null);

    // Form states for editing
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [availableKg, setAvailableKg] = useState('');
    const [travelMeans, setTravelMeans] = useState('airplane');

    useEffect(() => {
        fetchMyTrips();
    }, []);

    const fetchMyTrips = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/MyTrips');
            setTrips(res.data?.trips || res.data?.data || []);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTrip = async (id) => {
        try {
            const response = await api.delete(`/api/bago/Trip/${id}`);

            // Handle both 200 (with body) and 204 (no content) success responses
            if (response.status === 200 || response.status === 204) {
                // Update UI immediately on success
                setTrips(prev => prev.filter(t => t.id !== id && t._id !== id));
                setDeleteConfirmId(null);
            }
        } catch (err) {
            console.error('Delete trip error:', err);
            // Only show error if it's a genuine failure
            if (err.response && err.response.status !== 200 && err.response.status !== 204) {
                alert('Failed to delete trip. Please try again.');
            } else {
                // Backend succeeded but threw error parsing response - still update UI
                setTrips(prev => prev.filter(t => t.id !== id && t._id !== id));
                setDeleteConfirmId(null);
            }
        }
    };

    const startEditing = (trip) => {
        setEditingTrip(trip);
        setFromLocation(trip.fromLocation || '');
        setToLocation(trip.toLocation || '');
        setDepartureDate(trip.departureDate ? new Date(trip.departureDate).toISOString().split('T')[0] : '');
        setArrivalDate(trip.arrivalDate ? new Date(trip.arrivalDate).toISOString().split('T')[0] : '');
        setAvailableKg(trip.availableKg || '');
        setTravelMeans(trip.travelMeans || 'airplane');
    };

    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        if (!fromLocation || !toLocation || !departureDate || !arrivalDate || !availableKg) {
            alert('All fields are required.');
            return;
        }
        setIsUpdating(true);
        try {
            const payload = {
                fromLocation,
                toLocation,
                departureDate,
                arrivalDate,
                availableKg: parseFloat(availableKg),
                travelMeans
            };
            await api.put(`/api/bago/Trip/${editingTrip._id}`, payload);
            setEditingTrip(null);
            fetchMyTrips();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update trip. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };


    if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-[#5845D8]" size={40} /></div>;

    return (
        <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h2 className="text-lg font-black text-[#012126] tracking-tight uppercase">{t('myTrips')}</h2>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">{t('manageFlightBusRoutes')}</p>
                </div>
                <button
                    onClick={() => navigate('/post-trip')}
                    className="flex items-center gap-2 bg-[#5845D8] text-white px-4 py-2.5 rounded-xl font-black hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/20 text-[10px] uppercase tracking-widest"
                >
                    <Plus size={14} />
                    <span>{t('postNewTrip')}</span>
                </button>
            </div>

            {trips.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Plane size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#012126] mb-1.5 text-center uppercase tracking-tight">{t('noActiveTrips')}</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto mb-8 font-bold uppercase tracking-wider opacity-60 leading-relaxed">{t('noActiveTripsDesc')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {trips.map(trip => (
                        <div key={trip._id || trip.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                            {/* Top — dark boarding pass header */}
                            <div className="bg-[#012126] px-5 pt-5 pb-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#5845D8]/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

                                {/* Mode + status row */}
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-1.5 bg-[#5845D8]/20 border border-[#5845D8]/30 rounded-full px-2.5 py-1">
                                        <Plane size={9} className="text-[#9B8EF5]" />
                                        <span className="text-[7px] text-[#9B8EF5] font-black uppercase tracking-widest">
                                            {t(trip.travelMeans?.toLowerCase()) || trip.travelMeans || 'Flight'}
                                        </span>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                        trip.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                        trip.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {trip.status || 'Active'}
                                    </span>
                                </div>

                                {/* City codes route */}
                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <p className="text-white text-[28px] font-black tracking-tighter leading-none">
                                            {(trip.fromLocation || '').split(',')[0].slice(0, 3).toUpperCase() || 'ORG'}
                                        </p>
                                        <p className="text-white/35 text-[8px] font-bold mt-1 truncate max-w-[80px] uppercase">
                                            {(trip.fromLocation || '').split(',')[0] || '—'}
                                        </p>
                                        <p className="text-[#9B8EF5] text-[8px] font-black mt-1.5">
                                            {trip.departureDate
                                                ? new Date(trip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                                                : '—'}
                                        </p>
                                    </div>

                                    <div className="flex flex-1 items-center mx-3 gap-1.5">
                                        <div className="flex-1 border-t border-dashed border-white/10" />
                                        <div className="w-7 h-7 bg-[#5845D8] rounded-full flex items-center justify-center shadow-lg shadow-[#5845D8]/40 flex-shrink-0">
                                            <Plane size={12} className="text-white" />
                                        </div>
                                        <div className="flex-1 border-t border-dashed border-white/10" />
                                    </div>

                                    <div className="text-right">
                                        <p className="text-white text-[28px] font-black tracking-tighter leading-none">
                                            {(trip.toLocation || '').split(',')[0].slice(0, 3).toUpperCase() || 'DST'}
                                        </p>
                                        <p className="text-white/35 text-[8px] font-bold mt-1 truncate max-w-[80px] uppercase text-right">
                                            {(trip.toLocation || '').split(',')[0] || '—'}
                                        </p>
                                        <p className="text-[#9B8EF5] text-[8px] font-black mt-1.5 text-right">
                                            {trip.arrivalDate
                                                ? new Date(trip.arrivalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Boarding-pass tear line */}
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-[#F5F4FC] -ml-2 flex-shrink-0 border-r border-gray-100" />
                                <div className="flex-1 border-t border-dashed border-gray-200" />
                                <div className="w-4 h-4 rounded-full bg-[#F5F4FC] -mr-2 flex-shrink-0 border-l border-gray-100" />
                            </div>

                            {/* Bottom — white details */}
                            <div className="px-5 pt-3 pb-4">
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div>
                                        <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{t('availableSpace')}</p>
                                        <div className="flex items-center gap-1">
                                            <Weight size={10} className="text-[#5845D8]/60" />
                                            <p className="text-[#012126] font-black text-[11px]">{trip.availableKg} KG</p>
                                        </div>
                                    </div>
                                    {trip.travelerEarnings > 0 && (
                                        <div>
                                            <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Earnings</p>
                                            <div className="flex items-center gap-1">
                                                <TrendingUp size={10} className="text-green-500" />
                                                <p className="text-green-600 font-black text-[11px]">{trip.currency || 'USD'} {Number(trip.travelerEarnings).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {trip.payoutStatus && (
                                        <div>
                                            <p className="text-[7px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Payout</p>
                                            <p className={`font-black text-[10px] ${trip.payoutStatus === 'paid' ? 'text-green-600' : trip.payoutStatus === 'partially_paid' ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                {formatPayoutStatus(trip.payoutStatus)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Route Map toggle */}
                                <button
                                    onClick={() => setExpandedTripId(expandedTripId === (trip._id || trip.id) ? null : (trip._id || trip.id))}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-[8px] font-black text-gray-400 uppercase tracking-widest"
                                >
                                    <span>Route Map</span>
                                    <ChevronDown size={11} className={`transition-transform ${expandedTripId === (trip._id || trip.id) ? 'rotate-180' : ''}`} />
                                </button>

                                {expandedTripId === (trip._id || trip.id) && (
                                    <div className="mb-3">
                                        <JourneyMap
                                            fromCity={trip.fromLocation}
                                            fromCountry={trip.fromCountry || ''}
                                            toCity={trip.toLocation}
                                            toCountry={trip.toCountry || ''}
                                            travelMeans={trip.travelMeans || 'airplane'}
                                            status={trip.status}
                                            departureDate={trip.departureDate}
                                            arrivalDate={trip.arrivalDate}
                                        />
                                    </div>
                                )}

                                {/* Delete confirmation / actions */}
                                {deleteConfirmId === (trip._id || trip.id) ? (
                                    <div className="flex gap-2 bg-red-50 rounded-xl p-3 border border-red-100 animate-in fade-in duration-150">
                                        <p className="text-[9px] font-black text-red-600 uppercase tracking-wider flex-1">Delete this trip?</p>
                                        <button
                                            onClick={() => handleDeleteTrip(trip._id || trip.id)}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                                        >
                                            Yes, Delete
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="px-3 py-1.5 bg-white text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-wider border border-gray-100"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEditing(trip)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-100 rounded-xl text-[10px] font-black text-[#012126] uppercase tracking-widest hover:bg-gray-50 transition-all"
                                        >
                                            <Edit3 size={13} />
                                            {t('edit')}
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(trip._id || trip.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-50 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={13} />
                                            {t('delete')}
                                        </button>
                                    </div>
                                )}
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
                            <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">{t('editTrip')}</h3>
                            <button onClick={() => setEditingTrip(null)} className="p-1.5 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateTrip} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">{t('originCity')}</label>
                                    <input
                                        type="text"
                                        value={fromLocation}
                                        onChange={(e) => setFromLocation(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">{t('arrivalCity')}</label>
                                    <input
                                        type="text"
                                        value={toLocation}
                                        onChange={(e) => setToLocation(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                        placeholder="City, Country"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">{t('departureDate')}</label>
                                    <input
                                        type="date"
                                        value={departureDate}
                                        onChange={(e) => setDepartureDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">{t('arrivalDate')}</label>
                                    <input
                                        type="date"
                                        value={arrivalDate}
                                        onChange={(e) => setArrivalDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">{t('spaceKg')}</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={availableKg}
                                        onChange={(e) => setAvailableKg(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">{t('travelMode')}</label>
                                    <select
                                        value={travelMeans}
                                        onChange={(e) => setTravelMeans(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none text-xs font-bold transition-all appearance-none"
                                    >
                                        <option value="airplane">{t('airplane') || 'Airplane'}</option>
                                        <option value="bus">{t('bus') || 'Bus'}</option>
                                        <option value="train">{t('train') || 'Train'}</option>
                                        <option value="car">{t('car') || 'Car'}</option>
                                        <option value="ship">{t('ship') || 'Ship'}</option>
                                        <option value="other">{t('other') || 'Other'}</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                {isUpdating ? <RefreshCw className="animate-spin" size={16} /> : t('updateRoute')}
                            </button>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}
