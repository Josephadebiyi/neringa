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

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
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
            // Send minimal data — name and DOB will come from KYC
            const payload = {
                email: formData.email,
                phone: formData.phone,
                country: formData.country,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                referralCode: formData.referralCode,
                // Placeholder name — will be overwritten by DIDIT KYC
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
        <div className="min-h-screen bg-[#F8F6F3] flex flex-col">
            {/* Header */}
            <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
                </Link>
                <p className="text-sm text-[#708c91]">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#5845D8] font-bold hover:underline">Log in</Link>
                </p>
            </nav>

            <div className="flex flex-1 items-center justify-center py-10 px-4">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-black text-[#054752] mb-2">Create your account</h1>
                        <p className="text-[#708c91] text-sm font-medium">
                            Your name & date of birth will be filled automatically after identity verification (KYC).
                        </p>
                    </div>

                    {/* Google Signup */}
                    <button
                        onClick={() => handleGoogleSignup()}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-[#054752] py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors mb-6 shadow-sm"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-sm text-gray-400 font-medium">or sign up with email</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {showOtp ? (
                        <form onSubmit={handleOtpVerify} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-[#054752] mb-2">Check your email</h2>
                            <p className="text-sm text-[#708c91] mb-6">
                                We sent a 6-digit code to <strong>{formData.email}</strong>. Enter it below to verify your account.
                            </p>

                            {success && (
                                <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm font-medium">{success}</div>
                            )}
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>
                            )}

                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl font-bold tracking-widest focus:border-[#5845D8] outline-none mb-4"
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-bold hover:bg-[#4838B5] transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Verifying…' : 'Verify & Complete'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                    required
                                />
                            </div>

                            {/* Country selection */}
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-1.5">Country</label>
                                <select
                                    value={formData.countryCode}
                                    onChange={handleCountrySelect}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white appearance-none"
                                    required
                                >
                                    <option value="">Select your country…</option>
                                    {countries.map(c => (
                                        <option key={c.value} value={c.value}>
                                            {c.flag} {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-1.5">Phone number</label>
                                <PhoneInput
                                    country={formData.countryCode?.toLowerCase() || 'gb'}
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    inputStyle={{
                                        width: '100%',
                                        padding: '12px 14px 12px 52px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                    buttonStyle={{
                                        borderRadius: '12px 0 0 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRight: 'none',
                                        background: '#f9fafb'
                                    }}
                                    dropdownStyle={{ zIndex: 9999 }}
                                    inputProps={{ required: true }}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-1.5">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                    required
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-1.5">Confirm password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter your password"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                    required
                                />
                            </div>

                            {/* Referral (optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-1.5">
                                    Referral code <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="referralCode"
                                    value={formData.referralCode}
                                    onChange={handleChange}
                                    placeholder="Enter referral code"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#5845D8] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#4838B5] transition-colors disabled:opacity-50 mt-2"
                            >
                                {loading ? 'Creating account…' : 'Create account'}
                            </button>

                            <p className="text-xs text-center text-gray-400 leading-relaxed">
                                By signing up, you agree to our{' '}
                                <Link to="/terms" className="text-[#5845D8] hover:underline">Terms</Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="text-[#5845D8] hover:underline">Privacy Policy</Link>.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
