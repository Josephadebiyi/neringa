import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { useGoogleLogin } from '@react-oauth/google';
import { AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/bago/signin', { email, password });
            if (response.data.success) {
                login(response.data.user, response.data.token, response.data.refreshToken);
                navigate('/dashboard');
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            if (serverMsg) {
                setError(serverMsg);
            } else if (err.code === 'ERR_NETWORK') {
                setError(t('networkError') || 'Unable to connect. Please check your internet connection and try again.');
            } else {
                setError(t('unexpectedError') || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                const response = await api.post('/api/bago/google-auth', { accessToken: tokenResponse.access_token });
                if (response.data.success) {
                    login(response.data.user, response.data.token, response.data.refreshToken);
                    navigate('/dashboard');
                } else {
                    setError(response.data.message || t('googleSignupFailed') || 'Unable to sign in with Google');
                }
            } catch (err) {
                const msg = err.response?.data?.message || t('googleAuthFailed') || 'Unable to complete Google authentication';
                setError(msg);
            } finally {
                setLoading(false);
            }
        },
        onError: (err) => {
            setError(t('googlePopupBlocked') || 'Google sign-in was blocked. Please allow popups and try again.');
        }
    });

    return (
        <div className="min-h-screen bg-white flex lg:flex-row flex-col">
            {/* Left side banner */}
            <div className="lg:w-1/2 w-full lg:h-screen h-[35vh] relative flex flex-col justify-between p-8 md:p-16 overflow-hidden bg-[#012126]">
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
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black uppercase tracking-[2px] mb-6 inline-block">{t('welcomeBack')}</span>
                    <h1 className="text-3xl lg:text-5xl font-extrabold mb-5 leading-[1.1] tracking-tight">{t('earnMoreSpendLess').split(' ').map((word, i) => i < 2 ? <React.Fragment key={i}>{word} </React.Fragment> : <span key={i} className="text-[#5845D8]">{word} </span>)}</h1>
                    <p className="text-sm md:text-base text-white/70 max-w-sm font-semibold leading-relaxed mb-8">
                        {t('loginSubtitle')}
                    </p>

                    {/* App download teasers */}
                    <div className="flex items-center gap-4 opacity-70 grayscale pointer-events-none mb-10">
                        <img src="/app-store.svg" alt="" className="h-7 w-auto" />
                        <img src="/google-play.svg" alt="" className="h-7 w-auto" />
                    </div>
                </div>
            </div>

            {/* Right side form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-8 bg-white z-10 lg:h-screen overflow-y-auto">
                <div className="w-full max-w-md py-12">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl font-bold text-[#012126] mb-2 tracking-tight">{t('signInHeader')}</h2>
                        <p className="text-[#6B7280] font-semibold text-base">{t('accessAccount')}</p>
                    </div>

                    <div className="space-y-8">
                        {/* Google Login */}
                        <button
                            onClick={() => handleGoogleLogin()}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-[#012126] hover:bg-gray-50 transition-all shadow-sm group"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm">{t('continueWithGoogle')}</span>
                        </button>

                        <div className="relative flex items-center">
                            <div className="flex-grow border-t-2 border-gray-50"></div>
                            <span className="flex-shrink mx-6 text-gray-300 text-[9px] font-black uppercase tracking-[3px]">{t('secureAccountLogin')}</span>
                            <div className="flex-grow border-t-2 border-gray-50"></div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-shake">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest ml-1">{t('emailAddressLabel')}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between mb-0.5 px-1">
                                        <label className="text-[10px] font-black text-[#012126] uppercase tracking-widest">{t('passwordLabel')}</label>
                                        <Link to="/forgot-password" shaking="true" className="text-[9px] font-black text-[#5845D8] hover:text-[#4838B5] transition-colors tracking-widest uppercase underline">{t('forgotPasswordLink')}</Link>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-[#012126] font-bold text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#5845D8] hover:bg-[#4838B5] text-white py-4 rounded-xl font-bold text-base mt-2 transition-all shadow-lg shadow-[#5845D8]/20 hover:shadow-[#5845D8]/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-3"
                            >
                                {loading ? t('securityCheck') : t('signInBtn')}
                                {!loading && <ArrowRight size={18} />}
                            </button>

                            <p className="text-center text-[10px] text-[#6B7280] mt-8 px-6 font-bold uppercase tracking-wider">
                                {t('secureLoginProtected')}
                            </p>
                        </form>
                    </div>

                    <p className="mt-12 text-center text-[#6B7280] font-bold text-sm">
                        {t('noAccountYet')}{' '}
                        <Link to="/signup" className="text-[#5845D8] font-black border-b-2 border-transparent hover:border-[#5845D8] transition-all ml-1">
                            {t('joinBagoToday')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
