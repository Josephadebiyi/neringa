import React from 'react';
import { Shield, Plane, Package, CheckCircle, Clock, AlertCircle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Overview({ user, kycStatus, handleStartKyc, fetchKycStatus, userStats }) {
    const { t } = useLanguage();
    const renderKycContent = () => {
        switch (kycStatus) {
            case 'approved':
                return (
                    <div className="flex items-center gap-3 text-green-600 bg-green-50/30 p-4 rounded-2xl border border-green-100/30 font-sans">
                        <CheckCircle size={20} />
                        <div>
                            <p className="font-black uppercase tracking-widest text-[8px]">{t('verified')}</p>
                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight">{t('fullAccessEnabled')}</p>
                        </div>
                    </div>
                );
            case 'pending':
            case 'processing':
                return (
                    <div className="space-y-3 font-sans w-full">
                        <div className="flex items-center gap-3 text-amber-600 bg-amber-50/30 p-4 rounded-2xl border border-amber-100/30">
                            <Clock size={20} className="animate-pulse" />
                            <div>
                                <p className="font-black uppercase tracking-widest text-[8px]">{t('underReview')}</p>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight">{t('underReviewDesc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleStartKyc}
                            className="w-full bg-amber-500 text-white font-black py-2.5 rounded-xl shadow-lg text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95"
                        >
                            {t('continueVerification') || 'Continue Verification'}
                        </button>
                    </div>
                );
            case 'declined':
                return (
                    <div className="space-y-2 font-sans">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50/30 p-4 rounded-2xl border border-red-100/30">
                            <AlertCircle size={20} />
                            <div>
                                <p className="font-black uppercase tracking-widest text-[8px]">{t('declined')}</p>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight">{t('docsRejected')}</p>
                            </div>
                        </div>
                        <button onClick={handleStartKyc} className="w-full bg-[#5845D8] text-white font-black py-2.5 rounded-xl shadow-lg text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                            {t('tryAgain')}
                        </button>
                    </div>
                );
            case 'failed_verification':
                return (
                    <div className="space-y-2 font-sans">
                        <div className="flex items-center gap-3 text-red-600 bg-red-50/30 p-4 rounded-2xl border border-red-100/30">
                            <AlertCircle size={20} />
                            <div>
                                <p className="font-black uppercase tracking-widest text-[8px]">{t('mismatch')}</p>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight">{t('idMismatchDesc')}</p>
                            </div>
                        </div>
                        <button onClick={handleStartKyc} className="w-full bg-[#5845D8] text-white font-black py-2.5 rounded-xl shadow-lg text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                            {t('verifyAgain')}
                        </button>
                    </div>
                );
            case 'blocked_duplicate':
                return (
                    <div className="flex items-center gap-3 text-red-600 bg-red-50/30 p-4 rounded-2xl border border-red-100/30 font-sans">
                        <Shield size={20} />
                        <div>
                            <p className="font-black uppercase tracking-widest text-[8px]">{t('blocked')}</p>
                            <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight">{t('duplicateIdDesc')}</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-4 font-sans">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-relaxed opacity-80">{t('completeVerificationToPost')}</p>
                        <button onClick={handleStartKyc} className="w-full bg-[#5845D8] text-white font-black py-3 rounded-xl text-[9px] uppercase tracking-widest shadow-md shadow-[#5845D8]/15 hover:scale-[1.02] transition-all active:scale-95">
                            {t('verifyNow')}
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-sans text-[#012126]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* KYC Card */}
                {kycStatus !== 'approved' && (
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#5845D8]/5 rounded-bl-[50px] -mr-8 -mt-8 group-hover:bg-[#5845D8]/10 transition-all"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="font-black text-[#012126] flex items-center gap-2 text-[9px] uppercase tracking-widest">
                                <Shield size={14} className="text-[#5845D8]" /> {t('verification')}
                            </h3>
                        </div>

                        <div className="flex-1 flex flex-col justify-center relative z-10">
                            {renderKycContent()}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className={`${kycStatus === 'approved' ? 'md:col-span-3' : 'md:col-span-2'} grid grid-cols-1 sm:grid-cols-2 gap-5`}>
                    <Link to="/post-trip" className="bg-[#5845D8] p-5 rounded-[24px] text-white shadow-lg shadow-[#5845D8]/15 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all h-full flex flex-col justify-between border border-[#5845D8]">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                        <div>
                            <Plane size={24} className="mb-3 text-white/90" />
                            <h3 className="text-base font-black mb-1 tracking-tight uppercase">{t('postATrip')}</h3>
                            <p className="text-white/60 text-[9px] font-black leading-relaxed uppercase tracking-wider opacity-80">{t('monetizeLuggageDesc')}</p>
                        </div>
                        <div className="font-black text-white mt-5 flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-widest text-[7px]">
                            {t('getStarted')} <span>→</span>
                        </div>
                    </Link>

                    <Link to="/search" className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative group cursor-pointer hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-gray-50 rounded-bl-[40px] -mr-4 -mt-4 group-hover:bg-[#5845D8]/5 transition-all"></div>
                        <div>
                            <Package size={24} className="mb-3 text-[#5845D8]" />
                            <h3 className="text-base font-black text-[#012126] mb-1 tracking-tight uppercase">{t('sendPackage')}</h3>
                            <p className="text-gray-400 text-[9px] font-black leading-relaxed uppercase tracking-wider opacity-80">{t('findTravelerDesc')}</p>
                        </div>
                        <div className="font-black text-[#5845D8] mt-5 flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-widest text-[7px]">
                            {t('findTraveler')} <span>→</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: t('completed'), value: userStats?.completedBookings || '0', icon: CheckCircle, color: 'text-green-500' },
                    { label: t('inTransit'), value: userStats?.activePackages || '0', icon: Clock, color: 'text-blue-500' },
                    {
                        label: t('totalEarned'),
                        value: `${user?.balance?.toFixed(2) || '0.00'} ${user?.preferredCurrency || 'USD'}`,
                        icon: Wallet,
                        color: 'text-[#5845D8]'
                    },
                    { label: t('community'), value: userStats?.totalUsers || '0', icon: Shield, color: 'text-indigo-500' },
                    { label: t('rating'), value: '5.0', icon: AlertCircle, color: 'text-amber-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm text-center group hover:border-[#5845D8]/20 transition-all">
                        <div className={`mx-auto w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center mb-2 ${stat.color} group-hover:bg-white transition-colors`}>
                            <stat.icon size={14} />
                        </div>
                        <p className="text-sm font-black text-[#012126] tracking-tight">{stat.value}</p>
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
