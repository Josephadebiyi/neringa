import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Coord { lat: number; lng: number; }
const geocodeCache: Record<string, Coord | null> = {};

async function geocode(city: string, country: string): Promise<Coord | null> {
    const key = `${city}|${country}`.toLowerCase();
    if (geocodeCache[key] !== undefined) return geocodeCache[key];
    for (const q of [`${city}, ${country}`, city]) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
                { headers: { 'User-Agent': 'BagoAdmin/1.0 (journey-map)' } }
            );
            const data = await res.json();
            if (data?.[0]) {
                const result: Coord = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                geocodeCache[key] = result;
                return result;
            }
        } catch { /* try next */ }
    }
    geocodeCache[key] = null;
    return null;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function interpolate(from: Coord, to: Coord, t: number): [number, number] {
    return [lerp(from.lat, to.lat, t), lerp(from.lng, to.lng, t)];
}

function naturalProgress(status: string, departureDate?: string, arrivalDate?: string): number {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 0;
    if (s === 'accepted') return 0.05;
    if (s === 'completed') return 1;
    if (s === 'intransit' || s === 'delivering') {
        if (!departureDate) return 0.5;
        const now = Date.now();
        const dep = new Date(departureDate).getTime();
        const arr = arrivalDate ? new Date(arrivalDate).getTime() : dep + 48 * 3600 * 1000;
        if (now <= dep) return 0.05;
        if (now >= arr) return s === 'delivering' ? 0.92 : 0.85;
        const p = (now - dep) / (arr - dep);
        const base = s === 'delivering' ? 0.82 : 0.12;
        const top = s === 'delivering' ? 0.92 : 0.82;
        return base + p * (top - base);
    }
    return 0;
}

function vehicleEmoji(means: string) {
    const m = (means || '').toLowerCase();
    if (m.includes('air') || m.includes('plane')) return '✈️';
    if (m.includes('ship') || m.includes('sea')) return '🚢';
    if (m.includes('train')) return '🚆';
    if (m.includes('bus')) return '🚌';
    if (m.includes('car')) return '🚗';
    return '🚚';
}

function makeVehicleIcon(means: string) {
    return L.divIcon({
        html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${vehicleEmoji(means)}</div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
    });
}

function makeDotIcon(color: string) {
    return L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    });
}

function FitBounds({ from, to }: { from: Coord; to: Coord }) {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]);
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [from, to, map]);
    return null;
}

interface Props {
    fromCity: string;
    fromCountry: string;
    toCity: string;
    toCountry: string;
    travelMeans?: string;
    status?: string;
    departureDate?: string;
    arrivalDate?: string;
}

export default function JourneyMap({ fromCity, fromCountry, toCity, toCountry, travelMeans = 'truck', status = 'pending', departureDate, arrivalDate }: Props) {
    const [fromCoord, setFromCoord] = useState<Coord | null>(null);
    const [toCoord, setToCoord] = useState<Coord | null>(null);
    const [geocodeError, setGeocodeError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [simulating, setSimulating] = useState(false);
    const simRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);

    const load = useCallback(async () => {
        setLoading(true);
        setGeocodeError(false);
        const [f, t] = await Promise.all([geocode(fromCity, fromCountry), geocode(toCity, toCountry)]);
        if (!f || !t) { setGeocodeError(true); } else { setFromCoord(f); setToCoord(t); }
        setLoading(false);
    }, [fromCity, fromCountry, toCity, toCountry]);

    useEffect(() => { load(); return () => stopSim(); }, [load]);

    useEffect(() => {
        if (!simulating) setProgress(naturalProgress(status, departureDate, arrivalDate));
    }, [status, departureDate, arrivalDate, simulating]);

    function startSim() {
        stopSim();
        setSimulating(true);
        setProgress(0);
        startRef.current = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - startRef.current) / 6000, 1);
            setProgress(t);
            if (t < 1) { simRef.current = requestAnimationFrame(tick); }
            else { setSimulating(false); }
        };
        simRef.current = requestAnimationFrame(tick);
    }

    function stopSim() {
        if (simRef.current) { cancelAnimationFrame(simRef.current); simRef.current = null; }
        setSimulating(false);
    }

    if (loading) return (
        <div className="w-full h-48 rounded-2xl bg-gray-100 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#5240E8] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (geocodeError || !fromCoord || !toCoord) return (
        <div className="w-full h-48 rounded-2xl bg-gray-100 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🗺️</span>
            <p className="text-xs font-bold text-gray-400">{fromCity} → {toCity}</p>
            <button onClick={load} className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Retry</button>
        </div>
    );

    const vehiclePos = interpolate(fromCoord, toCoord, progress);
    const pct = Math.round(progress * 100);

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative" style={{ height: 200 }}>
            <MapContainer
                center={[lerp(fromCoord.lat, toCoord.lat, 0.5), lerp(fromCoord.lng, toCoord.lng, 0.5)]}
                zoom={4}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds from={fromCoord} to={toCoord} />
                <Polyline positions={[[fromCoord.lat, fromCoord.lng], [toCoord.lat, toCoord.lng]]} color="#5240E8" weight={3} dashArray="8 6" opacity={0.7} />
                <Marker position={[fromCoord.lat, fromCoord.lng]} icon={makeDotIcon('#22c55e')} />
                <Marker position={[toCoord.lat, toCoord.lng]} icon={makeDotIcon('#ef4444')} />
                <Marker position={vehiclePos} icon={makeVehicleIcon(travelMeans)} />
            </MapContainer>
            <div className="absolute top-2 left-2 z-[1000] bg-white/95 rounded-lg px-2.5 py-1 shadow-sm border border-gray-100 text-[10px] font-black text-[#5240E8]">{pct}%</div>
            <button
                onClick={simulating ? stopSim : startSim}
                className="absolute bottom-2 right-2 z-[1000] bg-white/95 rounded-lg px-2.5 py-1 shadow-sm border border-gray-100 text-[10px] font-black text-gray-600 hover:bg-white"
            >
                {simulating ? 'Stop' : `${vehicleEmoji(travelMeans)} Simulate`}
            </button>
        </div>
    );
}
