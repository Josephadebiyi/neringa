import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Shield, Upload, FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '../../api';

// Displays a date of birth with the exact year hidden — shows the month, day,
// and only the century (first two digits of the year), e.g. "Mar 15, 19**"
// for 1985-03-15. Once KYC is approved, the representative's DOB becomes a
// locked, read-only field, so we show this masked form instead.
function maskDateOfBirth(dateString) {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Not provided';
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const centuryDigits = String(date.getFullYear()).slice(0, 2);
    return `${monthDay}, ${centuryDigits}**`;
}

const GRACE_PERIOD_DAYS = 14;

const DOC_STATUS_LABEL = {
    not_uploaded: 'Not uploaded',
    pending_review: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
};
const DOC_STATUS_STYLE = {
    not_uploaded: 'bg-gray-100 text-gray-500',
    pending_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
};

function graceBanner(user) {
    if (user?.businessStatus === 'verified') {
        return { tone: 'success', title: 'Your business is fully verified.', body: 'All account restrictions have been lifted.' };
    }
    if (!user?.businessGracePeriodStartedAt) {
        return null;
    }
    const deadline = new Date(user.businessGracePeriodStartedAt).getTime() + GRACE_PERIOD_DAYS * 86400_000;
    const msLeft = deadline - Date.now();
    if (msLeft <= 0) {
        return {
            tone: 'danger',
            title: 'Your account is restricted.',
            body: 'The 14-day verification window has ended. Complete the steps below to restore full access — an admin will review and approve your account once submitted.',
        };
    }
    const daysLeft = Math.ceil(msLeft / 86400_000);
    return {
        tone: 'warning',
        title: `Your account is fully active — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left to verify.`,
        body: 'Complete business verification below before the grace period ends to avoid any interruption.',
    };
}

