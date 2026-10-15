import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Store, Search, CheckCircle2, X } from "lucide-react";
import { searchBusinesses, createBusinessServiceForBusiness } from "../services/api";

type BusinessOption = {
  id: string;
  tradingName?: string;
  companyName?: string;
  email?: string;
  walletCurrency?: string;
};

// A business's named per-kg service (e.g. "Express") — not tied to a route or
// date, unlimited capacity. Modeled on the backend as a trip
// (is_business_service), the same as CreateTrip.tsx's regular trips, so it
// goes through the identical checkout-preview pricing a real trip uses.
export default function CreateBusinessServicePage() {
  const navigate = useNavigate();

  const [businessSearch, setBusinessSearch] = useState("");
  const [businessResults, setBusinessResults] = useState<BusinessOption[]>([]);
  const [businessSearching, setBusinessSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessOption | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (selectedBusiness || !businessSearch.trim()) {
      setBusinessResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setBusinessSearching(true);
      try {
        const res = await searchBusinesses(businessSearch.trim());
        setBusinessResults(res?.data || []);
      } catch {
        setBusinessResults([]);
      } finally {
        setBusinessSearching(false);
      }
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [businessSearch, selectedBusiness]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedBusiness) {
      setError("Select the business account this service belongs to.");
      return;
    }
    if (!selectedBusiness.walletCurrency) {
      setError("This business has not set a wallet receiving currency yet — set it on their account before adding a service on their behalf.");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Service name is required (e.g. "Express", "Standard").');
      return;
    }
    const price = parseFloat(pricePerKg);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price per kg must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBusinessServiceForBusiness({
        businessUserId: selectedBusiness.id,
        name: trimmedName,
        pricePerKg: price,
      });
      if (!res?.success) throw new Error(res?.message || "Could not create the service.");
      setDone({ message: res.message });
    } catch (e: any) {
      setError(e?.message || "Could not create the service.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-5" size={56} />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Service created</h1>
        <p className="text-gray-500 mb-8">{done.message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate("/trips")} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
            Go to Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate("/trips")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to Trips
      </button>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-3"><Store className="text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Create Business Service</h1>
          <p className="text-sm text-gray-500">A named per-kg rate (e.g. "Express"), not tied to a route or date. Goes live immediately.</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Business account</h2>
          {selectedBusiness ? (
            <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedBusiness.tradingName || selectedBusiness.companyName}</p>
                  <p className="text-xs text-gray-500">{selectedBusiness.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => { setSelectedBusiness(null); setBusinessSearch(""); }} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
                placeholder="Search business by name, email or registration…"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm"
              />
              {businessSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
              {businessResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg max-h-64 overflow-y-auto">
                  {businessResults.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => { setSelectedBusiness(b); setBusinessResults([]); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                    >
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{b.tradingName || b.companyName}</p>
                        <p className="text-xs text-gray-500">{b.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Service name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Express, Standard"
              className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Price per kg {selectedBusiness?.walletCurrency ? `(${selectedBusiness.walletCurrency})` : ""}
            </label>
            <input
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating…" : "Create service"}
        </button>
      </form>
    </div>
  );
}
