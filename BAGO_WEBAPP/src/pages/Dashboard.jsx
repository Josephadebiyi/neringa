import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/dashboard/Sidebar';
import Overview from '../components/dashboard/Overview';
import Trips from '../components/dashboard/Trips';
import Shipments from '../components/dashboard/Shipments';
import Deliveries from '../components/dashboard/Deliveries';
import Chats from '../components/dashboard/Chats';
import Earnings from '../components/dashboard/Earnings';
import Referral from '../components/dashboard/Referral';
import Settings from '../components/dashboard/Settings';
import {
    LayoutDashboard,
    Menu,
    Shield,
    AlertCircle,
    Bell,
    Search,
} from 'lucide-react';


const TAB_LABELS = {
    overview: 'Overview',
    trips: 'My Trips',
    shipments: 'My Shipments',
    deliveries: 'My Deliveries',
    chats: 'Messages',
    earnings: 'Wallet & Earnings',
    referral: 'Referrals',
    settings: 'Settings',
    insurance: 'Insurance',
};

export default function Dashboard() {
    const { user, loading, isAuthenticated, logout, checkAuthStatus, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('not_started');
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userStats, setUserStats] = useState({ totalUsers: 0 });
    const [chatConv, setChatConv] = useState(null);
    const location = useLocation();
    const [msg, setMsg] = useState(location.state?.message || '');
    const refreshedApprovedKycRef = useRef(false);

    const effectiveKycStatus =
        user?.kycStatus === 'approved' || user?.isKycCompleted ? 'approved' : kycStatus;

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const allowed = ['overview', 'trips', 'shipments', 'deliveries', 'messages', 'chats', 'earnings', 'referral', 'settings', 'insurance'];
        if (tab && allowed.includes(tab)) {
            setActiveTab(tab === 'messages' ? 'chats' : tab);
        }
    }, [location.search]);

    useEffect(() => {
        if (location.state?.message) {
            setMsg(location.state.message);
            const timer = setTimeout(() => setMsg(''), 5000);
            return () => clearTimeout(timer);
        }
        const params = new URLSearchParams(location.search);
        if (params.get('kyc_check')) {
            navigate('/dashboard', { replace: true });
            // Fetch the real status then show a contextual message
            api.get('/api/bago/kyc/status').then(res => {
                const status = res.data?.kycStatus || 'not_started';
                setKycStatus(status);
                if (status === 'approved') {
                    setMsg('✅ Identity verified! You now have full access to Bago.');
                } else if (['pending', 'processing', 'under_review'].includes(status)) {
                    setMsg('Your verification is under review. We\'ll notify you by email once it\'s done.');
                } else if (['declined', 'rejected', 'failed'].includes(status)) {
                    setMsg('Your verification was not approved. Please go to Verify to try again.');
                } else {
                    setMsg('Please complete your identity verification to unlock all Bago features.');
                }
                setTimeout(() => setMsg(''), 8000);
            }).catch(() => {
                setMsg('Please complete your identity verification to unlock all Bago features.');
                setTimeout(() => setMsg(''), 8000);
            });
        }
    }, [location.state, location.search, navigate]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login?redirect=/dashboard');
        } else if (isAuthenticated) {
            if (user?.isBanned) navigate('/banned');
            fetchKycStatus();
            fetchUserStats();
        }
    }, [loading, isAuthenticated, user, navigate]);

    const fetchUserStats = async () => {
        try {
            const resp = await api.get('/api/bago/user-stats');
            if (resp.data.success) {
                setUserStats({
                    totalUsers: resp.data.totalUsers,
                    completedBookings: resp.data.completedBookings || 0,
                    activePackages: resp.data.activePackages || 0,
                    thisMonthShipments: resp.data.thisMonthShipments || 0,
                    lastMonthShipments: resp.data.lastMonthShipments || 0,
                });
            }
        } catch (_) {}
    };

    const fetchKycStatus = async () => {
        try {
            try {
                const res = await api.get('/api/bago/kyc/status');
                const status =
                    user?.kycStatus === 'approved' || user?.isKycCompleted
                        ? 'approved'
                        : res.data?.kycStatus || 'not_started';
                setKycStatus(status);
                if (status === 'approved' && !refreshedApprovedKycRef.current) {
                    refreshedApprovedKycRef.current = true;
                    await refreshUser();
                }
            } catch {
                const response = await api.get('/api/bago/getKyc');
                if (response.data.status === 'success') {
                    setKycStatus(response.data.data?.kyc ? 'approved' : 'not_started');
                }
            }
        } catch {
            setKycStatus('not_started');
        }
    };

    const handleStartKyc = () => navigate('/verify');

    const renderTabContent = () => {
        try {
            switch (activeTab) {
                case 'overview':
                    return (
                        <Overview
                            user={user}
                            kycStatus={effectiveKycStatus}
                            handleStartKyc={handleStartKyc}
                            fetchKycStatus={fetchKycStatus}
                            userStats={userStats}
                        />
                    );
                case 'trips':
                    return <Trips user={user} />;
                case 'shipments':
                    return (
                        <Shipments
                            user={user}
                            onNavigateToChat={convId => {
                                setChatConv({ _id: convId });
                                setActiveTab('chats');
                            }}
                        />
                    );
                case 'deliveries':
                    return (
                        <Deliveries
                            user={user}
                            onNavigateToChat={convId => {
                                setChatConv({ _id: convId });
                                setActiveTab('chats');
                            }}
                        />
                    );
                case 'chats':
                    return (
                        <Chats
                            user={user}
                            selectedConv={chatConv}
                            setSelectedConv={setChatConv}
                            onTabChange={setActiveTab}
                        />
                    );
                case 'earnings':
                    return <Earnings user={user} checkAuthStatus={checkAuthStatus} />;
                case 'referral':
                    return <Referral user={user} />;
                case 'settings':
                    return <Settings user={user} checkAuthStatus={checkAuthStatus} />;
                case 'insurance':
                    return (
                        <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm">
                            <Shield size={48} className="text-[#5845D8]/30 mx-auto mb-5" />
                            <h3 className="text-lg font-black text-[#111827] mb-2 uppercase tracking-tight">
                                Insurance Coming Soon
                            </h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest opacity-70">
                                Insurance management will be available soon.
                            </p>
                        </div>
                    );
                default:
                    return (
                        <Overview
                            user={user}
                            kycStatus={effectiveKycStatus}
                            handleStartKyc={handleStartKyc}
                        />
                    );
            }
        } catch (error) {
            console.error('Dashboard section crashed:', activeTab, error);
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="text-center max-w-sm">
                        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LayoutDashboard size={40} />
                        </div>
                        <h3 className="text-xl font-black text-[#111827] mb-3">Something Went Wrong</h3>
                        <p className="text-gray-500 font-medium mb-8">Trouble loading this section.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-[#5845D8] text-white font-bold py-4 rounded-2xl shadow-lg"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className="text-[#5845D8] font-bold py-2 hover:opacity-70 transition-all"
                            >
                                Back to Overview
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#5845D8]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#5845D8]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-6 w-6 bg-[#5845D8]/20 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-black text-white/50 uppercase tracking-widest text-xs mb-1">Bago</p>
                        <p className="text-[#5845D8] font-bold animate-pulse text-sm">Preparing your dashboard…</p>
                    </div>
                </div>
            </div>
        );
    }

    const userInitial = user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'B';
    const tabLabel = TAB_LABELS[activeTab] || activeTab;

    return (
        <div className="min-h-screen bg-[#F5F4FC] flex font-sans">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                logout={logout}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">

                {/* ── Top bar – Velto style ── */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">

                    {/* Left: hamburger + tab label */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            className="md:hidden p-2 rounded-xl bg-gray-50 text-[#111827] hover:bg-gray-100 shrink-0"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-[#111827] uppercase tracking-widest leading-none">
                                {tabLabel}
                            </h1>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 hidden sm:block">
                                {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    </div>

                    {/* Center: search bar — all tabs */}
                    <div className="hidden lg:flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-2.5 w-80 border border-gray-100 hover:border-[#5845D8]/20 focus-within:border-[#5845D8]/40 focus-within:bg-white focus-within:shadow-sm transition-all">
                        <Search size={13} className="text-gray-400 shrink-0" />
                        <input
                            placeholder="Search shipments, trips, earnings…"
                            className="bg-transparent text-[11px] outline-none text-[#111827] placeholder:text-gray-300 w-full font-medium"
                        />
                        <kbd className="hidden xl:flex items-center gap-0.5 text-[8px] font-bold text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">⌘F</kbd>
                    </div>

                    {/* Right: back link + bell + avatar */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            to="/"
                            className="text-[10px] text-gray-400 hover:text-[#5845D8] font-bold uppercase tracking-wider hidden sm:block transition-colors"
                        >
                            ← Site
                        </Link>

                        <button className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#5845D8]/5 hover:text-[#5845D8] transition-all relative">
                            <Bell size={17} />
                        </button>

                        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
                            <div className="text-right hidden md:block">
                                <p className="text-[11px] font-black text-[#111827] leading-tight">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-[9px] text-gray-400 font-medium truncate max-w-[150px]">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm overflow-hidden border-2 border-[#5845D8]/20 shrink-0">
                                {user?.image
                                    ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                                    : userInitial}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                    {msg && (
                        <div className="mb-5 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-900 font-bold animate-in slide-in-from-top duration-300">
                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                            {msg}
                        </div>
                    )}
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
