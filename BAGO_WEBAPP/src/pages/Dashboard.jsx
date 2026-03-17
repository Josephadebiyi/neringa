import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../api';
import Sidebar from '../components/dashboard/Sidebar';
import Overview from '../components/dashboard/Overview';
import Trips from '../components/dashboard/Trips';
import Shipments from '../components/dashboard/Shipments';
import Deliveries from '../components/dashboard/Deliveries';
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
    ChevronLeft,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';



export default function Dashboard() {
    const { user, loading, isAuthenticated, logout, checkAuthStatus } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('not_started');
    const [kycLoading, setKycLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
    const [userStats, setUserStats] = useState({ totalUsers: 0 });
    const [chatConv, setChatConv] = useState(null); // Persist chat across tab switches
    const location = useLocation();
    const [msg, setMsg] = useState(location.state?.message || '');

    useEffect(() => {
        if (location.state?.message) {
            setMsg(location.state.message);
            // Clear message after 5 seconds
            const timer = setTimeout(() => setMsg(''), 5000);
            return () => clearTimeout(timer);
        }

        // Handle Didit redirect check
        const params = new URLSearchParams(location.search);
        if (params.get('kyc_check')) {
            setMsg('Identity verification submitted! Status will update once processing is complete.');
            fetchKycStatus();
            // Clean up the URL
            navigate('/dashboard', { replace: true });
        }
    }, [location.state, location.search, navigate]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login?redirect=/dashboard');
        } else if (isAuthenticated) {
            if (user?.isBanned) {
                navigate('/banned');
            }
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
                    activePackages: resp.data.activePackages || 0
                });
            }
        } catch (err) {
            // Error fetching user stats
        }
    };

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
            setKycStatus('not_started');
        } finally {
            setKycLoading(false);
        }
    };

    const handleStartKyc = () => {
        navigate('/verify');
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSidebarOpen(false); // close mobile sidebar on nav
    };

    const renderTabContent = () => {
        try {
            switch (activeTab) {
                case 'overview': return <Overview user={user} kycStatus={kycStatus} handleStartKyc={handleStartKyc} fetchKycStatus={fetchKycStatus} userStats={userStats} />;
                case 'trips': return <Trips user={user} />;
                case 'shipments':
                    return <Shipments user={user} onNavigateToChat={(convId) => { setChatConv({ _id: convId }); setActiveTab('chats'); }} />;
                case 'deliveries':
                    return <Deliveries user={user} onNavigateToChat={(convId) => { setChatConv({ _id: convId }); setActiveTab('chats'); }} />;
                case 'chats': return <Chats user={user} selectedConv={chatConv} setSelectedConv={setChatConv} onTabChange={setActiveTab} />;
                case 'earnings': return <Earnings user={user} checkAuthStatus={checkAuthStatus} />;
                case 'settings': return <Settings user={user} checkAuthStatus={checkAuthStatus} />;
                default: return <Overview user={user} kycStatus={kycStatus} handleStartKyc={handleStartKyc} />;
            }
        } catch (err) {
            return renderError(err);
        }
    };

    const renderError = (error) => (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LayoutDashboard size={40} />
                </div>
                <h3 className="text-2xl font-black text-[#012126] mb-3">{t('somethingWentWrong')}</h3>
                <p className="text-gray-500 font-medium mb-8">{t('troubleLoadingSection')}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => window.location.reload()} className="bg-[#5845D8] text-white font-bold py-4 rounded-2xl shadow-lg ring-offset-2 active:scale-95 transition-all">
                        {t('refreshPage')}
                    </button>
                    <button onClick={() => setActiveTab('overview')} className="text-[#5845D8] font-bold py-2 hover:opacity-70 transition-all">
                        {t('backToOverview')}
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading || kycLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F6F3]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#5845D8]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-8 w-8 bg-[#5845D8]/10 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-black text-[#012126] uppercase tracking-widest text-xs mb-1">Bago</p>
                    <p className="text-[#5845D8] font-bold animate-pulse text-sm">{t('preparingDashboard')}</p>
                </div>
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
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                logout={logout}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* ── Main Content ── */}
            <main className="flex-1 md:ml-64 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-xl bg-gray-50 text-[#012126] hover:bg-gray-100"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-xs font-black text-[#012126] uppercase tracking-widest">{t(activeTab)}</h1>
                            <p className="text-[9px] text-gray-400 font-bold hidden sm:block uppercase tracking-tight">{t('personalDashboard')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link to="/" className="text-[10px] text-[#6B7280] hover:text-[#5845D8] font-bold uppercase tracking-wider hidden sm:block">
                            {t('backToSite')}
                        </Link>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-red-500 bg-red-50/50 hover:bg-red-50 transition-all font-bold text-[10px] uppercase tracking-wider"
                        >
                            <LogOut size={14} />
                            <span className="hidden xs:block">{t('logout')}</span>
                        </button>

                        <div className="w-8 h-8 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-xs">
                            {userInitial}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="p-4 md:p-8 max-w-6xl mx-auto">
                    {msg && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-900 font-bold animate-in slide-in-from-top duration-300">
                            <AlertCircle className="text-amber-500" size={20} />
                            {msg}
                        </div>
                    )}
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
}
