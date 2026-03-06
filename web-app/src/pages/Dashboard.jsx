import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Shield, Package, Plane, CheckCircle, Clock, AlertCircle, LogOut } from 'lucide-react';

export default function Dashboard() {
    const { user, loading, isAuthenticated, logout, checkAuthStatus } = useAuth();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('pending');
    const [kycLoading, setKycLoading] = useState(true);
    const [sessionUrl, setSessionUrl] = useState('');

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        } else if (isAuthenticated) {
            fetchKycStatus();
        }
    }, [loading, isAuthenticated, navigate]);

    const fetchKycStatus = async () => {
        try {
            setKycLoading(true);
            const response = await api.get('/api/bago/getKyc');
            if (response.data.status === 'success') {
                const isApproved = response.data.data?.kyc;
                const status = isApproved ? 'approved' : 'not_started';
                setKycStatus(status);

                if (isApproved) {
                    const pendingBooking = localStorage.getItem('pending_booking');
                    if (pendingBooking) {
                        try {
                            const parsed = JSON.parse(pendingBooking);
                            localStorage.removeItem('pending_booking');
                            navigate('/send-package', { state: { trip: parsed.trip } });
                            return;
                        } catch (e) {
                            console.error("Failed to parse", e);
                        }
                    }

                    const pendingTrip = localStorage.getItem('pending_trip_post');
                    if (pendingTrip) {
                        navigate('/post-trip');
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch KYC:', error);
            setKycStatus('not_started');
        } finally {
            setKycLoading(false);
        }
    };

    const handleStartKyc = async () => {
        try {
            const response = await api.post('/api/bago/KycVerifications');
            const url = response.data.diditSessionUrl || response.data.sessionUrl;
            if (response.data.success && url) {
                window.location.href = url;
            }
        } catch (err) {
            console.error('Failed to start KYC', err);
            alert('Could not start identity verification. Please try later.');
        }
    };

    if (loading || kycLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <Link to="/">
                    <img src="/bago_logo.png" alt="Bago" className="h-8" />
                </Link>
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName}</h1>
                    <p className="text-gray-500">Manage your trips, packages, and identity.</p>
                </div>

                {(localStorage.getItem('pending_booking') || localStorage.getItem('pending_trip_post')) && kycStatus !== 'approved' && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm">
                        <AlertCircle className="mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold">Pending Action</h4>
                            <p className="text-sm mt-1">You started a {localStorage.getItem('pending_booking') ? 'shipping request' : 'trip post'}. Please complete your Identity Verification below to continue automatically.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* KYC Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Shield size={20} className="text-primary" /> Identity Verification
                            </h3>
                        </div>

                        {kycStatus === 'approved' && (
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-xl">
                                    <CheckCircle size={24} />
                                    <div>
                                        <p className="font-semibold">Verified</p>
                                        <p className="text-sm">Your identity is fully verified.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(kycStatus === 'pending' || kycStatus === 'processing') && (
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl mb-4">
                                    <Clock size={24} />
                                    <div>
                                        <p className="font-semibold">Under Review</p>
                                        <p className="text-sm">We are reviewing your documents.</p>
                                    </div>
                                </div>
                                <button onClick={fetchKycStatus} className="btn-secondary w-full text-sm">Refresh Status</button>
                            </div>
                        )}

                        {(kycStatus === 'not_started' || kycStatus === 'declined') && (
                            <div className="flex-1 flex flex-col justify-center">
                                {kycStatus === 'declined' && (
                                    <div className="flex items-center gap-2 text-red-600 mb-3 text-sm">
                                        <AlertCircle size={16} /> Verification declined. Please retry.
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 mb-4">You need to verify your identity to post trips or request deliveries.</p>
                                <button onClick={handleStartKyc} className="btn-primary w-full text-white font-bold py-3">ID Verification</button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Link to="/post-trip" className="bg-gradient-to-br from-[#8B5CF6] to-[#6B21A8] p-6 rounded-2xl text-white shadow-md relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                            <Plane size={32} className="mb-4 text-white/90" />
                            <h3 className="text-xl font-bold mb-2">Post a Trip</h3>
                            <p className="text-white/80 text-sm mb-4">Monetize your empty luggage space.</p>
                            <div className="font-medium text-white flex items-center">Get Started →</div>
                        </Link>

                        <Link to="/send-package" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group cursor-pointer hover:shadow-md transition-all">
                            <Package size={32} className="mb-4 text-primary" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Send Package</h3>
                            <p className="text-gray-500 text-sm mb-4">Find a trusted traveler heading to your destination.</p>
                            <div className="font-medium text-primary flex items-center">Find Traveler →</div>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity placeholder */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-6 font-display text-xl">Recent Activity</h3>
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut size={24} className="text-gray-300 transform rotate-180" />
                        </div>
                        <p className="text-gray-500 font-medium">No recent trips or shipments.</p>
                        <p className="text-gray-400 text-sm mt-1">Activities will show up here once you start using Bago.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
