import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, ChevronLeft, CheckCircle, Clock, AlertCircle, ArrowRight, Loader2, Lock, Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api';

export default function Verify() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [kycStatus, setKycStatus] = useState('not_started');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login?redirect=/verify');
        } else if (isAuthenticated) {
            fetchKycStatus();
        }
    }, [authLoading, isAuthenticated, navigate]);

    const fetchKycStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/bago/kyc/status');
            setKycStatus(res.data?.kycStatus || 'not_started');
        } catch (err) {
            setKycStatus('not_started');
        } finally {
            setLoading(false);
        }
    };

    const handleStartKyc = async () => {
        try {
            setActionLoading(true);
            setError('');
            const response = await api.post('/api/bago/kyc/create-session');
            const url = response.data.sessionUrl || response.data.diditSessionUrl;

            if (url) {
                // Redirect current page instead of opening popup
                window.location.href = url;
            } else {
                setError('Could not create verification session. Please try again or contact support.');
            }
        } catch (err) {
            setError('Failed to start verification. Please try again later.');
        } finally {
            setActionLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F6F3]">
                <Loader2 className="animate-spin text-[#5845D8]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans text-[#012126]">
            {/* Header */}
            <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#012126] hover:text-[#5845D8] transition-colors">
                    <ChevronLeft size={20} />
                    <span className="font-bold text-sm">{t('back') || 'Back'}</span>
                </button>
                <Link to="/">
                    <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
                </Link>
                <div className="w-10 md:w-20" /> {/* Spacer */}
            </nav>

            <main className="max-w-2xl mx-auto px-6 py-12 md:py-20">
                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Status Header */}
                    <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-[#5845D8]/5">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6 relative">
                            <Shield size={40} className="text-[#5845D8]" />
                            {kycStatus === 'approved' && (
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full border-4 border-white">
                                    <CheckCircle size={16} />
                                </div>
                            )}
                        </div>
                        <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">
                            {kycStatus === 'approved' ? t('identityVerified') || 'Identity Verified' :
                                kycStatus === 'pending' || kycStatus === 'processing' ? t('verificationPending') || 'Verification Pending' :
                                    t('identityVerification') || 'Identity Verification'}
                        </h1>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">
                            {kycStatus === 'approved' ? t('verifiedSubtitle') || 'You have full access to Bago' :
                                t('secureYourAccount') || 'Secure your account and build trust'}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12">
                        {kycStatus === 'approved' ? (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex items-start gap-4 p-6 bg-green-50 rounded-3xl border border-green-100">
                                    <CheckCircle className="text-green-500 shrink-0" size={24} />
                                    <div>
                                        <p className="font-black text-green-900 uppercase text-xs tracking-wider mb-1">{t('congratulations') || 'Congratulations!'}</p>
                                        <p className="text-sm text-green-700 font-medium leading-relaxed">
                                            {t('verificationSuccessDesc') || 'Your identity has been successfully verified. You can now post trips, send packages, and withdraw your earnings without limits.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => navigate('/dashboard')} className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a262c] transition-all">
                                        {t('goDashboard') || 'Go to Dashboard'}
                                    </button>
                                    <button onClick={() => navigate('/post-trip')} className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#4838B5] transition-all">
                                        {t('postTrip') || 'Post a Trip'}
                                    </button>
                                </div>
                            </div>
                        ) : kycStatus === 'pending' || kycStatus === 'processing' ? (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                                    <Clock className="text-amber-500 shrink-0 animate-pulse" size={24} />
                                    <div>
                                        <p className="font-black text-amber-900 uppercase text-xs tracking-wider mb-1">{t('underReview') || 'Under Review'}</p>
                                        <p className="text-sm text-amber-700 font-medium leading-relaxed">
                                            {t('underReviewDesc') || 'We are currently reviewing your documents. This usually takes between 5 to 30 minutes. We will notify you once it\'s complete.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">{t('nextSteps') || 'Next Steps'}</h3>
                                    <ul className="space-y-3">
                                        {[
                                            { text: t('verificationReviewStep') || 'Our team is reviewing your identity documents', icon: <Clock size={14} /> },
                                            { text: t('notificationOnCompletion') || 'You\'ll receive a notification once verification is complete', icon: <ArrowRight size={14} /> }
                                        ].map((step, i) => (
                                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-[#012126]">
                                                <div className="text-[#5845D8]">{step.icon}</div>
                                                {step.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => navigate('/dashboard')} className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a262c] transition-all">
                                        {t('backDashboard') || 'Back to Dashboard'}
                                    </button>
                                    <button onClick={handleStartKyc} disabled={actionLoading} className="w-full border-2 border-[#5845D8] text-[#5845D8] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all">
                                        {actionLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : t('reSubmitDocs') || 'Re-submit Documents'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="space-y-6">
                                    <p className="text-gray-500 font-medium leading-relaxed text-center">
                                        {t('kycIntro') || 'To maintain a safe and trusted community, we require all our users to verify their identity before posting trips or shipping items.'}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: t('fastVerification') || 'Fast & Secure', desc: t('fastVerificationDesc') || 'Verified in minutes using advanced AI.', icon: <Lock size={18} /> },
                                            { title: t('trustedBadge') || 'Trust Badge', desc: t('trustedBadgeDesc') || 'Get a verified shield on your profile.', icon: <CheckCircle size={18} /> },
                                            { title: t('globalAccess') || 'Global Access', desc: t('globalAccessDesc') || 'Send packages to any destination.', icon: <Globe size={18} /> },
                                            { title: t('securePayments') || 'Secure Payouts', desc: t('securePaymentsDesc') || 'Required for all financial withdrawals.', icon: <Shield size={18} /> }
                                        ].map((item, i) => (
                                            <div key={i} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:border-[#5845D8]/20 transition-all group">
                                                <div className="text-[#5845D8] mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                                                <h3 className="font-black text-[10px] uppercase tracking-wider mb-1">{item.title}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                                        <AlertCircle size={18} />
                                        <p className="text-xs font-black uppercase tracking-wider">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <button
                                        onClick={handleStartKyc}
                                        disabled={actionLoading}
                                        className="w-full bg-[#5845D8] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 group"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                {t('startVerification') || 'Start Verification'}
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                                        Powered by <strong>DIDIT</strong> & <strong>STRIPE</strong>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">
                        {t('havingTrouble') || 'Having trouble verifying?'}
                    </p>
                    <Link to="/help" className="text-[#5845D8] font-black text-[10px] uppercase tracking-widest hover:underline">
                        {t('contactSupport') || 'Contact Bago Support'}
                    </Link>
                </div>
            </main>
        </div>
    );
}
