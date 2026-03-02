import React, { useState } from 'react';
import { MapPin, Calendar, Scale, Plane, Bus, Train, Car, ArrowRight, Check, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AddTrip: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fromLocation: '',
        toLocation: '',
        departureDate: '',
        arrivalDate: '',
        availableKg: '',
        travelMeans: 'Plane',
        description: ''
    });

    const transportTypes = [
        { id: 'Plane', icon: Plane, label: 'Flight' },
        { id: 'Bus', icon: Bus, label: 'Bus' },
        { id: 'Train', icon: Train, label: 'Train' },
        { id: 'Car', icon: Car, label: 'Car' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.post('/AddAtrip', {
                ...formData,
                availableKg: Number(formData.availableKg)
            });
            setSuccess(true);
            setTimeout(() => navigate('/profile'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to post trip. Please check your inputs.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white">
                <div className="text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                        <Check size={48} />
                    </div>
                    <h1 className="text-4xl mb-4">Trip Posted!</h1>
                    <p className="text-slate-500 font-bold mb-8">Redirecting you to your dashboard...</p>
                    <Loader2 className="animate-spin text-emerald-500 mx-auto" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-40 px-6 bg-slate-50/30">
            <div className="max-w-2xl mx-auto">
                <div className="mb-12">
                    <span className="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Traveler Portal</span>
                    <h1 className="text-5xl mb-4 text-slate-900">Share your journey</h1>
                    <p className="text-xl text-slate-500 font-bold">Help others ship while reducing your travel costs.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Route Section */}
                    <div className="card-bold space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="text-brand-primary" size={24} />
                            <h3 className="text-xl">Route Details</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Departure City</label>
                                <input
                                    type="text"
                                    required
                                    className="search-input"
                                    placeholder="e.g. London"
                                    value={formData.fromLocation}
                                    onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Arrival City</label>
                                <input
                                    type="text"
                                    required
                                    className="search-input"
                                    placeholder="e.g. Lagos"
                                    value={formData.toLocation}
                                    onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Departure Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                    <input
                                        type="date"
                                        required
                                        className="search-input !pl-14"
                                        value={formData.departureDate}
                                        onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Arrival Date (EST.)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                    <input
                                        type="date"
                                        required
                                        className="search-input !pl-14"
                                        value={formData.arrivalDate}
                                        onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Capacity & Transport */}
                    <div className="card-bold space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Scale className="text-brand-accent" size={24} />
                            <h3 className="text-xl">Capacity & Transport</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Available Weight (KG)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="search-input text-2xl"
                                placeholder="10"
                                value={formData.availableKg}
                                onChange={(e) => setFormData({ ...formData, availableKg: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Transport Mode</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {transportTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, travelMeans: type.id })}
                                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${formData.travelMeans === type.id
                                                ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-brand-primary/20 hover:text-brand-primary'
                                            }`}
                                    >
                                        <type.icon size={28} />
                                        <span className="text-xs font-black uppercase tracking-widest">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="bg-brand-primary/5 p-6 rounded-3xl border-2 border-brand-primary/10 flex gap-4">
                        <Info className="text-brand-primary shrink-0" size={24} />
                        <p className="text-sm font-bold text-brand-primary/80">
                            Your trip will be visible to everyone. Please ensure your dates are accurate to avoid disputes.
                        </p>
                    </div>

                    {error && (
                        <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl font-bold border-2 border-rose-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-bold-primary w-full py-6 text-xl shadow-2xl"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <>
                                Post Trip Listing
                                <ArrowRight size={24} className="ml-2" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddTrip;
