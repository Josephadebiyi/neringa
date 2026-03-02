import React, { useState, useEffect } from 'react';
import { Package, Wallet, LogOut, ArrowRight, ShieldCheck, Clock, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const [trips, setTrips] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'trips' | 'wallet'>('trips');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [profileRes, walletRes] = await Promise.all([
                    api.get('/Profile'),
                    api.get('/getWallet')
                ]);
                setTrips(profileRes.data.data.getTrips || []);
                setWallet(walletRes.data.data.getwallet || { total_amount: 0, currency: 'USD' });
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="pt-32 pb-40 px-6 bg-slate-50/30">
            <div className="max-w-5xl mx-auto flex flex-col gap-12">

                {/* Header Profile Card */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border-2 border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-brand-primary flex items-center justify-center text-white text-5xl font-black shadow-lg shadow-brand-primary/20">
                                {user?.firstName?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white">
                                <ShieldCheck size={24} />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <h1 className="text-4xl md:text-5xl capitalize">{user?.firstName} {user?.lastName}</h1>
                                <span className="inline-flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                                    {user?.kycStatus || 'Verified'} Member
                                </span>
                            </div>
                            <p className="text-slate-500 font-bold mb-8">{user?.email}</p>

                            <div className="grid grid-cols-3 gap-8 p-6 bg-slate-50 rounded-[2.5rem] border-2 border-white">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-900">{user?.average_rating || '5.0'}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating</div>
                                </div>
                                <div className="text-center border-x-2 border-slate-100">
                                    <div className="text-2xl font-black text-slate-900">{user?.total_trips || '0'}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trips</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-900">12</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviews</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border-2 border-slate-50 w-full md:w-fit self-center md:self-start shadow-sm">
                        <button
                            onClick={() => setActiveTab('trips')}
                            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'trips' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Your Trips
                        </button>
                        <button
                            onClick={() => setActiveTab('wallet')}
                            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'wallet' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Wallet Balance
                        </button>
                    </div>

                    {activeTab === 'trips' ? (
                        <div className="grid md:grid-cols-2 gap-6">
                            {trips.length === 0 ? (
                                <div className="col-span-full card-bold border-dashed text-center py-20 opacity-50">
                                    <Clock className="mx-auto mb-4 text-slate-300" size={48} />
                                    <h3 className="text-xl mb-2">No active trips</h3>
                                    <p className="font-bold">Post a trip to start earning with your journey.</p>
                                </div>
                            ) : (
                                trips.map((trip: any) => (
                                    <div key={trip._id} className="card-bold group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Listing Active</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-black">{trip.fromLocation}</span>
                                                    <ArrowRight size={16} className="text-slate-300" />
                                                    <span className="text-xl font-black">{trip.toLocation}</span>
                                                </div>
                                            </div>
                                            <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-primary transition-colors">
                                                <Settings size={20} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                                            <div className="py-2 px-4 bg-slate-50 rounded-xl flex items-center gap-2">
                                                <Clock size={16} className="text-brand-primary" />
                                                {new Date(trip.departureDate).toLocaleDateString()}
                                            </div>
                                            <div className="py-2 px-4 bg-slate-50 rounded-xl flex items-center gap-2">
                                                <Package size={16} className="text-brand-accent" />
                                                {trip.availableKg}kg Available
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="card-bold p-12 text-center bg-brand-primary relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                            <div className="relative text-white flex flex-col items-center">
                                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md">
                                    <Wallet size={40} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Current Balance</span>
                                <h2 className="text-7xl mb-8">{wallet?.currency || 'USD'} {wallet?.total_amount || '0.00'}</h2>
                                <button className="bg-white text-brand-primary btn-bold-white px-12 py-5 shadow-none hover:shadow-2xl hover:scale-105 transition-all">
                                    Withdraw Funds
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sign out */}
                <button
                    onClick={logout}
                    className="flex items-center justify-center gap-3 w-full p-6 text-slate-400 font-black hover:text-brand-accent transition-colors border-2 border-transparent hover:border-brand-accent/10 rounded-[2.5rem]"
                >
                    <LogOut size={20} />
                    SIGN OUT SECURELY
                </button>
            </div>
        </div>
    );
};

export default Profile;
