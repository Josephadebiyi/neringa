import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import Sidebar, { useUnreadCount } from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import Overview from '../components/dashboard/Overview';
import Trips from '../components/dashboard/Trips';
import Shipments from '../components/dashboard/Shipments';
import Deliveries from '../components/dashboard/Deliveries';
import Chats from '../components/dashboard/Chats';
import Earnings from '../components/dashboard/Earnings';
import Referral from '../components/dashboard/Referral';
import Settings from '../components/dashboard/Settings';
import FinancialReports from '../components/dashboard/FinancialReports';
import BusinessVerification from '../components/dashboard/BusinessVerification';
import StaffAccounts from '../components/dashboard/StaffAccounts';
import BusinessServices from '../components/dashboard/BusinessServices';
import {
    LayoutDashboard,
    Menu,
    Shield,
    AlertCircle,
    ArrowLeft,
    Package,
    Plus,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getUserPayoutCurrency } from '../utils/userCurrency';


const TAB_LABELS = {
    overview: 'Overview',
    trips: 'My Trips',
    services: 'Business Services',
    shipments: 'My Shipments',
    deliveries: 'My Deliveries',
    chats: 'Messages',
    earnings: 'Wallet & Earnings',
    financial: 'Financial Reports',
    referral: 'Referrals',
    settings: 'Settings',
    insurance: 'Insurance',
    staff: 'Staff Accounts',
    'business-verification': 'Business Verification',
};

const TAB_SUBTITLES = {
    overview: 'Track your shipments, trips and earnings in one place.',
    trips: 'Manage the trips you have posted.',
    services: 'Manage the shipping services your business offers.',
    shipments: 'Follow every package you are sending.',
    deliveries: 'Packages you are carrying for other people.',
    chats: 'Talk to senders and travellers.',
    earnings: 'Your balance, escrow and payouts.',
    financial: 'Revenue and payout reports for your business.',
    referral: 'Invite friends and earn rewards.',
    settings: 'Profile, security and preferences.',
    insurance: 'Protect the packages you send.',
    staff: 'Control who on your team can access this account.',
    'business-verification': 'Verify your business to unlock every feature.',
};

