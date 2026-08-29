import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createBusiness, type CreateBusinessPayload } from "../services/api";

const OPERATIONAL_CURRENCIES = ['EUR', 'GBP', 'GHS', 'KES', 'MWK', 'NGN', 'SLL', 'TZS', 'UGX', 'USD', 'XAF', 'XOF', 'ZAR', 'ZMW'];

// Only company name, trading name, and email are required — everything else
// is something the business fills in themselves once they set up their own
// account, so admin isn't blocked from creating it without those details.
const FIELDS: { key: keyof CreateBusinessPayload; label: string; required?: boolean; type?: string }[] = [
  { key: "companyName", label: "Registered company name", required: true },
  { key: "tradingName", label: "Trading name shown to senders", required: true },
  { key: "email", label: "Business email (login)", required: true, type: "email" },
  { key: "businessRegistrationNumber", label: "Registration number (optional)" },
  { key: "businessAddress", label: "Business address (optional)" },
  { key: "businessTaxId", label: "Tax ID (optional)" },
  { key: "country", label: "Country (e.g. NG, GH, US) (optional)" },
];

const initialForm: CreateBusinessPayload = {
  companyName: "", tradingName: "", email: "", businessRegistrationNumber: "",
  businessAddress: "", businessTaxId: "", country: "", operationalCurrency: "",
};

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateBusinessPayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const change = (key: keyof CreateBusinessPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const missing = FIELDS.find((f) => f.required && !String(form[f.key] || "").trim());
    if (missing) {
      setError(`Please fill in "${missing.label}".`);
      return;
    }
    setLoading(true);
    try {
      const res = await createBusiness(form);
      if (!res?.success) throw new Error(res?.message || "Could not create the business account.");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Could not create the business account.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-5" size={56} />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Business account created</h1>
        <p className="text-gray-500 mb-8">
          {form.tradingName || form.companyName} can sign in with <strong>{form.email}</strong> once they set their
          password — a welcome email with instructions has been sent. Next, upload their CAC document and generate
          a KYC link from the Businesses page.
        </p>
        <button
          onClick={() => navigate("/businesses")}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
        >
          Go to Businesses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate("/businesses")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to Businesses
      </button>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-3"><Building2 className="text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Create Business Account</h1>
          <p className="text-sm text-gray-500">Onboard a business on their behalf — they'll receive a welcome email with login details.</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Business details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, required, type }) => (
              <label key={key}>
                <span className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
                <input
                  type={type || "text"}
                  required={required}
                  value={form[key] || ""}
                  onChange={change(key)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
            ))}
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1">Operational currency</span>
              <select
                value={form.operationalCurrency || ""}
                onChange={change("operationalCurrency")}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Select currency</option>
                {OPERATIONAL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-xs text-gray-400">Sets the business's wallet and payout currency. Only supported payout currencies are listed.</span>
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          No password is needed here, and no representative details either — the business sets their own password
          via "Forgot password" once they receive the welcome email, and fills in their representative and any
          remaining business details themselves from Settings afterward.
        </p>

        {error && <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
          Create Business Account
        </button>
      </form>
    </div>
  );
}
