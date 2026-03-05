import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Extracted from what we passed in VerifyOtp navigation
    const email = location.state?.email;
    const token = location.state?.token;

    useEffect(() => {
        if (!email || !token) {
            navigate('/forgot-password');
        }
    }, [email, token, navigate]);

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            return setError('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const response = await api.post(
                '/api/bago/reset-password',
                { email, newPassword: password },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setSuccess('Password reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Token may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!email || !token) return null;

    return (
        <div className="min-h-screen bg-bg-theme flex overflow-hidden lg:flex-row flex-col">
            <div className="lg:w-1/2 w-full lg:min-h-screen h-[40vh] relative bg-[#054752] flex flex-col justify-between p-8 md:p-16 overflow-hidden">
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-tl-[120px] -mr-20 -mb-20"></div>
                <div className="absolute top-20 right-20 w-48 h-48 bg-[#5845D8] rounded-full blur-[80px] opacity-40"></div>

                <div className="z-10">
                    <Link to="/">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10 brightness-0 invert opacity-90" onError={(e) => { e.target.src = '/vite.svg' }} />
                    </Link>
                </div>

                <div className="z-10 text-white mt-auto mb-10 md:mb-20">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">Set New <br />Password!</h1>
                    <p className="text-base md:text-lg text-white/80 max-w-md font-medium leading-relaxed">
                        Secure your account. Almost back into the ecosystem to manage your packages and trips.
                    </p>
                </div>
            </div>

            <div className="lg:w-1/2 w-full flex items-center justify-center p-8 bg-white z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                <div className="w-full max-w-md">
                    <h2 className="text-3xl font-bold text-[#054752] mb-2">Create Password</h2>
                    <p className="text-[#708c91] font-medium mb-10">Make sure it's strong and something you'll remember.</p>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-xl mb-6 text-sm font-medium">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleResetSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-[#054752] mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border border-gray-200 focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#054752] font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#054752] mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border border-gray-200 focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#054752] font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold mt-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:bg-[#5845D8]"
                        >
                            {loading ? 'Saving Update...' : 'Update Password'}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-[#708c91] font-medium">
                        Remember your old password?{' '}
                        <Link to="/login" className="text-[#5845D8] font-bold hover:text-[#4838B5] transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
