import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveToken } from '../api';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function Signup() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        country: 'United States',
        password: '',
        confirmPassword: '',
        referralCode: ''
    });

    const BAGO_COUNTRIES = [
        "United States", "United Kingdom", "Canada", "Australia",
        "Germany", "France", "Spain", "Italy", "Nigeria",
        "South Africa", "Kenya", "Ghana", "India", "China",
        "Japan", "Brazil", "Mexico", "United Arab Emirates"
    ].sort();

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [showOtp, setShowOtp] = useState(false);
    const [signupToken, setSignupToken] = useState('');
    const [otp, setOtp] = useState('');
    const { login } = useAuth();

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

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);


        try {
            const response = await api.post('/api/bago/signup', formData);
            if (response.data.success) {
                setSignupToken(response.data.signupToken);
                setShowOtp(true);
                setSuccess(response.data.message || 'OTP sent to your email.');
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
                setSuccess('Account verified successfully!');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    if (showOtp) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-md text-center">
                    <div className="mb-8">
                        <img src="/bago_logo.png" alt="Bago" className="h-10 mx-auto" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#054752] mb-4">Verify Your Email</h2>
                    <p className="text-[#708c91] mb-8 font-medium">We've sent a 6-digit code to <span className="text-[#054752] font-bold">{formData.email}</span></p>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}
                    {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm">{success}</div>}

                    <form onSubmit={handleOtpVerify} className="space-y-6">
                        <input
                            type="text"
                            maxLength="6"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl border border-gray-200 focus:border-[#5845D8] outline-none transition-all bg-gray-50/50"
                            autoFocus
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold hover:bg-[#4838B5] transition-all shadow-lg text-lg"
                        >
                            {loading ? 'Verifying...' : 'Verify & Complete'}
                        </button>
                    </form>
                    <p className="mt-8 text-sm text-gray-500">
                        Didn't receive a code? <button type="button" className="text-[#5845D8] font-bold hover:underline" onClick={handleSignup}>Resend Code</button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex overflow-hidden lg:flex-row flex-col">
            {/* Left side banner */}
            <div className="lg:w-1/2 w-full lg:min-h-screen h-[40vh] hidden lg:flex relative bg-[#054752] flex-col justify-between p-8 md:p-16 overflow-hidden order-1 lg:order-none">
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-tl-[120px] -mr-20 -mb-20"></div>
                <div className="absolute top-20 right-20 w-48 h-48 bg-[#5845D8] rounded-full blur-[80px] opacity-40"></div>

                <div className="z-10">
                    <Link to="/">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10 brightness-0 invert opacity-90" onError={(e) => { e.target.src = '/vite.svg' }} />
                    </Link>
                </div>

                <div className="z-10 text-white mt-auto mb-10 md:mb-20">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">Join Bago. <br />Travel differently.</h1>
                    <p className="text-base md:text-lg text-white/80 max-w-md font-medium leading-relaxed">
                        Send packages to thousands of destinations worldwide with reliable delivery partners, or monetize your empty luggage space as a verified courier.
                    </p>

                    <div className="mt-12 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-white/90 font-medium pt-1">Verified delivery partner and sender profiles</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="text-white/90 font-medium pt-1">Secure payments and seamless wallet payouts via Stripe & Paystack</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side form */}
            <div className="lg:w-1/2 w-full flex items-start justify-center p-8 bg-white z-10 overflow-y-auto order-2 lg:order-none shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                <div className="w-full max-w-lg pb-10 mt-4 md:mt-10">
                    <div className="lg:hidden mb-8">
                        <Link to="/">
                            <img src="/bago_logo.png" alt="Bago" className="h-8" onError={(e) => { e.target.src = '/vite.svg' }} />
                        </Link>
                    </div>
                    <h2 className="text-3xl font-bold text-[#054752] mb-2">Join Bago</h2>

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}

                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={40} className="text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#054752] mb-4">Check Your Email!</h2>
                            <p className="text-[#708c91] font-medium mb-8 leading-relaxed">
                                {success}
                            </p>
                            <Link
                                to="/login"
                                className="inline-block bg-[#5845D8] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4838B5] transition-all shadow-md"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-[#708c91] font-medium mb-8">Create your seamless logistics account.</p>

                            <div className="space-y-4 mb-8">
                                <button
                                    onClick={() => handleGoogleSignup()}
                                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3.5 rounded-xl font-bold text-[#054752] hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                    <span>Continue with Google</span>
                                </button>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-gray-100"></div>
                                    <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Or with email</span>
                                    <div className="flex-grow border-t border-gray-100"></div>
                                </div>
                            </div>

                            <form onSubmit={handleSignup} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors bg-white font-medium" required />
                                    <p className="text-xs text-gray-500 mt-1">You must be 18+ to use Bago Services</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors bg-white"
                                            required
                                        >
                                            {BAGO_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <PhoneInput
                                            country={'us'}
                                            value={formData.phone}
                                            onChange={phone => setFormData({ ...formData, phone })}
                                            inputStyle={{
                                                width: '100%',
                                                height: '48px',
                                                borderRadius: '12px',
                                                border: '1px solid #E5E7EB',
                                                fontSize: '16px'
                                            }}
                                            containerStyle={{ width: '100%' }}
                                            buttonStyle={{ borderRadius: '12px 0 0 12px', border: '1px solid #E5E7EB', backgroundColor: 'white' }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none transition-colors" required />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold mt-4 hover:bg-[#4838B5] transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Creating Account...' : 'Continue'}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 mb-4">
                            By signing up, you agree to our Terms & Conditions and Privacy Policy
                        </p>
                        <p className="text-sm text-gray-600">
                            Already have an account? <Link to="/login" className="text-[#5845D8] font-semibold hover:underline hover:text-[#4838B5] transition-colors">Sign In</Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
