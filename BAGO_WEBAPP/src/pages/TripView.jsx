import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, Package, Star, ArrowRight } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { setPendingTripRedirect } from '../utils/pendingTrip';

export default function TripView() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [trip, setTrip] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | not_found | error

    useEffect(() => {
        let cancelled = false;
        api.get(`/api/trips/public/${tripId}`)
            .then((res) => {
                if (cancelled) return;
                if (res.data.success) {
                    setTrip(res.data.trip);
                    setStatus('ready');
                } else {
                    setStatus('not_found');
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setStatus(err.response?.status === 404 ? 'not_found' : 'error');
            });
        return () => { cancelled = true; };
    }, [tripId]);

    const handleBook = () => {
        if (authLoading) return;
        if (isAuthenticated) {
            navigate('/send-package', { state: { trip } });
        } else {
            setPendingTripRedirect(trip);
            navigate('/signup');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F6F3] text-[#5845D8] font-bold">
                Loading trip…
            </div>
        );
    }

    if (status === 'not_found' || status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F6F3] px-6 text-center">
                <img src="/bago_logo.png" alt="Bago" className="h-10 mb-8" />
                <h1 className="text-xl font-bold text-[#012126] mb-2">
                    {status === 'not_found' ? 'This trip is no longer available' : 'Something went wrong'}
                </h1>
                <p className="text-sm text-[#5b6b6d] mb-6 max-w-sm">
                    {status === 'not_found'
                        ? "This trip may have already departed, been filled, or the link is incorrect."
                        : "We couldn't load this trip right now. Please try again shortly."}
                </p>
                <Link to="/search" className="text-[#5845D8] font-semibold text-sm">Browse available trips →</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F3] px-4 py-10 md:py-16">
            <div className="max-w-lg mx-auto">
                <Link to="/" className="inline-block mb-8">
                    <img src="/bago_logo.png" alt="Bago" className="h-8" />
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-[#eee] p-6 md:p-8">
                    <span className="inline-block px-3 py-1 bg-[#f3f0ff] text-[#5240E8] text-[10px] font-black uppercase tracking-widest rounded-full mb-5">
                        Shared Trip
                    </span>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-[#012126] font-bold text-lg">
                                <MapPin size={16} className="text-[#5845D8]" />
                                {trip.fromLocation}
                            </div>
                        </div>
                        <ArrowRight size={18} className="text-[#c7c7c7]" />
                        <div className="flex-1 text-right">
                            <div className="flex items-center justify-end gap-2 text-[#012126] font-bold text-lg">
                                {trip.toLocation}
                                <MapPin size={16} className="text-[#5845D8]" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-2 text-[#5b6b6d]">
                            <Calendar size={15} />
                            {trip.departureDate ? new Date(trip.departureDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'}
                        </div>
                        <div className="flex items-center gap-2 text-[#5b6b6d]">
                            <Package size={15} />
                            {trip.availableKg}kg available
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#F8F6F3] rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                            {trip.traveler?.image ? (
                                <img src={trip.traveler.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[#5240E8] text-white flex items-center justify-center font-bold">
                                    {trip.traveler?.firstName?.[0] || 'B'}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-[#012126] text-sm">{trip.traveler?.name || 'Bago Traveler'}</p>
                                <div className="flex items-center gap-1 text-xs text-[#5b6b6d]">
                                    <Star size={11} className="fill-[#f5b800] text-[#f5b800]" />
                                    {trip.traveler?.rating?.toFixed(1) || 'New'} · {trip.traveler?.completedTrips || 0} trips
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-[#012126]">{trip.currency} {trip.pricePerKg}</p>
                            <p className="text-[11px] text-[#5b6b6d]">per kg</p>
                        </div>
                    </div>

                    <button
                        onClick={handleBook}
                        disabled={authLoading}
                        className="w-full bg-[#5240E8] hover:bg-[#4433c9] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60"
                    >
                        Send a Package on This Trip
                    </button>
                    {!isAuthenticated && !authLoading && (
                        <p className="text-center text-xs text-[#5b6b6d] mt-3">
                            You'll create a free Bago account to complete your booking — already have one? <Link to="/login" onClick={() => setPendingTripRedirect(trip)} className="text-[#5845D8] font-semibold">Log in</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
