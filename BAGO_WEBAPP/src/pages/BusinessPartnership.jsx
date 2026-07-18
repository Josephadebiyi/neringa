import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck, Upload, Wallet } from 'lucide-react';
import api, { setAuthSession } from '../api';
import { useAuth } from '../AuthContext';
import Footer from '../components/Footer';
import { countries } from '../utils/countries';

const COUNTRY_META = {
    NG: ['+234','NGN'], GH: ['+233','GHS'], KE: ['+254','KES'], ZA: ['+27','ZAR'], CM: ['+237','XAF'], CI: ['+225','XOF'], SN: ['+221','XOF'], TZ: ['+255','TZS'], UG: ['+256','UGX'],
    US: ['+1','USD'], CA: ['+1','CAD'], GB: ['+44','GBP'], FR: ['+33','EUR'], DE: ['+49','EUR'], ES: ['+34','EUR'], IT: ['+39','EUR'], PT: ['+351','EUR'], NL: ['+31','EUR'], BE: ['+32','EUR'], AT: ['+43','EUR'],
    CH: ['+41','CHF'], SE: ['+46','SEK'], PL: ['+48','PLN'], RO: ['+40','RON'], UA: ['+380','UAH'], AE: ['+971','AED'], SA: ['+966','SAR'], TR: ['+90','TRY'], IN: ['+91','INR'], CN: ['+86','CNY'],
    JP: ['+81','JPY'], KR: ['+82','KRW'], SG: ['+65','SGD'], MY: ['+60','MYR'], PH: ['+63','PHP'], ID: ['+62','IDR'], TH: ['+66','THB'], VN: ['+84','VND'], AU: ['+61','AUD'], BR: ['+55','BRL'],
    MX: ['+52','MXN'], AR: ['+54','ARS'], CO: ['+57','COP'], EG: ['+20','EGP'], MA: ['+212','MAD'], ET: ['+251','ETB'], PK: ['+92','PKR'], ZW: ['+263','USD'], CD: ['+243','CDF'], DZ: ['+213','DZD'],
};
const OPERATIONAL_CURRENCIES = [...new Set(Object.values(COUNTRY_META).map(([, currency]) => currency))].sort();

const initialForm = {
    firstName: '', lastName: '', representativeRole: '', dateOfBirth: '',
    companyName: '', tradingName: '', businessRegistrationNumber: '', businessType: '',
    businessTaxId: '', businessAddress: '', country: '', operationalCurrency: '', email: '', phone: '',
    password: '', confirmPassword: '',
};

