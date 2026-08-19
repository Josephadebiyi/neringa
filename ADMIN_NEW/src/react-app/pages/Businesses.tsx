import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Search, ShieldCheck, Wallet, FileText, Check, X, Loader2, Pencil, Plus, Upload, KeyRound, Copy } from "lucide-react";
import { getBusinesses, reviewBusinessDocument, updateUser, adminUploadBusinessDocument, adminGenerateKycLink, approveBusinessAccount } from "../services/api";

type Business = {
  id: string; tradingName?: string; companyName?: string; businessRegistrationNumber?: string;
  businessType?: string; businessStatus?: string; representativeRole?: string; firstName?: string;
  lastName?: string; email?: string; country?: string; image?: string; kycStatus?: string;
  walletBalance?: number; walletCurrency?: string; createdAt?: string;
  businessDocumentUrl?: string; businessDocumentStatus?: string;
  businessAddress?: string; businessTaxId?: string;
};

const BUSINESS_EDIT_FIELDS: { key: keyof Business; label: string }[] = [
  { key: "companyName", label: "Registered company name" },
  { key: "tradingName", label: "Trading name" },
  { key: "businessRegistrationNumber", label: "Registration number" },
  { key: "businessAddress", label: "Business address" },
  { key: "businessTaxId", label: "Tax ID" },
  { key: "representativeRole", label: "Representative role" },
];

