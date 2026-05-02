import React, { useState } from 'react';
import api from '../../api';
import { Wallet, ArrowUpRight, ArrowDownLeft, Landmark, RefreshCw, CreditCard, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function Earnings({ user, checkAuthStatus }) {
    const { currency, t } = useLanguage();
    const navigate = useNavigate();
    const [balance, setBalance] = useState(user?.walletBalance ?? user?.balance ?? 0);
    const [history, setHistory] = useState(user?.balanceHistory || []);
    const [loading, setLoading] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    const africanCurrencies = ['NGN', 'GHS', 'KES', 'ZAR'];
    const walletCurrency = (user?.walletCurrency || user?.preferredCurrency || currency || 'USD').toUpperCase();
    const isAfricanCurrency = africanCurrencies.includes(walletCurrency);

    const hasStripe = !!user?.stripeConnectAccountId && user?.stripeVerified;
    const hasBank = !!user?.bankDetails?.accountNumber;

    // Default method based on logic
    const [method, setMethod] = useState(isAfricanCurrency ? 'bank' : 'stripe');

    const getSymbol = (curr) => {
        const symbols = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        return symbols[curr] || curr;
    };
    const currencySymbol = getSymbol(walletCurrency);

    const handleWithdraw = async (e) => {
        if (e) e.preventDefault();
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
        if (Number(withdrawAmount) > balance) {
            setStatus({ type: 'error', message: t('insufficientBalance') });
            return;
        }

        // Validate method selection
        if (method === 'bank' && !hasBank) {
            setStatus({ type: 'error', message: t('addBankDetailsFirst') });
            return;
        }
        if (method === 'stripe' && !hasStripe) {
            setStatus({ type: 'error', message: t('addStripeDetailsFirst') });
            return;
        }

        setIsWithdrawing(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await api.post('/api/bago/withdrawFunds', {
                amount: Number(withdrawAmount),
                method: method,
                currency: walletCurrency,
                description: `Withdrawal via ${method === 'bank' ? 'Bank Transfer' : 'Stripe Connect'}`
            });
            if (res.data.success) {
                setStatus({ type: 'success', message: t('withdrawalRequestSubmitted') });
                setWithdrawAmount('');
                if (checkAuthStatus) await checkAuthStatus();
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || t('withdrawalFailed') });
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Balance Card - Premium Dark */}
                <div className="lg:col-span-2 bg-[#012126] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#5845D8]/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16"></div>
                    
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[200px]">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[2px] border border-white/10 text-white/70">
                                    {t('walletBalance') || 'Wallet Balance'}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-2">
                                <span className="text-[#5845D8] mr-1">{currencySymbol}</span>
                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h1>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{t('availableForWithdrawal') || 'Available for withdrawal'}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-8">
                            {isAfricanCurrency ? (
                                <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${hasBank ? 'bg-white/5 border-white/10 text-white' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    <Landmark size={18} />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Bank Payout (Naira/Africa)</p>
                                        <p className="text-[8px] opacity-60 font-bold uppercase">{hasBank ? 'Method Connected' : 'No Bank Connected'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${hasStripe ? 'bg-white/5 border-white/10 text-white' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                    <CreditCard size={18} />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Stripe Connect</p>
                                        <p className="text-[8px] opacity-60 font-bold uppercase">{hasStripe ? 'Account Verified' : 'Not Connected'}</p>
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => setShowPayoutModal(true)}
                                className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#5845D8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all shadow-xl shadow-[#5845D8]/20"
                            >
                                <RefreshCw size={14} />
                                {t('managePayouts') || 'Manage Payouts'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Withdraw */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <ArrowUpRight size={18} />
                            </div>
                            <h3 className="text-sm font-black text-[#012126] uppercase tracking-tight">{t('quickWithdraw') || 'Quick Withdraw'}</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-6 py-5 bg-gray-50 rounded-3xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none font-black text-2xl transition-all text-[#012126] placeholder:text-gray-200"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-[#5845D8] text-lg opacity-40">{currencySymbol}</div>
                            </div>

                            <button
                                onClick={handleWithdraw}
                                disabled={isWithdrawing || !withdrawAmount || balance < Number(withdrawAmount)}
                                className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#0a262c] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                            >
                                {isWithdrawing ? <RefreshCw className="animate-spin" size={16} /> : <><Wallet size={16} /> {t('transferFunds')}</>}
                            </button>
                        </div>
                    </div>

                    {status.message && (
                        <div className={`mt-6 p-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'} animate-in slide-in-from-bottom duration-300`}>
                            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {status.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction History - Modernized Table */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#5845D8]/5 text-[#5845D8] flex items-center justify-center">
                            <RefreshCw size={16} />
                        </div>
                        <h3 className="text-sm font-black text-[#012126] tracking-tight uppercase">{t('transactionHistory') || 'Transaction History'}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#012126] transition-colors">{t('viewAll') || 'View All'}</button>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
                            <Wallet size={40} />
                        </div>
                        <p className="text-gray-300 font-black uppercase tracking-widest text-[11px] max-w-[200px] leading-relaxed">
                            {t('noTransactionsRecorded') || 'No transactions recorded yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {history.slice().reverse().map((tx, i) => (
                            <div key={i} className="flex items-center justify-between px-8 py-6 hover:bg-gray-50/50 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${tx.type === 'withdraw' ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                                        {tx.type === 'withdraw' ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#012126] text-sm uppercase mb-0.5 tracking-tight">{tx.description || (tx.type === 'withdraw' ? t('payout') : t('earnings'))}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                            <span className="text-[9px] text-[#5845D8] font-black uppercase tracking-widest">{tx.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-black tracking-tighter ${tx.type === 'withdraw' ? 'text-red-500' : 'text-green-600'}`}>
                                        {tx.type === 'withdraw' ? '-' : '+'}{currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mt-1">Completed</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payout Management Modal Shortcut */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-[#012126]/40 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300 px-6">
                    <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-100 relative">
                        <button onClick={() => setShowPayoutModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-[#012126] transition-opacity">
                            <X size={24} />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#5845D8]/10 text-[#5845D8] rounded-2xl flex items-center justify-center">
                                <Landmark size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">{t('payoutSettings') || 'Payout Settings'}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('manageYourPayoutMethods') || 'Manage your payout methods'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            {isAfricanCurrency ? (
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-[#012126] uppercase tracking-widest">
                                        <div className="w-5 h-5 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[8px]">✓</div>
                                        Paystack / Bank Transfer
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-4 uppercase tracking-wide">
                                        Required for payouts in NGN, GHS, KES, ZAR.
                                    </p>
                                    <button 
                                        onClick={() => { setShowPayoutModal(false); navigate('/dashboard?tab=settings'); }}
                                        className="w-full py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#012126] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {hasBank ? 'Update Bank Details' : 'Add Bank Account'}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-[#012126] uppercase tracking-widest">
                                        <div className="w-5 h-5 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[8px]">✓</div>
                                        Stripe Connect
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-4 uppercase tracking-wide">
                                        Required for payouts in USD, EUR, GBP.
                                    </p>
                                    <button 
                                        onClick={() => { setShowPayoutModal(false); navigate('/dashboard?tab=settings'); }}
                                        className="w-full py-4 bg-[#5845D8] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5845D8]/10"
                                    >
                                        {hasStripe ? 'View Stripe Account' : 'Connect Stripe'}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
                            <Shield className="text-blue-500 shrink-0" size={16} />
                            <p className="text-[9px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                                Bago uses industry-standard encryption to protect your financial data. We never store your full bank details on our servers.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const X = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
);

const ArrowRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
