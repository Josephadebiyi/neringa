import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function ResetPassword() {
    const { t } = useLanguage();
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
            return setError(t('passwordMinLength'));
        }

        if (password !== confirmPassword) {
            return setError(t('passwordsDoNotMatch'));
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

            setSuccess(t('passwordResetSuccess'));
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || t('errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    if (!email || !token) return null;

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
                    <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight tracking-tighter uppercase">{t('setNewPasswordTitle').split(' ').map((word, i) => <React.Fragment key={i}>{word} <br /></React.Fragment>)}</h1>
                    <p className="text-sm md:text-base text-white/70 max-w-md font-semibold leading-relaxed">
                        {t('setNewPasswordDesc')}
                    </p>
                </div>
            </div>

            <div className="lg:w-1/2 w-full flex items-center justify-center p-8 bg-white z-10 lg:min-h-screen overflow-y-auto">
                <div className="w-full max-w-md py-12">
                    <h2 className="text-2xl font-black text-[#012126] mb-1.5 tracking-tight">{t('createPasswordHeader')}</h2>
                    <p className="text-[#6B7280] font-semibold text-base mb-10">{t('strongPasswordDesc')}</p>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-xs font-bold">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-[#5845D8]/5 border border-[#5845D8]/20 text-[#012126] p-4 rounded-xl mb-6 text-xs font-bold">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleResetSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('newPasswordLabel')}</label>
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
                            <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('confirmPasswordLabel')}</label>
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
                            disabled={loading || success}
                            className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold text-base mt-2 transition-all shadow-lg shadow-[#5845D8]/20 disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {loading ? t('savingUpdate') : t('updatePasswordBtn')}
                        </button>
                    </form>

                    <p className="mt-12 text-center text-[#6B7280] font-bold text-sm">
                        {t('rememberOldPassword')}{' '}
                        <Link to="/login" className="text-[#5845D8] font-black border-b-2 border-transparent hover:border-[#5845D8] transition-all ml-1">
                            {t('signIn')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
