import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Overview from '../components/dashboard/Overview';
import Trips from '../components/dashboard/Trips';
import Shipments from '../components/dashboard/Shipments';
import Chats from '../components/dashboard/Chats';
import Earnings from '../components/dashboard/Earnings';
import Settings from '../components/dashboard/Settings';
import {
    LayoutDashboard,
    MessageCircle,
    Plane,
    Package,
    Wallet,
    Settings as SettingsIcon,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trips', label: 'My Trips', icon: Plane },
    { id: 'shipments', label: 'My Shipments', icon: Package },
    { id: 'chats', label: 'Messages', icon: MessageCircle },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Dashboard() {
    const { user, loading, isAuthenticated, logout, checkAuthStatus } = useAuth();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('not_started');
    const [kycLoading, setKycLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login?redirect=/dashboard');
        } else if (isAuthenticated) {
            fetchKycStatus();
        }
    }, [loading, isAuthenticated]);

    const fetchKycStatus = async () => {
        try {
            setKycLoading(true);
            // Try the correct KYC status endpoint first
            try {
                const res = await api.get('/api/bago/kyc/status');
                setKycStatus(res.data?.kycStatus || 'not_started');
            } catch {
                // Fallback to old endpoint
                const response = await api.get('/api/bago/getKyc');
                if (response.data.status === 'success') {
                    const isApproved = response.data.data?.kyc;
                    setKycStatus(isApproved ? 'approved' : 'not_started');
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
            const response = await api.post('/api/bago/kyc/create-session');
            const url = response.data.sessionUrl || response.data.diditSessionUrl;
            if (url) window.open(url, '_blank');
            else alert('Verification session created. Please check your email or refresh the page.');
        } catch (err) {
            console.error('KYC error:', err);
            alert('Could not start identity verification. Please try later.');
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSidebarOpen(false); // close mobile sidebar on nav
    };

    const renderTabContent = () => {
        // Wrap each in error boundary-like try
        try {
            switch (activeTab) {
                case 'overview': return <Overview user={user} kycStatus={kycStatus} handleStartKyc={handleStartKyc} fetchKycStatus={fetchKycStatus} />;
                case 'trips': return <Trips user={user} />;
                case 'shipments': return <Shipments user={user} />;
                case 'chats': return <Chats user={user} />;
                case 'earnings': return <Earnings user={user} checkAuthStatus={checkAuthStatus} />;
                case 'settings': return <Settings user={user} checkAuthStatus={checkAuthStatus} />;
                default: return <Overview user={user} kycStatus={kycStatus} handleStartKyc={handleStartKyc} />;
            }
        } catch (err) {
            console.error('Tab render error:', err);
            return (
                <div className="text-center py-20">
                    <p className="text-red-500 font-semibold">Something went wrong loading this section.</p>
                    <button onClick={() => setActiveTab('overview')} className="mt-4 text-[#5845D8] underline text-sm">Go back to Overview</button>
                </div>
            );
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

    const userInitial = user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'B';

    return (
        <div className="min-h-screen bg-[#F8F6F3] flex font-sans">

            {/* ── Mobile Backdrop ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={`
                fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Logo */}
                <div className="p-5 flex items-center justify-between border-b border-gray-50">
                    <Link to="/" onClick={() => setSidebarOpen(false)}>
                        <img src="/bago_logo.png" alt="Bago" className="h-7" />
                    </Link>
                    <button className="md:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === item.id
                                    ? 'bg-[#5845D8] text-white shadow-md shadow-[#5845D8]/20'
                                    : 'text-[#708c91] hover:bg-gray-50 hover:text-[#054752]'
                                }`}
                        >
                            <item.icon size={19} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="font-bold text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User footer */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-9 h-9 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#054752] truncate">
                                {user?.firstName !== 'Bago' ? `${user?.firstName} ${user?.lastName}` : user?.email?.split('@')[0]}
                            </p>
                            <div className="flex items-center gap-1">
                                <Shield size={9} className={kycStatus === 'approved' ? 'text-green-500' : 'text-gray-300'} />
                                <span className="text-[9px] text-gray-400 font-bold uppercase">
                                    {kycStatus === 'approved' ? 'Verified' : 'Unverified'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 md:ml-64 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-xl bg-gray-50 text-[#054752] hover:bg-gray-100"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={22} />
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-[#054752] capitalize">{activeTab}</h1>
                            <p className="text-[10px] text-gray-400 hidden sm:block">Welcome back{user?.firstName !== 'Bago' ? `, ${user?.firstName}` : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-xs text-[#708c91] hover:text-[#5845D8] font-semibold hidden sm:block">
                            ← Back to site
                        </Link>
                        <div className="w-8 h-8 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-sm">
                            {userInitial}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="p-4 md:p-8 max-w-6xl mx-auto">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
