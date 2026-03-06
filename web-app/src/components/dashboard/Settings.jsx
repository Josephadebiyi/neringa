import React, { useState, useEffect } from 'react';
import api from '../../api';
import { User, Mail, CreditCard, Shield, Camera, Check, RefreshCw, Landmark, PlusCircle, CheckCircle, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Settings({ user, checkAuthStatus }) {
    const { currency } = useLanguage();
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
            setError('Failed to start Stripe onboarding. Please try again.');
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
                setSuccessMessage('Settings updated successfully!');
                await checkAuthStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = (e) => {
        e.preventDefault();
        if (!newCard.number || !newCard.holderName) {
            setError('Please enter card number and holder name');
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
        setSuccessMessage('Card added successfully!');
    };

    const handleDeleteCard = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setCards(cards.filter(c => c.id !== id));
        setSuccessMessage('Card removed');
    };

    const handleRequestEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/bago/email/request-change', { newEmail });
            setShowEmailOtp(true);
            setSuccessMessage('OTP sent to your current email');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request email change');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl pb-10 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Edit */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                        <User className="text-[#5845D8]" size={20} />
                        <h3 className="font-bold text-[#054752]">Personal Information</h3>
                    </div>

                    <div className="flex justify-center mb-8 relative group">
                        <div className="w-24 h-24 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg overflow-hidden relative">
                            {user?.image ? <img src={user.image} alt="User" className="w-full h-full object-cover" /> : (firstName?.charAt(0) || 'B')}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        {isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-4 border-white shadow-sm" title="Verified Account">
                                <Check size={16} strokeWidth={3} />
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={isVerified}
                                    className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm transition-all ${isVerified ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' : 'bg-gray-50 border-gray-100 focus:border-[#5845D8] outline-none'}`}
                                />
                                {isVerified && <p className="text-[10px] text-green-600 font-bold mt-1">Locked after verification</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={isVerified}
                                    className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm transition-all ${isVerified ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' : 'bg-gray-50 border-gray-100 focus:border-[#5845D8] outline-none'}`}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#5845D8]/20"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Account Settings */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                        <Mail className="text-[#5845D8]" size={20} />
                        <h3 className="font-bold text-[#054752]">Email Address</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Email</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 rounded-2xl border border-transparent font-bold text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        {!showEmailOtp ? (
                            <form onSubmit={handleRequestEmailChange} className="space-y-4 pt-4 border-t border-gray-50">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Enter new email"
                                        className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-[#5845D8] font-bold text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newEmail || loading}
                                    className="w-full border-2 border-[#5845D8] text-[#5845D8] py-3 rounded-2xl font-black hover:bg-[#5845D8] hover:text-white transition-all disabled:opacity-50"
                                >
                                    Update Email
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">OTP Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={emailOtp}
                                        onChange={(e) => setEmailOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 bg-[#5845D8]/5 rounded-2xl border border-[#5845D8]/20 outline-none focus:border-[#5845D8] font-black text-center text-xl tracking-[10px]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-[#5845D8] text-white py-3 rounded-2xl font-black">Verify OTP</button>
                                    <button onClick={() => setShowEmailOtp(false)} className="px-4 text-gray-400 font-bold">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payout Settings */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-8">
                    <Landmark className="text-[#5845D8]" size={20} />
                    <h3 className="font-bold text-[#054752]">Withdrawal Methods</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 h-full flex flex-col justify-between">
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-black text-[#054752] mb-4">
                                    <span className="w-6 h-6 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[10px]">1</span>
                                    Stripe Connect
                                </h4>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                                    Get paid directly to your bank account via Stripe. Quick setup, secure, and supports international payments.
                                </p>
                            </div>

                            {stripeVerified ? (
                                <div className="flex items-center gap-3 bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-green-700 uppercase tracking-wider">Account Connected</p>
                                        <p className="text-[10px] text-green-600 font-bold">Ready for payouts</p>
                                    </div>
                                    <ShieldCheck className="text-green-500" size={20} />
                                </div>
                            ) : (
                                <button
                                    onClick={handleStripeConnect}
                                    disabled={stripeLoading}
                                    className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black hover:bg-[#4838B5] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#5845D8]/20 disabled:opacity-50"
                                >
                                    {stripeLoading ? <RefreshCw className="animate-spin" size={20} /> : (
                                        <>
                                            Connect Stripe
                                            <ShieldCheck size={20} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {showBankOption && (
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <h4 className="flex items-center gap-2 text-sm font-black text-[#054752] mb-4">
                                    <span className="w-6 h-6 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[10px]">2</span>
                                    Nigerian Bank Transfer (NGN)
                                </h4>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="Bank Name"
                                        className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#054752]"
                                    />
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="Account Number"
                                        className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#054752]"
                                    />
                                    <input
                                        type="text"
                                        value={accountHolderName}
                                        onChange={(e) => setAccountHolderName(e.target.value)}
                                        placeholder="Account Holder Name"
                                        className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-100 focus:border-[#5845D8] outline-none text-sm font-bold text-[#054752]"
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
                        className="px-8 py-3.5 bg-[#054752] text-white rounded-2xl font-black hover:bg-[#0a262c] transition-all flex items-center gap-2 shadow-lg"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Check size={18} />}
                        Save Payout Details
                    </button>
                </div>
            </div>

            {/* Payment Methods - Stored Cards */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-8">
                    <div className="flex items-center gap-3">
                        <CreditCard className="text-[#5845D8]" size={20} />
                        <h3 className="font-bold text-[#054752]">Stored Cards</h3>
                    </div>
                    <button
                        onClick={() => setShowAddCard(!showAddCard)}
                        className="text-[#5845D8] font-bold text-sm flex items-center gap-1 hover:underline"
                    >
                        <PlusCircle size={16} /> Add New Card
                    </button>
                </div>

                {showAddCard && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-[#5845D8]/20 animate-in slide-in-from-top duration-300">
                        <h4 className="text-sm font-black text-[#054752] mb-4">Enter Card Details</h4>
                        <form onSubmit={handleAddCard} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Card Holder's Name"
                                    className="px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold"
                                    value={newCard.holderName}
                                    onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Card Number"
                                    className="px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold"
                                    value={newCard.number}
                                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                                    maxLength={16}
                                />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold"
                                    value={newCard.expiry}
                                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                                    maxLength={5}
                                />
                                <input
                                    type="text"
                                    placeholder="CVC"
                                    className="px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold"
                                    value={newCard.cvc}
                                    onChange={(e) => setNewCard({ ...newCard, cvc: e.target.value })}
                                    maxLength={3}
                                />
                                <button type="submit" className="bg-[#5845D8] text-white py-3 rounded-2xl font-black hover:bg-[#4838B5] transition-all">Add Card</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-gray-400">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">No cards stored</p>
                        </div>
                    ) : (
                        cards.map(card => (
                            <div key={card.id} className="p-6 rounded-[28px] bg-[#054752] text-white relative h-44 shadow-lg overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-6 bg-white/20 rounded-md backdrop-blur-sm"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{card.brand}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteCard(e, card.id)}
                                        className="text-white/40 hover:text-red-400 transition-colors p-2 bg-white/5 rounded-full z-20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-lg font-black tracking-[4px] mb-4">•••• •••• •••• {card.last4}</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase mb-0.5">Card Holder</p>
                                        <p className="text-xs font-black truncate max-w-[150px]">{card.holderName || (firstName + ' ' + lastName)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/40 font-bold uppercase mb-0.5">Expires</p>
                                        <p className="text-xs font-black">{card.expMonth}/{card.expYear}</p>
                                    </div>
                                </div>
                                {card.isDefault && (
                                    <div className="absolute bottom-4 right-4 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                                        <span className="text-[8px] font-black uppercase">Default</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Status Messages */}
            {successMessage && (
                <div className="fixed bottom-10 right-10 bg-[#054752] text-white p-5 rounded-[24px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 z-50 border border-white/20 backdrop-blur-md">
                    <CheckCircle className="text-green-400" size={24} />
                    <span className="font-bold">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-4 opacity-70">✕</button>
                </div>
            )}
            {error && (
                <div className="fixed bottom-10 right-10 bg-red-500 text-white p-5 rounded-[24px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 z-50">
                    <AlertCircle size={24} />
                    <span className="font-bold">{error}</span>
                    <button onClick={() => setError('')} className="ml-4 opacity-70">✕</button>
                </div>
            )}
        </div>
    );
}

const BankTransferSection = ({ bankName, setBankName, accountNumber, setAccountNumber, accountHolderName, setAccountHolderName }) => (
    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
        <h4 className="flex items-center gap-2 text-sm font-black text-[#054752] mb-4">
            <span className="w-6 h-6 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[10px]">2</span>
            Nigerian Bank Transfer (NGN)
        </h4>
        <div className="space-y-3">
            <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#054752]"
            />
            <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#054752]"
            />
            <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Account Holder Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-100 focus:border-[#5845D8] outline-none text-sm font-bold text-[#054752]"
            />
        </div>
    </div>
);
