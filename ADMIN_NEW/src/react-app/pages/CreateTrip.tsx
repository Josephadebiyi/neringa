import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Plane, Car, Bus, Train, Ship, Search, CheckCircle2, X } from "lucide-react";
import { searchBusinesses, createTripForBusiness } from "../services/api";
import TripDateSelector from "../components/TripDateSelector";
import CityAutocomplete from "../components/CityAutocomplete";

const TRAVEL_MEANS = [
  { id: "airplane", label: "Airplane", icon: Plane },
  { id: "car", label: "Car", icon: Car },
  { id: "bus", label: "Bus", icon: Bus },
  { id: "train", label: "Train", icon: Train },
  { id: "ship", label: "Ship", icon: Ship },
];

type BusinessOption = {
  id: string;
  tradingName?: string;
  companyName?: string;
  email?: string;
  country?: string;
  walletCurrency?: string;
};

export default function CreateTripPage() {
  const navigate = useNavigate();

  const [businessSearch, setBusinessSearch] = useState("");
  const [businessResults, setBusinessResults] = useState<BusinessOption[]>([]);
  const [businessSearching, setBusinessSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessOption | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [originCity, setOriginCity] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [collectionCity, setCollectionCity] = useState("");
  const [collectionCountry, setCollectionCountry] = useState("");
  const [travelMeans, setTravelMeans] = useState("airplane");
  const [dates, setDates] = useState<string[]>([]);
  const [availableKg, setAvailableKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [landmark, setLandmark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ count: number; message: string } | null>(null);

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
      setError("Select the business account this trip belongs to.");
      return;
    }
    if (!selectedBusiness.walletCurrency) {
      setError("This business has not set a wallet receiving currency yet — set it on their account before posting a trip on their behalf.");
      return;
    }
    if (!originCity.trim() || !destinationCity.trim()) {
      setError("Origin and destination city are required.");
      return;
    }
    if (!dates.length) {
      setError("Select at least one departure date.");
      return;
    }
    const weight = parseFloat(availableKg);
    const price = parseFloat(pricePerKg);
    if (!Number.isFinite(weight) || weight <= 0) {
      setError("Trip capacity must be greater than 0kg.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price per kg must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTripForBusiness({
        businessUserId: selectedBusiness.id,
        fromLocation: `${originCity}, ${originCountry}`.replace(/, $/, ""),
        fromCountry: originCountry,
        toLocation: `${destinationCity}, ${destinationCountry}`.replace(/, $/, ""),
        toCountry: destinationCountry,
        collectionCity: collectionCity || undefined,
        collectionCountry: collectionCountry || undefined,
        departureDates: dates,
        availableKg: weight,
        travelMeans,
        pricePerKg: price,
        landmark,
      });
      if (!res?.success) throw new Error(res?.message || "Could not create the trip.");
      setDone({ count: res.count || dates.length, message: res.message });
    } catch (e: any) {
      setError(e?.message || "Could not create the trip.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-5" size={56} />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Trip{done.count > 1 ? "s" : ""} created</h1>
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
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate("/trips")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to Trips
      </button>

      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-3"><Plane className="text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Create Trip for a Business</h1>
          <p className="text-sm text-gray-500">The trip is created live and immediately visible to customers — no review queue.</p>
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

        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Route</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <CityAutocomplete
              label="Origin city"
              city={originCity}
              onSelect={(loc) => { setOriginCity(loc.city); setOriginCountry(loc.country); }}
            />
            <CityAutocomplete
              label="Destination city"
              city={destinationCity}
              onSelect={(loc) => { setDestinationCity(loc.city); setDestinationCountry(loc.country); }}
            />
            <div className="text-xs text-gray-500 md:col-span-2 -mt-2">
              {originCountry && <span>Origin country: <strong>{originCountry}</strong></span>}
              {originCountry && destinationCountry && <span className="mx-2">·</span>}
              {destinationCountry && <span>Destination country: <strong>{destinationCountry}</strong></span>}
            </div>
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1">Collection point city (optional)</span>
              <input value={collectionCity} onChange={(e) => setCollectionCity(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1">Collection point country (optional)</span>
              <input value={collectionCountry} onChange={(e) => setCollectionCountry(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Travel means</h2>
          <div className="grid grid-cols-5 gap-2">
            {TRAVEL_MEANS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTravelMeans(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition-all ${
                  travelMeans === id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Departure dates</h2>
          <p className="text-xs text-gray-400 mb-3">Single date, pick multiple, a whole month, or a daily range — same options a business gets when posting their own trip.</p>
          <TripDateSelector dates={dates} onChange={setDates} />
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Capacity &amp; pricing</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1">Available capacity (kg) <span className="text-red-500">*</span></span>
              <input type="number" min={0.1} step={0.1} value={availableKg} onChange={(e) => setAvailableKg(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1">Price per kg <span className="text-red-500">*</span></span>
              <input type="number" min={0.01} step={0.01} value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} required className="w-full border rounded-lg px-3 py-2 text-sm" />
            </label>
            <label>
              <span className="block text-sm font-medium text-gray-700 mb-1">Currency</span>
              <input
                value={selectedBusiness?.walletCurrency || "Not set"}
                disabled
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
              />
              <span className="text-xs text-gray-400">Always priced in the business's own wallet currency.</span>
            </label>
          </div>
          <label className="block mt-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Pickup landmark</span>
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
          Create Trip
        </button>
      </form>
    </div>
  );
}