export default function Dashboard() {
    const { user, loading, isAuthenticated, logout, checkAuthStatus, refreshUser } = useAuth();
    const { setCurrency } = useLanguage();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('not_started');
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userStats, setUserStats] = useState({ totalUsers: 0 });
    const [chatConv, setChatConv] = useState(null);
    const unreadCount = useUnreadCount(user);
    const location = useLocation();
    const [msg, setMsg] = useState(location.state?.message || '');
    // Dark mode is temporarily disabled — the CSS-override implementation
    // shipped with real, user-reported readability bugs in production
    // (invisible text on gradient cards, low-contrast chat list, a muddy
    // overlay panel). Forcing this false (and clearing any stored
    // preference) reverts every user, including anyone who had already
    // opted in, back to the known-working light dashboard. Re-enable only
    // once dark mode is implemented properly (real per-component styling,
    // not blanket CSS attribute-selector overrides) and visually verified.
    const darkMode = false;
    useEffect(() => {
        localStorage.removeItem('bago_dashboard_theme');
    }, []);
    const refreshedApprovedKycRef = useRef(false);

    const effectiveKycStatus =
        user?.kycStatus === 'approved' || user?.isKycCompleted ? 'approved' : kycStatus;
    const isBusinessAccount = user?.accountType === 'company' || user?.account_type === 'company';

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const allowed = ['overview', 'trips', 'services', 'shipments', 'deliveries', 'messages', 'chats', 'earnings', 'financial', 'referral', 'settings', 'insurance'];
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

    // Sync display currency from user's wallet profile — overrides IP/localStorage guesses
    useEffect(() => {
        const profileCurrency = getUserPayoutCurrency(user, '');
        if (profileCurrency) {
            setCurrency(profileCurrency.toUpperCase());
        }
    }, [user?.payoutAccount?.currency, user?.payout_account?.currency, user?.payoutCurrency, user?.payout_currency, user?.walletCurrency, user?.wallet_currency, user?.earningCurrency, user?.preferredCurrency, user?.preferred_currency, user?.currency, setCurrency]);

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
                case 'services':
                    return isBusinessAccount
                        ? <BusinessServices user={user} />
                        : <Overview user={user} kycStatus={effectiveKycStatus} handleStartKyc={handleStartKyc} fetchKycStatus={fetchKycStatus} userStats={userStats} />;
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
                case 'financial':
                    return isBusinessAccount
                        ? <FinancialReports user={user} />
                        : <Overview user={user} kycStatus={effectiveKycStatus} handleStartKyc={handleStartKyc} fetchKycStatus={fetchKycStatus} userStats={userStats} />;
                case 'referral':
                    return <Referral user={user} />;
                case 'business-verification':
                    return <BusinessVerification user={user} checkAuthStatus={checkAuthStatus} />;
                case 'staff':
                    return <StaffAccounts user={user} />;
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
            <div className="min-h-screen flex items-center justify-center bg-[#F5F4FC]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#5845D8]/20 border-t-[#5845D8]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-6 w-6 bg-[#5845D8]/20 rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-black text-[#111827] uppercase tracking-widest text-xs mb-1">Bago</p>
                        <p className="text-[#5845D8] font-bold animate-pulse text-sm">Preparing your dashboard…</p>
                    </div>
                </div>
            </div>
        );
    }

    const userInitial = user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'B';
    const tabLabel = activeTab === 'overview' ? 'Dashboard' : (TAB_LABELS[activeTab] || activeTab);
    const tabSubtitle = TAB_SUBTITLES[activeTab] || '';
    const goBack = () => (activeTab === 'overview' ? navigate('/') : setActiveTab('overview'));

    return (
        <div className={`dashboard-shell min-h-screen bg-[#ECEBF7] font-sans lg:p-5 ${darkMode ? 'dashboard-dark' : ''}`}>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Drawer navigation (below lg) */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                logout={logout}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                isBusinessAccount={isBusinessAccount}
                unreadCount={unreadCount}
            />

            <div className="min-h-screen lg:min-h-[calc(100vh-40px)] bg-[#F7F7FC] lg:rounded-[32px] lg:shadow-[0_30px_80px_rgba(88,69,216,0.10)] lg:border lg:border-white px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 lg:pt-7 pb-10">

                {/* Mobile header */}
                <header className="lg:hidden flex items-center justify-between gap-3 mb-5">
                    <button
                        className="w-11 h-11 rounded-full bg-white border border-gray-200/80 text-[#171B22] flex items-center justify-center"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu size={19} />
                    </button>
                    <Link to="/" aria-label="Bago home">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
                    </Link>
                    <div className="relative w-11 h-11 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold overflow-hidden ring-2 ring-white">
                        {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : userInitial}
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#EF4444] ring-2 ring-[#F7F7FC]" />
                        )}
                    </div>
                </header>

                {/* Desktop top navigation */}
                <TopNav
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    user={user}
                    logout={logout}
                    isBusinessAccount={isBusinessAccount}
                    unreadCount={unreadCount}
                />

                <main className="max-w-[1400px] mx-auto w-full">
                    {/* Page heading */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 lg:mt-10 mb-7">
                        <div className="flex items-center gap-4 min-w-0">
                            <button
                                type="button"
                                onClick={goBack}
                                aria-label={activeTab === 'overview' ? 'Back to website' : 'Back to overview'}
                                className="hidden sm:flex w-12 h-12 rounded-full bg-white border border-gray-200/80 items-center justify-center text-[#171B22] hover:text-[#5845D8] hover:border-[#5845D8]/40 transition-colors shrink-0"
                            >
                                <ArrowLeft size={19} />
                            </button>
                            <div className="min-w-0">
                                <h1 className="font-['Manrope'] text-[30px] sm:text-[40px] font-extrabold text-[#171B22] tracking-[-0.03em] leading-[1.05] truncate">
                                    {tabLabel}
                                </h1>
                                {tabSubtitle && (
                                    <p className="text-sm text-[#6B7280] mt-1.5">{tabSubtitle}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                to="/search"
                                className="flex-1 sm:flex-none justify-center whitespace-nowrap flex items-center gap-2 h-12 px-5 rounded-full bg-white border border-gray-200/80 text-sm font-semibold text-[#171B22] hover:border-[#5845D8]/40 hover:text-[#5845D8] transition-colors"
                            >
                                <Package size={16} /> Send a package
                            </Link>
                            <Link
                                to="/post-trip"
                                className="flex-1 sm:flex-none justify-center whitespace-nowrap flex items-center gap-2 h-12 px-6 rounded-full bg-[#5845D8] text-white text-sm font-semibold shadow-[0_10px_24px_rgba(88,69,216,0.35)] hover:bg-[#4A38C9] transition-colors"
                            >
                                <Plus size={17} /> Post a trip
                            </Link>
                        </div>
                    </div>

                    {msg && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-900 font-semibold text-sm">
                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                            {msg}
                        </div>
                    )}
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
}