export default function BusinessPartnership() {
    const [form, setForm] = useState(initialForm);
    const [logo, setLogo] = useState(null);
    const [registrationDocument, setRegistrationDocument] = useState(null);
    const [phoneCode, setPhoneCode] = useState('+234');
    const [signupToken, setSignupToken] = useState('');
    const [accountVerified, setAccountVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const change = ({ target }) => setForm((value) => ({ ...value, [target.name]: target.value }));

    const submit = async (event) => {
        event.preventDefault(); setError(''); setLoading(true);
        try {
            if (!registrationDocument) throw new Error('Please upload your CAC or business registration certificate.');
            const response = await api.post('/api/bago/signup', { ...form, phone: `${phoneCode}${form.phone.replace(/^0+/, '')}`, accountType: 'company' });
            setSignupToken(response.data.signupToken);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'We could not create the business account.');
        } finally { setLoading(false); }
    };

    const verify = async (event) => {
        event.preventDefault(); setError(''); setLoading(true);
        try {
            if (!accountVerified) {
                const response = await api.post('/api/bago/verify-signup-otp', { signupToken, otp });
                setAuthSession(response.data);
                login(response.data.user);
                setAccountVerified(true);
            }
            if (logo) {
                const imageData = new FormData();
                imageData.append('image', logo);
                await api.post('/api/bago/user/image', imageData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            const documentData = new FormData();
            documentData.append('document', registrationDocument);
            await api.post('/api/bago/user/business-document', documentData, { headers: { 'Content-Type': 'multipart/form-data' } });
            navigate('/verify', { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || (accountVerified
                ? 'Your account is verified, but the document upload failed. Keep this page open and try again.'
                : 'Verification failed. Check the code and try again.'));
        } finally { setLoading(false); }
    };

    const fields = [
        ['companyName', 'Registered company name', 'text', true], ['tradingName', 'Trading name shown to senders', 'text', true],
        ['businessRegistrationNumber', 'Registration number', 'text', true], ['businessType', 'Business type', 'text', false],
        ['businessTaxId', 'Tax ID (optional)', 'text', false],
        ['businessAddress', 'Registered business address', 'text', true], ['firstName', "Representative's first name", 'text', true],
        ['lastName', "Representative's last name", 'text', true], ['representativeRole', 'Role in the business', 'text', true],
        ['dateOfBirth', "Representative's date of birth", 'date', true], ['password', 'Password', 'password', true],
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
                {!signupToken ? <form onSubmit={submit}><div className="mb-9"><h2 className="text-3xl font-black">Create your business account</h2><p className="text-gray-500 mt-2">Enter the legal business and authorised representative details.</p>
                    <div className="mt-6 rounded-2xl bg-[#F3F0FF] p-5 text-left"><p className="font-black text-[#5845D8]">What happens next</p><ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal pl-5"><li>Verify the six-digit code sent to your business email.</li><li>We securely upload your business registration certificate and logo.</li><li>The authorised representative completes Prembly identity verification using a valid government ID and a live selfie.</li><li>After approval, your trading name, verified status, wallet and payout setup become available across web and mobile.</li></ol><p className="mt-4 text-sm font-bold">Have ready: your CAC/registration certificate, government ID, date of birth and a camera-enabled device.</p></div>
                </div>
                    <div className="grid md:grid-cols-2 gap-5">{fields.map(([name,label,type,required]) => <label key={name} className={name === 'businessAddress' ? 'md:col-span-2' : ''}><span className="block font-bold text-sm mb-2">{label}</span><input name={name} type={type} required={required} value={form[name]} onChange={change} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-[#5845D8]" /></label>)}
                        <label><span className="block font-bold text-sm mb-2">Country of registration</span><select required value={form.country} onChange={(e) => { const code=e.target.value; const [dial,currency]=COUNTRY_META[code] || ['', 'USD']; setForm((v)=>({...v,country:code,operationalCurrency:currency})); if(dial)setPhoneCode(dial); }} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 bg-white"><option value="">Select country</option>{countries.map((country)=><option key={country.value} value={country.value}>{country.flag} {country.label}</option>)}</select></label>
                        <label><span className="block font-bold text-sm mb-2">Operational currency</span><select required name="operationalCurrency" value={form.operationalCurrency} onChange={change} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 bg-white"><option value="">Select currency</option>{OPERATIONAL_CURRENCIES.map((currency)=><option key={currency} value={currency}>{currency}</option>)}</select><span className="text-xs text-gray-500">This becomes the business wallet currency.</span></label>
                        <label><span className="block font-bold text-sm mb-2">Business phone</span><div className="flex"><select value={phoneCode} onChange={(e)=>setPhoneCode(e.target.value)} className="rounded-l-xl border border-r-0 border-gray-200 px-3 bg-gray-50">{[...new Set(Object.values(COUNTRY_META).map(([dial])=>dial))].map((dial)=><option key={dial}>{dial}</option>)}</select><input required name="phone" type="tel" value={form.phone} onChange={change} className="min-w-0 flex-1 rounded-r-xl border border-gray-200 px-4 py-3.5" placeholder="Phone number" /></div></label>
                        <label><span className="block font-bold text-sm mb-2">Business email</span><div className="flex"><input required name="email" type="email" value={form.email} onChange={change} className="min-w-0 flex-1 rounded-l-xl border border-gray-200 px-4 py-3.5"/><button type="submit" disabled={loading} className="rounded-r-xl bg-[#5845D8] px-4 text-white font-bold disabled:opacity-50">{loading?'Sending…':'Verify'}</button></div><span className="text-xs font-bold text-amber-600">● Not verified</span></label>
                    </div>
                    <label className="mt-6 border-2 border-dashed border-gray-200 rounded-2xl p-5 flex gap-4 items-center cursor-pointer"><Upload className="text-[#5845D8]"/><div><b>Business logo</b><p className="text-sm text-gray-500">PNG, JPEG or WebP. It will become the profile image.</p></div><input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogo(e.target.files?.[0] || null)} /></label>{logo && <p className="text-sm text-green-700 mt-2">Selected: {logo.name}</p>}
                    <label className="mt-5 border-2 border-dashed border-[#5845D8]/30 bg-[#5845D8]/5 rounded-2xl p-5 flex gap-4 items-center cursor-pointer"><ShieldCheck className="text-[#5845D8] shrink-0"/><div><b>CAC or business registration certificate <span className="text-red-500">*</span></b><p className="text-sm text-gray-500">Required. Upload PDF, JPEG, PNG or WebP, up to 10 MB.</p></div><input className="hidden" required type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => setRegistrationDocument(e.target.files?.[0] || null)} /></label>{registrationDocument && <p className="text-sm text-green-700 mt-2">Certificate selected: {registrationDocument.name}</p>}
                    {error && <p className="mt-5 rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}
                    <button disabled={loading} className="mt-7 w-full rounded-xl bg-[#5845D8] text-white font-black py-4 disabled:opacity-50">{loading ? 'Creating account…' : 'Create business account'}</button>
                </form> : <form onSubmit={verify} className="max-w-lg mx-auto text-center py-10"><CheckCircle2 className="mx-auto text-[#5845D8]" size={54}/><h2 className="text-3xl font-black mt-5">Verify your business email</h2><p className="text-gray-500 mt-3">{accountVerified ? form.email : `Enter the six-digit code sent to ${form.email}.`}</p><p className={`mt-3 text-sm font-bold ${accountVerified?'text-green-700':'text-amber-600'}`}>● Email {accountVerified?'verified':'verification pending'}</p>{!accountVerified && <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" required minLength={6} className="mt-7 w-full text-center tracking-[0.5em] text-2xl rounded-xl border border-gray-200 px-4 py-4" />}{error && <p className="mt-5 text-red-700">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-[#5845D8] text-white font-black py-4">{loading ? 'Verifying…' : accountVerified ? 'Retry upload and continue' : 'Verify email and continue to KYC'}</button></form>}
            </div></section>
        </main><Footer />
    </div>;
}
