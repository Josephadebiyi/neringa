import React, { useState, useEffect } from 'react';
import api from '../../api';
import { User, Mail, CreditCard, Shield, Camera, Check, RefreshCw, Landmark, PlusCircle, CheckCircle, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Settings({ user, checkAuthStatus }) {
    const { currency, t } = useLanguage();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [newEmail, setNewEmail] = useState('');
    const [showEmailOtp, setShowEmailOtp] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
    const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
    const [accountHolderName, setAccountHolderName] = useState(user?.bankDetails?.accountHolderName || '');
    const [stripeVerified, setStripeVerified] = useState(user?.stripeVerified || false);
    const [stripeLoading, setStripeLoading] = useState(false);

    useEffect(() => {
        if (user?._id) {
            checkStripeStatus();
        }
    }, [user?._id]);

    const checkStripeStatus = async () => {
        try {
            const res = await api.get(`/api/stripe/connect/status/${user?._id || user?.id}`);
            if (res.data.success) {
                setStripeVerified(res.data.verified);
            }
        } catch (err) {
            console.error("Stripe status check failed", err);
        }
    };

    const handleStripeConnect = async () => {
        setStripeLoading(true);
        try {
            const res = await api.post('/api/stripe/connect/onboard', {
                userId: user?._id || user?.id,
                email: user?.email
            });
            if (res.data.success && res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            console.error("Stripe Onboarding Error:", err);
            const msg = err.response?.data?.message || t('failStripeOnboarding');
            setError(msg);
        } finally {
            setStripeLoading(false);
        }
    };

    // Card Management States
    const [cards, setCards] = useState([
        { id: 1, last4: '4242', brand: 'visa', expMonth: 12, expYear: 26, isDefault: true, holderName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Joseph Ade' },
        { id: 2, last4: '5555', brand: 'mastercard', expMonth: 10, expYear: 25, isDefault: false, holderName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Joseph Ade' }
    ]);
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCard, setNewCard] = useState({ number: '', expiry: '', cvc: '', holderName: '' });

    const isVerified = user?.kycStatus === 'approved';
    const africanCurrencies = ['NGN', 'ZAR', 'KES', 'GHS'];
    const showBankOption = user?.country === 'Nigeria' || africanCurrencies.includes(currency);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.put('/api/bago/edit', {
                firstName,
                lastName,
                bankDetails: {
                    bankName,
                    accountNumber,
                    accountHolderName
                }
            });
            if (res.data.status === 'success') {
                setSuccessMessage(t('settingsUpdated'));
                await checkAuthStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || t('failedUpdateSettings'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = (e) => {
        e.preventDefault();
        if (!newCard.number || !newCard.holderName) {
            setError(t('enterCardDetailsError'));
            return;
        }
        // Mock add card logic
        const last4 = newCard.number.slice(-4);
        const newCardObj = {
            id: Date.now(),
            last4,
            brand: 'visa',
            expMonth: 12,
            expYear: 28,
            isDefault: false,
            holderName: newCard.holderName
        };
        setCards([newCardObj, ...cards]);
        setShowAddCard(false);
        setNewCard({ number: '', expiry: '', cvc: '', holderName: '' });
        setSuccessMessage(t('cardAdded'));
    };

    const handleDeleteCard = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setCards(cards.filter(c => c.id !== id));
        setSuccessMessage(t('cardRemoved'));
    };

    const handleRequestEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/bago/email/request-change', { newEmail });
            setShowEmailOtp(true);
            setSuccessMessage(t('otpSentEmail'));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request email change');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1200px] pb-10 font-sans text-[#012126]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Edit */}
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
                        <User className="text-[#5845D8]" size={16} />
                        <h3 className="font-black text-[#012126] text-[10px] uppercase tracking-widest">{t('personalInfo')}</h3>
                    </div>

                    <div className="flex justify-center mb-5 relative group">
                        <div className="w-16 h-16 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-xl font-black border-[3px] border-white shadow-md overflow-hidden relative">
                            {user?.image ? <img src={user.image} alt="User" className="w-full h-full object-cover" /> : (firstName?.charAt(0) || 'B')}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white" size={16} />
                            </div>
                        </div>
                        {isVerified && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white p-0.5 rounded-full border-[3px] border-white shadow-sm" title={t('verified')}>
                                <Check size={12} strokeWidth={4} />
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('firstName')}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border font-black text-[11px] transition-all uppercase tracking-tight bg-gray-50 border-gray-100 focus:border-[#5845D8]/20 focus:bg-white outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('lastName')}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border font-black text-[11px] transition-all uppercase tracking-tight bg-gray-50 border-gray-100 focus:border-[#5845D8]/20 focus:bg-white outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5845D8]/15"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={14} /> : t('saveChanges')}
                        </button>
                    </form>
                </div>

                {/* Account Settings */}
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
                        <Mail className="text-[#5845D8]" size={16} />
                        <h3 className="font-black text-[#012126] text-[10px] uppercase tracking-widest">{t('emailSettings')}</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('currentEmail')}</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-2 bg-gray-100 rounded-xl border border-transparent font-black text-[11px] text-gray-400 cursor-not-allowed opacity-70"
                            />
                        </div>

                        {!showEmailOtp ? (
                            <form onSubmit={handleRequestEmailChange} className="space-y-4 pt-4 border-t border-gray-50">
                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('newEmailLabel')}</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder={t('enterNewEmail')}
                                        className="w-full px-4 py-2 bg-gray-50 border border-transparent focus:border-[#5845D8]/20 focus:bg-white rounded-xl outline-none font-black text-[11px] transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newEmail || loading}
                                    className="w-full border-2 border-[#5845D8]/20 text-[#5845D8] py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all disabled:opacity-50"
                                >
                                    {t('updateAddress')}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('verificationCode')}</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={emailOtp}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full px-4 py-2.5 bg-[#5845D8]/5 rounded-xl border border-[#5845D8]/20 outline-none focus:border-[#5845D8] font-black text-center text-sm tracking-[8px]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-[#5845D8] text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{t('verify')}</button>
                                    <button onClick={() => setShowEmailOtp(false)} className="px-3 text-gray-400 font-black text-[8px] uppercase tracking-widest">{t('cancel')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                    <Landmark className="text-[#5845D8]" size={18} />
                    <h3 className="font-black text-[#012126] text-[11px] uppercase tracking-widest">{t('withdrawalMethods')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 h-full flex flex-col justify-between group hover:border-[#5845D8]/20 transition-all">
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-[#012126] mb-3 uppercase tracking-widest">
                                    <span className="w-5 h-5 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[8px]">1</span>
                                    Stripe Connect
                                </h4>
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-6 uppercase tracking-wide opacity-70">
                                    {t('stripeConnectDesc')}
                                </p>
                            </div>

                            {stripeVerified ? (
                                <div className="flex items-center gap-3 bg-green-50/50 p-3 rounded-xl border border-green-500/10 transition-all">
                                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">{t('accountConnected')}</p>
                                        <p className="text-[8px] text-green-600 font-bold uppercase opacity-60">{t('readyForPayouts')}</p>
                                    </div>
                                    <ShieldCheck className="text-green-500/50" size={18} />
                                </div>
                            ) : (
                                <button
                                    onClick={handleStripeConnect}
                                    disabled={stripeLoading}
                                    className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5845D8]/10 disabled:opacity-50"
                                >
                                    {stripeLoading ? <RefreshCw className="animate-spin" size={14} /> : (
                                        <>{t('connectStripe')} <ShieldCheck size={16} /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {showBankOption && (
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-[#5845D8]/20 transition-all">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-[#012126] mb-4 uppercase tracking-widest">
                                    <span className="w-5 h-5 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[8px]">2</span>
                                    {t('bankTransferNgn')}
                                </h4>
                                <div className="space-y-2.5">
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder={t('bankName')}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#012126] shadow-sm uppercase tracking-tight"
                                    />
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder={t('accountNumber')}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#012126] shadow-sm tracking-widest"
                                    />
                                    <input
                                        type="text"
                                        value={accountHolderName}
                                        onChange={(e) => setAccountHolderName(e.target.value)}
                                        placeholder={t('accountHolderName')}
                                        className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#012126] shadow-sm uppercase tracking-tight"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
                    <button
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="px-6 py-3 bg-[#012126] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0a262c] transition-all flex items-center gap-2 shadow-lg"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                        {t('saveDetails')}
                    </button>
                </div>
            </div>

            {/* Payment Methods - Stored Cards */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
                    <div className="flex items-center gap-2.5">
                        <CreditCard className="text-[#5845D8]" size={18} />
                        <h3 className="font-black text-[#012126] text-[11px] uppercase tracking-widest">{t('storedCards')}</h3>
                    </div>
                    <button
                        onClick={() => setShowAddCard(!showAddCard)}
                        className="text-[#5845D8] font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                        <PlusCircle size={14} /> {t('addCard')}
                    </button>
                </div>

                {showAddCard && (
                    <div className="mb-6 p-5 bg-gray-50/50 rounded-2xl border border-[#5845D8]/10 animate-in slide-in-from-top duration-300">
                        <h4 className="text-[10px] font-black text-[#012126] mb-3 uppercase tracking-widest">{t('enterCardDetails')}</h4>
                        <form onSubmit={handleAddCard} className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('holderName')}
                                    className="px-4 py-2 rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[10px] font-black uppercase tracking-widest"
                                    value={newCard.holderName}
                                    onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder={t('cardNumber')}
                                    className="px-4 py-2 rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[10px] font-black tracking-[4px]"
                                    value={newCard.number}
                                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                                    maxLength={16}
                                />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('expMonthYear')}
                                    className="px-4 py-2 rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[10px] font-black tracking-widest"
                                    value={newCard.expiry}
                                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                                    maxLength={5}
                                />
                                <input
                                    type="text"
                                    placeholder={t('cvc')}
                                    className="px-4 py-2 rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[10px] font-black tracking-[3px]"
                                    value={newCard.cvc}
                                    onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value })}
                                    maxLength={3}
                                />
                                <button type="submit" className="md:col-span-2 bg-[#5845D8] text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all">{t('addCard')}</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cards.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-gray-400">
                            <AlertCircle size={28} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{t('noCardsStored')}</p>
                        </div>
                    ) : (
                        cards.map(card => (
                            <div key={card.id} className="p-5 rounded-[24px] bg-[#012126] text-white relative h-36 shadow-lg overflow-hidden group border border-[#012126]">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-6 -mt-6"></div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-8 h-4.5 bg-white/10 rounded-sm backdrop-blur-sm border border-white/5"></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{card.brand}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteCard(e, card.id)}
                                        className="text-white/20 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-full z-20"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-sm font-black tracking-[3px] mb-3 opacity-90">•••• •••• •••• {card.last4}</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[7px] text-white/30 font-black uppercase mb-0.5 tracking-widest">{t('holderName')}</p>
                                        <p className="text-[9px] font-black truncate max-w-[120px] uppercase tracking-tight">{card.holderName || (firstName + ' ' + lastName)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[7px] text-white/30 font-black uppercase mb-0.5 tracking-widest">{t('exp')}</p>
                                        <p className="text-[9px] font-black tracking-widest">{card.expMonth}/{card.expYear}</p>
                                    </div>
                                </div>
                                {card.isDefault && (
                                    <div className="absolute bottom-3 right-3 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/5">
                                        <span className="text-[7px] font-black uppercase tracking-widest">{t('default')}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Status Messages */}
            {successMessage && (
                <div className="fixed bottom-10 right-10 bg-[#012126] text-white px-5 py-3.5 rounded-[20px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 z-50 border border-white/20 backdrop-blur-md">
                    <CheckCircle className="text-green-400" size={18} />
                    <span className="font-black text-[11px] uppercase tracking-wide">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-3 opacity-40 hover:opacity-100 transition-opacity">✕</button>
                </div>
            )}
            {error && (
                <div className="fixed bottom-10 right-10 bg-red-500 text-white px-5 py-3.5 rounded-[20px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 z-50">
                    <AlertCircle size={18} />
                    <span className="font-black text-[11px] uppercase tracking-wide">{error}</span>
                    <button onClick={() => setError('')} className="ml-3 opacity-40 hover:opacity-100 transition-opacity">✕</button>
                </div>
            )}
        </div>
    );
}

const BankTransferSection = ({ bankName, setBankName, accountNumber, setAccountNumber, accountHolderName, setAccountHolderName }) => (
    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
        <h4 className="flex items-center gap-2 text-sm font-black text-[#012126] mb-4">
            <span className="w-6 h-6 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[10px]">2</span>
            Nigerian Bank Transfer (NGN)
        </h4>
        <div className="space-y-3">
            <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#012126]"
            />
            <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#012126]"
            />
            <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Account Holder Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-100 focus:border-[#5845D8] outline-none text-sm font-bold text-[#012126]"
            />
        </div>
    </div>
);
