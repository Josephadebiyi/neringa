import React, { useState } from 'react';
import api from '../../api';
import { Wallet, ArrowUpRight, ArrowDownLeft, Landmark, RefreshCw, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Earnings({ user, checkAuthStatus }) {
    const { currency } = useLanguage();
    const [balance, setBalance] = useState(user?.balance || 0);
    const [history, setHistory] = useState(user?.balanceHistory || []);
    const [loading, setLoading] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const africanCurrencies = ['NGN', 'ZAR', 'KES', 'GHS'];
    const showBankOption = user?.country === 'Nigeria' || africanCurrencies.includes(currency);
    const [method, setMethod] = useState(user?.country === 'Nigeria' ? 'bank' : 'stripe');

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
        if (Number(withdrawAmount) > balance) {
            setStatus({ type: 'error', message: 'Insufficient balance' });
            return;
        }

        // Validate method selection
        if (method === 'bank' && (!user?.bankDetails?.accountNumber || !user?.bankDetails?.bankName)) {
            setStatus({ type: 'error', message: 'Please add bank details in Settings first' });
            return;
        }
        if (method === 'stripe' && !user?.stripeConnectAccountId) {
            setStatus({ type: 'error', message: 'Please add Stripe Connect ID in Settings first' });
            return;
        }

        setIsWithdrawing(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await api.post('/api/bago/withdrawFunds', {
                amount: Number(withdrawAmount),
                method: method,
                description: `Withdrawal via ${method === 'bank' ? 'Bank Transfer' : 'Stripe'}`
            });
            if (res.data.success) {
                setStatus({ type: 'success', message: 'Withdrawal request submitted!' });
                setWithdrawAmount('');
                await checkAuthStatus();
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Withdrawal failed' });
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Balance Card */}
                <div className="md:col-span-2 bg-[#054752] rounded-[24px] p-6 text-white relative overflow-hidden shadow-xl border border-[#054752]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-[40px] -mr-12 -mt-12 text-xs uppercase tracking-widest font-bold"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white/40 font-black uppercase tracking-widest text-[8px] mb-2 tracking-[0.25em]">Available Balance</p>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">${balance.toLocaleString()}</h1>
                            </div>
                            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/5">
                                <Wallet size={18} />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-6">
                            <button
                                onClick={() => setMethod('stripe')}
                                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${method === 'stripe' ? 'bg-white text-[#054752] border-white shadow-lg' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
                            >
                                <CreditCard size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Stripe</span>
                            </button>
                            {showBankOption && (
                                <button
                                    onClick={() => setMethod('bank')}
                                    className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${method === 'bank' ? 'bg-white text-[#054752] border-white shadow-lg' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
                                >
                                    <Landmark size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Transfer</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Withdrawal Form */}
                <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full min-h-[160px]">
                    <div>
                        <h3 className="text-sm font-black text-[#054752] mb-0.5 tracking-tight uppercase">Withdraw</h3>
                        <p className="text-gray-400 text-[8px] font-black mb-4 uppercase tracking-widest opacity-60">
                            Via {method === 'bank' ? 'Bank Transfer' : 'Stripe Connect'}
                        </p>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#5845D8] text-sm opacity-60">$</span>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-[#5845D8]/20 focus:bg-white outline-none font-black text-sm transition-all text-[#054752] placeholder:text-gray-200"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isWithdrawing || !withdrawAmount}
                                className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isWithdrawing ? <RefreshCw className="animate-spin" size={14} /> : 'Transfer Funds'}
                            </button>
                        </form>
                    </div>

                    {status.message && (
                        <div className={`mt-3 p-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} animate-in fade-in duration-300`}>
                            {status.type === 'success' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            {status.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                    <h3 className="text-sm font-black text-[#054752] tracking-tight uppercase">Recent Activity</h3>
                    <button onClick={checkAuthStatus} className="text-[#5845D8] font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                        <RefreshCw size={10} /> Refresh
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="p-16 text-center">
                        <p className="text-gray-400 font-black uppercase tracking-widest text-[9px] opacity-40">No transactions recorded</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {history.slice().reverse().map((tx, i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl border border-transparent group-hover:bg-white group-hover:border-gray-50 transition-all ${tx.type === 'withdraw' ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-600'}`}>
                                        {tx.type === 'withdraw' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#054752] text-[11px] uppercase tracking-tight">{tx.description || (tx.type === 'withdraw' ? 'Payout' : 'Earnings')}</p>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest opacity-60">{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                </div>
                                <div className={`text-right font-black text-xs tracking-tight ${tx.type === 'withdraw' ? 'text-red-500' : 'text-green-600'}`}>
                                    {tx.type === 'withdraw' ? '-' : '+'}${tx.amount.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