export default function BusinessVerification({ user, checkAuthStatus }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
        representativeRole: user?.representativeRole || '',
        companyName: user?.companyName || '',
        tradingName: user?.tradingName || '',
        businessRegistrationNumber: user?.businessRegistrationNumber || '',
        businessAddress: user?.businessAddress || '',
        businessTaxId: user?.businessTaxId || '',
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    const change = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const kycStatus = String(user?.kycStatus || '').toLowerCase();
    const kycApproved = ['approved', 'verified', 'completed'].includes(kycStatus);

    const saveRepresentative = async (e) => {
        e.preventDefault();
        setSaveError('');
        setSaveSuccess('');
        setSaving(true);
        try {
            const businessDetailsLocked = user?.businessDocumentStatus === 'approved' || user?.businessStatus === 'verified';
            const payload = {
                ...(kycApproved ? { representativeRole: form.representativeRole } : {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    dateOfBirth: form.dateOfBirth,
                    representativeRole: form.representativeRole,
                }),
                ...(!businessDetailsLocked ? {
                    companyName: form.companyName,
                    tradingName: form.tradingName,
                    businessRegistrationNumber: form.businessRegistrationNumber,
                    businessAddress: form.businessAddress,
                    businessTaxId: form.businessTaxId,
                } : {}),
            };
            await api.put('/api/bago/edit', payload);
            setSaveSuccess('Representative details saved.');
            await checkAuthStatus?.();
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Could not save your details. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const uploadDocument = async () => {
        if (!file) return;
        setUploadError('');
        setUploadSuccess('');
        setUploading(true);
        try {
            const documentData = new FormData();
            documentData.append('document', file);
            await api.post('/api/bago/user/business-document', documentData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadSuccess('Document uploaded and pending review.');
            setFile(null);
            await checkAuthStatus?.();
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Could not upload the document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const banner = graceBanner(user);
    const docStatus = user?.businessDocumentStatus || 'not_uploaded';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-[#012126]">Business Verification</h1>
                <p className="text-[#6B7280] font-semibold text-sm mt-1">
                    Complete these steps so an admin can verify and fully approve your business account.
                </p>
            </div>

            {banner && (
                <div className={`rounded-2xl p-5 flex gap-4 items-start border ${
                    banner.tone === 'success' ? 'bg-emerald-50 border-emerald-100' :
                    banner.tone === 'danger' ? 'bg-red-50 border-red-100' :
                    'bg-amber-50 border-amber-100'
                }`}>
                    {banner.tone === 'success' ? <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />
                        : banner.tone === 'danger' ? <AlertTriangle className="text-red-600 shrink-0" size={22} />
                        : <Clock className="text-amber-600 shrink-0" size={22} />}
                    <div>
                        <p className="font-black text-[#012126] text-sm">{banner.title}</p>
                        <p className="text-sm text-[#374151] mt-1">{banner.body}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
                <form onSubmit={saveRepresentative}>
                <h2 className="text-lg font-black text-[#012126] mb-1">Registered business details</h2>
                <p className="text-sm text-gray-500 mb-6">These must match the CAC or registration certificate. They lock once the document is approved.</p>
                <div className="grid md:grid-cols-2 gap-5 mb-8">
                    {[
                        ['companyName', 'Registered company name'],
                        ['tradingName', 'Trading name'],
                        ['businessRegistrationNumber', 'Registration number'],
                        ['businessTaxId', 'Tax ID (optional)'],
                    ].map(([key, label]) => (
                        <label key={key}>
                            <span className="block text-[10px] font-black text-[#012126] uppercase tracking-widest mb-1.5">{label}</span>
                            <input value={form[key]} onChange={change(key)} required={key !== 'businessTaxId'} disabled={user?.businessDocumentStatus === 'approved' || user?.businessStatus === 'verified'}
                                className="w-full px-4 py-3 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] outline-none text-sm font-bold disabled:text-gray-400" />
                        </label>
                    ))}
                    <label className="md:col-span-2">
                        <span className="block text-[10px] font-black text-[#012126] uppercase tracking-widest mb-1.5">Registered business address</span>
                        <textarea value={form.businessAddress} onChange={change('businessAddress')} required disabled={user?.businessDocumentStatus === 'approved' || user?.businessStatus === 'verified'} rows={3}
                            className="w-full px-4 py-3 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] outline-none text-sm font-bold disabled:text-gray-400" />
                    </label>
                </div>
                <h2 className="text-lg font-black text-[#012126] mb-1">Representative details</h2>
                <p className="text-sm text-gray-500 mb-6">The person authorised to act on behalf of the business.</p>
                <div className="grid md:grid-cols-2 gap-5">
                    <label>
                        <span className="block text-[10px] font-black text-[#012126] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            First name
                            {kycApproved && <Shield size={10} className="text-green-500" />}
                        </span>
                        <input value={form.firstName} onChange={change('firstName')} required disabled={kycApproved}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-sm font-bold ${kycApproved ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-[#f8f9fa] border-transparent focus:border-[#5845D8] focus:bg-white'}`} />
                    </label>
                    <label>
                        <span className="block text-[10px] font-black text-[#012126] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            Last name
                            {kycApproved && <Shield size={10} className="text-green-500" />}
                        </span>
                        <input value={form.lastName} onChange={change('lastName')} required disabled={kycApproved}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-sm font-bold ${kycApproved ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-[#f8f9fa] border-transparent focus:border-[#5845D8] focus:bg-white'}`} />
                    </label>
                    <label>
                        <span className="block text-[10px] font-black text-[#012126] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            Date of birth
                            {kycApproved && <Shield size={10} className="text-green-500" />}
                        </span>
                        {kycApproved ? (
                            <div className="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">
                                {maskDateOfBirth(form.dateOfBirth)}
                            </div>
                        ) : (
                            <input type="date" value={form.dateOfBirth} onChange={change('dateOfBirth')}
                                className="w-full px-4 py-3 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-sm font-bold" />
                        )}
                    </label>
                    <label>
                        <span className="block text-[10px] font-black text-[#012126] uppercase tracking-widest mb-1.5">Role in the business</span>
                        <input value={form.representativeRole} onChange={change('representativeRole')} required disabled={user?.businessDocumentStatus === 'approved' || user?.businessStatus === 'verified'}
                            className="w-full px-4 py-3 bg-[#f8f9fa] rounded-xl border-2 border-transparent focus:border-[#5845D8] focus:bg-white outline-none transition-all text-sm font-bold disabled:text-gray-400" />
                    </label>

                    {saveError && <p className="md:col-span-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">{saveError}</p>}
                    {saveSuccess && <p className="md:col-span-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700">{saveSuccess}</p>}

                    <div className="md:col-span-2">
                        <button type="submit" disabled={saving}
                            className="px-6 py-3 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-xl font-bold text-sm disabled:opacity-60">
                            {saving ? 'Saving…' : 'Save business details'}
                        </button>
                    </div>
                </div>
                </form>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-black text-[#012126]">CAC / registration document</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${DOC_STATUS_STYLE[docStatus] || 'bg-gray-100 text-gray-500'}`}>
                        {DOC_STATUS_LABEL[docStatus] || docStatus}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mb-5">Upload your CAC or business registration certificate for admin review.</p>

                {docStatus === 'rejected' && user?.businessDocumentRejectionReason && (
                    <p className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">
                        Rejected: {user.businessDocumentRejectionReason}
                    </p>
                )}
                {user?.businessDocumentUrl && (
                    <a href={user.businessDocumentUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[#5845D8] hover:underline text-sm font-bold mb-5">
                        <FileText size={14} /> View current document
                    </a>
                )}

                <label className="border-2 border-dashed border-[#5845D8]/30 bg-[#5845D8]/5 rounded-2xl p-5 flex gap-4 items-center cursor-pointer">
                    <Upload className="text-[#5845D8]" />
                    <div>
                        <b className="text-sm">{docStatus === 'not_uploaded' ? 'Upload document' : 'Replace document'}</b>
                        <p className="text-sm text-gray-500">PDF, JPEG, PNG or WebP, up to 10 MB.</p>
                    </div>
                    <input className="hidden" type="file" accept="application/pdf,image/png,image/jpeg,image/webp"
                        onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
                {file && <p className="text-sm text-green-700 mt-2">Selected: {file.name}</p>}
                {uploadError && <p className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-600">{uploadError}</p>}
                {uploadSuccess && <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700">{uploadSuccess}</p>}

                <button onClick={uploadDocument} disabled={!file || uploading}
                    className="mt-5 px-6 py-3 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-xl font-bold text-sm disabled:opacity-60">
                    {uploading ? 'Uploading…' : 'Upload document'}
                </button>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-black text-[#012126]">Identity verification (KYC)</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${kycApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {kycApproved ? 'Approved' : (kycStatus || 'Not started')}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mb-5">
                    Verify the identity of the business representative with a government ID and a quick selfie/liveness check.
                </p>
                <button onClick={() => navigate('/verify')}
                    className="px-6 py-3 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-xl font-bold text-sm flex items-center gap-2">
                    <ShieldCheck size={16} /> {kycApproved ? 'View verification' : 'Complete KYC verification'}
                </button>
            </div>
        </div>
    );
}
