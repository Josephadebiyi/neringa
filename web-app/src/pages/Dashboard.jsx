import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/dashboard/Sidebar';
import Overview from '../components/dashboard/Overview';
import Trips from '../components/dashboard/Trips';
import Shipments from '../components/dashboard/Shipments';
import Chats from '../components/dashboard/Chats';
import Earnings from '../components/dashboard/Earnings';
import Settings from '../components/dashboard/Settings';

export default function Dashboard() {
    const { user, loading, isAuthenticated, logout, checkAuthStatus } = useAuth();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('pending');
    const [kycLoading, setKycLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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
                setKycStatus(isApproved ? 'approved' : 'not_started');
            }
        } catch (error) {
            console.error('Failed to fetch KYC:', error);
        } finally {
            setKycLoading(false);
        }
    };

    const handleStartKyc = async () => {
        try {
            const response = await api.post('/api/bago/KycVerifications');
            const url = response.data.diditSessionUrl || response.data.sessionUrl;
            if (url) window.location.href = url;
        } catch (err) {
            alert('Could not start identity verification. Please try later.');
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <Overview user={user} kycStatus={kycStatus} handleStartKyc={handleStartKyc} fetchKycStatus={fetchKycStatus} />;
            case 'trips': return <Trips user={user} />;
            case 'shipments': return <Shipments user={user} />;
            case 'chats': return <Chats user={user} />;
            case 'earnings': return <Earnings user={user} checkAuthStatus={checkAuthStatus} />;
            case 'settings': return <Settings user={user} checkAuthStatus={checkAuthStatus} />;
            default: return <Overview user={user} kycStatus={kycStatus} />;
        }
    };

    if (loading || kycLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F6F3]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#5845D8]"></div>
                <p className="font-black text-[#5845D8] animate-pulse uppercase tracking-widest text-xs">Loading Bago...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F6F3] flex font-sans">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />

            <main className="flex-1 ml-64 p-10 min-h-screen overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header bar (mobile toggle, user name) */}
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-sm font-black text-gray-400 uppercase tracking-[3px]">Dashboard / {activeTab}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="font-black text-[#054752] text-sm uppercase">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[10px] text-[#708c91] font-bold">{user?.email}</p>
                            </div>
                        </div>
                    </header>

                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