const DOC_STATUS_STYLES: Record<string, string> = {
  not_uploaded: "bg-gray-100 text-gray-500",
  pending_review: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [uploadTarget, setUploadTarget] = useState<Business | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSaving, setUploadSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [kycLinkTarget, setKycLinkTarget] = useState<Business | null>(null);
  const [kycLinkUrl, setKycLinkUrl] = useState("");
  const [kycLinkLoading, setKycLinkLoading] = useState(false);
  const [kycLinkError, setKycLinkError] = useState("");
  const [kycLinkEmailed, setKycLinkEmailed] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getBusinesses().then((result) => setBusinesses(result?.data || []))
      .catch((reason) => setError(reason.message || "Could not load businesses."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const shown = useMemo(() => businesses.filter((business) =>
    [business.tradingName, business.companyName, business.email, business.businessRegistrationNumber]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))), [businesses, search]);
  const verified = businesses.filter((b) => ["approved", "verified", "completed"].includes(String(b.kycStatus).toLowerCase())).length;

  const handleApproveDocument = async (b: Business) => {
    setActioningId(b.id);
    setActionError("");
    try {
      const res = await reviewBusinessDocument(b.id, 'approved');
      if (!res?.success) throw new Error(res?.message || 'Could not approve document.');
      setBusinesses((prev) => prev.map((x) => (x.id === b.id ? { ...x, businessDocumentStatus: 'approved' } : x)));
    } catch (e: any) {
      setActionError(e?.message || 'Could not approve document.');
    } finally {
      setActioningId(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadTarget || !uploadFile) return;
    setUploadSaving(true);
    setUploadError("");
    try {
      const res = await adminUploadBusinessDocument(uploadTarget.id, uploadFile);
      if (!res?.success) throw new Error(res?.message || 'Could not upload the document.');
      setBusinesses((prev) => prev.map((x) => (x.id === uploadTarget.id ? { ...x, businessDocumentStatus: 'pending_review', businessDocumentUrl: res.documentUrl } : x)));
      setUploadTarget(null);
      setUploadFile(null);
    } catch (e: any) {
      setUploadError(e?.message || 'Could not upload the document.');
    } finally {
      setUploadSaving(false);
    }
  };

  const openKycLink = async (b: Business) => {
    setKycLinkTarget(b);
    setKycLinkUrl("");
    setKycLinkError("");
    setKycLinkEmailed(false);
    setKycLinkLoading(true);
    try {
      const res = await adminGenerateKycLink(b.id);
      if (!res?.success) throw new Error(res?.message || 'Could not generate a verification link.');
      setKycLinkUrl(res.verificationUrl || "");
      setKycLinkEmailed(Boolean(res.emailed));
    } catch (e: any) {
      setKycLinkError(e?.message || 'Could not generate a verification link.');
    } finally {
      setKycLinkLoading(false);
    }
  };

  const handleApproveAccount = async (b: Business) => {
    if (!confirm(`Approve ${b.tradingName || b.companyName}'s business account? A welcome email will be sent.`)) return;
    setApprovingId(b.id);
    setActionError("");
    try {
      const res = await approveBusinessAccount(b.id);
      if (!res?.success) throw new Error(res?.message || 'Could not approve this account.');
    } catch (e: any) {
      setActionError(e?.message || 'Could not approve this account.');
    } finally {
      setApprovingId(null);
    }
  };

  const openEdit = (b: Business) => {
    const initial: Record<string, string> = {};
    BUSINESS_EDIT_FIELDS.forEach(({ key }) => { initial[key] = String(b[key] || ""); });
    setEditForm(initial);
    setEditTarget(b);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await updateUser(editTarget.id, editForm);
      if (!res?.success) throw new Error(res?.message || "Could not save business details.");
      setBusinesses((prev) => prev.map((x) => (x.id === editTarget.id ? { ...x, ...editForm } : x)));
      setEditTarget(null);
    } catch (e: any) {
      setEditError(e?.message || "Could not save business details.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActioningId(rejectTarget.id);
    setActionError("");
    try {
      const res = await reviewBusinessDocument(rejectTarget.id, 'rejected', rejectReason.trim());
      if (!res?.success) throw new Error(res?.message || 'Could not reject document.');
      setBusinesses((prev) => prev.map((x) => (x.id === rejectTarget.id ? { ...x, businessDocumentStatus: 'rejected' } : x)));
      setRejectTarget(null);
      setRejectReason("");
    } catch (e: any) {
      setActionError(e?.message || 'Could not reject document.');
    } finally {
      setActioningId(null);
    }
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-black text-gray-900">Businesses</h1><p className="mt-1 text-sm text-gray-500">Business accounts, representative KYC and shared Bago wallets.</p></div>
      <Link to="/businesses/create" className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-bold">
        <Plus className="h-4 w-4" /> Create Business
      </Link>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {[[Building2,"Business accounts",businesses.length],[ShieldCheck,"KYC verified",verified],[Wallet,"Awaiting KYC",businesses.length-verified]].map(([Icon,label,value]: any) => <div key={label} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4"><div className="rounded-xl bg-indigo-50 p-3"><Icon className="text-indigo-600" /></div><div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-black">{value}</p></div></div>)}
    </div>
    {actionError && <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">{actionError}</p>}
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b"><div className="relative max-w-md"><Search className="absolute left-3 top-3 text-gray-400 h-5 w-5"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search business, email or registration…" className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4"/></div></div>
      {error ? <p className="p-6 text-red-600">{error}</p> : loading ? <p className="p-6 text-gray-500">Loading businesses…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-gray-500"><tr>{["Business","Registration","Representative","KYC","Document","Wallet","Joined",""].map(h=><th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y">{shown.map((b)=><tr key={b.id} className="hover:bg-gray-50"><td className="px-5 py-4"><div className="flex items-center gap-3">{b.image?<img src={b.image} className="h-10 w-10 rounded-xl object-cover"/>:<div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-indigo-600"/></div>}<div><b>{b.tradingName || b.companyName}</b><p className="text-gray-500">{b.email}</p></div></div></td><td className="px-5 py-4">{b.businessRegistrationNumber || "—"}<p className="text-gray-500">{b.country || ""}</p></td><td className="px-5 py-4">{[b.firstName,b.lastName].filter(Boolean).join(" ")}<p className="text-gray-500">{b.representativeRole || "—"}</p></td><td className="px-5 py-4"><span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold capitalize">{b.kycStatus || "pending"}</span></td>
        <td className="px-5 py-4">
          <div className="flex flex-col gap-1.5 items-start">
            <span className={`rounded-full px-2.5 py-1 font-semibold capitalize ${DOC_STATUS_STYLES[b.businessDocumentStatus || 'not_uploaded'] || 'bg-gray-100 text-gray-500'}`}>
              {(b.businessDocumentStatus || 'not_uploaded').replace(/_/g, ' ')}
            </span>
            {b.businessDocumentUrl && (
              <a href={b.businessDocumentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline text-xs font-semibold">
                <FileText className="h-3.5 w-3.5" /> View document
              </a>
            )}
            {(b.businessDocumentStatus || 'not_uploaded') === 'not_uploaded' && (
              <button
                onClick={() => { setUploadTarget(b); setUploadFile(null); setUploadError(""); }}
                className="flex items-center gap-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 text-xs font-bold"
              >
                <Upload className="h-3 w-3" /> Upload CAC
              </button>
            )}
            {b.businessDocumentStatus === 'pending_review' && (
              <div className="flex gap-1.5 mt-0.5">
                <button
                  onClick={() => handleApproveDocument(b)}
                  disabled={actioningId === b.id}
                  className="flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 text-xs font-bold disabled:opacity-50"
                >
                  {actioningId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve
                </button>
                <button
                  onClick={() => { setRejectTarget(b); setRejectReason(""); setActionError(""); }}
                  disabled={actioningId === b.id}
                  className="flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 text-xs font-bold disabled:opacity-50"
                >
                  <X className="h-3 w-3" /> Reject
                </button>
              </div>
            )}
          </div>
        </td>
        <td className="px-5 py-4 font-semibold">{b.walletCurrency || ""} {Number(b.walletBalance || 0).toFixed(2)}</td><td className="px-5 py-4 text-gray-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</td>
        <td className="px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => openEdit(b)} className="flex items-center gap-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 text-xs font-bold">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button onClick={() => openKycLink(b)} className="flex items-center gap-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 text-xs font-bold">
              <KeyRound className="h-3.5 w-3.5" /> KYC Link
            </button>
            <button
              onClick={() => handleApproveAccount(b)}
              disabled={approvingId === b.id}
              className="flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {approvingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Approve Account
            </button>
          </div>
        </td>
        </tr>)}</tbody></table>{!shown.length&&<p className="p-8 text-center text-gray-500">No businesses found.</p>}</div>}
    </div>

    {rejectTarget && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Reject business document</h2>
          <p className="text-sm text-gray-600 mb-4">
            Rejecting the registration document for <strong>{rejectTarget.tradingName || rejectTarget.companyName}</strong>. This will be sent to the business.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            rows={3}
            placeholder="e.g. Document is illegible, or registration number doesn't match"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setRejectTarget(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || actioningId === rejectTarget.id}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {actioningId === rejectTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Reject Document
            </button>
          </div>
        </div>
      </div>
    )}
    {editTarget && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Edit business details</h2>
          <p className="text-sm text-gray-600 mb-4">{editTarget.tradingName || editTarget.companyName}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {BUSINESS_EDIT_FIELDS.map(({ key, label }) => (
              <label key={key} className={key === "businessAddress" ? "md:col-span-2" : ""}>
                <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
                <input
                  value={editForm[key] || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
            ))}
          </div>
          {editError && <p className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm font-semibold text-red-600">{editError}</p>}
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditTarget(null)} disabled={editSaving} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )}
    {uploadTarget && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Upload CAC document</h2>
          <p className="text-sm text-gray-600 mb-4">
            On behalf of <strong>{uploadTarget.tradingName || uploadTarget.companyName}</strong>. PDF, JPEG, PNG or WebP, up to 10&nbsp;MB.
          </p>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {uploadError && <p className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm font-semibold text-red-600">{uploadError}</p>}
          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setUploadTarget(null)} disabled={uploadSaving} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleUploadDocument}
              disabled={!uploadFile || uploadSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploadSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
        </div>
      </div>
    )}

    {kycLinkTarget && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Representative KYC link</h2>
          <p className="text-sm text-gray-600 mb-4">
            For {[kycLinkTarget.firstName, kycLinkTarget.lastName].filter(Boolean).join(" ") || "the representative"} to verify their identity. You can also copy it below to share via another channel.
          </p>
          {kycLinkLoading && <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto my-4" />}
          {kycLinkError && <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm font-semibold text-red-600">{kycLinkError}</p>}
          {!kycLinkLoading && kycLinkUrl && (
            <>
              {kycLinkEmailed ? (
                <p className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 mb-3">
                  ✓ Emailed to {kycLinkTarget.email} with a "Verify My Identity" button.
                </p>
              ) : (
                <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm font-semibold text-amber-700 mb-3">
                  Could not confirm the email was sent — copy the link below and share it directly.
                </p>
              )}
              <div className="flex items-center gap-2">
                <input readOnly value={kycLinkUrl} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono" onFocus={(e) => e.target.select()} />
                <button
                  onClick={() => navigator.clipboard?.writeText(kycLinkUrl)}
                  className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </>
          )}
          <div className="flex justify-end mt-5">
            <button onClick={() => setKycLinkTarget(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
