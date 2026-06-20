import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Copy, Gift, Loader2, Share2, Users, Wallet } from 'lucide-react';
import api from '../../api';

const FALLBACK_RATES = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.78,
    NGN: 1500,
    GHS: 15,
    KES: 130,
    ZAR: 18.5,
    CAD: 1.35,
    AUD: 1.5,
};

function money(amount, currency = 'USD') {
    return `${currency} ${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function convertFallback(amount, fromCurrency, toCurrency) {
    const numeric = Number(amount || 0);
    const from = String(fromCurrency || toCurrency || 'USD').toUpperCase();
    const to = String(toCurrency || from || 'USD').toUpperCase();
    if (!numeric || numeric <= 0) return 0;
    if (from === to) return numeric;
    const fromRate = from === 'USD' ? 1 : FALLBACK_RATES[from];
    const toRate = to === 'USD' ? 1 : FALLBACK_RATES[to];
    if (!fromRate || !toRate) return 0;
    return Number(((numeric * toRate) / fromRate).toFixed(4));
}

function rewardMoney(settings, amountKey, currencyKey, baseAmountKey, baseCurrency, displayCurrency, defaultBaseAmount = 0) {
    const amount = Number(settings?.[amountKey]);
    const configuredBaseAmount = Number(settings?.[baseAmountKey]);
    const baseAmount = Number.isFinite(configuredBaseAmount) && configuredBaseAmount > 0
        ? configuredBaseAmount
        : Number(defaultBaseAmount || 0);
    const currency = String(settings?.[currencyKey] || displayCurrency || baseCurrency).toUpperCase();
    const hasPositiveAmount = Number.isFinite(amount) && amount > 0;
    const hasPositiveBase = Number.isFinite(baseAmount) && baseAmount > 0;
    if ((hasPositiveAmount || !hasPositiveBase) && settings?.[amountKey] != null && currency) {
        return money(amount, currency);
    }
    return money(hasPositiveBase ? convertFallback(baseAmount, baseCurrency, currency) : 0, currency);
}

function objectList(value) {
    return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function objectValue(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export default function Referral({ user }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState('');

    useEffect(() => {
        let alive = true;
        api.get('/api/bago/referral')
            .then((res) => {
                if (alive) setData(res.data?.data || null);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => { alive = false; };
    }, []);

    const referralCode = data?.code || user?.referralCode || user?.referral_code || '';

    const link = useMemo(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sendwithbago.com';
        return referralCode ? `${origin}/signup?ref=${encodeURIComponent(referralCode)}` : '';
    }, [referralCode]);

    const rewards = objectList(data?.rewards);
    const settings = objectValue(data?.settings);
    const currency = settings.referralTotalEarnedCurrency
        || settings.walletCurrency
        || rewards.find((r) => r.viewer_currency)?.viewer_currency
        || user?.walletCurrency
        || user?.preferredCurrency
        || 'USD';
    const totalEarned = settings.referralTotalEarnedAmount ?? rewards.reduce((sum, reward) => {
        const userId = user?.id || user?._id;
        return sum + Number(reward.viewer_amount ?? (reward.referrer_id === userId ? reward.referrer_amount : reward.referred_amount) ?? 0);
    }, 0);

    const copyValue = async (value, label) => {
        if (!value) return;
        await navigator.clipboard?.writeText(value);
        setCopied(label);
        setTimeout(() => setCopied(''), 1800);
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center text-[#5845D8]">
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    const referredUsers = objectList(data?.referredUsers);
    const welcomeDisplay = rewardMoney(
        settings,
        'referralWelcomeBonusAmount',
        'referralWelcomeBonusCurrency',
        'referralWelcomeBonusNgn',
        'NGN',
        currency,
        2000,
    );
    const shipmentDisplay = rewardMoney(
        settings,
        'referralShipmentBonusAmount',
        'referralShipmentBonusCurrency',
        'referralShipmentBonusUsd',
        'USD',
        currency,
        2,
    );
    const thresholdDisplay = rewardMoney(
        settings,
        'referralShipmentThresholdAmount',
        'referralShipmentThresholdCurrency',
        'referralShipmentThresholdUsd',
        'USD',
        currency,
        50,
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="rounded-[30px] bg-[#5845D8] text-white p-8 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-72 h-72 bg-[#5845D8]/30 rounded-full blur-3xl translate-x-24 -translate-y-24" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-end">
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                            <Gift size={24} />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/45 font-black mb-3">Referral Program</p>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-4">Invite people. Earn real wallet bonuses.</h2>
                        <p className="text-white/60 font-semibold max-w-2xl">
                            Both accounts receive the welcome referral bonus once your invite creates an account. A qualifying shipment unlocks the extra shipment bonus.
                        </p>
                    </div>
                    <div className="bg-white/8 border border-white/10 rounded-3xl p-5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Total referral earnings</p>
                        <p className="text-4xl font-black tracking-tight">{money(totalEarned, currency)}</p>
                        <p className="text-[10px] text-white/45 mt-2 font-bold">Added through real wallet transactions</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-[28px] border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <Share2 size={18} className="text-[#5845D8]" />
                        <h3 className="font-black text-[#111827] text-lg">Your invite link</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
                        <button
                            onClick={() => copyValue(referralCode, 'code')}
                            disabled={!referralCode}
                            className="bg-[#5845D8]/8 text-[#5845D8] rounded-2xl px-5 py-4 font-black tracking-widest flex items-center justify-between"
                        >
                            {referralCode || 'Generating referral code...'}
                            <Copy size={15} />
                        </button>
                        <button
                            onClick={() => copyValue(link, 'link')}
                            disabled={!link}
                            className="bg-gray-50 rounded-2xl px-5 py-4 text-left text-sm font-bold text-[#111827] flex items-center justify-between gap-4 overflow-hidden"
                        >
                            <span className="truncate">{link || 'Referral link will appear when your code is ready'}</span>
                            <Copy size={15} className="text-[#5845D8] shrink-0" />
                        </button>
                    </div>
                    {copied && <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-3">{copied} copied</p>}
                </div>

                <div className="bg-white rounded-[28px] border border-gray-100 p-6 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Current reward rules</p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Wallet size={16} className="text-[#5845D8]" />
                            <span className="text-sm font-bold text-[#111827]">You and your friend each get {welcomeDisplay} after signup</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-emerald-600" />
                            <span className="text-sm font-bold text-[#111827]">Earn another {shipmentDisplay} when they send an item over {thresholdDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-[#111827] text-lg">Referred users</h3>
                        <p className="text-gray-400 text-xs font-bold">Track who used your code and their completion stage.</p>
                    </div>
                    <div className="flex items-center gap-2 text-[#5845D8] font-black text-sm">
                        <Users size={17} />
                        {referredUsers.length}
                    </div>
                </div>

                {referredUsers.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-gray-400 font-bold">No referred users yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {referredUsers.map((person) => (
                            <div key={person.id} className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                                <div>
                                    <p className="font-black text-[#111827]">{[person.first_name, person.last_name].filter(Boolean).join(' ') || person.email}</p>
                                    <p className="text-xs text-gray-400 font-bold">{person.email}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${person.signup_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                            Account created
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${person.shipment_completed ? 'bg-[#5845D8]/10 text-[#5845D8]' : 'bg-gray-100 text-gray-400'}`}>
                                            Qualified shipment
                                        </span>
                                    </div>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-[9px] uppercase tracking-widest font-black text-gray-400">Earned</p>
                                    <p className="text-lg font-black text-[#111827]">{money(person.referrer_earned, person.referrer_earned_currency || currency)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
