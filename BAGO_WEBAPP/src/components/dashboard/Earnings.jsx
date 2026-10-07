import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw,
    CheckCircle, AlertCircle, TrendingUp, Lock, AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { cacheWallet, getCachedWallet, getUserPayoutCurrency } from '../../utils/userCurrency';
import { convertWallet } from '../../utils/currencyConversion';

const CURRENCY_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', NGN:'₦', GHS:'₵', KES:'KSh', ZAR:'R' };
// Approximate exchange rates vs USD for minimum calculation
const FX = { USD:1, EUR:0.91, GBP:0.78, NGN:1550, GHS:15, KES:129, ZAR:18.5 };
const MIN_USD = 2;

function getMinimum(currency) {
    const rate = FX[currency.toUpperCase()] || 1;
    return Math.ceil(MIN_USD * rate * 100) / 100;
}

function getSymbol(currency) {
    return CURRENCY_SYMBOLS[currency] || currency + ' ';
}

function moneyMovementErrorMessage(error, fallback = 'Request failed. Please try again.') {
    const data = error?.response?.data;
    const raw = data?.message || data?.error || error?.message || fallback;
    const value = String(raw || '').toLowerCase();
    if (
        data?.code === 'EXCHANGE_RATE_EXPIRED' ||
        data?.code === 'EXCHANGE_RATE_MISSING' ||
        value.includes('exchange rates are stale') ||
        value.includes('exchange rates are not available') ||
        value.includes('exchange rate refresh failed') ||
        value.includes('exchange rate missing')
    ) {
        return 'Currency rates are refreshing. Please try again in a few minutes.';
    }
    return raw;
}

function transactionTitle(tx, isOut) {
    if (tx.type === 'withdrawal') return 'Withdrawal Request';
    if (tx.description) return tx.description;
    if (tx.tracking_number) return `Shipment ${tx.tracking_number}`;
    if (tx.trip_number) return `Trip #${tx.trip_number}`;
    return isOut ? 'Payout' : 'Earnings';
}

function formatTxStatus(status) {
    switch ((status || '').toLowerCase()) {
        case 'completed':             return 'Completed';
        case 'pending':               return 'Pending';
        case 'pending_admin_approval':
        case 'pending_admin_review':  return 'Under Review';
        case 'processing':            return 'Processing';
        case 'failed':                return 'Failed';
        case 'rejected':              return 'Rejected';
        case 'cancelled':
        case 'canceled':              return 'Cancelled';
        default: return (status || '').replace(/_/g, ' ');
    }
}

