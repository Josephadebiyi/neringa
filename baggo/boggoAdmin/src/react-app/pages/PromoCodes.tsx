import { useEffect, useState } from 'react';
import {
    Ticket,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Calendar,
    Percent,
    DollarSign,
    Wallet,
    Loader2,
    X,
    ShieldCheck,
    ShieldAlert,
    Users
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface PromoCode {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    isSignupBonus: boolean;
    signupBonusAmount: number;
    maxUses: number | null;
    usedCount: number;
    expiryDate: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function PromoCodes() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPromo, setNewPromo] = useState({
        code: '',
        discountType: 'fixed',
        discountAmount: 0,
        isSignupBonus: false,
        signupBonusAmount: 0,
        maxUses: '',
        expiryDate: ''
    });

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/promo-codes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setPromoCodes(data.data);
        } catch (error) {
            console.error('Fetch promo codes error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/promo-codes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newPromo,
                    maxUses: newPromo.maxUses === '' ? null : Number(newPromo.maxUses),
                    discountAmount: Number(newPromo.discountAmount),
                    signupBonusAmount: Number(newPromo.signupBonusAmount)
                })
            });

            const data = await response.json();
            if (data.success) {
                setIsModalOpen(false);
                setNewPromo({
                    code: '',
                    discountType: 'fixed',
                    discountAmount: 0,
                    isSignupBonus: false,
                    signupBonusAmount: 0,
                    maxUses: '',
                    expiryDate: ''
                });
                fetchPromoCodes();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Create promo error:', error);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_BASE_URL}/promo-codes/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPromoCodes();
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    };

    const deletePromo = async (id: string) => {
        if (!confirm('Permanent delete promo code?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${API_BASE_URL}/promo-codes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPromoCodes();
        } catch (error) {
            console.error('Delete promo error:', error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
                        Incentive Engine
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Manage discounts, referrals, and signup bonuses</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#5240E8] text-white px-8 py-3.5 rounded-[22px] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5240E8]/20 hover:scale-[1.05] transition-all active:scale-[0.95]"
                >
                    <Plus className="w-5 h-5" />
                    Generate Code
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-12 h-12 text-[#5240E8] animate-spin" />
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest text-center">Loading Rewards Database...</p>
                    </div>
                ) : (
                    promoCodes.map((promo) => (
                        <div key={promo._id} className={`premium-card p-6 border-t-4 transition-all ${promo.isActive ? 'border-t-[#5240E8]' : 'border-t-gray-200 opacity-75'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-lg tracking-widest shadow-lg">
                                    {promo.code}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleStatus(promo._id)} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                                        {promo.isActive ? <ToggleRight className="w-6 h-6 text-[#5240E8]" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                                    </button>
                                    <button onClick={() => deletePromo(promo._id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount</span>
                                    <span className="text-sm font-black text-[#1e2749]">
                                        {promo.discountType === 'percentage' ? `${promo.discountAmount}% Off` : `€${promo.discountAmount} Fixed`}
                                    </span>
                                </div>

                                {promo.isSignupBonus && (
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-100">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-green-600" />
                                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Signup Reward</span>
                                        </div>
                                        <span className="text-sm font-black text-green-700">+€{promo.signupBonusAmount}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Utilization</p>
                                        <p className="text-sm font-black text-[#1e2749]">
                                            {promo.usedCount} <span className="text-gray-300">/</span> {promo.maxUses || '∞'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expires</p>
                                        <p className="text-xs font-bold text-gray-600">
                                            {promo.expiryDate ? new Date(promo.expiryDate).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0a0c10]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-[#1e2749]">Generate Incentive</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Configure code logic and rewards</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Voucher Code (Unique Identifier)</label>
                                <input
                                    type="text"
                                    value={newPromo.code}
                                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                    placeholder="BAGO2024"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-black text-lg tracking-widest"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Type</label>
                                    <select
                                        value={newPromo.discountType}
                                        onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                                    >
                                        <option value="fixed">Fixed (€)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Amount</label>
                                    <div className="relative">
                                        {newPromo.discountType === 'fixed' ? <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> : <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                                        <input
                                            type="number"
                                            value={newPromo.discountAmount}
                                            onChange={(e) => setNewPromo({ ...newPromo, discountAmount: Number(e.target.value) })}
                                            className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${newPromo.isSignupBonus ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#1e2749]">Automated Signup Bonus</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Credits wallet balance on registration</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewPromo({ ...newPromo, isSignupBonus: !newPromo.isSignupBonus })}
                                        className={`w-14 h-7 rounded-full transition-all relative ${newPromo.isSignupBonus ? 'bg-[#5240E8]' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${newPromo.isSignupBonus ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                {newPromo.isSignupBonus && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">Wallet Credit Amount (€)</label>
                                        <input
                                            type="number"
                                            value={newPromo.signupBonusAmount}
                                            onChange={(e) => setNewPromo({ ...newPromo, signupBonusAmount: Number(e.target.value) })}
                                            className="w-full px-6 py-4 bg-white border border-green-100 rounded-2xl focus:border-green-500 outline-none transition-all font-bold text-green-700"
                                            placeholder="e.g. 5.00"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usage Limit (Empty for ∞)</label>
                                    <input
                                        type="number"
                                        value={newPromo.maxUses}
                                        onChange={(e) => setNewPromo({ ...newPromo, maxUses: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                                        placeholder="e.g. 100"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={newPromo.expiryDate}
                                        onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-[#5240E8] text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5240E8]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Activate Reward Strategy
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
