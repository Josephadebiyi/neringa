import React, { useState } from 'react';
import api from '../../api';
import { User, Mail, CreditCard, Shield, Camera, Check, RefreshCw } from 'lucide-react';

export default function Settings({ user, checkAuthStatus }) {
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [newEmail, setNewEmail] = useState('');
    const [showEmailOtp, setShowEmailOtp] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.put('/api/bago/edit', { firstName, lastName });
            if (res.data.status === 'success') {
                setSuccessMessage('Profile updated successfully!');
                await checkAuthStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Need verification logic here - OTP to new email
            setSuccessMessage('Check your new email for a verification code.');
            setShowEmailOtp(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate email change');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Edit */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                        <User className="text-[#5845D8]" size={20} />
                        <h3 className="font-bold text-[#054752]">Personal Information</h3>
                    </div>

                    <div className="flex justify-center mb-8 relative group">
                        <div className="w-24 h-24 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg overflow-hidden relative">
                            {user?.image ? <img src={user.image} alt="User" className="w-full h-full object-cover" /> : user?.firstName?.charAt(0)}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#5845D8] font-medium text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#5845D8] font-medium text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] text-white py-3.5 rounded-xl font-bold hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Account Settings */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
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
                                className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-transparent font-medium text-sm text-gray-500 cursor-not-allowed"
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
                                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#5845D8] font-medium text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newEmail || loading}
                                    className="w-full border-2 border-[#5845D8] text-[#5845D8] py-3 rounded-xl font-bold hover:bg-[#5845D8] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#5845D8]"
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
                                        className="w-full px-4 py-3 bg-[#5845D8]/5 rounded-xl border border-[#5845D8]/20 outline-none focus:border-[#5845D8] font-black text-center text-xl tracking-[10px]"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 bg-[#5845D8] text-white py-3 rounded-xl font-bold hover:bg-[#4838B5] transition-all">Verify OTP</button>
                                    <button onClick={() => setShowEmailOtp(false)} className="px-4 text-gray-400 hover:text-gray-600 font-bold transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-8">
                    <CreditCard className="text-[#5845D8]" size={20} />
                    <h3 className="font-bold text-[#054752]">Stored Cards</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#054752] to-[#0A262C] text-white relative overflow-hidden h-48 select-none shadow-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <div className="flex justify-between items-start mb-10">
                            <Shield size={24} className="text-white/40" />
                            <p className="font-black italic text-lg opacity-80 uppercase tracking-tighter">Bago Card</p>
                        </div>
                        <p className="text-xl font-medium tracking-[4px] mb-4">•••• •••• •••• 4242</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] uppercase opacity-50 font-bold mb-1">Card Holder</p>
                                <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase opacity-50 font-bold mb-1">Expires</p>
                                <p className="text-sm font-bold text-right">12/28</p>
                            </div>
                        </div>
                    </div>

                    <button className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-[#5845D8] hover:text-[#5845D8] transition-all group">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#5845D8]/10 group-hover:scale-110 transition-all">
                            <PlusCircle size={24} />
                        </div>
                        <p className="font-bold">Add Payment Method</p>
                        <p className="text-xs font-medium opacity-60">Visa, Mastercard, AMEX</p>
                    </button>
                </div>
            </div>

            {/* Status Messages */}
            {successMessage && (
                <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-100 flex items-center gap-2 animate-in slide-in-from-top duration-300">
                    <Check size={18} />
                    <span className="font-bold">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2 animate-in slide-in-from-top duration-300">
                    <Shield size={18} />
                    <span className="font-bold">{error}</span>
                    <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                </div>
            )}
        </div>
    );
}
import { PlusCircle } from 'lucide-react';
