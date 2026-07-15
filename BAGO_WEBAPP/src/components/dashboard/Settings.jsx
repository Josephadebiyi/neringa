import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { User, Mail, Shield, Camera, Check, RefreshCw, Landmark, CheckCircle, ShieldCheck, AlertCircle, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const COUNTRY_CODES = [
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
    { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹' },
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
    { code: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
    { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
    { code: 'SN', name: 'Senegal', dial: '+221', flag: '🇸🇳' },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
    { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
    { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
    { code: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
    { code: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
    { code: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
    { code: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
    { code: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
    { code: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
    { code: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
    { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
    { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
    { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
    { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
    { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
    { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
    { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
    { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
    { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
    { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
    { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
    { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
    { code: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
];

// Maps a country of residence to Bago's supported earning currencies, so
// picking a country auto-suggests the right currency instead of asking users
// to guess from a bare currency-code list.
const COUNTRY_TO_CURRENCY = {
    NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
    LT: 'EUR', LV: 'EUR', EE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', FI: 'EUR',
    GB: 'GBP',
    US: 'USD',
    CA: 'CAD',
    AU: 'AUD', NZ: 'AUD',
};

const PAYOUT_CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'ZAR'];

function parsePhone(fullPhone) {
    if (!fullPhone) return { dial: '+1', local: '' };
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
        if (fullPhone.startsWith(c.dial)) {
            return { dial: c.dial, local: fullPhone.slice(c.dial.length) };
        }
    }
    if (fullPhone.startsWith('+')) return { dial: '+1', local: fullPhone.slice(1) };
    return { dial: '+1', local: fullPhone };
}

function CountryPhoneInput({ value, onChange, placeholder = 'Phone number', disabled = false, className = '' }) {
    const parsed = parsePhone(value);
    const [dialCode, setDialCode] = useState(parsed.dial);
    const [localNumber, setLocalNumber] = useState(parsed.local);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const p = parsePhone(value);
        setDialCode(p.dial);
        setLocalNumber(p.local);
    }, [value]);

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLocal = (e) => {
        const v = e.target.value.replace(/[^\d\s\-()]/g, '');
        setLocalNumber(v);
        onChange(dialCode + v);
    };

    const handleDial = (dial) => {
        setDialCode(dial);
        setOpen(false);
        setSearch('');
        onChange(dial + localNumber);
    };

    const filtered = COUNTRY_CODES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search)
    );

    const selected = COUNTRY_CODES.find(c => c.dial === dialCode) || COUNTRY_CODES[0];

    return (
        <div className={`flex gap-1.5 ${className}`} ref={dropdownRef}>
            <div className="relative shrink-0">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen(o => !o)}
                    className="h-full flex items-center gap-1 px-2.5 py-2 bg-gray-50 border border-transparent rounded-xl text-[10px] font-black text-[#111827] hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    <span className="text-sm">{selected.flag}</span>
                    <span>{dialCode}</span>
                    <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                    <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-2 border-b border-gray-50">
                            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-xl">
                                <Search size={11} className="text-gray-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search country..."
                                    className="flex-1 bg-transparent outline-none text-[10px] font-bold text-[#111827] placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            {filtered.map(c => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleDial(c.dial)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5845D8]/5 transition-all ${dialCode === c.dial ? 'bg-[#5845D8]/10' : ''}`}
                                >
                                    <span className="text-base">{c.flag}</span>
                                    <span className="flex-1 text-[10px] font-bold text-[#111827] truncate">{c.name}</span>
                                    <span className="text-[10px] font-black text-[#5845D8]">{c.dial}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <input
                type="tel"
                value={localNumber}
                onChange={handleLocal}
                disabled={disabled}
                placeholder={placeholder}
                className="min-w-0 flex-1 px-3 py-2 bg-gray-50 border border-transparent focus:border-[#5845D8]/20 focus:bg-white rounded-xl outline-none font-black text-[10px] text-[#111827] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}

export default function Settings({ user, checkAuthStatus }) {
    const { currency, setCurrency, t } = useLanguage();
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [dateOfBirth, setDateOfBirth] = useState(() => {
        if (user?.dateOfBirth) {
            return new Date(user.dateOfBirth).toISOString().split('T')[0];
        }
        return '';
    });
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [showPhoneOtp, setShowPhoneOtp] = useState(false);
    const [phoneOtp, setPhoneOtp] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [showEmailOtp, setShowEmailOtp] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [preferredCurrency, setPreferredCurrency] = useState(user?.earningCurrency || user?.preferredCurrency || '');
    const [residenceCountry, setResidenceCountry] = useState(user?.country || '');
    const earningLocked = user?.earningCurrencyLocked ?? false;
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
    const [bankCode, setBankCode] = useState(user?.bankDetails?.bankCode || '');
    const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
    const [accountHolderName, setAccountHolderName] = useState(user?.bankDetails?.accountHolderName || '');
    const [banks, setBanks] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [showBankOtp, setShowBankOtp] = useState(false);
    const [bankOtp, setBankOtp] = useState('');
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [switchToBankPayout, setSwitchToBankPayout] = useState(false);
    const linkedPayoutCurrency = String(
        user?.payoutAccount?.currency ||
        user?.payout_account?.currency ||
        user?.payoutCurrency ||
        user?.payout_currency ||
        user?.earningCurrency ||
        user?.preferredCurrency ||
        'USD'
    ).toUpperCase();
    const [payoutCurrency, setPayoutCurrency] = useState(linkedPayoutCurrency);

    const phoneVerified = user?.phoneVerified || false;
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneSuccess, setPhoneSuccess] = useState(false);

    useEffect(() => {
        if (user?.earningCurrency || user?.preferredCurrency) {
            setPreferredCurrency(user.earningCurrency || user.preferredCurrency);
        }
        if (user?.phone) {
            setPhone(user.phone);
        }
    }, [user?._id, user?.preferredCurrency, user?.phone]);

    useEffect(() => {
        setPayoutCurrency(linkedPayoutCurrency);
    }, [linkedPayoutCurrency]);

    // Re-sync name and DOB when user data updates (e.g. after identity verification)
    useEffect(() => {
        if (user?.firstName) setFirstName(user.firstName);
        if (user?.lastName) setLastName(user.lastName);
        if (user?.dateOfBirth) {
            try {
                setDateOfBirth(new Date(user.dateOfBirth).toISOString().split('T')[0]);
            } catch { /* ignore invalid date */ }
        }
    }, [user?.firstName, user?.lastName, user?.dateOfBirth]);

    const handleSendPhoneOtp = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 7) return;
        setPhoneLoading(true);
        setError('');
        try {
            await api.post('/api/bago/user/request-phone-change', { newPhone: phone });
            setShowPhoneOtp(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification code.');
        } finally {
            setPhoneLoading(false);
        }
    };

    const handleVerifyPhoneOtp = async () => {
        if (!phoneOtp || phoneOtp.length < 4) return;
        setPhoneLoading(true);
        setError('');
        try {
            await api.post('/api/bago/user/verify-phone-change', { otp: phoneOtp });
            setShowPhoneOtp(false);
            setPhoneOtp('');
            setPhoneSuccess(true);
            if (checkAuthStatus) checkAuthStatus();
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code.');
        } finally {
            setPhoneLoading(false);
        }
    };

    // Flutterwave is the sole active payout provider — bank/IBAN setup is no
    // longer currency-branched between "African bank" and "PayPal email".
    // EUR/GBP use IBAN + SWIFT/BIC instead of the bank-list picker.
    const ibanCurrencies = ['EUR', 'GBP'];
    const isIbanCurrency = ibanCurrencies.includes(payoutCurrency);
    const bankDetails = user?.bankDetails || user?.bank_details || {};
    const payoutProvider = String(user?.payoutProvider || user?.payout_provider || '').toLowerCase();
    const payoutMethod = String(user?.payoutMethod || user?.payout_method || '').toLowerCase();
    const payoutStatus = String(user?.payoutStatus || user?.payout_status || '').toLowerCase();
    const payoutMethodStatus = String(user?.payoutMethodStatus || user?.payout_method_status || '').toLowerCase();
    const hasConnectedPayout = Boolean(
        payoutProvider === 'paypal' ||
        payoutMethod === 'paypal' ||
        (payoutStatus === 'active' && payoutProvider === 'paypal') ||
        (payoutMethodStatus === 'connected' && payoutProvider === 'paypal')
    );
    const connectedPaypalEmail = user?.bankDetails?.paypalEmail || user?.bank_details?.paypalEmail || '';
    const hasBankPayout = Boolean(
        user?.bankAccountLinked ||
        user?.bank_account_linked ||
        bankDetails?.recipientCode ||
        bankDetails?.recipient_code ||
        bankDetails?.accountNumber ||
        bankDetails?.account_number
    );
    // Only surface the legacy PayPal panel for an account that's already
    // connected on it — no new PayPal connections are offered going forward.
    // switchToBankPayout lets an already-connected legacy user move to the
    // new Flutterwave bank/IBAN flow (PayPal connect is no longer available).
    const showConnectedPayoutOption = hasConnectedPayout && !switchToBankPayout;
    const showBankOption = !hasConnectedPayout || switchToBankPayout;

    useEffect(() => {
        if (!showBankOption || isIbanCurrency) return;
        const countryByCurrency = { USD: 'NG', NGN: 'NG', KES: 'KE', ZAR: 'ZA' };
        api.get(`/api/payouts/flutterwave/banks?country=${countryByCurrency[payoutCurrency] || 'NG'}&currency=${payoutCurrency}`)
            .then((res) => setBanks(res.data?.banks || res.data?.data || []))
            .catch(() => setBanks([]));
    }, [showBankOption, isIbanCurrency, payoutCurrency]);

    const handlePayoutCurrencyChange = (nextCurrency) => {
        const next = String(nextCurrency || '').toUpperCase();
        if (!next || next === payoutCurrency) return;
        if (user?.kycStatus !== 'approved' && !user?.isKycCompleted) {
            setError('Complete identity verification before changing your payout currency.');
            navigate('/verify');
            return;
        }
        const keep = linkedPayoutCurrency;
        const confirmed = window.confirm(
            `You must link and confirm a ${next} payout account before Bago changes your wallet payout currency. If you cancel setup, Bago will keep ${keep}. Continue?`
        );
        if (!confirmed) {
            setPayoutCurrency(keep);
            return;
        }
        setPayoutCurrency(next);
        setBankCode('');
        setBankName('');
        setAccountNumber('');
        setAccountHolderName('');
        setIban('');
        setSwiftBic('');
        setShowBankOtp(false);
        setBankOtp('');
        setError('');
        setSuccessMessage(`Add and confirm your ${next} account. Your stored currency remains ${keep} until OTP verification succeeds.`);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Lock earning currency on first save if not yet locked
            if (!earningLocked && preferredCurrency) {
                await api.post('/api/bago/activate-earning', { currency: preferredCurrency });
            }
            const res = await api.put('/api/bago/edit', {
                firstName,
                lastName,
                dateOfBirth,
                country: residenceCountry,
                bankDetails: {
                    bankName,
                    accountNumber,
                    accountHolderName
                }
            });
            if (res.data.status === 'success') {
                setCurrency(preferredCurrency);
                localStorage.setItem('baggo_currency', preferredCurrency);
                setSuccessMessage(t('settingsUpdated'));
                await checkAuthStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || t('failedUpdateSettings'));
        } finally {
            setLoading(false);
        }
    };


    const handleRequestEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/bago/user/request-email-change', { newEmail });
            setShowEmailOtp(true);
            setSuccessMessage(t('otpSentEmail'));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request email change');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmailChange = async () => {
        if (!emailOtp || emailOtp.length < 4) return;
        setLoading(true);
        setError('');
        try {
            await api.post('/api/bago/user/verify-email-change', { otp: emailOtp });
            setShowEmailOtp(false);
            setEmailOtp('');
            setNewEmail('');
            setSuccessMessage('Email address updated successfully.');
            if (checkAuthStatus) checkAuthStatus();
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartBankSetup = async () => {
        setError('');
        setSuccessMessage('');
        if (!accountNumber || !bankCode) {
            setError('Select a bank and enter your account number.');
            return;
        }
        setBankLoading(true);
        try {
            const selectedBank = banks.find(bank => String(bank.code) === String(bankCode));
            const res = await api.post('/api/payouts/flutterwave/connect', {
                accountNumber,
                bankCode,
                bankName: selectedBank?.name || bankName,
                currency: payoutCurrency,
            });
            if (res.data.success) {
                setAccountHolderName(res.data.accountName || '');
                setBankName(selectedBank?.name || bankName);
                setShowBankOtp(true);
                setSuccessMessage(res.data.message || 'Confirmation code sent.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not start bank verification.');
        } finally {
            setBankLoading(false);
        }
    };

    // EUR/GBP — IBAN + SWIFT/BIC instead of the bank-list picker above.
    const [iban, setIban] = useState('');
    const [swiftBic, setSwiftBic] = useState('');
    const handleStartIbanSetup = async () => {
        setError('');
        setSuccessMessage('');
        const cleanedIban = iban.replace(/\s/g, '').toUpperCase();
        if (!accountHolderName.trim()) {
            setError('Enter the account holder name.');
            return;
        }
        if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(cleanedIban)) {
            setError('Enter a valid IBAN.');
            return;
        }
        if (!swiftBic.trim()) {
            setError('Enter the SWIFT/BIC code.');
            return;
        }
        setBankLoading(true);
        try {
            const res = await api.post('/api/payouts/flutterwave/connect', {
                accountHolderName: accountHolderName.trim(),
                iban: cleanedIban,
                bankName: bankName.trim(),
                swiftBic: swiftBic.trim().toUpperCase(),
                currency: payoutCurrency,
            });
            if (res.data.success) {
                setShowBankOtp(true);
                setSuccessMessage(res.data.message || 'Confirmation code sent.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not start bank verification.');
        } finally {
            setBankLoading(false);
        }
    };

    const handleVerifyBankOtp = async () => {
        setError('');
        setSuccessMessage('');
        if (!bankOtp.trim()) {
            setError('Enter the bank confirmation code.');
            return;
        }
        setBankLoading(true);
        try {
            const res = await api.post('/api/payouts/flutterwave/verify-bank-otp', { otp: bankOtp.trim() });
            if (res.data.success) {
                await api.post('/api/bago/activate-earning', { currency: payoutCurrency });
                setShowBankOtp(false);
                setBankOtp('');
                setPreferredCurrency(payoutCurrency);
                setCurrency(payoutCurrency);
                localStorage.setItem('baggo_currency', payoutCurrency);
                setSuccessMessage(res.data.message || 'Bank account linked successfully.');
                await checkAuthStatus();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not verify bank OTP.');
        } finally {
            setBankLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1200px] pb-10 font-sans text-[#111827]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Edit */}
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
                        <User className="text-[#5845D8]" size={16} />
                        <h3 className="font-black text-[#111827] text-[10px] uppercase tracking-widest">{t('personalInfo')}</h3>
                    </div>

                    <div className="flex justify-center mb-5 relative group">
                        <div className="w-16 h-16 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-xl font-black border-[3px] border-white shadow-md overflow-hidden relative">
                            {user?.image ? <img src={user.image} alt="User" className="w-full h-full object-cover" /> : (firstName?.charAt(0) || 'B')}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera className="text-white" size={16} />
                            </div>
                        </div>
                        {user?.isVerified && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white p-0.5 rounded-full border-[3px] border-white shadow-sm" title={t('verified')}>
                                <Check size={12} strokeWidth={4} />
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                                    {t('firstName')}
                                    {user?.kycStatus === 'approved' && <Shield size={8} className="text-green-500" />}
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={user?.kycStatus === 'approved'}
                                    className={`w-full px-4 py-2 rounded-xl border font-black text-[11px] transition-all uppercase tracking-tight ${user?.kycStatus === 'approved' ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-100 focus:border-[#5845D8]/20 focus:bg-white outline-none'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                                    {t('lastName')}
                                    {user?.kycStatus === 'approved' && <Shield size={8} className="text-green-500" />}
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={user?.kycStatus === 'approved'}
                                    className={`w-full px-4 py-2 rounded-xl border font-black text-[11px] transition-all uppercase tracking-tight ${user?.kycStatus === 'approved' ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-100 focus:border-[#5845D8]/20 focus:bg-white outline-none'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('dateOfBirth') || 'Date of Birth'}</label>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                disabled={user?.kycStatus === 'approved'}
                                className={`w-full px-4 py-2 rounded-xl border font-black text-[11px] transition-all uppercase tracking-tight ${user?.kycStatus === 'approved' ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-100 focus:border-[#5845D8]/20 focus:bg-white outline-none'}`}
                            />
                        </div>

                        {!earningLocked && (
                            <div className="pt-2 border-t border-gray-50 mt-2">
                                <div className="bg-[#5845D8]/5 p-3 rounded-2xl border border-[#5845D8]/10 mb-2">
                                    <label className="block text-[8px] font-black text-[#5845D8] uppercase tracking-widest mb-1.5 ml-1">
                                        Country of residence
                                    </label>
                                    <select
                                        value={residenceCountry}
                                        onChange={(e) => {
                                            const code = e.target.value;
                                            setResidenceCountry(code);
                                            const suggested = COUNTRY_TO_CURRENCY[code];
                                            if (suggested) setPreferredCurrency(suggested);
                                        }}
                                        className="w-full px-4 py-2 rounded-xl border border-transparent font-black text-[11px] transition-all uppercase tracking-tight bg-white focus:border-[#5845D8]/20 outline-none appearance-none"
                                    >
                                        <option value="">— select your country —</option>
                                        {COUNTRY_CODES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[7px] text-[#5845D8]/60 font-medium mt-1 uppercase tracking-wider ml-1">
                                        * Sets your earning currency below automatically.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-50 mt-2">
                            <div className="bg-[#5845D8]/5 p-3 rounded-2xl border border-[#5845D8]/10 mb-2">
                                <label className="block text-[8px] font-black text-[#5845D8] uppercase tracking-widest mb-1.5 ml-1">
                                    {t('walletReceivingCurrency') || 'Earning Currency'}
                                </label>
                                {earningLocked ? (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#5845D8]/10">
                                        <span className="font-black text-[13px] text-[#111827] uppercase tracking-tight">{preferredCurrency}</span>
                                        <span className="ml-auto text-[7px] font-black text-[#5845D8]/60 uppercase tracking-widest bg-[#5845D8]/10 px-2 py-0.5 rounded-full">Locked</span>
                                    </div>
                                ) : (
                                    <select
                                        value={preferredCurrency}
                                        onChange={(e) => setPreferredCurrency(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl border border-transparent font-black text-[11px] transition-all uppercase tracking-tight bg-white focus:border-[#5845D8]/20 outline-none appearance-none"
                                    >
                                        <option value="">— select your earning currency —</option>
                                        {['USD', 'NGN', 'ZAR', 'KES', 'GHS', 'EUR', 'GBP', 'CAD', 'AUD'].map(curr => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-[7px] text-[#5845D8]/60 font-medium mt-1 uppercase tracking-wider ml-1">
                                    {earningLocked
                                        ? '* Earning currency is locked. Contact support to change it.'
                                        : '* Set once — this is the currency you will receive for trip bookings.'}
                                </p>
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
                        <h3 className="font-black text-[#111827] text-[10px] uppercase tracking-widest">{t('emailSettings')}</h3>
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
                                    <button onClick={handleVerifyEmailChange} disabled={!emailOtp || emailOtp.length < 4 || loading} className="flex-1 bg-[#5845D8] text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest disabled:opacity-50">{loading ? '...' : t('verify')}</button>
                                    <button onClick={() => setShowEmailOtp(false)} className="px-3 text-gray-400 font-black text-[8px] uppercase tracking-widest">{t('cancel')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Phone Verification */}
            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Shield className="text-[#5845D8]" size={16} />
                        <h3 className="font-black text-[#111827] text-[10px] uppercase tracking-widest">Phone Number</h3>
                    </div>
                    {phoneVerified || phoneSuccess ? (
                        <span className="flex items-center gap-1 text-green-600 font-black text-[8px] uppercase tracking-widest">
                            <CheckCircle size={12} /> Verified
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-amber-600 font-black text-[8px] uppercase tracking-widest">
                            <AlertCircle size={12} /> Unverified
                        </span>
                    )}
                </div>

                {phoneVerified || phoneSuccess ? (
                    <div className="flex items-center gap-3 bg-green-50/50 rounded-xl p-3 border border-green-100">
                        <CheckCircle className="text-green-600 shrink-0" size={16} />
                        <div>
                            <p className="font-black text-[10px] text-green-700 uppercase tracking-widest">Phone Verified</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{phone || user?.phone}</p>
                        </div>
                    </div>
                ) : !showPhoneOtp ? (
                    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                {user?.phone ? 'Current Phone' : 'Phone Number'}
                            </label>
                            <CountryPhoneInput
                                value={phone}
                                onChange={setPhone}
                                placeholder="Phone number"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!phone || phoneLoading}
                            className="w-full border-2 border-[#5845D8]/20 text-[#5845D8] py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {phoneLoading ? <RefreshCw className="animate-spin" size={12} /> : null}
                            {user?.phone ? 'Send Code to Verify' : 'Add & Verify Phone'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <p className="text-[9px] text-gray-500 font-bold">We sent a 6-digit code to <strong>{phone}</strong> via SMS.</p>
                        <div>
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Verification Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full px-4 py-2.5 bg-[#5845D8]/5 rounded-xl border border-[#5845D8]/20 outline-none focus:border-[#5845D8] font-black text-center text-sm tracking-[8px]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleVerifyPhoneOtp}
                                disabled={phoneLoading || phoneOtp.length < 4}
                                className="flex-1 bg-[#5845D8] text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {phoneLoading ? <RefreshCw className="animate-spin" size={12} /> : null}
                                Verify
                            </button>
                            <button onClick={() => { setShowPhoneOtp(false); setPhoneOtp(''); }} className="px-3 text-gray-400 font-black text-[8px] uppercase tracking-widest">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payout Settings */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                    <Landmark className="text-[#5845D8]" size={18} />
                    <h3 className="font-black text-[#111827] text-[11px] uppercase tracking-widest">{t('withdrawalMethods')}</h3>
                </div>

                {user?.kycStatus !== 'approved' && !user?.isKycCompleted && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                        <div className="flex-1">
                            <p className="font-black text-[10px] text-amber-900 uppercase tracking-wider mb-1">Identity Verification Required</p>
                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">You need to verify your identity before setting up payout methods.</p>
                        </div>
                        <button
                            onClick={() => navigate('/verify')}
                            className="shrink-0 bg-amber-500 text-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 transition-all"
                        >
                            Verify Now
                        </button>
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-[#5845D8]/10 bg-[#5845D8]/5 p-4">
                    <label className="mb-2 block text-[8px] font-black uppercase tracking-widest text-[#5845D8]">
                        Payout and wallet currency
                    </label>
                    <select
                        value={payoutCurrency}
                        onChange={(event) => handlePayoutCurrencyChange(event.target.value)}
                        disabled={bankLoading}
                        className="w-full rounded-xl border border-[#5845D8]/10 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-tight text-[#111827] outline-none focus:border-[#5845D8]/30 disabled:opacity-60"
                    >
                        {PAYOUT_CURRENCIES.map((code) => (
                            <option key={code} value={code}>{code}</option>
                        ))}
                    </select>
                    <p className="mt-2 text-[8px] font-bold leading-relaxed text-[#5845D8]/70">
                        Selecting another currency starts account setup. Bago keeps {linkedPayoutCurrency} unless the new account is confirmed by email OTP.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {showConnectedPayoutOption && (
                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 h-full flex flex-col gap-4 group hover:border-[#5845D8]/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="w-5 h-5 rounded-full bg-[#003087] text-white flex items-center justify-center text-[8px] font-black shrink-0">P</span>
                                    <h4 className="text-[10px] font-black text-[#111827] uppercase tracking-widest">PayPal Payout Email</h4>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wide opacity-70">
                                    Earnings in {payoutCurrency} are sent to your PayPal account after delivery is confirmed.
                                </p>

                                {hasConnectedPayout && connectedPaypalEmail && (
                                    <div className="flex items-center gap-3 bg-green-50/50 p-3 rounded-xl border border-green-500/10">
                                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">PayPal connected</p>
                                            <p className="text-[9px] text-green-600 font-bold truncate">{connectedPaypalEmail}</p>
                                        </div>
                                        <ShieldCheck className="text-green-500/50 shrink-0" size={16} />
                                    </div>
                                )}

                                {hasConnectedPayout && !connectedPaypalEmail && (
                                    <div className="flex items-center gap-3 bg-green-50/50 p-3 rounded-xl border border-green-500/10">
                                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">PayPal payout active</p>
                                            <p className="text-[8px] text-green-600 font-bold uppercase opacity-60">Ready for withdrawals</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setSwitchToBankPayout(true)}
                                    className="text-[9px] font-black text-[#003087] uppercase tracking-widest hover:underline text-left"
                                >
                                    Switch to bank payout →
                                </button>
                            </div>
                        </div>
                    )}

                    {showBankOption && (
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-[#5845D8]/20 transition-all">
                                <h4 className="flex items-center gap-2 text-[10px] font-black text-[#111827] mb-4 uppercase tracking-widest">
                                    <span className="w-5 h-5 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[8px]">2</span>
                                    Bank Transfer ({payoutCurrency})
                                </h4>
                                {hasBankPayout && (
                                    <div className="mb-4 flex items-center gap-3 bg-green-50/50 p-3 rounded-xl border border-green-500/10">
                                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Bank payout connected</p>
                                            <p className="text-[8px] text-green-600 font-bold uppercase opacity-60">
                                                {bankDetails?.bankName || bankDetails?.bank_name || bankName || 'Bank transfer'}
                                            </p>
                                        </div>
                                        <ShieldCheck className="text-green-500/50" size={18} />
                                    </div>
                                )}
                                <div className="space-y-2.5">
                                    {isIbanCurrency ? (
                                        <>
                                            <input
                                                type="text"
                                                value={accountHolderName}
                                                onChange={(e) => setAccountHolderName(e.target.value)}
                                                placeholder="Account holder name"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#111827] shadow-sm uppercase tracking-tight"
                                            />
                                            <input
                                                type="text"
                                                value={iban}
                                                onChange={(e) => setIban(e.target.value)}
                                                placeholder="IBAN"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#111827] shadow-sm tracking-widest uppercase"
                                            />
                                            <input
                                                type="text"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                placeholder="Bank name"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#111827] shadow-sm"
                                            />
                                            <input
                                                type="text"
                                                value={swiftBic}
                                                onChange={(e) => setSwiftBic(e.target.value)}
                                                placeholder="SWIFT/BIC"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#111827] shadow-sm tracking-widest uppercase"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                value={bankCode}
                                                onChange={(e) => {
                                                    setBankCode(e.target.value);
                                                    const selectedBank = banks.find(bank => String(bank.code) === e.target.value);
                                                    setBankName(selectedBank?.name || '');
                                                }}
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#111827] shadow-sm uppercase tracking-tight"
                                            >
                                                <option value="">Select bank</option>
                                                {banks.map((bank) => (
                                                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                                placeholder={t('accountNumber')}
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent focus:border-[#5845D8]/20 outline-none text-[11px] font-black text-[#111827] shadow-sm tracking-widest"
                                            />
                                            <input
                                                type="text"
                                                value={accountHolderName}
                                                onChange={(e) => setAccountHolderName(e.target.value)}
                                                placeholder={t('accountHolderName')}
                                                readOnly
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-transparent outline-none text-[11px] font-black text-[#111827] shadow-sm uppercase tracking-tight opacity-70"
                                            />
                                        </>
                                    )}
                                    {!showBankOtp ? (
                                        <button
                                            type="button"
                                            onClick={isIbanCurrency ? handleStartIbanSetup : handleStartBankSetup}
                                            disabled={bankLoading}
                                            className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {bankLoading ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                                            Verify bank account
                                        </button>
                                    ) : (
                                        <div className="space-y-2.5 pt-2">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={bankOtp}
                                                onChange={(e) => setBankOtp(e.target.value)}
                                                placeholder="000000"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-[#5845D8]/20 outline-none text-center text-sm font-black tracking-[8px] text-[#111827] shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyBankOtp}
                                                disabled={bankLoading}
                                                className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {bankLoading ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                                                Confirm payout account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex justify-end">
                    <button
                        onClick={handleUpdateProfile}
                        className="px-6 py-3 bg-[#5845D8] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center gap-2 shadow-lg"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                        {t('saveDetails')}
                    </button>
                </div>
            </div>


            {/* Status Messages */}
            {successMessage && (
                <div className="fixed bottom-10 right-10 bg-[#5845D8] text-white px-5 py-3.5 rounded-[20px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500 z-50 border border-white/20 backdrop-blur-md">
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
        <h4 className="flex items-center gap-2 text-sm font-black text-[#111827] mb-4">
            <span className="w-6 h-6 rounded-full bg-[#5845D8] text-white flex items-center justify-center text-[10px]">2</span>
            Nigerian Bank Transfer (NGN)
        </h4>
        <div className="space-y-3">
            <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#111827]"
            />
            <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm font-bold text-[#111827]"
            />
            <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Account Holder Name"
                className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-100 focus:border-[#5845D8] outline-none text-sm font-bold text-[#111827]"
            />
        </div>
    </div>
);
