import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Wallet, ArrowUpRight, ArrowDownLeft, Landmark, RefreshCw, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

export default function Earnings({ user, checkAuthStatus }) {
    const [balance, setBalance] = useState(user?.balance || 0);
    const [history, setHistory] = useState(user?.balanceHistory || []);
    const [loading, setLoading] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const isEurope = user?.paymentGateway === 'stripe' || ['UK', 'FR', 'DE', 'ES', 'IT', 'NL'].includes(user?.country);
    const gateway = isEurope ? 'Stripe Connect' : 'Paystack';

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
        if (Number(withdrawAmount) > balance) {
            setStatus({ type: 'error', message: 'Insufficient balance' });
            return;
        }

        setIsWithdrawing(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await api.post('/api/bago/withdrawFunds', {
                userId: user.id,
                amount: Number(withdrawAmount),
                description: `Withdrawal via ${gateway}`
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="md:col-span-2 bg-[#054752] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Available Balance</p>
                                <h1 className="text-5xl font-black tracking-tighter">${balance.toLocaleString()}</h1>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                <Wallet size={32} />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="px-5 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-2">
                                <Landmark size={18} className="text-green-400" />
                                <span className="text-sm font-bold uppercase tracking-wider">{gateway}</span>
                            </div>
                            <div className="px-5 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-2">
                                <CreditCard size={18} className="text-blue-400" />
                                <span className="text-sm font-bold uppercase tracking-wider">Default Payout</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Form */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-[#054752] mb-1">Withdraw</h3>
                        <p className="text-gray-400 text-xs font-bold mb-6">Process payouts to your bank account.</p>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#5845D8] text-lg">$</span>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-black text-xl focus:border-[#5845D8] focus:bg-white transition-all text-[#054752]"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isWithdrawing || !withdrawAmount}
                                className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isWithdrawing ? <RefreshCw className="animate-spin" size={20} /> : 'Transfer Space'}
                            </button>
                        </form>
                    </div>

                    {status.message && (
                        <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {status.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-[#054752]">Transaction History</h3>
                    <button onClick={checkAuthStatus} className="text-[#5845D8] font-bold text-sm flex items-center gap-1 hover:underline">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No transactions found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {history.slice().reverse().map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${tx.type === 'withdraw' ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                                        {tx.type === 'withdraw' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#054752] text-sm uppercase tracking-tight">{tx.description || (tx.type === 'withdraw' ? 'Payout' : 'Earnings')}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{new Date(tx.date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>
                                <div className={`text-right font-black ${tx.type === 'withdraw' ? 'text-red-500' : 'text-green-500'}`}>
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
