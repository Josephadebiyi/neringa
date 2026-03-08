import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveToken } from '../api';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { countries } from '../utils/countries';
import { CheckCircle, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Signup() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        country: '',
        countryCode: '',
        password: '',
        confirmPassword: '',
        referralCode: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [showOtp, setShowOtp] = useState(false);
    const [signupToken, setSignupToken] = useState('');
    const [otp, setOtp] = useState('');
    const { login } = useAuth();

    // Auto-detect country from phone flag
    const [detectedCountry, setDetectedCountry] = useState('');

    const handleGoogleSignup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Google login success, response:', tokenResponse);
            setLoading(true);
            setError('');
            try {
                const response = await api.post('/api/bago/google-auth', { accessToken: tokenResponse.access_token });
                console.log('Backend google-auth response:', response.data);
                if (response.data.success) {
                    saveToken(response.data.token);
                    login(response.data.user);
                    navigate('/dashboard');
                } else {
                    setError(response.data.message || 'Google signup failed');
                }
            } catch (err) {
                console.error("Google Auth Backend Error:", err);
                const msg = err.response?.data?.message || err.message || 'Google auth failed. Technical issue.';
                setError(msg);
            } finally {
                setLoading(false);
            }
        },
        onError: (err) => {
            console.error('Google login popup error:', err);
            setError('Google login popup failed. Please allow popups.');
        }
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (value, countryData) => {
        setFormData(prev => ({
            ...prev,
            phone: value,
            country: countryData?.name || prev.country,
            countryCode: countryData?.countryCode?.toUpperCase() || prev.countryCode
        }));
    };

    const handleCountrySelect = (e) => {
        const selected = countries.find(c => c.value === e.target.value);
        setFormData(prev => ({
            ...prev,
            country: selected?.label || '',
            countryCode: selected?.value || ''
        }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            setError(t('passwordMinLength'));
            return;
        }
        if (!formData.phone || formData.phone.length < 7) {
            setError(t('validPhoneError'));
            return;
        }
        if (!formData.country) {
            setError(t('selectCountryError'));
            return;
        }

        setLoading(true);

        try {
            const payload = {
                email: formData.email,
                phone: formData.phone,
                country: formData.country,
                password: formData.password,
                confirmPassword: formData.password, // backend might still expect it
                referralCode: formData.referralCode,
                firstName: 'Bago',
                lastName: 'User',
                dateOfBirth: '2000-01-01',
            };

            const response = await api.post('/api/bago/signup', payload);
            if (response.data.success) {
                setSignupToken(response.data.signupToken);
                setShowOtp(true);
                setSuccess(response.data.message || t('verificationCodeSent'));
            } else {
                setError(response.data.message || 'Signup failed');
            }
        } catch (err) {
            console.error('Signup Request Error:', err);
            setError(err.response?.data?.message || err.message || 'Network error: Backend might be offline');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/bago/verify-signup-otp', { signupToken, otp });
            if (response.data.success) {
                setSuccess(t('accountVerifiedRedirect'));
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            console.error('OTP Verification Error:', err);
            setError(err.response?.data?.message || err.message || 'OTP verification failed. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex lg:flex-row flex-col overflow-hidden">
            {/* Left side banner */}
            <div className="lg:w-1/2 w-full lg:h-screen h-[35vh] relative flex flex-col justify-between p-8 md:p-16 overflow-hidden bg-[#012126] sticky top-0">
                {/* Background Graphics */}
                <div className="absolute inset-0 z-0">
                    <img src="/assets/hero_bg.png" className="w-full h-full object-cover opacity-20 mix-blend-overlay" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5845D8]/80 to-[#012126]/90"></div>
                </div>

                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-32 -mb-32 blur-3xl"></div>

                <div className="z-10">
                    <Link to="/" className="inline-block transition-transform hover:scale-105">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-12 brightness-0 invert opacity-90" />
                    </Link>
                </div>

                <div className="z-10 text-white mt-auto">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black uppercase tracking-[2px] mb-4 inline-block">{t('joinOurNetwork')}</span>
                    <h1 className="text-3xl lg:text-5xl font-black mb-4 leading-none tracking-tighter">{t('moveStuffMakeMoney').split(' ').map((word, i) => i < 2 ? <React.Fragment key={i}>{word} </React.Fragment> : <span key={i} className="text-[#5845D8]">{word} </span>)}</h1>
                    <p className="text-sm md:text-base text-white/70 max-w-sm font-semibold leading-relaxed mb-6">
                        {t('signupSubtitle')}
                    </p>

                    {/* App download teasers */}
                    <div className="flex items-center gap-3 opacity-70 grayscale pointer-events-none mb-8">
                        <img src="/app-store.svg" alt="" className="h-7 w-auto" />
                        <img src="/google-play.svg" alt="" className="h-7 w-auto" />
                    </div>
                </div>
            </div>

            {/* Right side form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-8 bg-white z-10 lg:min-h-screen overflow-y-auto">
                <div className="w-full max-w-md py-12">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl font-black text-[#012126] mb-1.5 tracking-tight">{t('createAccountHeader')}</h2>
                        <p className="text-[#6B7280] font-semibold text-base">{t('getStartedToday')}</p>
                    </div>

                    {showOtp ? (
                        <div className="space-y-6">
                            <div className="bg-[#5845D8]/5 p-7 rounded-[24px] border border-[#5845D8]/10 text-center">
                                <h3 className="text-base font-bold text-[#012126] mb-1">{t('checkInbox')}</h3>
                                <p className="text-[#6B7280] font-semibold text-xs">
                                    {t('sentCodeTo')} <br /><span className="font-bold text-[#5845D8]">{formData.email}</span>
                                </p>
                            </div>

                            {success && (
                                <div className="bg-[#5845D8]/5 border border-[#5845D8]/20 text-[#012126] p-3 rounded-xl text-[11px] font-bold flex items-center gap-2.5">
                                    <CheckCircle size={14} className="text-[#5845D8]" />
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2.5">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleOtpVerify} className="space-y-5">
                                <div className="space-y-1.5 text-center">
                                    <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest">{t('verificationCode')}</label>
                                    <input
                                        type="text"
                                        name="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-5 py-4 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-center text-2xl font-black tracking-[8px] text-[#012126]"
                                        placeholder="000000"
                                        maxLength="6"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#4838B5] transition-all shadow-lg"
                                >
                                    {loading ? t('processing') : t('verifyOtpBtn')}
                                </button>

                                <div className="text-center space-y-2">
                                    <p className="text-[#6B7280] font-bold text-[10px] uppercase tracking-widest">{t('didntReceiveCode')}</p>
                                    <button
                                        type="button"
                                        className="text-[#5845D8] font-black text-xs hover:underline uppercase tracking-widest"
                                    >
                                        {t('resendCode')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Google Signup */}
                            <button
                                onClick={() => handleGoogleSignup()}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-[#012126] hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm">{t('continueWithGoogle')}</span>
                            </button>

                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t-2 border-gray-50"></div>
                                <span className="flex-shrink mx-6 text-gray-300 text-[9px] font-black uppercase tracking-[3px]">{t('secureAccountSignup')}</span>
                                <div className="flex-grow border-t-2 border-gray-50"></div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('emailAddressLabel')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('phoneNumberLabel')}</label>
                                        <PhoneInput
                                            country={detectedCountry || 'us'}
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            containerClass="phone-input-container"
                                            inputClass="!w-full !h-12 !px-12 !bg-[#f8f9fa] !rounded-xl !border-2 !border-transparent focus:!border-[#5845D8] focus:!bg-white !outline-none !transition-all !text-[#012126] !font-bold !text-sm"
                                            buttonClass="!bg-transparent !border-none !px-3"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('countryLabel')}</label>
                                        <div className="relative group">
                                            <select
                                                name="country"
                                                value={formData.countryCode}
                                                onChange={handleCountrySelect}
                                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm appearance-none"
                                            >
                                                <option value="">{t('chooseCountry')}</option>
                                                {countries.map(c => (
                                                    <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#5845D8] transition-colors pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('passwordLabel')}</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('confirmPasswordLabel')}</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('referralOptional')}</label>
                                        <input
                                            type="text"
                                            name="referralCode"
                                            value={formData.referralCode}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                            placeholder="BAGOREF123"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold text-base mt-4 transition-all shadow-lg shadow-[#5845D8]/20 hover:shadow-[#5845D8]/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-3"
                                >
                                    {loading ? t('processing') : t('signupBtn')}
                                    {!loading && <ArrowRight size={18} />}
                                </button>

                                <p className="text-center text-[10px] text-[#6B7280] mt-6 px-6 font-bold uppercase tracking-wider leading-relaxed">
                                    {t('byJoiningAgree')}{' '}
                                    <Link to="/terms" className="text-[#5845D8] underline">{t('terms')}</Link> &{' '}
                                    <Link to="/privacy" className="text-[#5845D8] underline">{t('privacy')}</Link>.
                                </p>
                            </form>

                            <p className="mt-8 text-center text-[#6B7280] font-bold text-sm">
                                {t('alreadyHaveAccount')}{' '}
                                <Link to="/login" className="text-[#5845D8] font-black border-b-2 border-transparent hover:border-[#5845D8] transition-all ml-1">
                                    {t('signInHere')}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
