import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveToken } from '../api';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { countries } from '../utils/countries';
import { CheckCircle, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';

export default function Signup() {
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
        redirect_uri: window.location.origin,
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                const response = await api.post('/api/bago/google-auth', { accessToken: tokenResponse.access_token });
                if (response.data.success) {
                    saveToken(response.data.token);
                    login(response.data.user);
                    navigate('/dashboard');
                } else {
                    setError(response.data.message || 'Google signup failed');
                }
            } catch (err) {
                console.error("Google Auth Error:", err);
                setError(err.response?.data?.message || 'Google signup failed. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Google signup failed'),
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
            setError('Password must be at least 6 characters');
            return;
        }
        if (!formData.phone || formData.phone.length < 7) {
            setError('Please enter a valid phone number');
            return;
        }
        if (!formData.country) {
            setError('Please select your country');
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
                setSuccess(response.data.message || 'A verification code has been sent to your email.');
            } else {
                setError(response.data.message || 'Signup failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error occurred during signup');
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
                setSuccess('Account verified! Redirecting to login…');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
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
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black uppercase tracking-[2px] mb-4 inline-block">Join our network</span>
                    <h1 className="text-3xl lg:text-5xl font-black mb-4 leading-none tracking-tighter">Move stuff. <br /><span className="text-[#5845D8]">Make money.</span></h1>
                    <p className="text-sm md:text-base text-white/70 max-w-sm font-semibold leading-relaxed mb-6">
                        The world's most human-centric logistics network is waiting for you.
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
                        <h2 className="text-2xl font-black text-[#012126] mb-1.5 tracking-tight">Create Account</h2>
                        <p className="text-[#6B7280] font-semibold text-base">Get started with Bago today.</p>
                    </div>

                    {showOtp ? (
                        <div className="space-y-6">
                            <div className="bg-[#5845D8]/5 p-7 rounded-[24px] border border-[#5845D8]/10 text-center">
                                <h3 className="text-base font-bold text-[#012126] mb-1">Check your inbox</h3>
                                <p className="text-[#6B7280] font-semibold text-xs">
                                    We sent a code to <br /><span className="font-bold text-[#5845D8]">{formData.email}</span>
                                </p>
                            </div>

                            {success && (
                                <div className="bg-[#5845D8]/5 border border-[#5845D8]/20 text-[#012126] p-3 rounded-xl text-[11px] font-bold flex items-center gap-2.5">
                                    <CheckCircle size={14} className="text-[#5845D8]" />
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2.5">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleOtpVerify} className="space-y-6">
                                <div className="flex justify-center">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-100 text-center text-2xl font-black tracking-[0.4em] focus:border-[#5845D8] focus:bg-white bg-[#f8f9fa] outline-none transition-all text-[#5845D8] shadow-sm"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#5845D8]/20 disabled:opacity-50 flex items-center justify-center gap-2.5"
                                >
                                    {loading ? 'Verifying...' : 'Verify My Email'}
                                    {!loading && <ArrowRight size={16} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(false)}
                                    className="w-full text-[9px] font-black text-[#6B7280] hover:text-[#012126] transition-colors uppercase tracking-widest"
                                >
                                    ← Back to details
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Google Signup */}
                            <button
                                onClick={() => handleGoogleSignup()}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-100 py-3 rounded-xl font-bold text-[#012126] text-sm hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Continue with Google</span>
                            </button>

                            <div className="relative flex items-center">
                                <div className="flex-grow border-t border-gray-50"></div>
                                <span className="flex-shrink mx-4 text-gray-300 text-[9px] font-black uppercase tracking-[2px]">Quick Signup</span>
                                <div className="flex-grow border-t border-gray-50"></div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-shake">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSignup} className="space-y-6">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">Email address</label>
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">Country</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.countryCode}
                                                    onChange={handleCountrySelect}
                                                    className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm appearance-none cursor-pointer"
                                                    required
                                                >
                                                    <option value="">Choose...</option>
                                                    {countries.map(c => (
                                                        <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <ChevronDown size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">Phone number</label>
                                            <PhoneInput
                                                country={formData.countryCode?.toLowerCase() || 'gb'}
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                inputStyle={{
                                                    width: '100%',
                                                    height: '52px',
                                                    padding: '12px 14px 12px 52px',
                                                    borderRadius: '12px',
                                                    border: '2px solid transparent',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    background: '#f8f9fa',
                                                    fontFamily: 'inherit',
                                                    color: '#012126'
                                                }}
                                                buttonStyle={{
                                                    borderRadius: '12px 0 0 12px',
                                                    border: '2px solid transparent',
                                                    borderRight: 'none',
                                                    background: 'transparent',
                                                    paddingLeft: '8px'
                                                }}
                                                dropdownStyle={{ zIndex: 9999, borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                inputProps={{ required: true }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">Password</label>
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
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">Referral (Optional)</label>
                                        <input
                                            type="text"
                                            name="referralCode"
                                            value={formData.referralCode}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                            placeholder="Code"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold text-base mt-2 transition-all shadow-xl shadow-[#5845D8]/20 hover:shadow-[#5845D8]/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0"
                                >
                                    {loading ? 'Processing...' : 'Create Account'}
                                </button>

                                <p className="text-center text-[9px] text-[#6B7280] mt-6 px-6 font-bold uppercase tracking-widest leading-relaxed">
                                    By joining, you agree to our <Link to="/terms" className="text-[#5845D8] underline">Terms</Link> & <Link to="/privacy" className="text-[#5845D8] underline">Privacy</Link>.
                                </p>
                            </form>
                        </div>
                    )}

                    <p className="mt-10 text-center text-[#6B7280] font-bold text-[13px]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#5845D8] font-black border-b-2 border-transparent hover:border-[#5845D8] transition-all ml-1">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

