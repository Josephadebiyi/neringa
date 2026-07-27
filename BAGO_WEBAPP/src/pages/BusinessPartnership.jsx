import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck, Upload, Wallet } from 'lucide-react';
import api, { setAuthSession } from '../api';
import { useAuth } from '../AuthContext';
import Footer from '../components/Footer';
import { countries } from '../utils/countries';
import { trackSignupConversion } from '../utils/googleAds';

const COUNTRY_META = {
    NG: ['+234','NGN'], GH: ['+233','GHS'], KE: ['+254','KES'], ZA: ['+27','ZAR'], CM: ['+237','XAF'], CI: ['+225','XOF'], SN: ['+221','XOF'], TZ: ['+255','TZS'], UG: ['+256','UGX'],
    US: ['+1','USD'], CA: ['+1','USD'], GB: ['+44','GBP'], FR: ['+33','EUR'], DE: ['+49','EUR'], ES: ['+34','EUR'], IT: ['+39','EUR'], PT: ['+351','EUR'], NL: ['+31','EUR'], BE: ['+32','EUR'], AT: ['+43','EUR'],
    CH: ['+41','EUR'], SE: ['+46','EUR'], PL: ['+48','EUR'], RO: ['+40','EUR'], UA: ['+380','EUR'], AE: ['+971','USD'], SA: ['+966','USD'], TR: ['+90','USD'], IN: ['+91','USD'], CN: ['+86','USD'],
    JP: ['+81','USD'], KR: ['+82','USD'], SG: ['+65','USD'], MY: ['+60','USD'], PH: ['+63','USD'], ID: ['+62','USD'], TH: ['+66','USD'], VN: ['+84','USD'], AU: ['+61','USD'], BR: ['+55','USD'],
    MX: ['+52','USD'], AR: ['+54','USD'], CO: ['+57','USD'], EG: ['+20','USD'], MA: ['+212','USD'], ET: ['+251','USD'], PK: ['+92','USD'], ZW: ['+263','USD'], CD: ['+243','USD'], DZ: ['+213','USD'], MW: ['+265','MWK'], SL: ['+232','SLL'], ZM: ['+260','ZMW'],
};
const OPERATIONAL_CURRENCIES = ['EUR','GBP','GHS','KES','MWK','NGN','SLL','TZS','UGX','USD','XAF','XOF','ZAR','ZMW'];

const initialForm = {
    firstName: '', lastName: '', representativeRole: '', dateOfBirth: '',
    companyName: '', tradingName: '', businessRegistrationNumber: '', businessType: '',
    businessTaxId: '', businessAddress: '', country: '', operationalCurrency: '', email: '', phone: '',
    password: '', confirmPassword: '', accountHolderName: '', accountNumber: '', bankCode: '', bankName: '', iban: '', swiftBic: '',
};

