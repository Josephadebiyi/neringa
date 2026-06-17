import React, { useState, useEffect } from 'react';
import {
    Package, Clock, Star, ArrowRight, ArrowUpRight, ArrowDownLeft,
    TrendingUp, TrendingDown, Shield, Plane, Wallet, ChevronRight, AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R' };
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EARNING_TYPES = new Set(['earning', 'signup_bonus', 'admin_settlement', 'credit', 'release', 'deposit', 'escrow_release']);
const EXPENSE_TYPES = new Set(['withdrawal', 'withdraw', 'payout', 'debit', 'escrow_hold']);

function transactionTitle(tx, isOut) {
    if (tx.description) return tx.description;
    if (tx.tracking_number) return `Shipment ${tx.tracking_number}`;
    if (tx.trip_number) return `Trip #${tx.trip_number}`;
    return isOut ? 'Withdrawal' : 'Earnings';
}

function transactionMeta(tx) {
    const parts = [];
    if (tx.trip_number) parts.push(`Trip #${tx.trip_number}`);
    if (tx.tracking_number) parts.push(`Tracking ${tx.tracking_number}`);
    const route = [tx.trip_from_location, tx.trip_to_location].filter(Boolean).join(' → ');
    if (route) parts.push(route);
    return parts.join(' · ');
}

function firstNumber(...values) {
    for (const value of values) {
        if (value === null || value === undefined || value === '') continue;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}

function BarChart({ data, activeIndex }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const hasData = data.some(d => d.value > 0);
    return (
        <div className="flex items-end gap-2 h-32 w-full">
            {data.map((d, i) => {
                const pct = Math.max((d.value / max) * 100, hasData ? 4 : 12);
                const isActive = i === activeIndex;
                return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                            className="w-full rounded-lg transition-all duration-700"
                            style={{
                                height: `${pct}%`,
                                backgroundColor: isActive ? '#5845D8' : d.value > 0 ? '#012126' : '#E9EAF0',
                                opacity: isActive ? 1 : d.value > 0 ? 0.3 : 1,
                                boxShadow: isActive ? '0 6px 20px #5845D840' : 'none',
                            }}
                        />
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? 'text-[#5845D8] font-black' : 'text-gray-400'}`}>
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function Sparkline({ data, color = '#5845D8', height = 40 }) {
    if (!data || data.length < 2) {
        return <div style={{ height }} className="w-full opacity-20 bg-gray-100 rounded" />;
    }
    const max = Math.max(...data, 0.01);
    const w = 100;
    const h = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (v / max) * (h * 0.8) - h * 0.1;
        return `${x},${y}`;
    });
    const fill = `${pts.join(' ')} ${w},${h} 0,${h}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={fill} fill="url(#sg)" />
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Overview({ user, kycStatus, handleStartKyc, userStats }) {
    const navigate = useNavigate();

    const [walletData, setWalletData] = useState({
        balance: 0,
        escrow: 0,
        history: [],
        allTimeReceived: 0,
        currency: 'USD',
    });
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [walletError, setWalletError] = useState(false);
    const [chartTab, setChartTab] = useState('earnings');

    const effectiveKycStatus =
        user?.kycStatus === 'approved' || user?.isKycCompleted ? 'approved' : kycStatus;

    const walletCurrency = (walletData.currency || user?.walletCurrency || user?.preferredCurrency || 'USD').toUpperCase();
    const sym = CURRENCY_SYMBOLS[walletCurrency] || walletCurrency;
    const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';

    useEffect(() => {
        let mounted = true;
        api.get('/api/bago/getWallet')
            .then(res => {
                if (!mounted) return;
                const d = res.data?.data || res.data || {};
                const root = res.data || {};
                setWalletData({
                    balance: firstNumber(
                        d.balance,
                        d.walletBalance,
                        d.wallet_balance,
                        d.availableBalance,
                        d.available_balance,
                        root.balance,
                        root.walletBalance,
                        root.wallet_balance,
                        user?.walletBalance,
                        user?.wallet_balance,
                    ),
                    escrow: firstNumber(d.escrowBalance, d.escrow_balance, root.escrowBalance, root.escrow_balance, user?.escrowBalance, user?.escrow_balance),
                    history: Array.isArray(d.history) ? d.history : (Array.isArray(d.transactions) ? d.transactions : []),
                    allTimeReceived: firstNumber(d.allTimeReceived, root.allTimeReceived),
                    allTimeExpenses: firstNumber(d.allTimeExpenses, root.allTimeExpenses),
                    currency: d.currency || root.currency || user?.walletCurrency || user?.wallet_currency || 'USD',
                });
            })
            .catch(() => { if (mounted) setWalletError(true); })
            .finally(() => { if (mounted) setLoadingWallet(false); });
        return () => { mounted = false; };
    }, []);

    const chartData = (() => {
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return {
                label: DAY_LABELS[d.getDay()],
                value: 0,
                dateStr: d.toISOString().slice(0, 10),
            };
        });
        const lookup = new Map(days.map(d => [d.dateStr, d]));
        walletData.history.forEach(tx => {
            const date = new Date(tx.created_at || tx.createdAt || tx.date);
            if (isNaN(date)) return;
            const slot = lookup.get(date.toISOString().slice(0, 10));
            if (!slot) return;
            if (chartTab === 'earnings' && EARNING_TYPES.has(tx.type)) {
                slot.value += Number(tx.amount || 0);
            } else if (chartTab === 'count') {
                slot.value += 1;
            }
        });
        return days;
    })();

    // 7-day sparkline values for Insights panel
    const sparkValues = chartData.map(d => d.value);

    const recentTxs = [...walletData.history].slice(0, 8);
    const derivedAllTimeReceived = walletData.history
        .filter(tx => EARNING_TYPES.has((tx.type || '').toLowerCase()) && (tx.status || 'completed').toLowerCase() === 'completed')
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

    const thisMonth = userStats?.thisMonthShipments ?? 0;
    const lastMonth = userStats?.lastMonthShipments ?? 0;
    const monthDelta = thisMonth - lastMonth;
    const monthUp = monthDelta >= 0;

    const allTimeIncome = walletData.allTimeReceived || derivedAllTimeReceived;
    const allTimeFormatted = allTimeIncome.toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-400">

            {walletError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-xs font-bold text-red-600">
                    <AlertCircle size={15} className="shrink-0" />
                    Could not load wallet data. Please refresh the page or check your connection.
                </div>
            )}

            {/* ── Top: Greeting + Month pill ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#012126] tracking-tight">
                        Hello, {firstName} 👋
                    </h1>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">
                        Monitor your shipments and trips in real time.
                    </p>
                </div>

                {/* Month-over-month pill */}
                <div className="flex items-stretch gap-0 bg-[#012126] rounded-2xl overflow-hidden shrink-0 divide-x divide-white/8">
                    <div className="px-5 py-3 text-center">
                        <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-1">This Month</p>
                        <p className="text-2xl font-black text-white leading-none">{thisMonth}</p>
                        <p className="text-[8px] text-white/30 font-medium mt-0.5">shipments</p>
                    </div>
                    <div className="px-5 py-3 text-center">
                        <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-1">Last Month</p>
                        <p className="text-2xl font-black text-white/50 leading-none">{lastMonth}</p>
                        <p className="text-[8px] text-white/30 font-medium mt-0.5">shipments</p>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-center">
                        <div className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl ${monthUp ? 'bg-emerald-400/10' : 'bg-red-400/10'}`}>
                            {monthUp
                                ? <TrendingUp size={14} className="text-emerald-400" />
                                : <TrendingDown size={14} className="text-red-400" />}
                            <span className={`text-[8px] font-black ${monthUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                {monthDelta > 0 ? `+${monthDelta}` : monthDelta}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 3 Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Cream — Total Shipments */}
                <div
                    className="bg-[#FBF9F0] border border-[#EDE8D0] rounded-[20px] p-5 flex items-center justify-between group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate('/dashboard?tab=shipments')}
                >
                    <div>
                        <p className="text-[8px] font-black text-[#8B7E52] uppercase tracking-widest mb-1">Total Shipments</p>
                        <p className="text-3xl font-black text-[#3D3410] tracking-tight leading-none">
                            {userStats?.completedBookings ?? '—'}
                        </p>
                        <p className="text-[9px] text-[#8B7E52] font-medium mt-1">completed deliveries</p>
                    </div>
                    <div className="w-10 h-10 bg-[#EDE8D0] group-hover:bg-[#D4CC9A] rounded-xl flex items-center justify-center transition-all">
                        <Package size={18} className="text-[#8B7E52]" />
                    </div>
                </div>

                {/* Blue — Active Deliveries */}
                <div
                    className="bg-[#EEF4FF] border border-[#CCDAFF] rounded-[20px] p-5 flex items-center justify-between group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate('/dashboard?tab=deliveries')}
                >
                    <div>
                        <p className="text-[8px] font-black text-[#4A6FA5] uppercase tracking-widest mb-1">Active Deliveries</p>
                        <p className="text-3xl font-black text-[#1A3A6B] tracking-tight leading-none">
                            {userStats?.activePackages ?? '—'}
                        </p>
                        <p className="text-[9px] text-[#4A6FA5] font-medium mt-1">in transit now</p>
                    </div>
                    <div className="w-10 h-10 bg-[#CCDAFF] group-hover:bg-[#99BAFF] rounded-xl flex items-center justify-center transition-all">
                        <Clock size={18} className="text-[#4A6FA5]" />
                    </div>
                </div>

                {/* Gray — Wallet Balance */}
                <div
                    className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-[20px] p-5 flex items-center justify-between group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate('/dashboard?tab=earnings')}
                >
                    <div>
                        <p className="text-[8px] font-black text-[#6B6B6B] uppercase tracking-widest mb-1">Wallet Balance</p>
                        <p className="text-2xl font-black text-[#1A1A1A] tracking-tight leading-none">
                            {loadingWallet
                                ? <span className="opacity-30 animate-pulse">—</span>
                                : `${sym}${walletData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                        {walletData.escrow > 0 && (
                            <p className="text-[9px] text-amber-600 font-medium mt-1">
                                + {sym}{walletData.escrow.toFixed(2)} in escrow
                            </p>
                        )}
                    </div>
                    <div className="w-10 h-10 bg-[#E5E5E5] group-hover:bg-[#D0D0D0] rounded-xl flex items-center justify-center transition-all">
                        <Wallet size={18} className="text-[#6B6B6B]" />
                    </div>
                </div>
            </div>

            {/* ── Bottom Row: Chart + Insights ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Left 3/5 — Shipment Activity */}
                <div className="lg:col-span-3 bg-white border border-gray-100 rounded-[24px] shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-black text-[#012126] tracking-tight">Shipment Activity</h3>
                            <p className="text-[9px] text-gray-400 font-medium mt-0.5">Past 7 days</p>
                        </div>
                        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            {[{ id: 'earnings', label: 'Earnings' }, { id: 'count', label: 'Count' }].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setChartTab(t.id)}
                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                        chartTab === t.id
                                            ? 'bg-[#5845D8] text-white shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <BarChart data={chartData} activeIndex={6} />

                    {/* Quick actions */}
                    <div className="flex gap-3 mt-5 pt-4 border-t border-gray-50">
                        <Link
                            to="/post-trip"
                            className="flex-1 flex items-center justify-center gap-2 bg-[#5845D8] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all"
                        >
                            <Plane size={12} /> Post a Trip
                        </Link>
                        <Link
                            to="/search"
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-[#012126]/60 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            <Package size={12} /> Send Package
                        </Link>
                    </div>
                </div>

                {/* Right 2/5 — Bago Insights */}
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[24px] shadow-sm p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-black text-[#012126] tracking-tight">Earnings Insight</h3>
                            <p className="text-[9px] text-gray-400 font-medium mt-0.5">All-time income</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard?tab=earnings')}
                            className="w-8 h-8 bg-[#5845D8]/8 rounded-xl flex items-center justify-center hover:bg-[#5845D8]/15 transition-all"
                        >
                            <ArrowRight size={13} className="text-[#5845D8]" />
                        </button>
                    </div>

                    {/* All-time total */}
                    <div className="bg-[#F5F4FC] rounded-2xl px-4 py-4 mb-4">
                        <p className="text-[8px] font-black text-[#5845D8]/60 uppercase tracking-widest mb-1">Total Earned</p>
                        <p className="text-3xl font-black text-[#012126] tracking-tight leading-none">
                            {sym}{allTimeFormatted}
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium mt-1">All time · {walletCurrency}</p>
                    </div>

                    {/* 7-day sparkline */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">7-Day Trend</p>
                            <p className="text-[9px] font-black text-[#5845D8]">
                                {sym}{chartData.reduce((s, d) => s + d.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} this week
                            </p>
                        </div>
                        <Sparkline data={sparkValues} color="#5845D8" height={52} />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">This Month</p>
                            <p className="text-lg font-black text-[#012126] leading-none">{thisMonth}</p>
                            <p className="text-[8px] text-gray-400 font-medium mt-0.5">shipments</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Completed</p>
                            <p className="text-lg font-black text-[#012126] leading-none">{userStats?.completedBookings ?? 0}</p>
                            <p className="text-[8px] text-gray-400 font-medium mt-0.5">all time</p>
                        </div>
                    </div>

                    {/* KYC nudge inside insights if not verified */}
                    {effectiveKycStatus !== 'approved' && (
                        <button
                            onClick={handleStartKyc}
                            className="mt-4 flex items-center justify-between bg-[#5845D8]/6 border border-[#5845D8]/15 rounded-xl px-4 py-3 hover:bg-[#5845D8]/10 transition-all w-full"
                        >
                            <div className="flex items-center gap-2.5">
                                <Shield size={14} className="text-[#5845D8]" />
                                <span className="text-[9px] font-black text-[#5845D8] uppercase tracking-widest">Complete KYC</span>
                            </div>
                            <ChevronRight size={13} className="text-[#5845D8]/50" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Transaction History ── */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-[#012126] uppercase tracking-tight">Transaction History</h3>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                            {recentTxs.length > 0 ? `${recentTxs.length} recent entries` : 'No transactions yet'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard?tab=earnings')}
                        className="flex items-center gap-1.5 text-[9px] font-black text-[#5845D8] hover:text-[#4838B5] uppercase tracking-widest transition-colors"
                    >
                        View All <ArrowRight size={11} />
                    </button>
                </div>

                {/* Table header */}
                <div className="hidden md:grid grid-cols-4 px-6 py-3 bg-gray-50/60 border-b border-gray-100/80">
                    {['Transaction', 'Date', 'Status', 'Amount'].map((h, i) => (
                        <span key={h} className={`text-[8px] font-black text-gray-400 uppercase tracking-widest ${i === 3 ? 'text-right' : ''}`}>
                            {h}
                        </span>
                    ))}
                </div>

                {recentTxs.length === 0 ? (
                    <div className="py-14 flex flex-col items-center gap-4 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                            <Wallet size={22} className="text-gray-200" />
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No transactions yet</p>
                        <p className="text-[9px] text-gray-300 font-medium max-w-[180px]">
                            Complete a delivery or post a trip to start earning
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentTxs.map((tx, i) => {
                            const isOut = EXPENSE_TYPES.has(tx.type);
                            const txDate = new Date(tx.created_at || tx.createdAt || tx.date);
                            const txStatus = tx.status || 'completed';
                            const meta = transactionMeta(tx);
                            return (
                                <div key={tx.id || i} className="grid grid-cols-1 md:grid-cols-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-all gap-3 md:gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOut ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                                            {isOut
                                                ? <ArrowUpRight size={14} className="text-orange-500" />
                                                : <ArrowDownLeft size={14} className="text-emerald-600" />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-[#012126] tracking-tight block truncate max-w-[130px]">
                                                {transactionTitle(tx, isOut)}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-medium capitalize">{tx.type?.replace(/_/g, ' ')}</span>
                                            {meta && (
                                                <span className="text-[8px] text-[#5845D8] font-bold block truncate max-w-[180px]">
                                                    {meta}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-medium text-gray-400 pl-12 md:pl-0">
                                        {isNaN(txDate) ? '—' : txDate.toLocaleDateString('en-GB', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                        })}
                                    </span>
                                    <span className="hidden md:flex">
                                        <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${
                                            txStatus === 'failed'  ? 'bg-red-50 text-red-500' :
                                            txStatus === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                                     'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {txStatus}
                                        </span>
                                    </span>
                                    <span className={`text-sm font-black tracking-tight md:text-right ${isOut ? 'text-orange-500' : 'text-emerald-600'}`}>
                                        {isOut ? '−' : '+'}{sym}{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── KYC Banner ── */}
            {effectiveKycStatus !== 'approved' && (
                <div className="bg-gradient-to-r from-[#5845D8] to-[#7B6BE8] rounded-[24px] p-5 flex items-center justify-between shadow-lg shadow-[#5845D8]/20">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                            <Shield size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-black text-sm uppercase tracking-tight">Verify Your Identity</p>
                            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                Complete KYC to post trips and earn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleStartKyc}
                        className="bg-white text-[#5845D8] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all shrink-0"
                    >
                        Verify Now
                    </button>
                </div>
            )}
        </div>
    );
}
