import { useEffect, useMemo, useState } from "react";
import { Building2, Search, ShieldCheck, Wallet } from "lucide-react";
import { getBusinesses } from "../services/api";

type Business = {
  id: string; tradingName?: string; companyName?: string; businessRegistrationNumber?: string;
  businessType?: string; businessStatus?: string; representativeRole?: string; firstName?: string;
  lastName?: string; email?: string; country?: string; image?: string; kycStatus?: string;
  walletBalance?: number; walletCurrency?: string; createdAt?: string;
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { getBusinesses().then((result) => setBusinesses(result?.data || []))
    .catch((reason) => setError(reason.message || "Could not load businesses."))
    .finally(() => setLoading(false)); }, []);

  const shown = useMemo(() => businesses.filter((business) =>
    [business.tradingName, business.companyName, business.email, business.businessRegistrationNumber]
      .some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()))), [businesses, search]);
  const verified = businesses.filter((b) => ["approved", "verified", "completed"].includes(String(b.kycStatus).toLowerCase())).length;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black text-gray-900">Businesses</h1><p className="mt-1 text-sm text-gray-500">Business accounts, representative KYC and shared Bago wallets.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      {[[Building2,"Business accounts",businesses.length],[ShieldCheck,"KYC verified",verified],[Wallet,"Awaiting KYC",businesses.length-verified]].map(([Icon,label,value]: any) => <div key={label} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 flex items-center gap-4"><div className="rounded-xl bg-indigo-50 p-3"><Icon className="text-indigo-600" /></div><div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-black">{value}</p></div></div>)}
    </div>
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b"><div className="relative max-w-md"><Search className="absolute left-3 top-3 text-gray-400 h-5 w-5"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search business, email or registration…" className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4"/></div></div>
      {error ? <p className="p-6 text-red-600">{error}</p> : loading ? <p className="p-6 text-gray-500">Loading businesses…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-gray-500"><tr>{["Business","Registration","Representative","KYC","Wallet","Joined"].map(h=><th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y">{shown.map((b)=><tr key={b.id} className="hover:bg-gray-50"><td className="px-5 py-4"><div className="flex items-center gap-3">{b.image?<img src={b.image} className="h-10 w-10 rounded-xl object-cover"/>:<div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-indigo-600"/></div>}<div><b>{b.tradingName || b.companyName}</b><p className="text-gray-500">{b.email}</p></div></div></td><td className="px-5 py-4">{b.businessRegistrationNumber || "—"}<p className="text-gray-500">{b.country || ""}</p></td><td className="px-5 py-4">{[b.firstName,b.lastName].filter(Boolean).join(" ")}<p className="text-gray-500">{b.representativeRole || "—"}</p></td><td className="px-5 py-4"><span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold capitalize">{b.kycStatus || "pending"}</span></td><td className="px-5 py-4 font-semibold">{b.walletCurrency || ""} {Number(b.walletBalance || 0).toFixed(2)}</td><td className="px-5 py-4 text-gray-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table>{!shown.length&&<p className="p-8 text-center text-gray-500">No businesses found.</p>}</div>}
    </div>
  </div>;
}
