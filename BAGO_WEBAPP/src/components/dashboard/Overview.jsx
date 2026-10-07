import React, { useState, useEffect, useMemo } from 'react';
import {
    Package, ArrowRight, ArrowUpRight, ArrowDownLeft, ArrowUp, ArrowDown,
    Shield, Plane, Wallet, Search, ChevronDown, CalendarDays, MapPin,
    BarChart3, TrendingUp, Truck, ExternalLink, X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { cacheWallet, getCachedWallet, getUserPayoutCurrency } from '../../utils/userCurrency';
import { convertWallet } from '../../utils/currencyConversion';

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

function transactionOpenTarget(tx) {
    if (tx.request_id) {
        const tab = (tx.type || '').toLowerCase() === 'earning' ? 'deliveries' : 'shipments';
        return `/dashboard?tab=${tab}&requestId=${encodeURIComponent(tx.request_id)}`;
    }
    if (tx.trip_id) {
        return `/dashboard?tab=trips&tripId=${encodeURIComponent(tx.trip_id)}`;
    }
    return null;
}

function firstNumber(...values) {
    for (const value of values) {
        if (value === null || value === undefined || value === '') continue;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}


const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function txDateOf(tx) {
    const d = new Date(tx.created_at || tx.createdAt || tx.date);
    return isNaN(d) ? null : d;
}

/* Vertical bars, brand gradient — the reference's "due within next month" card. */
function BarChart({ data }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const hasData = data.some(d => d.value > 0);
    return (
        <div className="flex items-end gap-2.5 h-[118px] w-full">
            {data.map((d, i) => {
                const pct = hasData ? Math.max((d.value / max) * 100, 6) : 10 + ((i * 37) % 30);
                const strong = i % 2 === 0 || i === data.length - 1;
                return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                        <div
                            className="w-full max-w-[26px] rounded-t-[7px] rounded-b-[3px]"
                            title={`${d.label}: ${d.value}`}
                            style={{
                                height: `${pct}%`,
                                background: hasData
                                    ? strong
                                        ? 'linear-gradient(180deg, #8B7DFF 0%, #5845D8 100%)'
                                        : 'linear-gradient(180deg, #D9D4FF 0%, #B3A9FF 100%)'
                                    : '#ECEBF7',
                            }}
                        />
                        <span className="text-[10px] font-medium text-[#9CA3AF]">{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* Area line with dots — the reference's "average time to get paid" card. */
function LineChart({ data }) {
    const w = 300;
    const h = 110;
    const max = Math.max(...data, 0.01);
    const hasData = data.some(v => v > 0);
    const pts = data.map((v, i) => {
        const x = 8 + (i / Math.max(data.length - 1, 1)) * (w - 16);
        const y = hasData ? h - 12 - (v / max) * (h - 30) : h - 20 - i * 4;
        return [x, y];
    });
    const line = pts.map(p => p.join(',')).join(' ');
    const area = `${line} ${w - 8},${h} 8,${h}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[110px]" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="bagoArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B7DFF" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#8B7DFF" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill="url(#bagoArea)" />
            <polyline points={line} fill="none" stroke={hasData ? '#5845D8' : '#D9D4FF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={hasData ? '#5845D8' : '#D9D4FF'} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            ))}
        </svg>
    );
}

function StatCard({ label, icon: Icon, tone = 'purple', children, className = '', onClick }) {
    const tones = {
        purple: 'text-[#5845D8] bg-[#5845D8]/8',
        red: 'text-[#EF4444] bg-red-50',
        teal: 'text-[#0EA5E9] bg-sky-50',
        green: 'text-[#16A34A] bg-emerald-50',
    };
    return (
        <div
            onClick={onClick}
            className={`relative bg-white rounded-[24px] border border-[#ECEBF3] shadow-[0_1px_2px_rgba(23,27,34,0.04)] p-6 flex flex-col overflow-hidden ${onClick ? 'cursor-pointer hover:border-[#5845D8]/30 transition-colors' : ''} ${className}`}
        >
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#171B22]">{label}</p>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
                    <Icon size={17} />
                </span>
            </div>
            {children}
        </div>
    );
}

function Delta({ value, suffix }) {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
        <p className="flex items-center gap-1 text-xs text-[#6B7280] mt-2">
            {up ? <ArrowUp size={13} className="text-[#5845D8]" /> : <ArrowDown size={13} className="text-[#EF4444]" />}
            <span className={`font-semibold ${up ? 'text-[#5845D8]' : 'text-[#EF4444]'}`}>{Math.abs(value)}</span>
            {suffix}
        </p>
    );
}

function Amount({ sym, value, size = 'text-[34px]' }) {
    return (
        <p className={`font-['Manrope'] ${size} font-extrabold text-[#171B22] tracking-[-0.03em] leading-none`}>
            <span className="text-[0.62em] font-bold text-[#6B7280] mr-1">{sym}</span>
            {value}
        </p>
    );
}

function FilterSelect({ value, onChange, options, label, icon: Icon = ChevronDown }) {
    return (
        <label className="relative flex-1 min-w-[150px]">
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none h-12 rounded-full bg-white border border-[#ECEBF3] pl-5 pr-11 text-[13px] font-medium text-[#171B22] outline-none focus:border-[#5845D8]/50 cursor-pointer"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Icon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </label>
    );
}

function StatusPill({ status, onDark = false, selected = false }) {
    const s = (status || 'completed').toLowerCase();
    if (onDark) {
        return (
            <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap ${selected ? 'bg-white text-[#171B22]' : 'bg-white/[0.07] text-white/70 border border-white/10'}`}>
                {s}
            </span>
        );
    }
    const tone = s === 'failed' ? 'bg-red-400/20 text-red-100' : s === 'pending' ? 'bg-amber-300/20 text-amber-100' : 'bg-white/15 text-white';
    return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${tone}`}>{s}</span>;
}

export default function Overview({ user, kycStatus, handleStartKyc, userStats }) {
    const navigate = useNavigate();

    const profileCurrency = getUserPayoutCurrency(user);
    const cachedWallet = getCachedWallet(user);

    const [walletData, setWalletData] = useState({
        balance: cachedWallet?.balance ?? null,
        escrow: cachedWallet?.escrow ?? 0,
        history: cachedWallet?.history || [],
        allTimeReceived: 0,
        currency: profileCurrency,
    });
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [chartTab, setChartTab] = useState('earnings');

    const effectiveKycStatus =
        user?.kycStatus === 'approved' || user?.isKycCompleted ? 'approved' : kycStatus;

    const walletCurrency = profileCurrency;
    const sym = CURRENCY_SYMBOLS[walletCurrency] || walletCurrency;
    const isBusinessAccount = user?.accountType === 'company' || user?.account_type === 'company';
    const greetingName = isBusinessAccount
        ? (user?.tradingName || user?.companyName || user?.firstName || 'there')
        : (user?.firstName || user?.name?.split(' ')[0] || 'there');

    useEffect(() => {
        let mounted = true;
        setLoadingWallet(true);
        api.get('/api/bago/getWallet')
            .then(async res => {
                if (!mounted) return;
                const d = res.data?.data || res.data || {};
                const root = res.data || {};
                const rawWallet = {
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
                    currency: d.currency || root.currency || profileCurrency,
                };
                const confirmedWallet = await convertWallet(rawWallet, profileCurrency);
                if (!mounted) return;
                setWalletData(confirmedWallet);
                cacheWallet(user, confirmedWallet);
            })
            .catch(() => {
                // Keep the dashboard usable if wallet history is temporarily unavailable.
            })
            .finally(() => { if (mounted) setLoadingWallet(false); });
        return () => { mounted = false; };
    }, [profileCurrency]);

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

    const sparkValues = chartData.map(d => d.value);

    const derivedAllTimeReceived = walletData.history
        .filter(tx => EARNING_TYPES.has((tx.type || '').toLowerCase()) && (tx.status || 'completed').toLowerCase() === 'completed')
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

    const thisMonth = userStats?.thisMonthShipments ?? 0;
    const lastMonth = userStats?.lastMonthShipments ?? 0;
    const monthDelta = thisMonth - lastMonth;

    const allTimeIncome = walletData.allTimeReceived || derivedAllTimeReceived;
    const allTimeFormatted = allTimeIncome.toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    });


    /* ── Transaction panel state ── */
    const [typeTab, setTypeTab] = useState('all'); // all | in | out
    const [statusFilter, setStatusFilter] = useState('all');
    const [rangeFilter, setRangeFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [selectedKey, setSelectedKey] = useState(null);

    const allTxs = walletData.history;
    const inCount = allTxs.filter(tx => !EXPENSE_TYPES.has(tx.type)).length;
    const outCount = allTxs.length - inCount;

    const filteredTxs = useMemo(() => {
        const q = query.trim().toLowerCase();
        const now = Date.now();
        const rangeDays = { '7': 7, '30': 30, '90': 90 }[rangeFilter];
        return allTxs.filter(tx => {
            const isOut = EXPENSE_TYPES.has(tx.type);
            if (typeTab === 'in' && isOut) return false;
            if (typeTab === 'out' && !isOut) return false;
            if (statusFilter !== 'all' && (tx.status || 'completed').toLowerCase() !== statusFilter) return false;
            if (rangeDays) {
                const d = txDateOf(tx);
                if (!d || now - d.getTime() > rangeDays * 86400000) return false;
            }
            if (q) {
                const hay = [transactionTitle(tx, isOut), transactionMeta(tx), tx.type, tx.tracking_number, tx.trip_number]
                    .filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [allTxs, typeTab, statusFilter, rangeFilter, query]);

    const keyOf = (tx, i) => String(tx.id || tx._id || `${tx.created_at || tx.createdAt || ''}-${i}`);
    const selectedIndex = Math.max(0, filteredTxs.findIndex((tx, i) => keyOf(tx, i) === selectedKey));
    const selected = filteredTxs[selectedIndex] || null;
    const activeFilterCount = (statusFilter !== 'all') + (rangeFilter !== 'all') + (query.trim() ? 1 : 0);
    const clearFilters = () => { setStatusFilter('all'); setRangeFilter('all'); setQuery(''); setTypeTab('all'); };

    const weekTotal = chartData.reduce((sum, d) => sum + d.value, 0);
    const balanceText = walletData.balance === null ? null : fmtMoney(walletData.balance);

    return (
        <div className="space-y-6">

            {/* ── KYC prompt ── */}
            {effectiveKycStatus !== 'approved' && (
                <div className="bg-white rounded-[24px] border border-[#5845D8]/15 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="w-12 h-12 rounded-2xl bg-[#5845D8] text-white flex items-center justify-center shrink-0">
                            <Shield size={22} />
                        </span>
                        <div>
                            <p className="font-['Manrope'] font-extrabold text-[#171B22]">Verify your identity</p>
                            <p className="text-sm text-[#6B7280]">Complete KYC to post trips and start earning on Bago.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleStartKyc}
                        className="h-11 px-6 rounded-full bg-[#5845D8] text-white text-sm font-semibold hover:bg-[#4A38C9] transition-colors shrink-0"
                    >
                        Verify now
                    </button>
                </div>
            )}

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {/* Wallet */}
                <StatCard label="Wallet balance" icon={Wallet} onClick={() => navigate('/dashboard?tab=earnings')}>
                    {balanceText === null
                        ? <div className="h-[34px] w-40 rounded-lg bg-[#F3F4F6] animate-pulse" />
                        : <Amount sym={sym} value={balanceText} />}
                    <p className="text-xs text-[#6B7280] mt-2">Available in {walletCurrency}</p>
                    <div className="mt-auto pt-6">
                        <div className="rounded-2xl bg-[#F7F7FC] border border-[#ECEBF3] p-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-[11px] text-[#6B7280] font-medium">In escrow</p>
                                <p className="font-['Manrope'] text-lg font-extrabold text-[#171B22] mt-0.5">{sym}{fmtMoney(walletData.escrow)}</p>
                            </div>
                            <span className="text-[11px] font-semibold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full">After delivery</span>
                        </div>
                    </div>
                </StatCard>

                {/* Shipments this month */}
                <StatCard label="Shipments this month" icon={CalendarDays}>
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <Amount sym="" value={thisMonth} />
                            <Delta value={monthDelta} suffix="from last month" />
                        </div>
                        <div className="flex bg-[#F3F4F6] rounded-full p-1">
                            {[{ id: 'earnings', label: sym }, { id: 'count', label: '#' }].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setChartTab(t.id)}
                                    aria-label={t.id === 'earnings' ? 'Show earnings' : 'Show count'}
                                    className={`w-8 h-7 rounded-full text-[11px] font-bold transition-colors ${chartTab === t.id ? 'bg-[#5845D8] text-white' : 'text-[#6B7280]'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-auto pt-5">
                        <BarChart data={chartData} />
                    </div>
                </StatCard>

                {/* Total earned */}
                <StatCard label="Total earned" icon={TrendingUp} tone="teal" onClick={() => navigate('/dashboard?tab=earnings')}>
                    <Amount sym={sym} value={allTimeFormatted} />
                    <p className="flex items-center gap-1 text-xs text-[#6B7280] mt-2">
                        <ArrowUp size={13} className="text-[#0EA5E9]" />
                        <span className="font-semibold text-[#0EA5E9]">{chartTab === 'earnings' ? sym : ''}{weekTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        {chartTab === 'earnings' ? 'this week' : 'transactions this week'}
                    </p>
                    <div className="mt-auto pt-4 -mx-2">
                        <LineChart data={sparkValues} />
                    </div>
                </StatCard>

                {/* Deliveries + quick actions */}
                <StatCard label="Active deliveries" icon={Truck} tone="green" className="!pb-0">
                    <div className="flex items-center gap-3">
                        <Amount sym="" value={userStats?.activePackages ?? 0} />
                        <span className="text-[11px] font-semibold text-[#171B22] border border-[#ECEBF3] px-3 py-1.5 rounded-full">
                            {userStats?.completedBookings ?? 0} completed
                        </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-2">In transit right now</p>
                    <div className="relative mt-auto pt-5 grid grid-cols-3 gap-2 -mx-1">
                        <Link to="/post-trip" className="h-[96px] rounded-t-2xl bg-[#F3F4F6] p-3 flex flex-col gap-1.5 hover:bg-[#ECEBF7] transition-colors">
                            <Plane size={16} className="text-[#171B22]" />
                            <span className="text-[11px] font-semibold text-[#6B7280]">Post trip</span>
                        </Link>
                        <Link to="/search" className="h-[110px] -mt-[14px] rounded-t-2xl bg-gradient-to-b from-[#8B7DFF] to-[#5845D8] p-3 flex flex-col gap-1.5 shadow-[0_-6px_20px_rgba(88,69,216,0.25)]">
                            <Package size={16} className="text-white" />
                            <span className="text-[11px] font-semibold text-white">Send package</span>
                        </Link>
                        <Link to="/track" className="h-[96px] rounded-t-2xl bg-[#F3F4F6] p-3 flex flex-col gap-1.5 hover:bg-[#ECEBF7] transition-colors">
                            <MapPin size={16} className="text-[#171B22]" />
                            <span className="text-[11px] font-semibold text-[#6B7280]">Track</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard?tab=deliveries')}
                            className="absolute right-1 bottom-2 h-9 px-4 rounded-full bg-[#171B22] text-white text-xs font-semibold shadow-lg hover:bg-black transition-colors"
                        >
                            View all
                        </button>
                    </div>
                </StatCard>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center gap-2.5 shrink-0 pr-2">
                    <span className="text-sm font-semibold text-[#171B22]">Active filters</span>
                    <span className="w-6 h-6 rounded-full bg-[#171B22] text-white text-[11px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                    {activeFilterCount > 0 && (
                        <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#5845D8] hover:underline">
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex flex-1 flex-wrap gap-3">
                    <FilterSelect
                        label="Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: 'all', label: 'All statuses' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'failed', label: 'Failed' },
                        ]}
                    />
                    <FilterSelect
                        label="Date range"
                        value={rangeFilter}
                        onChange={setRangeFilter}
                        icon={CalendarDays}
                        options={[
                            { value: 'all', label: 'All time' },
                            { value: '7', label: 'Last 7 days' },
                            { value: '30', label: 'Last 30 days' },
                            { value: '90', label: 'Last 90 days' },
                        ]}
                    />
                    <label className="relative flex-[1.4] min-w-[200px]">
                        <span className="sr-only">Search transactions</span>
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search trip, tracking or route"
                            className="w-full h-12 rounded-full bg-white border border-[#ECEBF3] pl-5 pr-11 text-[13px] font-medium text-[#171B22] placeholder:text-[#9CA3AF] outline-none focus:border-[#5845D8]/50"
                        />
                        <Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#171B22] pointer-events-none" />
                    </label>
                </div>
            </div>

            {/* ── Activity panel ── */}
            <div className="relative bg-[#171B22] rounded-[28px] p-4 sm:p-6">
                {/* Segmented tabs sit in a notch cut into the panel (from md up) */}
                <div className="mb-4 md:mb-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:-top-px md:bg-[#F7F7FC] md:rounded-b-[26px] md:px-3 md:pb-3 max-w-full">
                    <div className="flex items-center gap-1 bg-white rounded-full p-1.5 border border-[#ECEBF3] shadow-sm overflow-x-auto">
                        {[
                            { id: 'all', label: 'All', count: null },
                            { id: 'in', label: 'Money in', count: inCount },
                            { id: 'out', label: 'Money out', count: outCount },
                        ].map(t => {
                            const active = typeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTypeTab(t.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${active ? 'bg-[#5845D8] text-white' : 'text-[#171B22] hover:bg-[#F3F4F6]'}`}
                                >
                                    {t.label}
                                    {t.count !== null && (
                                        <span className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${active ? 'bg-white text-[#5845D8]' : 'bg-[#F3F4F6] text-[#171B22]'}`}>
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-5 md:min-h-[44px]">
                    <h3 className="text-white font-semibold">Recent activity</h3>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard?tab=earnings')}
                            aria-label="Open wallet"
                            title="Open wallet"
                            className="w-10 h-10 rounded-full border border-white/15 text-white/80 flex items-center justify-center hover:bg-white/10"
                        >
                            <Wallet size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard?tab=shipments')}
                            aria-label="Open shipments"
                            title="Open shipments"
                            className="w-10 h-10 rounded-full border border-white/15 text-white/80 flex items-center justify-center hover:bg-white/10"
                        >
                            <BarChart3 size={16} />
                        </button>
                    </div>
                </div>

                {allTxs.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-center">
                        <span className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
                            <Wallet size={22} className="text-white/50" />
                        </span>
                        <p className="text-white font-semibold">{loadingWallet ? 'Loading your activity…' : 'No transactions yet'}</p>
                        {!loadingWallet && (
                            <>
                                <p className="text-sm text-white/50 mt-1 max-w-xs">Post a trip or send a package to get started.</p>
                                <div className="flex gap-3 mt-6">
                                    <Link to="/post-trip" className="h-11 px-5 rounded-full bg-[#5845D8] text-white text-sm font-semibold flex items-center gap-2">
                                        <Plane size={15} /> Post a trip
                                    </Link>
                                    <Link to="/search" className="h-11 px-5 rounded-full bg-white text-[#171B22] text-sm font-semibold flex items-center gap-2">
                                        <Package size={15} /> Send a package
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                ) : filteredTxs.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-center">
                        <p className="text-white font-semibold">No activity matches these filters</p>
                        <button type="button" onClick={clearFilters} className="mt-4 h-10 px-5 rounded-full bg-white text-[#171B22] text-sm font-semibold flex items-center gap-2">
                            <X size={14} /> Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5">
                        {/* List */}
                        <div className="space-y-2.5 lg:max-h-[440px] lg:overflow-y-auto lg:pr-1">
                            {filteredTxs.slice(0, 30).map((tx, i) => {
                                const isOut = EXPENSE_TYPES.has(tx.type);
                                const isSel = i === selectedIndex;
                                const d = txDateOf(tx);
                                return (
                                    <button
                                        key={keyOf(tx, i)}
                                        type="button"
                                        onClick={() => setSelectedKey(keyOf(tx, i))}
                                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-colors ${
                                            isSel
                                                ? 'bg-gradient-to-r from-[#6C5CE7] to-[#5845D8] shadow-[0_10px_24px_rgba(88,69,216,0.35)]'
                                                : 'bg-white/[0.04] hover:bg-white/[0.08]'
                                        }`}
                                    >
                                        <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isSel ? 'bg-white/20' : isOut ? 'bg-orange-400/15' : 'bg-emerald-400/15'}`}>
                                            {isOut
                                                ? <ArrowUpRight size={17} className={isSel ? 'text-white' : 'text-orange-300'} />
                                                : <ArrowDownLeft size={17} className={isSel ? 'text-white' : 'text-emerald-300'} />}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold text-white truncate">{transactionTitle(tx, isOut)}</span>
                                            <span className="block text-xs text-white/55 mt-0.5">
                                                {d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </span>
                                        </span>
                                        <span className="hidden sm:block"><StatusPill status={tx.status} onDark selected={isSel} /></span>
                                        <span className="w-[110px] text-right text-[15px] font-semibold text-white tabular-nums shrink-0">
                                            {isOut ? '−' : '+'}{sym}{fmtMoney(tx.amount)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Detail */}
                        {selected && (() => {
                            const isOut = EXPENSE_TYPES.has(selected.type);
                            const d = txDateOf(selected);
                            const route = [selected.trip_from_location, selected.trip_to_location].filter(Boolean).join(' → ');
                            const openTarget = transactionOpenTarget(selected);
                            const tiles = [
                                { label: 'Amount', value: `${isOut ? '−' : '+'}${sym}${fmtMoney(selected.amount)}` },
                                selected.trip_number && { label: 'Trip', value: `#${selected.trip_number}` },
                                selected.tracking_number && { label: 'Tracking', value: selected.tracking_number },
                                route && { label: 'Route', value: route },
                            ].filter(Boolean).slice(0, 3);
                            return (
                                <div className="rounded-[24px] bg-gradient-to-br from-[#7A6CF0] via-[#5F4FDC] to-[#4C3CC8] p-5 sm:p-6 text-white flex flex-col">
                                    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr] gap-5">
                                        <div className="min-w-0">
                                            <p className="text-xs text-white/65">Transaction details</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-1.5">
                                                <p className="font-['Manrope'] text-xl xl:text-[22px] font-extrabold tracking-[-0.02em] leading-tight break-words min-w-0">
                                                    {transactionTitle(selected, isOut)}
                                                </p>
                                                <StatusPill status={selected.status} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/65">Type</p>
                                            <p className="text-base font-semibold mt-1.5 capitalize">{(selected.type || (isOut ? 'withdrawal' : 'earning')).replace(/_/g, ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/65">Date</p>
                                            <p className="text-base font-semibold mt-1.5">
                                                {d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                                        {tiles.map(t => (
                                            <div key={t.label} className="rounded-2xl bg-white/[0.12] border border-white/10 p-4 min-h-[96px] flex flex-col justify-between">
                                                <p className="font-['Manrope'] text-lg font-extrabold tracking-[-0.02em] truncate" title={t.value}>{t.value}</p>
                                                <p className="text-xs text-white/70">{t.label}</p>
                                            </div>
                                        ))}
                                        {openTarget ? (
                                            <button
                                                type="button"
                                                onClick={() => navigate(openTarget)}
                                                className="rounded-2xl border border-dashed border-white/35 p-4 min-h-[96px] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.06] transition-colors"
                                            >
                                                <ExternalLink size={17} />
                                                <span className="text-xs font-semibold">{selected.request_id ? 'Open shipment' : 'Open trip'}</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => navigate('/dashboard?tab=earnings')}
                                                className="rounded-2xl border border-dashed border-white/35 p-4 min-h-[96px] flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.06] transition-colors"
                                            >
                                                <Wallet size={17} />
                                                <span className="text-xs font-semibold">Open wallet</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-white/65">Balance</p>
                                                <p className="font-['Manrope'] text-lg font-extrabold mt-1">{sym}{balanceText ?? '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/65">In escrow</p>
                                                <p className="font-['Manrope'] text-lg font-extrabold mt-1">{sym}{fmtMoney(walletData.escrow)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-white/65">Currency</p>
                                                <p className="font-['Manrope'] text-lg font-extrabold mt-1">{walletCurrency}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => navigate('/dashboard?tab=chats')}
                                                aria-label="Messages"
                                                title="Messages"
                                                className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/dashboard?tab=earnings')}
                                                className="h-11 px-6 rounded-full bg-white text-[#171B22] text-sm font-semibold hover:bg-white/90"
                                            >
                                                Withdraw
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
