import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck, Upload, Wallet } from 'lucide-react';
import api, { setAuthSession } from '../api';
import { useAuth } from '../AuthContext';
import Footer from '../components/Footer';

const initialForm = {
    firstName: '', lastName: '', representativeRole: '', dateOfBirth: '',
    companyName: '', tradingName: '', businessRegistrationNumber: '', businessType: '',
    businessTaxId: '', businessAddress: '', country: '', email: '', phone: '',
    password: '', confirmPassword: '',
};

export default function BusinessPartnership() {
    const [form, setForm] = useState(initialForm);
    const [logo, setLogo] = useState(null);
    const [signupToken, setSignupToken] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const change = ({ target }) => setForm((value) => ({ ...value, [target.name]: target.value }));

    const submit = async (event) => {
        event.preventDefault(); setError(''); setLoading(true);
        try {
            const response = await api.post('/api/bago/signup', { ...form, accountType: 'company' });
            setSignupToken(response.data.signupToken);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'We could not create the business account.');
        } finally { setLoading(false); }
    };

    const verify = async (event) => {
        event.preventDefault(); setError(''); setLoading(true);
        try {
            const response = await api.post('/api/bago/verify-signup-otp', { signupToken, otp });
            setAuthSession(response.data);
            login(response.data.user);
            if (logo) {
                const imageData = new FormData();
                imageData.append('image', logo);
                await api.post('/api/bago/user/image', imageData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate('/verify', { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Verification failed. Check the code and try again.');
        } finally { setLoading(false); }
    };

    const fields = [
        ['companyName', 'Registered company name', 'text', true], ['tradingName', 'Trading name shown to senders', 'text', true],
        ['businessRegistrationNumber', 'Registration number', 'text', true], ['businessType', 'Business type', 'text', false],
        ['businessTaxId', 'Tax ID (optional)', 'text', false], ['country', 'Country of registration', 'text', true],
        ['businessAddress', 'Registered business address', 'text', true], ['firstName', "Representative's first name", 'text', true],
        ['lastName', "Representative's last name", 'text', true], ['representativeRole', 'Role in the business', 'text', true],
        ['dateOfBirth', "Representative's date of birth", 'date', true], ['phone', 'Business phone', 'tel', true],
        ['email', 'Business email', 'email', true], ['password', 'Password', 'password', true],
        ['confirmPassword', 'Confirm password', 'password', true],
    ];

    return <div className="min-h-screen bg-[#F7F7FB] text-[#012126]">
        <header className="bg-white border-b border-gray-100 px-6 py-5"><div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/"><img src="/bago_logo.png" className="h-9" alt="Bago" /></Link>
            <Link to="/login" className="font-bold text-[#5845D8]">Business login</Link>
        </div></header>
        <main>
            <section className="bg-[#012126] text-white px-6 py-16"><div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <div><span className="text-[#A99DFF] font-black uppercase tracking-widest text-sm">Bago for business</span>
                    <h1 className="text-4xl md:text-6xl font-black mt-4 leading-tight">Move goods and earn with one business account.</h1>
                    <p className="text-white/70 text-lg mt-6 max-w-xl">Your trading name and logo appear to customers. The same credentials work on Bago web and mobile, with one wallet, payout setup and KYC status.</p>
                </div>
                <div className="grid gap-4">{[[Building2,'Business identity','Customers see your trading name, not the representative name.'],[ShieldCheck,'Representative KYC','Prembly verifies the person acting for the business.'],[Wallet,'One Bago wallet','Receive earnings and configure payouts in the standard Bago flow.']].map(([Icon,title,copy]) => <div key={title} className="rounded-2xl bg-white/10 p-5 flex gap-4"><Icon className="text-[#A99DFF] shrink-0"/><div><b>{title}</b><p className="text-white/60 text-sm mt-1">{copy}</p></div></div>)}</div>
            </div></section>
            <section className="px-6 py-16"><div className="max-w-4xl mx-auto bg-white rounded-[32px] shadow-sm border border-gray-100 p-7 md:p-12">
                {!signupToken ? <form onSubmit={submit}><div className="mb-9"><h2 className="text-3xl font-black">Create your business account</h2><p className="text-gray-500 mt-2">Enter the legal business and authorised representative details.</p></div>
                    <div className="grid md:grid-cols-2 gap-5">{fields.map(([name,label,type,required]) => <label key={name} className={name === 'businessAddress' ? 'md:col-span-2' : ''}><span className="block font-bold text-sm mb-2">{label}</span><input name={name} type={type} required={required} value={form[name]} onChange={change} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-[#5845D8]" /></label>)}</div>
                    <label className="mt-6 border-2 border-dashed border-gray-200 rounded-2xl p-5 flex gap-4 items-center cursor-pointer"><Upload className="text-[#5845D8]"/><div><b>Business logo</b><p className="text-sm text-gray-500">PNG, JPEG or WebP. It will become the profile image.</p></div><input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogo(e.target.files?.[0] || null)} /></label>{logo && <p className="text-sm text-green-700 mt-2">Selected: {logo.name}</p>}
                    {error && <p className="mt-5 rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}
                    <button disabled={loading} className="mt-7 w-full rounded-xl bg-[#5845D8] text-white font-black py-4 disabled:opacity-50">{loading ? 'Creating account…' : 'Create business account'}</button>
                </form> : <form onSubmit={verify} className="max-w-lg mx-auto text-center py-10"><CheckCircle2 className="mx-auto text-[#5845D8]" size={54}/><h2 className="text-3xl font-black mt-5">Verify your email</h2><p className="text-gray-500 mt-3">Enter the six-digit code sent to {form.email}.</p><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" required minLength={6} className="mt-7 w-full text-center tracking-[0.5em] text-2xl rounded-xl border border-gray-200 px-4 py-4" />{error && <p className="mt-5 text-red-700">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-[#5845D8] text-white font-black py-4">{loading ? 'Verifying…' : 'Verify and start KYC'}</button></form>}
            </div></section>
        </main><Footer />
    </div>;
}
