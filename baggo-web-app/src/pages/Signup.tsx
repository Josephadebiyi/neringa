import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowRight, Loader2, PartyPopper, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
    const { signup } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        dobDay: '',
        dobMonth: '',
        dobYear: '',
        country: 'Nigeria'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const dateOfBirth = `${formData.dobYear}-${formData.dobMonth.padStart(2, '0')}-${formData.dobDay.padStart(2, '0')}`;

        try {
            await signup({
                ...formData,
                dateOfBirth,
                confirmPassword: formData.password
            });
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong during signup');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-32 flex items-center justify-center px-6">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-3xl mb-6 text-emerald-600">
                        <PartyPopper size={40} />
                    </div>
                    <h1 className="text-4xl mb-2">Join Bago</h1>
                    <p className="text-slate-500 font-bold">Start shipping with the community</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border-2 border-slate-50">
                    {isSuccess ? (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                                <Mail size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Check your email!</h2>
                            <p className="text-slate-500 mb-8 font-medium">
                                We've sent a verification link to <span className="text-slate-900 font-bold">{formData.email}</span>.
                                Please click the link to verify your account and start using Bago.
                            </p>
                            <Link to="/login" className="btn-bold-primary w-full py-5 inline-block text-center">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold border border-rose-100 italic">
                                    {error}
                                </div>
                            )}

                            {step === 1 ? (
                                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="search-input"
                                                placeholder="Jane"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Last Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="search-input"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="tel"
                                                required
                                                className="search-input !pl-14"
                                                placeholder="+1 (234) 567-890"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Date of Birth</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="search-input !px-4 appearance-none text-sm"
                                                    value={formData.dobDay}
                                                    onChange={(e) => setFormData({ ...formData, dobDay: e.target.value })}
                                                >
                                                    <option value="">Day</option>
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>{day}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="search-input !px-4 appearance-none text-sm"
                                                    value={formData.dobMonth}
                                                    onChange={(e) => setFormData({ ...formData, dobMonth: e.target.value })}
                                                >
                                                    <option value="">Month</option>
                                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                                        <option key={month} value={idx + 1}>{month}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="search-input !px-4 appearance-none text-sm"
                                                    value={formData.dobYear}
                                                    onChange={(e) => setFormData({ ...formData, dobYear: e.target.value })}
                                                >
                                                    <option value="">Year</option>
                                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Country</label>
                                        <div className="relative">
                                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <select
                                                required
                                                className="search-input !pl-14 appearance-none"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            >
                                                <option value="Nigeria">Nigeria</option>
                                                <option value="United States">United States</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                                <option value="Canada">Canada</option>
                                                <option value="Ghana">Ghana</option>
                                                <option value="Kenya">Kenya</option>
                                                <option value="South Africa">South Africa</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button type="button" onClick={() => setStep(2)} className="btn-bold-primary w-full py-5">
                                        Continue
                                        <ArrowRight className="ml-2" size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="email"
                                                required
                                                className="search-input !pl-14"
                                                placeholder="jane@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-4">Secure Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="password"
                                                required
                                                className="search-input !pl-14"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="btn-bold-primary w-full py-5">
                                        {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Complete Account'}
                                    </button>
                                    <button type="button" onClick={() => setStep(1)} className="w-full text-slate-400 text-sm font-bold py-2">
                                        Go back
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 font-bold text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brand-primary hover:underline underline-offset-4">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
