import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Shield, ChevronLeft, CheckCircle, Clock, AlertCircle,
    ArrowRight, Loader2, Lock, Globe
} from 'lucide-react';
import Dojah from 'dojah-kyc-sdk-react';
import { useAuth } from '../AuthContext';
import api from '../api';

const WIDGET_ID = '6a107b3f9e9b60b7a55f5fdf';

// Steps: 'status' | 'consent' | 'verifying'
export default function Verify() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const navigate = useNavigate();

    const [kycStatus, setKycStatus] = useState('not_started');
    const [pageLoading, setPageLoading] = useState(true);
    const [step, setStep] = useState('status');

    // Consent
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    // Dojah
    const [dojahCreds, setDojahCreds] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/login?redirect=/verify');
        else if (isAuthenticated) fetchKycStatus();
    }, [authLoading, isAuthenticated]);

    const fetchKycStatus = async () => {
        try {
            setPageLoading(true);
            const res = await api.get('/api/bago/kyc/status');
            const status = user?.kycStatus === 'approved' ? 'approved'
                : res.data?.kycStatus || res.data?.status || 'not_started';
            setKycStatus(status);
        } catch {
            setKycStatus(user?.kycStatus === 'approved' ? 'approved' : 'not_started');
        } finally {
            setPageLoading(false);
        }
    };

    const handleStartVerification = async () => {
        setActionLoading(true);
        setError('');
        try {
            const res = await api.post('/api/bago/kyc/dojah/start');
            setDojahCreds(res.data);
            setStep('verifying');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to start verification.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDojahResponse = (type, data) => {
        if (type === 'success') {
            setKycStatus('pending');
            setStep('status');
            setDojahCreds(null);
        } else if (type === 'close') {
            setStep('consent');
            setDojahCreds(null);
        } else if (type === 'error') {
            setError(typeof data === 'string' ? data : 'Verification encountered an error. Please try again.');
            setStep('consent');
            setDojahCreds(null);
        }
    };

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F6F3]">
                <Loader2 className="animate-spin text-[#5845D8]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans text-[#012126]">
            <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <button
                    onClick={() => {
                        if (step === 'consent') setStep('status');
                        else navigate(-1);
                    }}
                    className="flex items-center gap-2 text-[#012126] hover:text-[#5845D8] transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span className="font-bold text-sm">Back</span>
                </button>
                <Link to="/"><img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" /></Link>
                <div className="w-20" />
            </nav>

            {/* Dojah widget — renders nothing visible, auto-opens modal on mount */}
            {step === 'verifying' && dojahCreds && (
                <Dojah
                    appID={dojahCreds.appId}
                    publicKey={dojahCreds.publicKey}
                    type="custom"
                    config={{ widget_id: WIDGET_ID }}
                    userData={{ email: user?.email || undefined }}
                    metadata={{ userId: dojahCreds.userId }}
                    referenceId={dojahCreds.userId}
                    response={handleDojahResponse}
                />
            )}

            <main className="max-w-2xl mx-auto px-6 py-12 md:py-20">
                {(kycStatus === 'approved' || kycStatus === 'pending' || kycStatus === 'processing') ? (
                    <StatusCard
                        kycStatus={kycStatus}
                        navigate={navigate}
                        t={t}
                        onResubmit={() => { setStep('consent'); setKycStatus('not_started'); }}
                    />
                ) : step === 'status' ? (
                    <LandingCard onStart={() => setStep('consent')} />
                ) : step === 'consent' ? (
                    <ConsentCard
                        termsAccepted={termsAccepted}
                        setTermsAccepted={setTermsAccepted}
                        privacyAccepted={privacyAccepted}
                        setPrivacyAccepted={setPrivacyAccepted}
                        actionLoading={actionLoading}
                        error={error}
                        onContinue={handleStartVerification}
                    />
                ) : (
                    /* Verifying — modal is open, show subtle background while Dojah overlay is active */
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-[#5845D8]/5">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-4">
                                <Shield size={30} className="text-[#5845D8]" />
                            </div>
                            <h1 className="text-2xl font-black mb-1 tracking-tight uppercase">Verification in Progress</h1>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-[2px]">Follow the instructions in the overlay</p>
                        </div>
                        <div className="p-8 md:p-12 flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-[#5845D8]" size={32} />
                            <p className="text-sm text-gray-500 font-medium text-center">
                                A secure verification window is open. Complete the steps there to verify your identity.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Having trouble verifying?</p>
                    <Link to="/help" className="text-[#5845D8] font-black text-[10px] uppercase tracking-widest hover:underline">
                        Contact Bago Support
                    </Link>
                </div>
            </main>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LandingCard({ onStart }) {
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-[#5845D8]/5">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6">
                    <Shield size={40} className="text-[#5845D8]" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">Identity Verification</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">Secure your account and build trust</p>
            </div>
            <div className="p-8 md:p-12 space-y-8">
                <p className="text-gray-500 font-medium leading-relaxed text-center">
                    {t('kycIntro') || 'To maintain a safe and trusted community, we require identity verification before posting trips or shipping items.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Fast & Secure', desc: 'Verified in minutes using advanced AI.', icon: <Lock size={18} /> },
                        { title: 'Trust Badge', desc: 'Get a verified shield on your profile.', icon: <CheckCircle size={18} /> },
                        { title: 'Global Access', desc: 'Send packages to any destination.', icon: <Globe size={18} /> },
                        { title: 'Secure Payouts', desc: 'Required for all financial withdrawals.', icon: <Shield size={18} /> },
                    ].map((item, i) => (
                        <div key={i} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:border-[#5845D8]/20 transition-all group">
                            <div className="text-[#5845D8] mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
                            <h3 className="font-black text-[10px] uppercase tracking-wider mb-1">{item.title}</h3>
                            <p className="text-[10px] font-bold text-gray-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onStart}
                    className="w-full bg-[#5845D8] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 group"
                >
                    Start Verification
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                    Your data is encrypted and protected
                </p>
            </div>
        </div>
    );
}

function ConsentCard({ termsAccepted, setTermsAccepted, privacyAccepted, setPrivacyAccepted, actionLoading, error, onContinue }) {
    const canContinue = termsAccepted && privacyAccepted && !actionLoading;
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-[#5845D8]/5">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-4">
                    <Shield size={30} className="text-[#5845D8]" />
                </div>
                <h1 className="text-2xl font-black mb-1 tracking-tight uppercase">Data Protection & Consent</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[2px]">Required before verification</p>
            </div>
            <div className="p-8 md:p-12 space-y-6">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    To verify your identity we collect and process your personal data, including government-issued ID documents and biometric information. This is required by applicable law and our platform terms.
                </p>
                <div className="space-y-3">
                    <p className="font-black text-xs uppercase tracking-wider text-gray-700">What we collect</p>
                    {[
                        "Government-issued photo ID (passport, national ID, driver's licence)",
                        'A selfie or short video for liveness verification',
                        'Name, date of birth, and address from your ID',
                        'Device and location metadata during the session',
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <CheckCircle size={16} className="text-[#5845D8] shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>
                <div className="space-y-4 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={e => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#5845D8] cursor-pointer"
                        />
                        <span className="text-xs text-gray-600 font-medium leading-relaxed">
                            I have read and agree to the{' '}
                            <Link to="/terms" target="_blank" className="text-[#5845D8] font-bold hover:underline">Terms & Conditions</Link>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={privacyAccepted}
                            onChange={e => setPrivacyAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#5845D8] cursor-pointer"
                        />
                        <span className="text-xs text-gray-600 font-medium leading-relaxed">
                            I consent to the collection and processing of my personal data as described in the{' '}
                            <Link to="/privacy" target="_blank" className="text-[#5845D8] font-bold hover:underline">Privacy Policy</Link>
                            , including processing by our identity verification partner.
                        </span>
                    </label>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                        <AlertCircle size={18} />
                        <p className="text-xs font-bold">{error}</p>
                    </div>
                )}

                <button
                    onClick={onContinue}
                    disabled={!canContinue}
                    className="w-full bg-[#5845D8] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                    {actionLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            I Agree — Start Verification
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function StatusCard({ kycStatus, navigate, t, onResubmit }) {
    if (kycStatus === 'approved') {
        return (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-green-50/50">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6 relative">
                        <Shield size={40} className="text-[#5845D8]" />
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full border-4 border-white">
                            <CheckCircle size={16} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">Identity Verified</h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">You have full access to Bago</p>
                </div>
                <div className="p-8 md:p-12">
                    <div className="flex items-start gap-4 p-6 bg-green-50 rounded-3xl border border-green-100 mb-8">
                        <CheckCircle className="text-green-500 shrink-0" size={24} />
                        <p className="text-sm text-green-700 font-medium leading-relaxed">
                            Your identity has been successfully verified. You can now post trips, send packages, and withdraw your earnings.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('/dashboard')} className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a262c] transition-all">
                            Go to Dashboard
                        </button>
                        <button onClick={() => navigate('/post-trip')} className="w-full bg-[#5845D8] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#4838B5] transition-all">
                            Post a Trip
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-amber-50/50">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6">
                    <Clock size={40} className="text-amber-500 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">Verification Pending</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">Under review</p>
            </div>
            <div className="p-8 md:p-12 space-y-6">
                <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <Clock className="text-amber-500 shrink-0 animate-pulse" size={24} />
                    <p className="text-sm text-amber-700 font-medium leading-relaxed">
                        We are reviewing your documents. This usually takes 5–30 minutes. We will notify you once complete.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a262c] transition-all">
                        Back to Dashboard
                    </button>
                    <button onClick={onResubmit} className="w-full border-2 border-[#5845D8] text-[#5845D8] py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all">
                        Re-submit Documents
                    </button>
                </div>
            </div>
        </div>
    );
}
