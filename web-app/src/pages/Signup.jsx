import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveToken } from '../api';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { countries } from '../utils/countries';

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
        <div className="min-h-screen bg-white flex lg:flex-row flex-col">
            {/* Left side banner */}
            <div className="lg:w-1/2 w-full lg:min-h-screen h-[35vh] relative bg-[#054752] flex flex-col justify-between p-8 md:p-16 overflow-hidden">
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-tl-[120px] -mr-20 -mb-20"></div>
                <div className="absolute top-20 right-20 w-48 h-48 bg-[#5845D8] rounded-full blur-[80px] opacity-40"></div>

                <div className="z-10">
                    <Link to="/">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10 brightness-0 invert opacity-90" />
                    </Link>
                </div>

                <div className="z-10 text-white mt-auto mb-10 md:mb-16">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">Move stuff. <br />Make money.</h1>
                    <p className="text-base md:text-lg text-white/80 max-w-sm font-medium leading-relaxed">
                        Join thousands of travelers and senders in the Bago community.
                    </p>
                </div>
            </div>

            {/* Right side form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-8 bg-white z-10 lg:min-h-screen">
                <div className="w-full max-w-md py-12">
                    <h2 className="text-3xl font-bold text-[#054752] mb-2">Create Account</h2>
                    <p className="text-[#708c91] font-medium mb-8">Get started with Bago in minutes.</p>

                    {showOtp ? (
                        <div className="space-y-6">
                            <div className="bg-[#5845D8]/5 p-6 rounded-2xl border border-[#5845D8]/10 text-center">
                                <h3 className="text-lg font-bold text-[#054752] mb-2">Check your email</h3>
                                <p className="text-sm text-[#708c91]">
                                    We sent a code to <span className="font-bold text-[#5845D8]">{formData.email}</span>
                                </p>
                            </div>

                            {success && (
                                <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-sm font-medium">{success}</div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium">{error}</div>
                            )}

                            <form onSubmit={handleOtpVerify} className="space-y-6">
                                <div className="flex justify-center">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 text-center text-4xl font-black tracking-[1em] focus:border-[#5845D8] focus:bg-white bg-[#f8f9fa] outline-none transition-all text-[#5845D8]"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify Email'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(false)}
                                    className="w-full text-sm font-bold text-[#708c91] hover:text-[#054752] transition-colors"
                                >
                                    ← Change details
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Google Signup */}
                            <button
                                onClick={() => handleGoogleSignup()}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 rounded-xl font-bold text-[#054752] hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                <span>Sign up with Google</span>
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Or with email</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium">{error}</div>
                            )}

                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-[#054752] mb-2">Email address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border border-gray-200 focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#054752] font-medium"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#054752] mb-2">Country</label>
                                        <div className="relative">
                                            <select
                                                value={formData.countryCode}
                                                onChange={handleCountrySelect}
                                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border border-gray-200 focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#054752] font-medium appearance-none cursor-pointer"
                                                required
                                            >
                                                <option value="">Select country</option>
                                                {countries.map(c => (
                                                    <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#054752] mb-2">Phone number</label>
                                        <PhoneInput
                                            country={formData.countryCode?.toLowerCase() || 'gb'}
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            inputStyle={{
                                                width: '100%',
                                                height: '52px',
                                                padding: '12px 14px 12px 52px',
                                                borderRadius: '12px',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '14px',
                                                background: '#f8f9fa',
                                                fontFamily: 'inherit'
                                            }}
                                            buttonStyle={{
                                                borderRadius: '12px 0 0 12px',
                                                border: '1px solid #e5e7eb',
                                                borderRight: 'none',
                                                background: '#f8f9fa'
                                            }}
                                            dropdownStyle={{ zIndex: 9999, borderRadius: '12px' }}
                                            inputProps={{ required: true }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#054752] mb-2">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border border-gray-200 focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#054752] font-medium"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#054752] mb-2">Referral code (Optional)</label>
                                        <input
                                            type="text"
                                            name="referralCode"
                                            value={formData.referralCode}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border border-gray-200 focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#054752] font-medium"
                                            placeholder="REFERRAL123"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold mt-4 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                                >
                                    {loading ? 'Creating Account...' : 'Continue'}
                                </button>

                                <p className="text-center text-[11px] text-[#708c91] mt-6 px-4">
                                    By clicking Continue, you agree to Bago's <Link to="/terms" className="text-[#5845D8] font-bold">Terms</Link> and <Link to="/privacy" className="text-[#5845D8] font-bold">Privacy Policy</Link>.
                                </p>
                            </form>
                        </div>
                    )}

                    <p className="mt-8 text-center text-[#708c91] font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#5845D8] font-bold hover:text-[#4838B5] transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

