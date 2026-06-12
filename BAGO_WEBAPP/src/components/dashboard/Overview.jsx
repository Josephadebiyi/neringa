import React, { useState, useEffect } from 'react';
import {
    Shield, Plane, Package, Clock, Wallet,
    ArrowUpRight, ArrowDownLeft, Users, TrendingUp, Star,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R' };
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function BarChart({ data, activeIndex, accentColor = '#5845D8' }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const hasData = data.some(d => d.value > 0);
    return (
        <div className="flex items-end gap-1.5 h-28 w-full">
            {data.map((d, i) => {
                const pct = Math.max((d.value / max) * 100, hasData ? 3 : 30);
                const isToday = i === activeIndex;
                const hasValue = d.value > 0;
                return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                            className={`w-full rounded-lg transition-all duration-700 ${
                                isToday && hasValue
                                    ? 'shadow-lg'
                                    : hasValue
                                    ? 'opacity-60'
                                    : 'opacity-20'
                            }`}
                            style={{
                                height: `${pct}%`,
                                backgroundColor: isToday && hasValue ? accentColor : hasValue ? '#012126' : '#9CA3AF',
                                boxShadow: isToday && hasValue ? `0 4px 14px ${accentColor}40` : 'none',
                            }}
                        />
                        <span className={`text-[7px] font-black uppercase tracking-wider ${isToday ? 'text-[#5845D8]' : 'text-[#012126]/50'}`}>
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Overview({ user, kycStatus, handleStartKyc, userStats }) {
    const navigate = useNavigate();
    const [walletData, setWalletData] = useState({
        balance: user?.walletBalance ?? user?.balance ?? 0,
        escrow: user?.escrowBalance ?? user?.escrow_balance ?? 0,
        history: [],
    });
    const [chartTab, setChartTab] = useState('earned');
    const [loadingWallet, setLoadingWallet] = useState(false);

    const effectiveKycStatus =
        user?.kycStatus === 'approved' || user?.isKycCompleted ? 'approved' : kycStatus;

    const walletCurrency = (user?.walletCurrency || user?.preferredCurrency || 'USD').toUpperCase();
    const sym = CURRENCY_SYMBOLS[walletCurrency] || walletCurrency;

    useEffect(() => {
        let mounted = true;
        setLoadingWallet(true);
        api.get('/api/bago/getWallet')
            .then(res => {
                if (!mounted) return;
                const d = res.data?.data || res.data || {};
                setWalletData({
                    balance: Number(d.balance ?? d.walletBalance ?? user?.walletBalance ?? 0),
                    escrow: Number(d.escrowBalance ?? d.escrow_balance ?? user?.escrowBalance ?? 0),
                    history: d.history || d.transactions || [],
                });
            })
            .catch(() => {})
            .finally(() => { if (mounted) setLoadingWallet(false); });
        return () => { mounted = false; };
    }, []);

    // Build weekly chart data
    const todayDow = new Date().getDay();
    const chartData = (() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const dow = (todayDow - 6 + i + 7) % 7;
            return { label: DAY_LABELS[dow], value: 0, dow };
        });
        walletData.history.forEach(tx => {
            const dow = new Date(tx.date || tx.createdAt || tx.created_at).getDay();
            const slot = days.find(d => d.dow === dow);
            if (!slot || isNaN(dow)) return;
            if (chartTab === 'earned' && tx.type !== 'withdraw') slot.value += Number(tx.amount || 0);
            if (chartTab === 'spent' && tx.type === 'withdraw') slot.value += Number(tx.amount || 0);
        });
        return days;
    })();

    const earnedTotal = walletData.history
        .filter(t => t.type !== 'withdraw')
        .reduce((s, t) => s + Number(t.amount || 0), 0);
    const spentTotal = walletData.history
        .filter(t => t.type === 'withdraw')
        .reduce((s, t) => s + Number(t.amount || 0), 0);
    const displayAmount = chartTab === 'earned' ? earnedTotal : spentTotal;

    const recentTxs = [...walletData.history].reverse().slice(0, 6);

    const stats = [
        {
            label: 'Packages Sent',
            value: userStats?.completedBookings ?? '—',
            icon: Package,
            activeBg: 'bg-[#5845D8]',
            activeText: 'text-white',
            iconBg: 'bg-white/20',
            dark: true,
        },
        {
            label: 'In Delivery',
            value: userStats?.activePackages ?? '—',
            icon: Clock,
            activeBg: 'bg-white',
            activeText: 'text-[#012126]',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            dark: false,
        },
        {
            label: 'Community',
            value: userStats?.totalUsers ? `${Number(userStats.totalUsers).toLocaleString()}+` : '—',
            icon: Users,
            activeBg: 'bg-white',
            activeText: 'text-[#012126]',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
            dark: false,
        },
        {
            label: 'Rating',
            value: '5.0',
            icon: Star,
            activeBg: 'bg-white',
            activeText: 'text-[#012126]',
            iconBg: 'bg-[#5845D8]/8',
            iconColor: 'text-[#5845D8]',
            dark: false,
        },
    ];

    return (
        <div className="space-y-5 animate-in fade-in duration-400">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className={`${s.activeBg} p-5 rounded-[20px] flex items-center gap-4 shadow-sm border border-gray-100/60 hover:shadow-md transition-all`}
                    >
                        <div className={`w-11 h-11 rounded-2xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                            <s.icon size={19} className={s.dark ? 'text-white/80' : (s.iconColor || 'text-[#5845D8]')} />
                        </div>
                        <div>
                            <p className={`text-2xl font-black tracking-tight leading-none mb-0.5 ${s.activeText}`}>
                                {s.value}
                            </p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest opacity-60 ${s.activeText}`}>
                                {s.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Row: Cards (left) + Chart (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Left 3/5 */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Promo banner */}
                    <div className="bg-[#012126] rounded-[24px] p-6 relative overflow-hidden min-h-[120px]">
                        <div className="absolute top-0 right-0 w-56 h-56 bg-[#5845D8]/20 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/3 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
                        <div className="relative z-10 flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-block bg-[#5845D8]/20 text-[#9B8EF5] text-[8px] font-black uppercase tracking-[2px] px-3 py-1 rounded-full mb-3">
                                    Bago Network
                                </span>
                                <h3 className="text-white text-xl font-black leading-snug mb-4">
                                    Send packages.<br />Earn on every trip.
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    <Link
                                        to="/post-trip"
                                        className="inline-flex items-center gap-1.5 bg-[#5845D8] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all shadow-lg shadow-[#5845D8]/20"
                                    >
                                        <Plane size={12} /> Post a Trip
                                    </Link>
                                    <Link
                                        to="/search"
                                        className="inline-flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/70 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/12 transition-all"
                                    >
                                        <Package size={12} /> Send Package
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden sm:flex w-20 h-20 rounded-2xl bg-[#5845D8]/15 border border-[#5845D8]/20 items-center justify-center shrink-0">
                                <Package size={36} className="text-[#5845D8]/50" />
                            </div>
                        </div>
                    </div>

                    {/* Balance card */}
                    <div className="rounded-[24px] relative overflow-hidden shadow-xl border border-white/5">
                        <img src="/wallet_background.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 bg-[#012126]/50 pointer-events-none" />
                        <div className="absolute top-0 left-0 w-48 h-48 bg-[#5845D8]/15 rounded-full blur-[60px] -ml-20 -mt-20 pointer-events-none" />
                        <div className="relative z-10 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] text-white/30 font-black uppercase tracking-[2px]">Your Balance</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Live</span>
                                </div>
                            </div>
                            <div className="mb-5">
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-[#5845D8] text-2xl font-black">{sym}</span>
                                    <span className="text-4xl font-black text-white tracking-tighter leading-none">
                                        {loadingWallet
                                            ? <span className="opacity-30 animate-pulse">—</span>
                                            : walletData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {walletData.escrow > 0 && (
                                    <p className="text-[9px] text-amber-400/60 font-bold uppercase tracking-widest">
                                        + {sym}{walletData.escrow.toFixed(2)} held in escrow
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Link
                                    to="/post-trip"
                                    className="flex flex-col items-center gap-1.5 bg-[#5845D8] py-3 rounded-xl hover:bg-[#4838B5] transition-all shadow-lg shadow-[#5845D8]/20"
                                >
                                    <Plane size={16} className="text-white" />
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Post Trip</span>
                                </Link>
                                <Link
                                    to="/search"
                                    className="flex flex-col items-center gap-1.5 bg-white/[0.06] border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    <Package size={16} className="text-white/60" />
                                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Send</span>
                                </Link>
                                <button
                                    onClick={() => navigate('/dashboard?tab=earnings')}
                                    className="flex flex-col items-center gap-1.5 bg-white/[0.06] border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all"
                                >
                                    <Wallet size={16} className="text-white/60" />
                                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Withdraw</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right 2/5 - Chart */}
                <div className="lg:col-span-2 rounded-[24px] border border-gray-100 shadow-sm flex flex-col relative overflow-hidden">
                    <img src="/withdraw_background.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                    <div className="relative z-10 p-6 flex flex-col flex-1">
                        {/* Tabs */}
                        <div className="flex bg-black/10 rounded-xl p-1 mb-5">
                            {['earned', 'spent'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setChartTab(tab)}
                                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                        chartTab === tab
                                            ? 'bg-[#5845D8] text-white shadow-md shadow-[#5845D8]/15'
                                            : 'text-[#012126]/50 hover:text-[#012126]/80'
                                    }`}
                                >
                                    {tab === 'earned' ? 'Received' : 'Expenses'}
                                </button>
                            ))}
                        </div>

                        {/* Amount */}
                        <div className="mb-1">
                            <p className="text-[8px] text-[#012126]/50 font-bold uppercase tracking-widest mb-1">All Time</p>
                            <p className="text-3xl font-black text-[#012126] tracking-tighter">
                                {sym}{displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[9px] text-[#012126]/45 font-medium mt-0.5">
                                {chartTab === 'earned' ? 'Total income received' : 'Total amount withdrawn'}
                            </p>
                        </div>

                        {/* Bar chart – weekly activity */}
                        <div className="flex-1 flex flex-col justify-end pt-4">
                            <BarChart data={chartData} activeIndex={6} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Transaction History ── */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#012126] uppercase tracking-tight">Transaction History</h3>
                    <button
                        onClick={() => navigate('/dashboard?tab=earnings')}
                        className="flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-[#5845D8] uppercase tracking-widest transition-colors"
                    >
                        Recent <TrendingUp size={12} />
                    </button>
                </div>

                {/* Column headers */}
                <div className="hidden md:grid grid-cols-4 px-6 py-2.5 bg-gray-50/50 border-b border-gray-50/80">
                    {['Transaction Name', 'Detail Date', 'Status', 'Amount'].map(h => (
                        <span key={h} className={`text-[8px] font-black text-gray-400 uppercase tracking-widest ${h === 'Amount' ? 'text-right' : ''}`}>
                            {h}
                        </span>
                    ))}
                </div>

                {recentTxs.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                            <Wallet size={24} className="text-gray-200" />
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No transactions yet</p>
                        <p className="text-[9px] text-gray-300 font-medium max-w-[200px]">
                            Complete a delivery or post a trip to start earning
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentTxs.map((tx, i) => {
                            const isWithdraw = tx.type === 'withdraw';
                            return (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-4 items-center px-6 py-4 hover:bg-gray-50/40 transition-all gap-3 md:gap-0">
                                    {/* Name */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isWithdraw ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                                            {isWithdraw
                                                ? <ArrowUpRight size={15} className="text-orange-500" />
                                                : <ArrowDownLeft size={15} className="text-emerald-600" />}
                                        </div>
                                        <span className="text-[10px] font-black text-[#012126] uppercase tracking-tight truncate max-w-[140px]">
                                            {tx.description || (isWithdraw ? 'Payout' : 'Delivery Earnings')}
                                        </span>
                                    </div>
                                    {/* Date */}
                                    <span className="text-[9px] font-medium text-gray-400 pl-12 md:pl-0">
                                        {new Date(tx.date || tx.createdAt || tx.created_at).toLocaleDateString('en-GB', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                    {/* Status */}
                                    <span className="hidden md:flex">
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full">
                                            Success
                                        </span>
                                    </span>
                                    {/* Amount */}
                                    <span className={`text-sm font-black tracking-tight md:text-right ${isWithdraw ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {isWithdraw ? '-' : '+'}{sym}{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── KYC Banner ── */}
            {effectiveKycStatus !== 'approved' && (
                <div className="rounded-[24px] relative overflow-hidden">
                    <img src="/escrow_background.png" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-white/15 pointer-events-none" />
                    <div className="relative z-10 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-[#012126]/10 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                                <Shield size={22} className="text-[#012126]/60" />
                            </div>
                            <div>
                                <p className="text-[#012126] font-black text-sm uppercase tracking-tight">Verify Your Identity</p>
                                <p className="text-[#012126]/50 text-[9px] font-bold uppercase tracking-widest">
                                    Complete KYC to post trips and earn
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleStartKyc}
                            className="bg-[#5845D8] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4838B5] hover:shadow-lg active:scale-95 transition-all shrink-0"
                        >
                            Verify Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
