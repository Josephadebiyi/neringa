import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export interface CitySuggestion {
  city: string;
  country: string;
  countryCode: string;
}

// Live worldwide city search — mirrors the Flutter app's own trip-posting
// location picker (lib/features/trips/screens/post_trip_screen.dart,
// _LocationSearchSheetState._search), which queries Nominatim/OpenStreetMap
// directly rather than a small hardcoded city list, so any real city in the
// world resolves here the same way it does in the app.
async function searchCities(query: string): Promise<CitySuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    namedetails: "1",
    limit: "8",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();

  const seen = new Set<string>();
  const results: CitySuggestion[] = [];
  for (const item of data as any[]) {
    const addr = item.address || {};
    const country = addr.country || "";
    if (!country) continue;
    const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.county || "";
    if (!city) continue;
    const countryCode = String(addr.country_code || "xx").toLowerCase();
    const key = `${String(city).toLowerCase()}:${countryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ city: String(city), country: String(country), countryCode });
  }
  return results;
}

export default function CityAutocomplete({
  label,
  city,
  onSelect,
}: {
  label: string;
  city: string;
  onSelect: (option: CitySuggestion) => void;
}) {
  const [query, setQuery] = useState(city);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQuery(city), [city]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setSuggestions(await searchCities(q));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500); // matches the app's debounce, and stays polite to Nominatim's rate limit
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search cities…"
          required
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={`${s.city}-${s.countryCode}`}
              type="button"
              onClick={() => { onSelect(s); setQuery(s.city); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span>{s.city}, {s.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
