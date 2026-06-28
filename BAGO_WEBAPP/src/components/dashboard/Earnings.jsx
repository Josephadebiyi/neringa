import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import {
    Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw,
    CheckCircle, AlertCircle, TrendingUp, Lock, AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Same African currency set as the mobile app
const AFRICAN_CURRENCIES = new Set([
    'AOA','BIF','BWP','CDF','CVE','DJF','DZD','EGP','ERN','ETB',
    'GHS','GMD','GNF','KES','KMF','LRD','LSL','LYD','MAD','MGA',
    'MRU','MUR','MWK','MZN','NAD','NGN','RWF','SCR','SDG','SLE',
    'SOS','SSP','STN','SZL','TZS','UGX','XAF','XOF','ZAR','ZMW','ZWL',
]);

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

function firstNumber(...values) {
    for (const value of values) {
        if (value === null || value === undefined || value === '') continue;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}

function PayPalLogo({ size = 20 }) {
    return <img src="/paypal-symbol.png" alt="PayPal" style={{ height: size, width: 'auto' }} />;
}

function PaystackLogo({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="10" fill="#00C3F7"/>
            <path d="M12 10h10c4.418 0 8 3.134 8 7s-3.582 7-8 7H16v6h-4V10zm4 10h6c2.209 0 4-1.343 4-3s-1.791-3-4-3h-6v6z" fill="white"/>
        </svg>
    );
}

export default function Earnings({ user, checkAuthStatus }) {
    const { currency, t } = useLanguage();
    const navigate = useNavigate();

    const [balance, setBalance]         = useState(0);
    const [escrow, setEscrow]           = useState(0);
    const [history, setHistory]         = useState([]);
    const [allTimeTotals, setTotals]    = useState({ received: 0, expenses: 0 });
    const [walletApiCurrency, setWalletApiCurrency] = useState(null);
    const [loadingWallet, setLoading]   = useState(true);

    const [amount, setAmount]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus]         = useState({ type: '', msg: '' });
    const [chartMode, setChartMode]   = useState('received');
    const [showModal, setShowModal]   = useState(false);
    const [otpCode, setOtpCode]       = useState('');
    const [otpDestination, setOtpDestination] = useState('');

    const walletCurrency = (walletApiCurrency || user?.walletCurrency || user?.preferredCurrency || currency || 'USD').toUpperCase();
    const sym             = getSymbol(walletCurrency);
    const isAfrican       = AFRICAN_CURRENCIES.has(walletCurrency);
    const minimum         = getMinimum(walletCurrency);

    // Payout method detection — mirrors mobile app exactly
    const hasBankLinked   = !!user?.bankAccountLinked || !!user?.bankDetails?.accountNumber;
    const payoutProvider  = (user?.payoutProvider  || '').toLowerCase();
    const payoutMethod    = (user?.payoutMethod    || '').toLowerCase();
    const payoutStatus    = (user?.payoutStatus    || '').toLowerCase();
    const payoutMethodSt  = (user?.payoutMethodStatus || '').toLowerCase();
    const hasPaypalLinked = payoutProvider === 'paypal' || payoutMethod === 'paypal';
    const hasActivePaypal = hasPaypalLinked && (
        payoutStatus === 'active' || payoutMethodSt === 'connected' || payoutMethodSt === 'active'
    );
    const hasPayoutMethod = isAfrican ? hasBankLinked : hasActivePaypal;

    useEffect(() => {
        let alive = true;
        api.get('/api/bago/getWallet').then(res => {
            if (!alive) return;
            const d = res.data?.data || res.data || {};
            const root = res.data || {};
            setBalance(firstNumber(
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
            ));
            setEscrow(firstNumber(d.escrowBalance, d.escrow_balance, root.escrowBalance, root.escrow_balance, user?.escrowBalance, user?.escrow_balance));
            setHistory(Array.isArray(d.history) ? d.history : (Array.isArray(d.transactions) ? d.transactions : []));
            setTotals({
                received: firstNumber(d.allTimeReceived, root.allTimeReceived),
                expenses: firstNumber(d.allTimeExpenses, root.allTimeExpenses),
            });
            if (d.currency || root.currency) setWalletApiCurrency((d.currency || root.currency).toUpperCase());
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
    const aboveBal   = amountNum > balance;
    const canSubmit  = hasPayoutMethod && !submitting && amountNum >= minimum && !aboveBal;

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
            setStatus({ type:'error', msg: err.response?.data?.message || 'Could not send withdrawal code. Please try again.' });
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
            const endpoint = isAfrican ? '/api/bago/withdrawFunds' : '/api/payouts/paypal/withdraw';
            const payload  = { amount: amountNum, currency: walletCurrency, otp };
            if (!isAfrican) payload.method = 'paypal';
            else payload.description = 'Withdrawal via Bank Transfer';
            const res = await api.post(endpoint, payload);
            if (res.data.success) {
                setStatus({ type:'success', msg:'Withdrawal submitted successfully!' });
                setAmount('');
                setOtpCode('');
                setShowModal(false);
                if (checkAuthStatus) await checkAuthStatus();
            }
        } catch (err) {
            setStatus({ type:'error', msg: err.response?.data?.message || 'Withdrawal failed. Please try again.' });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6 font-sans animate-in fade-in duration-500">

            {/* ── Balance Hero ── */}
            <div
                className="rounded-[28px] p-7 relative overflow-hidden text-[#111827]"
                style={{ background: 'linear-gradient(135deg, #e8f4fd 0%, #f0ebff 50%, #fef9ec 100%)' }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5C4BFD]/8 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <p className="text-[9px] font-black text-[#111827]/50 uppercase tracking-widest mb-2">Available Balance</p>
                        <p className="text-5xl font-black text-[#111827] tracking-tighter leading-none">
                            {loadingWallet ? <span className="opacity-30 animate-pulse">—</span> : `${sym}${balance.toLocaleString(undefined,{minimumFractionDigits:2})}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-3">
                            <Lock size={11} className="text-[#111827]/50" />
                            <p className="text-[10px] font-bold text-[#111827]/50">
                                {sym}{escrow.toLocaleString(undefined,{minimumFractionDigits:2})} in escrow
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        {/* Payout method badge */}
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${hasPayoutMethod ? 'bg-white/70 border-white/60' : 'bg-red-50/80 border-red-200/60'}`}>
                            {isAfrican ? (
                                <PaystackLogo size={22} />
                            ) : (
                                <PayPalLogo size={22} />
                            )}
                            <div>
                                <p className="text-[10px] font-black text-[#111827] uppercase tracking-tight">
                                    {isAfrican ? 'Paystack Bank Transfer' : 'PayPal Payout'}
                                </p>
                                <p className={`text-[8px] font-bold uppercase tracking-wider ${hasPayoutMethod ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {hasPayoutMethod ? 'Connected' : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard?tab=settings')}
                            className="text-[9px] font-black text-[#5C4BFD] uppercase tracking-widest hover:underline text-center"
                        >
                            {hasPayoutMethod ? 'Manage payout method →' : 'Set up payout method →'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Grid: Chart + Withdraw ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Earnings Chart (left 2/3) */}
                <div className="lg:col-span-2 bg-white rounded-[28px] p-7 border border-gray-100 shadow-sm">
                    {/* Received / Expenses toggle */}
                    <div className="grid grid-cols-2 bg-gray-50 rounded-2xl p-1.5 mb-6 border border-gray-100">
                        {[{ id:'received', label:'Received' }, { id:'expenses', label:'Withdrawn' }].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setChartMode(tab.id)}
                                className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${chartMode===tab.id ? 'bg-[#5C4BFD] text-white shadow-lg shadow-[#5C4BFD]/15' : 'text-[#111827]/40 hover:text-[#111827]'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={13} className="text-[#5C4BFD]" />
                        <span className="text-[10px] font-black text-[#111827]/40 uppercase tracking-widest">All time</span>
                    </div>
                    <p className="text-5xl font-black text-[#111827] tracking-tighter leading-none mb-1">
                        {sym}{activeTotal.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </p>
                    <p className="text-[10px] text-[#111827]/40 font-bold mb-6">
                        {chartMode==='received' ? 'Total income received' : 'Total withdrawn from wallet'}
                    </p>

                    {/* Bar chart */}
                    <div className="grid grid-cols-7 gap-2 items-end h-28">
                        {chartDays.map(day => (
                            <div key={day.key} className="flex h-full flex-col items-center justify-end gap-1.5">
                                <div className="relative flex h-full w-full items-end justify-center rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className={`w-full rounded-full transition-all duration-500 ${chartMode==='received' ? 'bg-[#5C4BFD]' : 'bg-[#5C4BFD]'}`}
                                        style={{ height:`${Math.max(8,(day.value/maxChart)*100)}%`, opacity:day.value>0?1:0.15 }}
                                    />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#111827]/40">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Withdraw (right 1/3) */}
                <div className="bg-white rounded-[28px] p-7 border border-gray-100 shadow-sm flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                            <ArrowUpRight size={16} className="text-orange-500" />
                        </div>
                        <h3 className="text-sm font-black text-[#111827] uppercase tracking-tight">Withdraw</h3>
                    </div>

                    {/* No payout method warning */}
                    {!hasPayoutMethod && (
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight mb-1">No payout method linked</p>
                                <p className="text-[9px] text-amber-700 font-medium leading-relaxed">
                                    {isAfrican
                                        ? 'Please link a bank account before withdrawing.'
                                        : 'Please add your PayPal payout email before withdrawing.'}
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard?tab=settings')}
                                    className="mt-2 text-[9px] font-black text-amber-800 underline uppercase tracking-wider"
                                >
                                    Set up payout method →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Amount input */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Enter amount</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-2xl font-black text-[#5C4BFD]">{sym}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-transparent text-4xl font-black text-[#111827] outline-none w-32 text-center placeholder:text-gray-200"
                            />
                        </div>
                    </div>

                    {/* Quick amount buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setAmount(minimum.toFixed(2))}
                            className="bg-gray-50 border border-gray-200 rounded-xl py-3 text-[9px] font-black text-[#111827] uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            Minimum
                        </button>
                        <button
                            onClick={() => balance > 0 && setAmount(balance.toFixed(2))}
                            disabled={balance <= 0}
                            className="bg-gray-50 border border-gray-200 rounded-xl py-3 text-[9px] font-black text-[#111827] uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-30"
                        >
                            Withdraw all
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4 space-y-3 text-[10px] font-bold">
                        <div className="flex justify-between text-[#111827]">
                            <span className="text-[#5C4BFD]">Amount</span>
                            <span className="font-black">{sym}{amountNum.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#111827]">
                            <span className="text-[#5C4BFD]">Bago fee</span>
                            <span className="font-black text-emerald-600">No fee</span>
                        </div>
                        <div className="flex justify-between text-[#111827]">
                            <span className="text-[#5C4BFD]">Method</span>
                            <span className="font-black flex items-center gap-1.5">
                                {isAfrican ? <PaystackLogo size={14} /> : <PayPalLogo size={13} />}
                                {isAfrican ? 'Paystack' : 'PayPal'}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between text-[#111827]">
                            <span className="text-[#5C4BFD]">Minimum</span>
                            <span className="font-black">{sym}{minimum.toFixed(2)}</span>
                        </div>
                        {(belowMin || aboveBal) && (
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-tight">
                                {aboveBal ? 'Amount exceeds your available balance.' : `Minimum withdrawal is ${sym}${minimum.toFixed(2)}.`}
                            </p>
                        )}
                    </div>

                    {/* Payout method display */}
                    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${hasPayoutMethod ? 'bg-white border border-gray-100' : 'bg-gray-50 border border-gray-100'}`}>
                        {isAfrican ? (
                            <div className="w-10 h-7 rounded-lg flex items-center justify-center shrink-0">
                                <PaystackLogo size={24} />
                            </div>
                        ) : (
                            <div className="w-10 h-7 bg-[#003087]/5 rounded-lg flex items-center justify-center shrink-0">
                                <PayPalLogo size={18} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-[#111827] uppercase tracking-tight">
                                {isAfrican ? 'Paystack Bank Transfer' : 'PayPal'}
                            </p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                                {hasPayoutMethod ? 'Funds sent after approval' : 'Setup required before withdrawing'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard?tab=settings')}
                            className="text-[8px] font-black text-[#5C4BFD] uppercase tracking-wider hover:underline shrink-0"
                        >
                            {hasPayoutMethod ? 'Manage' : 'Set up'}
                        </button>
                    </div>

                    {/* Status message */}
                    {status.msg && (
                        <div className={`flex items-center gap-3 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${
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
                        className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#5C4BFD', color: '#fff', boxShadow: canSubmit ? '0 8px 24px #5C4BFD30' : 'none' }}
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
                        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5C4BFD]/10">
                                <Lock size={18} className="text-[#5C4BFD]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight text-[#111827]">
                                    Confirm withdrawal
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400">
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
                            className="mb-4 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 text-center text-2xl font-black tracking-[0.4em] text-[#111827] outline-none focus:border-[#5C4BFD]"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setOtpCode('');
                                }}
                                className="h-12 rounded-2xl bg-gray-100 text-[10px] font-black uppercase tracking-widest text-[#111827]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || otpCode.length !== 6}
                                className="h-12 rounded-2xl bg-[#5C4BFD] text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40"
                            >
                                {submitting ? 'Checking...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Transaction History ── */}
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-7 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5C4BFD]/6 flex items-center justify-center">
                            <RefreshCw size={14} className="text-[#5C4BFD]" />
                        </div>
                        <h3 className="text-sm font-black text-[#111827] uppercase tracking-tight">
                            {t('transactionHistory') || 'Transaction History'}
                        </h3>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400">{transactions.length} entries</span>
                </div>

                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Wallet size={28} className="text-gray-200" />
                        </div>
                        <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">
                            No transactions recorded yet
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {transactions.map((tx, i) => {
                            const isOut = expenseTypes.has(tx.type);
                            const meta = transactionMeta(tx);
                            return (
                                <div key={tx.id || i} className="flex items-center justify-between px-7 py-5 hover:bg-gray-50/40 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 ${isOut ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                                            {isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#111827] text-[11px] uppercase tracking-tight mb-0.5">
                                                {transactionTitle(tx, isOut)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {tx.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                <span className="text-[8px] text-[#5C4BFD] font-black uppercase tracking-widest capitalize">{formatTxType(tx.type)}</span>
                                            </div>
                                            {meta && (
                                                <p className="text-[8px] text-gray-400 font-bold mt-1 max-w-[260px] truncate">
                                                    {meta}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className={`text-xl font-black tracking-tighter ${isOut ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {isOut ? '−' : '+'}{sym}{tx.amount.toLocaleString(undefined,{minimumFractionDigits:2})}
                                        </p>
                                        <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${
                                            tx.status==='completed' ? 'text-emerald-500'
                                            : tx.status==='failed' || tx.status==='rejected' ? 'text-red-500'
                                            : tx.status==='pending' || tx.status==='pending_admin_approval' || tx.status==='pending_admin_review' ? 'text-amber-500'
                                            : 'text-gray-400'
                                        }`}>{formatTxStatus(tx.status)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