function formatTxType(type) {
    switch ((type || '').toLowerCase()) {
        case 'withdrawal':     return 'Withdrawal';
        case 'earning':        return 'Earning';
        case 'escrow_hold':    return 'Escrow Hold';
        case 'escrow_release': return 'Escrow Release';
        case 'refund':         return 'Refund';
        default: return (type || '').replace(/_/g, ' ');
    }
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
        const tab = tx.type === 'earning' ? 'deliveries' : 'shipments';
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

export default function Earnings({ user, checkAuthStatus }) {
    const { currency, t } = useLanguage();
    const navigate = useNavigate();

    const cachedWallet = getCachedWallet(user);
    const [balance, setBalance]         = useState(() => cachedWallet?.balance ?? null);
    const [escrow, setEscrow]           = useState(() => cachedWallet?.escrow ?? 0);
    const [history, setHistory]         = useState(() => cachedWallet?.history || []);
    const [allTimeTotals, setTotals]    = useState({ received: 0, expenses: 0 });
    const [walletApiCurrency, setWalletApiCurrency] = useState(null);
    const [loadingWallet, setLoading]   = useState(false);

    const [amount, setAmount]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus]         = useState({ type: '', msg: '' });
    const [chartMode, setChartMode]   = useState('received');
    const [showModal, setShowModal]   = useState(false);
    const [otpCode, setOtpCode]       = useState('');
    const [otpDestination, setOtpDestination] = useState('');

    const walletCurrency = getUserPayoutCurrency(user, currency || walletApiCurrency || 'USD');
    const sym             = getSymbol(walletCurrency);
    const minimum         = getMinimum(walletCurrency);

    // Bank transfer is the active payout method.
    const hasBankLinked   = !!user?.bankAccountLinked || !!user?.bankDetails?.accountNumber;
    const hasPayoutMethod = hasBankLinked;

    useEffect(() => {
        let alive = true;
        setLoading(true);
        api.get('/api/bago/getWallet').then(async res => {
            if (!alive) return;
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
                escrow: firstNumber(d.escrowBalance, d.escrow_balance, root.escrowBalance, root.escrow_balance),
                history: Array.isArray(d.history) ? d.history : (Array.isArray(d.transactions) ? d.transactions : []),
                allTimeReceived: firstNumber(d.allTimeReceived, root.allTimeReceived),
                allTimeExpenses: firstNumber(d.allTimeExpenses, root.allTimeExpenses),
                currency: d.currency || root.currency || walletCurrency,
            };
            const confirmedWallet = await convertWallet(rawWallet, walletCurrency);
            if (!alive) return;
            setBalance(confirmedWallet.balance);
            setEscrow(confirmedWallet.escrow);
            setHistory(confirmedWallet.history);
            cacheWallet(user, confirmedWallet);
            setTotals({
                received: confirmedWallet.allTimeReceived,
                expenses: confirmedWallet.allTimeExpenses,
            });
            setWalletApiCurrency(confirmedWallet.currency);
        }).catch(() => {
            // Keep the earnings page usable if wallet history is temporarily unavailable.
        }).finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    const incomeTypes  = new Set(['earning','signup_bonus','admin_settlement','credit','release','deposit','escrow_release']);
    const expenseTypes = new Set(['withdrawal','withdraw','payout']);

    const transactions = useMemo(() => {
        return history.map(tx => ({
            ...tx,
            amount: Math.abs(Number(tx.amount || 0)),
            type: (tx.type || '').toLowerCase(),
            status: (tx.status || 'completed').toLowerCase(),
            date: new Date(tx.created_at || tx.createdAt || tx.date || Date.now()),
        })).filter(tx => tx.amount > 0 && !isNaN(tx.date));
    }, [history]);

    const totalReceived = allTimeTotals.received || transactions.filter(t => incomeTypes.has(t.type)).reduce((s,t)=>s+t.amount,0);
    const totalExpenses = allTimeTotals.expenses || transactions.filter(t => expenseTypes.has(t.type)).reduce((s,t)=>s+t.amount,0);
    const activeTotal   = chartMode === 'received' ? totalReceived : totalExpenses;

    const chartDays = useMemo(() => {
        const today = new Date();
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today); d.setDate(today.getDate() - (6-i)); d.setHours(0,0,0,0);
            return { key: d.toISOString().slice(0,10), label: d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,2).toUpperCase(), value: 0 };
        });
        const lookup = new Map(days.map(d=>[d.key,d]));
        transactions.forEach(tx => {
            const key = tx.date.toISOString().slice(0,10);
            const day = lookup.get(key); if (!day) return;
            const isIncome  = incomeTypes.has(tx.type);
            const isExpense = expenseTypes.has(tx.type);
            if (chartMode === 'received' && isIncome)  day.value += tx.amount;
            if (chartMode === 'expenses' && isExpense) day.value += tx.amount;
        });
        return days;
    }, [transactions, chartMode]);
    const maxChart = Math.max(...chartDays.map(d=>d.value), 1);

    const amountNum = Number(amount) || 0;
    const belowMin   = amountNum > 0 && amountNum < minimum;
    const aboveBal   = balance !== null && amountNum > balance;
    const canSubmit  = balance !== null && hasPayoutMethod && !submitting && amountNum >= minimum && !aboveBal;

    const handleWithdraw = async (e) => {
        e?.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setStatus({ type:'', msg:'' });
        try {
            const otpRes = await api.post('/api/bago/withdrawal/request-otp', {});
            setOtpDestination(otpRes.data?.destination || 'your email');
            setOtpCode('');
            setShowModal(true);
        } catch (err) {
            setStatus({ type:'error', msg: moneyMovementErrorMessage(err, 'Could not send withdrawal code. Please try again.') });
        } finally { setSubmitting(false); }
    };

    const handleConfirmWithdrawalOtp = async (e) => {
        e?.preventDefault();
        const otp = otpCode.trim();
        if (!/^\d{6}$/.test(otp)) {
            setStatus({ type:'error', msg:'Enter the 6-digit withdrawal code.' });
            return;
        }
        setSubmitting(true);
        setStatus({ type:'', msg:'' });
        try {
            // One bank-withdrawal endpoint supports every wallet currency.
            const res = await api.post('/api/payouts/flutterwave/withdraw', {
                amount: amountNum,
                currency: walletCurrency,
                otp,
                description: 'Withdrawal via Bank Transfer',
            });
            if (res.data.success) {
                setStatus({ type:'success', msg:'Withdrawal submitted successfully!' });
                setAmount('');
                setOtpCode('');
                setShowModal(false);
                const nextBalance = firstNumber(res.data?.balance, res.data?.newBalance);
                setBalance(nextBalance || Math.max(0, balance - amountNum));
                if (checkAuthStatus) checkAuthStatus();
            }
        } catch (err) {
            setStatus({ type:'error', msg: moneyMovementErrorMessage(err, 'Withdrawal failed. Please try again.') });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6 font-sans animate-in fade-in duration-500">

            {/* ── Balance cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-[24px] border border-[#ECEBF3] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-[#171B22]">Available balance</p>
                        <span className="w-9 h-9 rounded-xl bg-[#5845D8]/8 text-[#5845D8] flex items-center justify-center"><Wallet size={17} /></span>
                    </div>
                    <p className="font-['Manrope'] text-[34px] font-extrabold text-[#171B22] tracking-[-0.03em] leading-none">
                        {balance === null
                            ? <span className="inline-block h-[34px] w-40 rounded-lg bg-[#F3F4F6] animate-pulse align-middle" />
                            : <><span className="text-[0.62em] font-bold text-[#6B7280] mr-1">{sym}</span>{balance.toLocaleString(undefined,{minimumFractionDigits:2})}</>}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-2">Ready to withdraw · {walletCurrency}</p>
                </div>
                <div className="bg-white rounded-[24px] border border-[#ECEBF3] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-[#171B22]">In escrow</p>
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center"><Lock size={16} /></span>
                    </div>
                    <p className="font-['Manrope'] text-[34px] font-extrabold text-[#171B22] tracking-[-0.03em] leading-none">
                        <span className="text-[0.62em] font-bold text-[#6B7280] mr-1">{sym}</span>{escrow.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </p>
                    <p className="mt-2"><span className="text-[11px] font-semibold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full">Released after delivery</span></p>
                </div>
                <div className="bg-[#171B22] rounded-[24px] p-6 text-white flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold">Payout method</p>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${hasPayoutMethod ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                            {hasPayoutMethod ? 'Connected' : 'Not connected'}
                        </span>
                    </div>
                    <p className="font-['Manrope'] text-xl font-extrabold">Bank transfer</p>
                    <p className="text-xs text-white/55 mt-1">{walletCurrency} · {hasPayoutMethod ? 'Funds sent after approval' : 'Link a bank account to withdraw'}</p>
                    <button
                        onClick={() => navigate('/dashboard?tab=settings')}
                        className="mt-auto self-start h-10 px-5 rounded-full bg-white text-[#171B22] text-[13px] font-semibold hover:bg-white/90 transition-colors"
                    >
                        {hasPayoutMethod ? 'Manage method' : 'Set up payout'}
                    </button>
                </div>
            </div>

            {/* ── Main Grid: Chart + Withdraw ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Earnings Chart (left 2/3) */}
                <div className="lg:col-span-2 bg-white rounded-[24px] p-7 border border-[#ECEBF3] shadow-sm">
                    {/* Received / Expenses toggle */}
                    <div className="inline-grid grid-cols-2 bg-[#F3F4F6] rounded-full p-1 mb-6">
                        {[{ id:'received', label:'Received' }, { id:'expenses', label:'Withdrawn' }].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setChartMode(tab.id)}
                                className={`h-10 px-6 rounded-full text-[13px] font-semibold transition-all ${chartMode===tab.id ? 'bg-[#5845D8] text-white shadow-[0_6px_16px_rgba(88,69,216,0.35)]' : 'text-[#6B7280] hover:text-[#171B22]'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={13} className="text-[#5845D8]" />
                        <span className="text-[13px] font-semibold text-[#171B22]/40 ">All time</span>
                    </div>
                    <p className="font-['Manrope'] text-[40px] font-extrabold text-[#171B22] tracking-[-0.03em] leading-none mb-1">
                        {sym}{activeTotal.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </p>
                    <p className="text-[13px] text-[#171B22]/40 font-bold mb-6">
                        {chartMode==='received' ? 'Total income received' : 'Total withdrawn from wallet'}
                    </p>

                    {/* Bar chart */}
                    <div className="grid grid-cols-7 gap-3 items-end h-64">
                        {chartDays.map((day, i) => (
                            <div key={day.key} className="flex h-full flex-col items-center justify-end gap-2">
                                <div
                                    className="w-full max-w-[34px] rounded-t-[8px] rounded-b-[3px] transition-all duration-500"
                                    title={`${day.label}: ${sym}${day.value.toFixed(2)}`}
                                    style={{
                                        height:`${Math.max(6,(day.value/maxChart)*100)}%`,
                                        background: day.value > 0
                                            ? (i % 2 === 0 || i === chartDays.length - 1
                                                ? 'linear-gradient(180deg, #8B7DFF 0%, #5845D8 100%)'
                                                : 'linear-gradient(180deg, #D9D4FF 0%, #B3A9FF 100%)')
                                            : '#ECEBF7',
                                    }}
                                />
                                <span className="text-[11px] font-medium text-[#9CA3AF]">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Withdraw (right 1/3) */}
                <div className="bg-white rounded-[24px] p-7 border border-[#ECEBF3] shadow-sm flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                            <ArrowUpRight size={16} className="text-orange-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-[#171B22] tracking-tight">Withdraw</h3>
                    </div>

                    {/* No payout method warning */}
                    {!hasPayoutMethod && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[13px] font-semibold text-amber-800 tracking-tight mb-1">No payout method linked</p>
                                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                    Please link a bank account before withdrawing.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard?tab=settings')}
                                    className="mt-2 text-xs font-semibold text-amber-800 underline "
                                >
                                    Set up payout method →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Amount input */}
                    <div className="bg-gray-50 rounded-2xl border border-[#ECEBF3] p-5 text-center">
                        <p className="text-[11px] font-semibold text-[#6B7280] mb-3">Enter amount</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-2xl font-extrabold text-[#5845D8]">{sym}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent text-4xl font-extrabold text-[#171B22] outline-none w-32 text-center placeholder:text-gray-200"
                            />
                        </div>
                    </div>

                    {/* Quick amount buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setAmount(minimum.toFixed(2))}
                            className="bg-white border border-[#ECEBF3] rounded-full py-3 text-xs font-semibold text-[#171B22] hover:border-[#5845D8]/40 transition-all"
                        >
                            Minimum
                        </button>
                        <button
                            onClick={() => balance > 0 && setAmount(balance.toFixed(2))}
                            disabled={balance <= 0}
                            className="bg-white border border-[#ECEBF3] rounded-full py-3 text-xs font-semibold text-[#171B22] hover:border-[#5845D8]/40 transition-all disabled:opacity-30"
                        >
                            Withdraw all
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="bg-[#F7F7FC] rounded-2xl border border-[#ECEBF3] px-5 py-4 space-y-3 text-[13px]">
                        <div className="flex justify-between text-[#171B22]">
                            <span className="text-[#6B7280]">Amount</span>
                            <span className="font-semibold">{sym}{amountNum.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#171B22]">
                            <span className="text-[#6B7280]">Bago fee</span>
                            <span className="font-semibold text-emerald-600">No fee</span>
                        </div>
                        <div className="flex justify-between text-[#171B22]">
                            <span className="text-[#6B7280]">Method</span>
                            <span className="font-semibold flex items-center gap-1.5">
                                <Wallet size={14} className="text-[#5845D8]" />
                                Bank Transfer
                            </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between text-[#171B22]">
                            <span className="text-[#6B7280]">Minimum</span>
                            <span className="font-semibold">{sym}{minimum.toFixed(2)}</span>
                        </div>
                        {(belowMin || aboveBal) && (
                            <p className="text-xs font-semibold text-red-500 tracking-tight">
                                {aboveBal ? 'Amount exceeds your available balance.' : `Minimum withdrawal is ${sym}${minimum.toFixed(2)}.`}
                            </p>
                        )}
                    </div>

                    {/* Payout method display */}
                    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${hasPayoutMethod ? 'bg-white border border-gray-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="w-10 h-7 bg-[#5845D8]/6 rounded-lg flex items-center justify-center shrink-0">
                            <Wallet size={18} className="text-[#5845D8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#171B22] tracking-tight">
                                Bank Transfer ({walletCurrency})
                            </p>
                            <p className="text-[11px] font-bold text-[#6B7280] ">
                                {hasPayoutMethod ? 'Funds sent after approval' : 'Setup required before withdrawing'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard?tab=settings')}
                            className="text-[11px] font-semibold text-[#5845D8] hover:underline shrink-0"
                        >
                            {hasPayoutMethod ? 'Manage' : 'Set up'}
                        </button>
                    </div>

                    {/* Status message */}
                    {status.msg && (
                        <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-semibold border ${
                            status.type==='success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-red-50 text-red-600 border-red-100'
                        } animate-in slide-in-from-bottom duration-300`}>
                            {status.type==='success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                            {status.msg}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        onClick={handleWithdraw}
                        disabled={!canSubmit}
                        className="w-full h-12 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#5845D8', color: '#fff', boxShadow: canSubmit ? '0 8px 24px #5845D830' : 'none' }}
                    >
                        {submitting
                            ? <RefreshCw size={15} className="animate-spin" />
                            : <><Wallet size={15} /> Confirm Withdrawal</>}
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <form
                        onSubmit={handleConfirmWithdrawalOtp}
                        className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5845D8]/10">
                                <Lock size={18} className="text-[#5845D8]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-[#171B22]">
                                    Confirm withdrawal
                                </h3>
                                <p className="text-[13px] font-bold text-[#6B7280]">
                                    Code sent to {otpDestination || 'your email'}
                                </p>
                            </div>
                        </div>
                        <input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            autoFocus
                            placeholder="000000"
                            className="mb-4 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 text-center text-2xl font-extrabold tracking-[0.4em] text-[#171B22] outline-none focus:border-[#5845D8]"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setOtpCode('');
                                }}
                                className="h-12 rounded-full bg-[#F3F4F6] text-[13px] font-semibold text-[#171B22]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || otpCode.length !== 6}
                                className="h-12 rounded-full bg-[#5845D8] text-[13px] font-semibold text-white disabled:opacity-40"
                            >
                                {submitting ? 'Checking...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Transaction History ── */}
            <div className="bg-[#171B22] rounded-[28px] p-4 sm:p-6">
                <div className="px-1 pb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold">
                            {t('transactionHistory') || 'Transaction History'}
                        </h3>
                    </div>
                    <span className="text-xs font-semibold text-white/70 bg-white/[0.07] border border-white/10 px-3 py-1.5 rounded-full">{transactions.length} entries</span>
                </div>

                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-white/[0.06] rounded-full flex items-center justify-center mb-4">
                            <Wallet size={26} className="text-white/40" />
                        </div>
                        <p className="text-white/70 font-semibold text-sm">
                            No transactions recorded yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {transactions.map((tx, i) => {
                            const isOut = expenseTypes.has(tx.type);
                            const meta = transactionMeta(tx);
                            // A withdrawal (or any transaction with no linked
                            // shipment/trip) has nothing to open. "earning"
                            // transactions are a traveler's payout for
                            // carrying someone else's package — that request
                            // only appears in the Deliveries tab (traveler
                            // role), not Shipments (sender role).
                            const openTarget = transactionOpenTarget(tx);
                            const Row = openTarget ? 'button' : 'div';
                            return (
                                <Row
                                    key={tx.id || i}
                                    type={openTarget ? 'button' : undefined}
                                    onClick={openTarget ? () => navigate(openTarget) : undefined}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.04] text-left hover:bg-white/[0.08] transition-all group ${openTarget ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5845D8]' : ''}`}
                                    aria-label={openTarget ? `Open ${transactionTitle(tx, isOut)}` : undefined}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${isOut ? 'bg-orange-400/15 text-orange-300' : 'bg-emerald-400/15 text-emerald-300'}`}>
                                            {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white text-sm mb-0.5">
                                                {transactionTitle(tx, isOut)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-white/55">
                                                    {tx.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                                                </span>
                                                <span className="w-1 h-1 bg-white/25 rounded-full" />
                                                <span className="text-xs text-[#B3A9FF] font-semibold capitalize">{formatTxType(tx.type)}</span>
                                            </div>
                                            {meta && (
                                                <p className="text-xs text-white/45 mt-1 max-w-[260px] truncate">
                                                    {meta}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className="text-[15px] font-semibold text-white tabular-nums">
                                            {isOut ? '−' : '+'}{sym}{tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                        </p>
                                        <p className={`text-[11px] font-semibold mt-0.5 ${
                                            tx.status==='completed' ? 'text-emerald-300'
                                            : tx.status==='failed' || tx.status==='rejected' ? 'text-red-500'
                                            : tx.status==='pending' || tx.status==='pending_admin_approval' || tx.status==='pending_admin_review' ? 'text-amber-500'
                                            : 'text-gray-400'
                                        }`}>{formatTxStatus(tx.status)}</p>
                                    </div>
                                </Row>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
