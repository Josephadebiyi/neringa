import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const geocodeCache = {};

async function geocode(city, country) {
    const key = `${city}|${country}`.toLowerCase();
    if (geocodeCache[key] !== undefined) return geocodeCache[key];

    const queries = [
        `${city}, ${country}`,
        city,
    ];

    for (const q of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'BagoApp/1.0 (journey-map)' },
            });
            const data = await res.json();
            if (data && data[0]) {
                const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                geocodeCache[key] = result;
                return result;
            }
        } catch (_) {
            // try next query
        }
    }

    geocodeCache[key] = null;
    return null;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function interpolateLatLng(from, to, t) {
    return [lerp(from.lat, to.lat, t), lerp(from.lng, to.lng, t)];
}

function naturalProgress(status, departureDate, arrivalDate) {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 0.0;
    if (s === 'accepted') return 0.05;
    if (s === 'completed' || s === 'delivered') return 1.0;

    if ((s === 'intransit' || s === 'delivering') && departureDate) {
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

    return 0.0;
}

function vehicleEmoji(travelMeans) {
    const m = (travelMeans || '').toLowerCase();
    if (m.includes('air') || m.includes('plane') || m.includes('flight')) return '✈️';
    if (m.includes('ship') || m.includes('sea') || m.includes('ferry')) return '🚢';
    if (m.includes('train') || m.includes('rail')) return '🚆';
    if (m.includes('bus')) return '🚌';
    if (m.includes('car')) return '🚗';
    return '🚚';
}

function makeVehicleIcon(travelMeans) {
    return L.divIcon({
        html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${vehicleEmoji(travelMeans)}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

function makeDotIcon(color) {
    return L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    });
}

function FitBoundsOnMount({ from, to }) {
    const map = useMap();
    useEffect(() => {
        if (from && to) {
            const bounds = L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]);
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [from, to, map]);
    return null;
}

export default function JourneyMap({ fromCity, fromCountry, toCity, toCountry, travelMeans, status, departureDate, arrivalDate }) {
    const [fromCoord, setFromCoord] = useState(null);
    const [toCoord, setToCoord] = useState(null);
    const [geocodeError, setGeocodeError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [simulating, setSimulating] = useState(false);
    const simRef = useRef(null);
    const startRef = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        setGeocodeError(false);
        const [f, t] = await Promise.all([
            geocode(fromCity, fromCountry),
            geocode(toCity, toCountry),
        ]);
        if (!f || !t) {
            setGeocodeError(true);
        } else {
            setFromCoord(f);
            setToCoord(t);
        }
        setLoading(false);
    }, [fromCity, fromCountry, toCity, toCountry]);

    useEffect(() => {
        load();
        return () => stopSim();
    }, [load]);

    useEffect(() => {
        if (!simulating) {
            setProgress(naturalProgress(status, departureDate, arrivalDate));
        }
    }, [status, departureDate, arrivalDate, simulating]);

    function startSim() {
        stopSim();
        setSimulating(true);
        setProgress(0);
        startRef.current = performance.now();
        const duration = 7000;

        const tick = (now) => {
            const t = Math.min((now - startRef.current) / duration, 1);
            setProgress(t);
            if (t < 1) {
                simRef.current = requestAnimationFrame(tick);
            } else {
                setSimulating(false);
            }
        };
        simRef.current = requestAnimationFrame(tick);
    }

    function stopSim() {
        if (simRef.current) {
            cancelAnimationFrame(simRef.current);
            simRef.current = null;
        }
        setSimulating(false);
    }

    if (loading) {
        return (
            <div className="w-full h-52 rounded-[20px] bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#5845D8] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading map...</span>
                </div>
            </div>
        );
    }

    if (geocodeError || !fromCoord || !toCoord) {
        return (
            <div className="w-full h-52 rounded-[20px] bg-gray-100 flex flex-col items-center justify-center gap-3">
                <div className="text-2xl">🗺️</div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{fromCity} → {toCity}</p>
                <button
                    onClick={load}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                    Retry
                </button>
            </div>
        );
    }

    const vehiclePos = interpolateLatLng(fromCoord, toCoord, progress);
    const pct = Math.round(progress * 100);

    return (
        <div className="w-full rounded-[20px] overflow-hidden border border-gray-100 shadow-sm relative" style={{ height: 220 }}>
            <MapContainer
                center={[lerp(fromCoord.lat, toCoord.lat, 0.5), lerp(fromCoord.lng, toCoord.lng, 0.5)]}
                zoom={4}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBoundsOnMount from={fromCoord} to={toCoord} />

                {/* Route line */}
                <Polyline
                    positions={[[fromCoord.lat, fromCoord.lng], [toCoord.lat, toCoord.lng]]}
                    color="#5845D8"
                    weight={3}
                    dashArray="8 6"
                    opacity={0.7}
                />

                {/* Origin dot */}
                <Marker position={[fromCoord.lat, fromCoord.lng]} icon={makeDotIcon('#22c55e')} />
                {/* Destination dot */}
                <Marker position={[toCoord.lat, toCoord.lng]} icon={makeDotIcon('#ef4444')} />
                {/* Vehicle */}
                <Marker position={vehiclePos} icon={makeVehicleIcon(travelMeans)} />
            </MapContainer>

            {/* Progress badge */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-gray-100">
                <span className="text-[9px] font-black text-[#5845D8] uppercase tracking-widest">{pct}%</span>
            </div>

            {/* Simulate button */}
            <button
                onClick={simulating ? stopSim : startSim}
                className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-gray-100 text-[9px] font-black text-[#012126] uppercase tracking-widest hover:bg-white transition-all"
            >
                {simulating ? 'Stop' : `${vehicleEmoji(travelMeans)} Simulate`}
            </button>
        </div>
    );
}