export default function BusinessPartnership() {
    const [form, setForm] = useState(initialForm);
    const [logo, setLogo] = useState(null);
    const [registrationDocument, setRegistrationDocument] = useState(null);
    const [phoneCode, setPhoneCode] = useState('+234');
    const [formStep, setFormStep] = useState(1);
    const [signupToken, setSignupToken] = useState('');
    const [accountVerified, setAccountVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [banks, setBanks] = useState([]);
    const [banksLoading, setBanksLoading] = useState(false);
    const [resolvedAccountName, setResolvedAccountName] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const change = ({ target }) => setForm((value) => ({ ...value, [target.name]: target.value }));
    const usesIban = form.operationalCurrency === 'EUR';
    const usesUkBank = form.operationalCurrency === 'GBP';

    useEffect(() => {
        if (!accountVerified || usesIban || usesUkBank) return;
        const countryByCurrency = {
            GHS: 'GH', KES: 'KE', MWK: 'MW', NGN: 'NG', SLL: 'SL', TZS: 'TZ',
            UGX: 'UG', XAF: 'CM', XOF: 'CI', ZAR: 'ZA', ZMW: 'ZM', USD: 'NG',
        };
        const bankCountry = COUNTRY_META[form.country]?.[1] === form.operationalCurrency
            ? form.country
            : countryByCurrency[form.operationalCurrency] || form.country;
        setBanksLoading(true);
        api.get('/api/payouts/flutterwave/banks', {
            params: { country: bankCountry, currency: form.operationalCurrency },
        })
            .then((response) => setBanks(response.data?.banks || response.data?.data || []))
            .catch(() => {
                setBanks([]);
                setError('We could not load the available banks. Please retry before continuing.');
            })
            .finally(() => setBanksLoading(false));
    }, [accountVerified, form.country, form.operationalCurrency, usesIban, usesUkBank]);

    const resolveAccount = async () => {
        if (usesIban || usesUkBank || !form.accountNumber || !form.bankCode) return;
        setResolvedAccountName('');
        try {
            const response = await api.get('/api/payouts/flutterwave/resolve', {
                params: { accountNumber: form.accountNumber, bankCode: form.bankCode },
            });
            const accountName = response.data?.accountName || response.data?.data?.account_name || '';
            setResolvedAccountName(accountName);
            if (accountName) setForm((value) => ({ ...value, accountHolderName: accountName }));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Flutterwave could not verify this account.');
        }
    };

    const submit = async (event) => {
        event.preventDefault(); setError(''); setLoading(true);
        try {
            if (!registrationDocument) throw new Error('Please upload your CAC or business registration certificate.');
            const { accountHolderName, accountNumber, bankCode, bankName, iban, swiftBic, ...signupForm } = form;
            const response = await api.post('/api/bago/signup', { ...signupForm, phone: `${phoneCode}${form.phone.replace(/^0+/, '')}`, accountType: 'company' });
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
                trackSignupConversion(response.data.user?.id || response.data.user?._id);
                setAccountVerified(true);
                setLoading(false);
                return;
            }
            if (logo) {
                const imageData = new FormData();
                imageData.append('image', logo);
                await api.post('/api/bago/user/image', imageData, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            await api.post('/api/bago/user/business-payout-draft', {
                currency: form.operationalCurrency, accountHolderName: form.accountHolderName,
                accountNumber: form.accountNumber, bankCode: form.bankCode, bankName: form.bankName,
                iban: form.iban, swiftBic: form.swiftBic,
            });
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

    const input = (name, label, type = 'text', required = true) => <label key={name}><span className="block font-bold text-sm mb-2">{label}</span><input name={name} type={type} required={required} value={form[name]} onChange={change} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-[#5845D8]" /></label>;
    const next = (required) => {
        const missing = required.find((name) => !String(form[name] || '').trim());
        if (missing || (formStep === 1 && !registrationDocument)) { setError('Please complete all required fields before continuing.'); return; }
        setError(''); setFormStep((step) => Math.min(4, step + 1)); window.scrollTo({ top: 500, behavior: 'smooth' });
    };
    const wizardStep = accountVerified ? 5 : signupToken ? 4 : formStep === 4 ? 3 : formStep;
    const stepLabels = ['Business', 'Representative', 'Account', 'Verify', 'Payout'];

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
                <div className="grid gap-4">{[[Building2,'Business identity','Customers see your trading name, not the representative name.'],[ShieldCheck,'Identity verification','The authorised representative verifies their identity securely.'],[Wallet,'One Bago wallet','Receive earnings and configure payouts in the standard Bago flow.']].map(([Icon,title,copy]) => <div key={title} className="rounded-2xl bg-white/10 p-5 flex gap-4"><Icon className="text-[#A99DFF] shrink-0"/><div><b>{title}</b><p className="text-white/60 text-sm mt-1">{copy}</p></div></div>)}</div>
            </div></section>
            <section className="px-6 py-16"><div className="max-w-4xl mx-auto bg-white rounded-[32px] shadow-sm border border-gray-100 p-7 md:p-12">
                <div className="mb-10"><div className="flex justify-between mb-3">{stepLabels.map((label,index)=><span key={label} className={`text-[10px] md:text-xs font-black ${wizardStep>=index+1?'text-[#5845D8]':'text-gray-300'}`}>{label}</span>)}</div><div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-[#5845D8] rounded-full transition-all" style={{width:`${wizardStep*20}%`}}/></div><p className="mt-3 text-sm text-gray-500">Step {wizardStep} of 5</p></div>
                {!signupToken ? <form onSubmit={submit}>
                    {formStep===1 && <div><h2 className="text-3xl font-black mb-2">Tell us about the business</h2><p className="text-gray-500 mb-7">Use the details exactly as they appear on the registration certificate.</p><div className="grid md:grid-cols-2 gap-5">{input('companyName','Registered company name')}{input('tradingName','Trading name shown to senders')}{input('businessRegistrationNumber','Registration number')}{input('businessType','Business type','text',false)}{input('businessTaxId','Tax ID (optional)','text',false)}{input('businessAddress','Registered business address')}<label><span className="block font-bold text-sm mb-2">Country of registration</span><select required value={form.country} onChange={(e)=>{const code=e.target.value;const[dial,currency]=COUNTRY_META[code]||['','USD'];setForm(v=>({...v,country:code,operationalCurrency:currency}));if(dial)setPhoneCode(dial);}} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 bg-white"><option value="">Select country</option>{countries.map(c=><option key={c.value} value={c.value}>{c.flag} {c.label}</option>)}</select></label><label><span className="block font-bold text-sm mb-2">Operational currency</span><select required name="operationalCurrency" value={form.operationalCurrency} onChange={change} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 bg-white"><option value="">Select currency</option>{OPERATIONAL_CURRENCIES.map(c=><option key={c}>{c}</option>)}</select><span className="text-xs text-gray-500">Only supported payout currencies are available.</span></label></div><label className="mt-5 border-2 border-dashed border-[#5845D8]/30 bg-[#5845D8]/5 rounded-2xl p-5 flex gap-4 items-center cursor-pointer"><ShieldCheck className="text-[#5845D8]"/><div><b>CAC or registration certificate *</b><p className="text-sm text-gray-500">PDF, JPEG, PNG or WebP, up to 10 MB.</p></div><input className="hidden" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={e=>setRegistrationDocument(e.target.files?.[0]||null)}/></label>{registrationDocument&&<p className="text-sm text-green-700 mt-2">Selected: {registrationDocument.name}</p>}<button type="button" onClick={()=>next(['companyName','tradingName','businessRegistrationNumber','businessAddress','country','operationalCurrency'])} className="mt-7 w-full rounded-xl bg-[#5845D8] text-white font-black py-4">Continue</button></div>}
                    {formStep===2 && <div><h2 className="text-3xl font-black mb-2">Authorised representative</h2><p className="text-gray-500 mb-7">This person will complete identity verification with a government ID and live selfie.</p><div className="grid md:grid-cols-2 gap-5">{input('firstName','First name')}{input('lastName','Last name')}{input('representativeRole','Role in the business')}{input('dateOfBirth','Date of birth','date')}<label className="md:col-span-2"><span className="block font-bold text-sm mb-2">Business phone</span><div className="flex"><select value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} className="rounded-l-xl border border-r-0 px-3 bg-gray-50">{[...new Set(Object.values(COUNTRY_META).map(([dial])=>dial))].map(d=><option key={d}>{d}</option>)}</select><input required name="phone" value={form.phone} onChange={change} className="flex-1 min-w-0 rounded-r-xl border px-4 py-3.5"/></div></label></div><div className="flex gap-3 mt-7"><button type="button" onClick={()=>setFormStep(1)} className="w-1/3 border rounded-xl font-bold">Back</button><button type="button" onClick={()=>{const missing=['firstName','lastName','representativeRole','dateOfBirth','phone'].find(name=>!String(form[name]||'').trim());if(missing){setError('Please complete all required fields before continuing.');return;}setError('');setFormStep(4);window.scrollTo({top:500,behavior:'smooth'});}} className="flex-1 rounded-xl bg-[#5845D8] text-white font-black py-4">Continue</button></div></div>}
                    {formStep===3 && <div><h2 className="text-3xl font-black mb-2">Payout details</h2><p className="text-gray-500 mb-2">Saved securely now and confirmed after identity approval.</p><p className="mb-7 text-sm font-bold text-[#5845D8]">Wallet and payout currency: {form.operationalCurrency}</p><div className="grid md:grid-cols-2 gap-5">{input('accountHolderName','Account holder name')}{form.operationalCurrency==='EUR'?<>{input('iban','IBAN')}{input('swiftBic','SWIFT / BIC')}</>:<>{input('bankName','Bank name','text',false)}{input('accountNumber','Account number')}{input('bankCode',form.operationalCurrency==='GBP'?'Sort code':'Bank code')}</>}</div><div className="flex gap-3 mt-7"><button type="button" onClick={()=>setFormStep(2)} className="w-1/3 border rounded-xl font-bold">Back</button><button type="button" onClick={()=>next(form.operationalCurrency==='EUR'?['accountHolderName','iban','swiftBic']:['accountHolderName','accountNumber','bankCode'])} className="flex-1 rounded-xl bg-[#5845D8] text-white font-black py-4">Continue</button></div></div>}
                    {formStep===4 && <div><h2 className="text-3xl font-black mb-2">Secure your account</h2><p className="text-gray-500 mb-7">Enter the business email once. You will use it with this password on both the Bago app and website.</p><div className="grid md:grid-cols-2 gap-5">{input('email','Business email','email')}{input('password','Password','password')}{input('confirmPassword','Confirm password','password')}</div><label className="mt-6 border-2 border-dashed rounded-2xl p-5 flex gap-4 cursor-pointer"><Upload className="text-[#5845D8]"/><div><b>Business logo (optional)</b><p className="text-sm text-gray-500">PNG, JPEG or WebP.</p></div><input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setLogo(e.target.files?.[0]||null)}/></label>{error&&<p className="mt-5 rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}<div className="flex gap-3 mt-7"><button type="button" onClick={()=>setFormStep(2)} className="w-1/3 border rounded-xl font-bold">Back</button><button disabled={loading} className="flex-1 rounded-xl bg-[#5845D8] text-white font-black py-4">{loading?'Sending code…':'Create account and send code'}</button></div></div>}
                </form>:!accountVerified?<form onSubmit={verify} className="max-w-lg mx-auto text-center py-8"><CheckCircle2 className="mx-auto text-[#5845D8]" size={54}/><h2 className="text-3xl font-black mt-5">Verify your business email</h2><p className="text-gray-500 mt-3">Enter the six-digit code sent to {form.email}.</p><p className="mt-3 text-sm font-bold text-amber-600">● Email verification pending</p><input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" required minLength={6} className="mt-7 w-full text-center tracking-[0.5em] text-2xl rounded-xl border px-4 py-4"/>{error&&<p className="mt-5 text-red-700">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-[#5845D8] text-white font-black py-4">{loading?'Verifying…':'Verify email'}</button></form>
                :<form onSubmit={verify} className="max-w-2xl mx-auto py-4"><CheckCircle2 className="text-green-600" size={48}/><h2 className="text-3xl font-black mt-4">Add your payout account</h2><p className="text-gray-500 mt-2 mb-2">Your account is ready. Sign in on the Bago app or website with <b>{form.email}</b> and the password you created.</p><p className="text-sm font-bold text-[#5845D8] mb-7">Flutterwave payout currency: {form.operationalCurrency}</p><div className="grid md:grid-cols-2 gap-5">{input('accountHolderName','Account holder name')}{usesIban?<>{input('iban','IBAN')}{input('swiftBic','SWIFT / BIC')}</>:usesUkBank?<>{input('bankName','Bank name')}{input('accountNumber','Account number')}{input('bankCode','6-digit sort code')}</>:<><label><span className="block font-bold text-sm mb-2">Bank</span><select required name="bankCode" value={form.bankCode} disabled={banksLoading} onChange={(event)=>{const selected=banks.find(bank=>String(bank.code)===event.target.value);setForm(value=>({...value,bankCode:event.target.value,bankName:selected?.name||''}));setResolvedAccountName('');}} className="w-full rounded-xl border border-gray-200 px-4 py-3.5 bg-white"><option value="">{banksLoading?'Loading banks…':'Select bank'}</option>{banks.map(bank=><option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></label><label><span className="block font-bold text-sm mb-2">Account number</span><input required name="accountNumber" value={form.accountNumber} onChange={change} onBlur={resolveAccount} className="w-full rounded-xl border border-gray-200 px-4 py-3.5"/></label>{resolvedAccountName&&<p className="md:col-span-2 rounded-xl bg-green-50 text-green-800 p-3 font-bold">Flutterwave verified: {resolvedAccountName}</p>}</>}</div>{error&&<p className="mt-5 rounded-xl bg-red-50 text-red-700 p-4">{error}</p>}<button disabled={loading||banksLoading} className="mt-7 w-full rounded-xl bg-[#5845D8] text-white font-black py-4">{loading?'Finishing setup…':'Save payout details and start identity verification'}</button><p className="text-xs text-gray-500 text-center mt-4">Your payout details are securely stored as a Flutterwave draft and activated after KYC and payout-account confirmation.</p></form>}
            </div></section>
        </main><Footer />
    </div>;
}
