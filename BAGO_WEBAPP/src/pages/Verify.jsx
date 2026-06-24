import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Shield, ChevronLeft, CheckCircle, Clock, AlertCircle,
    ArrowRight, Loader2, Lock, Globe,
} from 'lucide-react';
import Dojah from 'dojah-kyc-sdk-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api';

// ─── Country helpers ──────────────────────────────────────────────────────────

const ISO_COUNTRY_CODES = [
    'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ',
    'BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR',
    'IO','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL','CN','CX','CC',
    'CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO',
    'EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF',
    'GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY',
    'HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM',
    'JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY',
    'LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX',
    'FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI',
    'NE','NG','NU','NF','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH',
    'PN','PL','PT','PR','QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC',
    'WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS',
    'SS','ES','LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK',
    'TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU',
    'VE','VN','VG','VI','WF','EH','YE','ZM','ZW',
];

const REGION_NAMES = typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const countryFlag = (code) =>
    String(code || '').toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt()));

const countryLabel = (code) => REGION_NAMES?.of(code) || code;

const KYC_COUNTRIES = ISO_COUNTRY_CODES
    .map((code) => ({ code, flag: countryFlag(code), name: countryLabel(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));

const normalizeCountryCode = (value) => {
    const text = String(value || '').trim().toUpperCase();
    if (!text) return '';
    const byCode = KYC_COUNTRIES.find((c) => c.code === text);
    if (byCode) return byCode.code;
    const byName = KYC_COUNTRIES.find((c) => c.name.toUpperCase() === text);
    return byName?.code || '';
};

// ─── Status normaliser ────────────────────────────────────────────────────────

const normalizeKycStatus = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    if (['approved', 'verified', 'completed'].includes(s)) return 'approved';
    if (['pending', 'pending_admin_review', 'pending_review', 'admin_review',
         'manual_review', 'processing', 'under_review', 'submitted'].includes(s)) return 'pending';
    if (['declined', 'rejected', 'failed', 'failed_verification',
         'blocked_duplicate', 'expired'].includes(s)) return 'declined';
    return 'not_started';
};

// ─── Error boundary to prevent Dojah widget crashes taking down the whole app ─

class DojahErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { crashed: false };
    }
    static getDerivedStateFromError() {
        return { crashed: true };
    }
    render() {
        if (this.state.crashed) {
            this.props.onError?.();
            return null;
        }
        return this.props.children;
    }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Verify() {
    const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const pollRef = useRef(null);

    const [kycStatus, setKycStatus]     = useState('not_started');
    const [pageLoading, setPageLoading] = useState(true);
    // 'status'   — landing / status card
    // 'consent'  — consent form
    // 'verifying'— Dojah overlay is active
    // 'name'     — user must enter legal name before proceeding
    // 'review'   — account under security review
    // 'blocked'  — permanently blocked
    const [step, setStep]               = useState('status');

    const [termsAccepted, setTermsAccepted]     = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [countryDetecting, setCountryDetecting] = useState(true);

    // Name collection
    const [legalFirstName, setLegalFirstName] = useState(user?.firstName || '');
    const [legalLastName,  setLegalLastName]  = useState(user?.lastName  || '');
    const [nameSaving,     setNameSaving]     = useState(false);

    const [dojahCreds, setDojahCreds]       = useState(null); // { appId, publicKey, widgetId, userId, referenceId }
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError]                 = useState('');
    const [blockMsg, setBlockMsg]           = useState('');

    // ── Auth guard ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/login?redirect=/verify');
        else if (isAuthenticated) fetchKycStatus();
    }, [authLoading, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── IP-based country detection ─────────────────────────────────────────────
    useEffect(() => {
        // Pre-fill from profile while IP resolves
        const profileCountry = normalizeCountryCode(
            user?.country || user?.countryCode || user?.country_code,
        );
        if (profileCountry) setSelectedCountry(profileCountry);

        let cancelled = false;
        (async () => {
            try {
                const res  = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
                const json = await res.json();
                const detected = normalizeCountryCode(json?.country_code || json?.country);
                if (!cancelled && detected) setSelectedCountry(detected);
            } catch { /* keep profile fallback */ } finally {
                if (!cancelled) setCountryDetecting(false);
            }
        })();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Cleanup polling on unmount ─────────────────────────────────────────────
    useEffect(() => () => stopPolling(), []);

    // ── KYC status + pre-check ────────────────────────────────────────────────
    const fetchKycStatus = async () => {
        try {
            setPageLoading(true);

            // Run the security pre-check first
            try {
                const preRes = await api.get('/api/bago/kyc/pre-check');
                const preData = preRes.data || {};

                if (preData.status === 'already_verified') {
                    setKycStatus('approved');
                    setPageLoading(false);
                    return;
                }
                if (preData.status === 'pending_name' || preData.nameRequired) {
                    setStep('name');
                    setPageLoading(false);
                    return;
                }
                if (preData.status === 'pending_security_review') {
                    setStep('review');
                    setBlockMsg(preData.message || '');
                    setPageLoading(false);
                    return;
                }
                if (preData.status === 'blocked') {
                    setStep('blocked');
                    setBlockMsg(preData.message || '');
                    setPageLoading(false);
                    return;
                }
            } catch { /* pre-check failure is non-fatal — fall through to normal status fetch */ }

            const res    = await api.get('/api/bago/kyc/status');
            const status = normalizeKycStatus(res.data?.kycStatus || res.data?.kyc_status);
            setKycStatus(status);
            if (status === 'pending') startPolling();
        } catch {
            setKycStatus('not_started');
        } finally {
            setPageLoading(false);
        }
    };

    // ── Save legal name (when user is in pending_name step) ───────────────────
    const handleSaveLegalName = async () => {
        setNameSaving(true);
        setError('');
        try {
            await api.post('/api/bago/kyc/update-legal-name', {
                firstName: legalFirstName.trim(),
                lastName:  legalLastName.trim(),
            });
            // Re-run pre-check to see if they can proceed now
            await fetchKycStatus();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not save name. Please try again.');
        } finally {
            setNameSaving(false);
        }
    };

    // ── Polling ────────────────────────────────────────────────────────────────
    const startPolling = () => {
        if (pollRef.current) return;
        const deadline = Date.now() + 300_000; // 5 min cap
        pollRef.current = setInterval(async () => {
            if (Date.now() > deadline) { stopPolling(); return; }
            try {
                const res    = await api.get('/api/bago/kyc/status');
                const status = normalizeKycStatus(res.data?.kycStatus || res.data?.kyc_status);
                setKycStatus(status);
                if (status === 'approved' || status === 'declined' || status === 'blocked_duplicate') {
                    stopPolling();
                    await refreshUser();
                }
            } catch { /* keep polling */ }
        }, 3000);
    };

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    // ── Start verification ─────────────────────────────────────────────────────
    const handleStartVerification = async () => {
        setActionLoading(true);
        setError('');
        try {
            if (!selectedCountry) throw new Error('Please choose your country before starting.');

            // Preflight: check if there's already a final result from a previous session.
            // Mirrors the Flutter preflight call to /kyc/dojah/sync-existing.
            try {
                const preflightRes = await api.post('/api/bago/kyc/dojah/sync-existing', {});
                const preflightStatus = preflightRes.data?.kycStatus;
                const canStartNew    = preflightRes.data?.canStartNewSession !== false;

                if (preflightStatus === 'approved' || preflightStatus === 'blocked_duplicate') {
                    setKycStatus(preflightStatus);
                    await refreshUser();
                    return;
                }
                if (preflightStatus === 'declined' && canStartNew === false) {
                    setKycStatus('declined');
                    return;
                }
                if (preflightStatus === 'pending' && !canStartNew) {
                    setKycStatus('pending');
                    startPolling();
                    return;
                }
            } catch { /* preflight failure is non-fatal — proceed normally */ }

            const res  = await api.post('/api/bago/kyc/dojah/start', { country: selectedCountry });
            const data = res.data || {};
            const appId       = data.appId       || data.appID     || data.app_id;
            const publicKey   = data.publicKey   || data.public_key;
            const widgetId    = data.widgetId    || data.widget_id;
            const referenceId = data.referenceId || data.reference_id;
            if (!appId || !publicKey || !widgetId) {
                throw new Error('Verification service is not configured. Please contact support.');
            }
            // Clear Dojah session cache from both localStorage and sessionStorage
            // so the widget always opens a brand-new session with the fresh referenceId.
            try {
                Object.keys(localStorage)
                    .filter((k) => /dojah/i.test(k))
                    .forEach((k) => localStorage.removeItem(k));
                Object.keys(sessionStorage)
                    .filter((k) => /dojah/i.test(k))
                    .forEach((k) => sessionStorage.removeItem(k));
            } catch { /* ignore private-mode errors */ }
            setDojahCreds({ appId, publicKey, widgetId, userId: data.userId, referenceId });
            setStep('verifying');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to start verification.');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Dojah response handler ─────────────────────────────────────────────────
    const handleDojahResponse = async (type, data) => {
        if (type === 'success') {
            // Capture the creds snapshot before clearing them
            const credsCopy = dojahCreds;
            setDojahCreds(null);
            setStep('status');

            // Prefer the referenceId we sent (guaranteed fresh).
            // Fall back to what Dojah returned in the callback.
            const ourRef    = credsCopy?.referenceId;
            const callbackRef = data?.reference_id || data?.referenceId;
            const syncRef   = ourRef || callbackRef;

            // If Dojah returned a DIFFERENT reference, it resumed an old session.
            // Still sync — but use our reference so we query the correct session.
            const isStaleResumption = callbackRef && ourRef && callbackRef !== ourRef;
            if (isStaleResumption) {
                // Dojah found a previous session — sync its result without exposing widget jank
                console.warn('Dojah resumed old session:', callbackRef, '— syncing with our reference:', ourRef);
            }

            try {
                setKycStatus('pending');
                if (syncRef) {
                    const syncRes = await api.post('/api/bago/kyc/dojah/sync-result', { referenceId: syncRef });
                    const status  = normalizeKycStatus(syncRes.data?.kycStatus || syncRes.data?.kyc_status);
                    setKycStatus(status);
                    if (['approved', 'declined', 'blocked_duplicate'].includes(status)) {
                        await refreshUser();
                    } else {
                        startPolling();
                    }
                } else {
                    startPolling();
                }
            } catch {
                startPolling();
            }
        } else if (type === 'close') {
            setDojahCreds(null);
            setStep('consent');
        } else if (type === 'error') {
            setDojahCreds(null);
            setStep('consent');
            setError(typeof data === 'string' ? data : 'Verification encountered an error. Please try again.');
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F6F3]">
                <Loader2 className="animate-spin text-[#5845D8]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F3] font-sans text-[#012126]">

            {/* Nav */}
            <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <button
                    onClick={() => step === 'consent' ? setStep('status') : navigate(-1)}
                    className="flex items-center gap-2 text-[#012126] hover:text-[#5845D8] transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span className="font-bold text-sm">Back</span>
                </button>
                <Link to="/"><img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" /></Link>
                <div className="w-20" />
            </nav>

            {/* Dojah widget — always receives a FRESH referenceId generated by the
                backend for this specific attempt. This prevents the widget from
                resuming any previous session stored server-side by Dojah. */}
            {step === 'verifying' && dojahCreds && (
                <DojahErrorBoundary onError={() => {
                    setDojahCreds(null);
                    setStep('consent');
                    setError('Verification widget failed to load. Please try again.');
                }}>
                    <Dojah
                        appID={dojahCreds.appId}
                        publicKey={dojahCreds.publicKey}
                        type="custom"
                        config={{ widget_id: dojahCreds.widgetId }}
                        referenceId={dojahCreds.referenceId || undefined}
                        userData={{
                            first_name: user?.firstName || undefined,
                            last_name:  user?.lastName  || undefined,
                            residence_country: selectedCountry || undefined,
                        }}
                        metadata={{
                            user_id:      dojahCreds.userId,
                            userId:       dojahCreds.userId,
                            referenceId:  dojahCreds.referenceId,
                            reference_id: dojahCreds.referenceId,
                            country:      selectedCountry,
                        }}
                        response={handleDojahResponse}
                    />
                </DojahErrorBoundary>
            )}

            <main className="max-w-2xl mx-auto px-6 py-12 md:py-20">

                {/* ── Security gate steps (shown before any KYC flow) ── */}
                {step === 'name' && (
                    <NameCollectionCard
                        firstName={legalFirstName}
                        lastName={legalLastName}
                        onFirstNameChange={setLegalFirstName}
                        onLastNameChange={setLegalLastName}
                        saving={nameSaving}
                        error={error}
                        onSave={handleSaveLegalName}
                    />
                )}

                {step === 'review' && (
                    <ReviewCard message={blockMsg} navigate={navigate} />
                )}

                {step === 'blocked' && (
                    <BlockedCard message={blockMsg} navigate={navigate} />
                )}

                {/* ── Normal KYC flow (only shown when not in a security gate step) ── */}
                {!['name', 'review', 'blocked'].includes(step) && (
                    <>
                        {/* Status screens (approved / pending) */}
                        {kycStatus === 'approved' && (
                            <ApprovedCard navigate={navigate} />
                        )}

                        {kycStatus === 'pending' && step !== 'verifying' && (
                            <PendingCard
                                navigate={navigate}
                                onResubmit={() => { stopPolling(); setKycStatus('not_started'); setStep('consent'); }}
                            />
                        )}

                        {/* Not-started / declined flow */}
                        {(kycStatus === 'not_started' || kycStatus === 'declined') && (
                            <>
                                {step === 'status' && (
                                    <LandingCard
                                        declined={kycStatus === 'declined'}
                                        onStart={() => { setError(''); setStep('consent'); }}
                                        t={t}
                                    />
                                )}

                                {step === 'consent' && (
                                    <ConsentCard
                                        selectedCountry={selectedCountry}
                                        setSelectedCountry={setSelectedCountry}
                                        countryDetecting={countryDetecting}
                                        termsAccepted={termsAccepted}
                                        setTermsAccepted={setTermsAccepted}
                                        privacyAccepted={privacyAccepted}
                                        setPrivacyAccepted={setPrivacyAccepted}
                                        actionLoading={actionLoading}
                                        error={error}
                                        onContinue={handleStartVerification}
                                    />
                                )}

                                {step === 'verifying' && (
                                    <VerifyingCard />
                                )}
                            </>
                        )}
                    </>
                )}

                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Having trouble verifying?</p>
                    <Link to="/support" className="text-[#5845D8] font-black text-[10px] uppercase tracking-widest hover:underline">
                        Contact Bago Support
                    </Link>
                </div>
            </main>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LandingCard({ declined, onStart, t }) {
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-[#5845D8]/5">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6">
                    <Shield size={40} className="text-[#5845D8]" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">
                    {declined ? 'Verification Not Approved' : 'Identity Verification'}
                </h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">
                    {declined ? 'Please re-submit your documents' : 'Secure your account and build trust'}
                </p>
            </div>
            <div className="p-8 md:p-12 space-y-8">
                {declined && (
                    <div className="flex items-start gap-4 p-5 bg-red-50 rounded-3xl border border-red-100">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-700 font-medium leading-relaxed">
                            Your previous verification was not approved. Please try again with a clear photo ID and a well-lit selfie.
                        </p>
                    </div>
                )}
                {!declined && (
                    <p className="text-gray-500 font-medium leading-relaxed text-center">
                        {t('kycIntro') || 'To maintain a safe and trusted community, we require identity verification before posting trips or shipping items.'}
                    </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Fast & Secure', desc: 'Verified in minutes using advanced AI.', icon: <Lock size={18} /> },
                        { title: 'Trust Badge',   desc: 'Get a verified shield on your profile.',  icon: <CheckCircle size={18} /> },
                        { title: 'Global Access', desc: 'Send packages to any destination.',        icon: <Globe size={18} /> },
                        { title: 'Secure Payouts',desc: 'Required for all financial withdrawals.', icon: <Shield size={18} /> },
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
                    {declined ? 'Re-submit Verification' : (t('startVerification') || 'Start Verification')}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                    Your data is encrypted and protected
                </p>
            </div>
        </div>
    );
}

function ConsentCard({
    selectedCountry, setSelectedCountry, countryDetecting,
    termsAccepted, setTermsAccepted,
    privacyAccepted, setPrivacyAccepted,
    actionLoading, error, onContinue,
}) {
    const canContinue = Boolean(selectedCountry) && termsAccepted && privacyAccepted && !actionLoading;
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

                {/* Country picker */}
                <div>
                    <label className="block font-black text-xs uppercase tracking-wider text-gray-700 mb-2">
                        Country for verification
                    </label>
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        disabled={countryDetecting}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none focus:border-[#5845D8] focus:ring-4 focus:ring-[#5845D8]/10 disabled:opacity-60"
                    >
                        {countryDetecting
                            ? <option value="">Detecting your location…</option>
                            : <option value="">Select your country</option>
                        }
                        {KYC_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                    </select>
                    <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {countryDetecting ? 'Detecting from your IP…' : 'You can change this if it looks wrong.'}
                    </p>
                </div>

                {/* What we collect */}
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

                {/* Consent checkboxes */}
                <div className="space-y-4 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#5845D8] cursor-pointer"
                        />
                        <span className="text-xs text-gray-600 font-medium leading-relaxed">
                            I have read and agree to the{' '}
                            <Link to="/terms" target="_blank" className="text-[#5845D8] font-bold hover:underline">Terms & Conditions</Link>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={privacyAccepted}
                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
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
                        <AlertCircle size={18} className="shrink-0" />
                        <p className="text-xs font-bold">{error}</p>
                    </div>
                )}

                <button
                    onClick={onContinue}
                    disabled={!canContinue}
                    className="w-full bg-[#5845D8] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                    {actionLoading
                        ? <Loader2 className="animate-spin" size={20} />
                        : <><span>I Agree — Start Verification</span><ArrowRight size={20} /></>
                    }
                </button>
            </div>
        </div>
    );
}

function VerifyingCard() {
    return (
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
                    A secure verification window is open. Complete all steps there to verify your identity.
                </p>
            </div>
        </div>
    );
}

function ApprovedCard({ navigate }) {
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

function PendingCard({ navigate, onResubmit }) {
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
                        We are reviewing your documents. This usually takes about 5 minutes. We will notify you by email once complete.
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

// ─── Name collection gate ─────────────────────────────────────────────────────
function NameCollectionCard({ firstName, lastName, onFirstNameChange, onLastNameChange, saving, error, onSave }) {
    const canSave = firstName.trim().length >= 2 && lastName.trim().length >= 2 && !saving;
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-[#5845D8]/5">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-4">
                    <Shield size={30} className="text-[#5845D8]" />
                </div>
                <h1 className="text-2xl font-black mb-1 tracking-tight uppercase">Confirm Your Legal Name</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[2px]">Required before identity verification</p>
            </div>
            <div className="p-8 md:p-12 space-y-6">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    Please enter your full legal name exactly as it appears on your government-issued ID. This is required for identity verification.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block font-black text-xs uppercase tracking-wider text-gray-700 mb-2">First Name</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => onFirstNameChange(e.target.value)}
                            placeholder="e.g. Aanuoluwapo"
                            autoComplete="given-name"
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none focus:border-[#5845D8] focus:ring-4 focus:ring-[#5845D8]/10"
                        />
                    </div>
                    <div>
                        <label className="block font-black text-xs uppercase tracking-wider text-gray-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => onLastNameChange(e.target.value)}
                            placeholder="e.g. Johnson"
                            autoComplete="family-name"
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm font-bold text-[#111827] outline-none focus:border-[#5845D8] focus:ring-4 focus:ring-[#5845D8]/10"
                        />
                    </div>
                </div>
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                        <AlertCircle size={18} className="shrink-0" />
                        <p className="text-xs font-bold">{error}</p>
                    </div>
                )}
                <button
                    onClick={onSave}
                    disabled={!canSave}
                    className="w-full bg-[#5845D8] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <><span>Confirm Name & Continue</span><ArrowRight size={20} /></>}
                </button>
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                    Use your legal name exactly as it appears on your ID
                </p>
            </div>
        </div>
    );
}

// ─── Security review gate ─────────────────────────────────────────────────────
function ReviewCard({ navigate }) {
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-amber-50/50">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6">
                    <Clock size={40} className="text-amber-500 animate-pulse" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight uppercase">Account Under Review</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">Security verification in progress</p>
            </div>
            <div className="p-8 md:p-12 space-y-6">
                <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <Clock className="text-amber-500 shrink-0 mt-0.5" size={24} />
                    <p className="text-sm text-amber-700 font-medium leading-relaxed">
                        Your account is currently under review by our security team. We will notify you by email once the review is complete. This usually takes 1–2 business days.
                    </p>
                </div>
                <p className="text-xs text-gray-500 font-medium text-center leading-relaxed">
                    If you believe this is a mistake, please contact{' '}
                    <a href="mailto:support@sendwithbago.com" className="text-[#5845D8] font-bold hover:underline">
                        support@sendwithbago.com
                    </a>
                </p>
                <button onClick={() => navigate('/dashboard')} className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a262c] transition-all">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}

// ─── Hard block gate ──────────────────────────────────────────────────────────
function BlockedCard({ navigate }) {
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 text-center border-b border-gray-50 bg-red-50/50">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-black mb-2 tracking-tight uppercase">Verification Unavailable</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[3px]">Account restricted</p>
            </div>
            <div className="p-8 md:p-12 space-y-6">
                <div className="flex items-start gap-4 p-6 bg-red-50 rounded-3xl border border-red-100">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-700 font-medium leading-relaxed">
                        Your account cannot proceed with verification at this time. Due to our internal security and compliance policy, we are unable to allow this account to proceed.
                    </p>
                </div>
                <p className="text-xs text-gray-500 font-medium text-center leading-relaxed">
                    If you believe this is a mistake, please contact{' '}
                    <a href="mailto:support@sendwithbago.com" className="text-[#5845D8] font-bold hover:underline">
                        support@sendwithbago.com
                    </a>
                </p>
                <button onClick={() => navigate('/dashboard')} className="w-full bg-[#012126] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0a262c] transition-all">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
