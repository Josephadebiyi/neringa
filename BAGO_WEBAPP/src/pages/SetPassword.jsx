import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Shown right after an admin-created business account signs in with the
// temporary password from their welcome email. Setting a new password here
// both clears `mustChangePassword` and starts the 14-day verification
// grace period on the backend (see POST /user/change-password).
export default function SetPassword() {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { refreshUser } = useAuth();

    const currentPassword = location.state?.currentPassword;
    const redirectPath = location.state?.redirectPath?.startsWith('/') ? location.state.redirectPath : '/dashboard';

    useEffect(() => {
        if (!currentPassword) {
            navigate('/login');
        }
    }, [currentPassword, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            return setError(t('passwordMinLength') || 'Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
            return setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
        }

        setLoading(true);
        try {
            await api.post('/api/bago/user/change-password', { currentPassword, newPassword: password });
            await refreshUser?.();
            navigate(redirectPath);
        } catch (err) {
            setError(err.response?.data?.message || t('errorOccurred') || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!currentPassword) return null;

    return (
        <div className="min-h-screen bg-white flex overflow-hidden lg:flex-row flex-col">
            <div className="lg:w-1/2 w-full lg:min-h-screen h-[40vh] relative bg-[#012126] flex flex-col justify-between p-8 md:p-16 overflow-hidden sticky top-0">
                <div className="absolute inset-0 z-0">
                    <img src="/assets/hero_bg.png" className="w-full h-full object-cover opacity-20 mix-blend-overlay" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5845D8]/80 to-[#012126]/90"></div>
                </div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-tl-[120px] -mr-20 -mb-20"></div>

                <div className="z-10">
                    <Link to="/">
                        <img src="/bago_logo.png" alt="Bago" className="h-8 md:h-10 brightness-0 invert opacity-90" />
                    </Link>
                </div>

                <div className="z-10 text-white mt-auto mb-10 md:mb-20">
                    <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight tracking-tighter uppercase">
                        Welcome<br />to Bago
                    </h1>
                    <p className="text-sm md:text-base text-white/70 max-w-md font-semibold leading-relaxed">
                        Set a permanent password to finish securing your business account. You'll have 14 days to complete
                        verification once you're in.
                    </p>
                </div>
            </div>

            <div className="lg:w-1/2 w-full flex items-center justify-center p-8 bg-white z-10 lg:min-h-screen overflow-y-auto">
                <div className="w-full max-w-md py-12">
                    <h2 className="text-2xl font-black text-[#012126] mb-1.5 tracking-tight">Set your password</h2>
                    <p className="text-[#6B7280] font-semibold text-base mb-10">
                        Replace the temporary password from your welcome email with one only you know.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">New password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">Confirm password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold text-base mt-2 transition-all shadow-lg shadow-[#5845D8]/20 disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {loading ? 'Saving…' : 'Set password & continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
