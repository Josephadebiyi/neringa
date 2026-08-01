import { countries, locations } from './countries';

export const normalizeText = (value = '') =>
    value
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const countryAliases = {
    usa: 'united states', us: 'united states', 'u s a': 'united states',
    uk: 'united kingdom', 'u k': 'united kingdom', england: 'united kingdom',
    uae: 'united arab emirates', 'u a e': 'united arab emirates',
    drc: 'democratic republic of congo',
    'ivory coast': 'cote d ivoire',
};
export const normalizeCountry = (v = '') => {
    const n = normalizeText(v);
    return countryAliases[n] || n;
};

const codeToFlag = (code) => {
    if (!code || code.length !== 2) return '🌍';
    return [...code.toUpperCase()]
        .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
        .join('');
};

// Predefined option list — cities first, countries appended at the end
const _cityOptions = locations.map((loc) => ({
    value: `city:${loc.city}`,
    label: `${loc.city}, ${loc.country}`,
    city: loc.city,
    country: loc.country,
    flag: loc.flag,
    type: 'city',
    searchText: normalizeText(`${loc.city} ${loc.country} ${loc.label}`),
}));
const _countryOptions = countries.map((c) => ({
    value: `country:${c.label}`,
    label: `All cities in ${c.label}`,
    city: '',
    country: c.label,
    flag: c.flag,
    type: 'country',
    searchText: normalizeText(`${c.label} ${c.value}`),
}));
export const locationOptions = [..._cityOptions, ..._countryOptions];

// Renders each option row inside the dropdown
export const formatCityOptionLabel = ({ flag, city, country, type }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
        <span style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: '#F1EEFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            lineHeight: 1,
            flexShrink: 0,
        }}>{flag || '📍'}</span>
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#012126', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {type === 'country' ? `All cities in ${country}` : city}
            </div>
            {city && country && (
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {country}
                </div>
            )}
        </div>
    </div>
);

// Creates a custom option when the user types something not in the list
export const makeCustomLocation = (inputValue) => {
    const parts = inputValue.split(',').map((p) => p.trim()).filter(Boolean);
    const city = parts[0] || inputValue.trim();
    const country = parts.slice(1).join(', ');
    return {
        value: `custom:${inputValue}`,
        label: inputValue,
        city,
        country,
        flag: '📍',
        type: 'city',
        isCustom: true,
        searchText: normalizeText(inputValue),
    };
};

const citySearchCache = new Map();

const uniqueCities = (options) => {
    const seen = new Set();
    return options.filter((option) => {
        const isCountry = option.type === 'country';
        const key = isCountry
            ? `country|${normalizeCountry(option.country)}`
            : `city|${normalizeText(option.city)}|${normalizeCountry(option.country)}`;
        if ((!isCountry && !option.city) || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const fetchJson = async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`City search failed (${response.status})`);
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
};

const searchPhoton = async (inputValue) => {
    const data = await fetchJson(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(inputValue)}&limit=12&lang=en`,
    );
    return (data.features || []).map((feature) => {
        const properties = feature.properties || {};
        const city = properties.city || properties.name || properties.locality || '';
        const country = properties.country || '';
        if (!city || !country) return null;
        return {
            value: `photon:${city}:${country}`,
            label: `${city}, ${country}`,
            city,
            country,
            flag: codeToFlag(properties.countrycode || ''),
            type: 'city',
            searchText: normalizeText(`${city} ${country}`),
        };
    }).filter(Boolean);
};

const searchNominatim = async (inputValue) => {
    const data = await fetchJson(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=jsonv2&addressdetails=1&limit=10&accept-language=en`,
    );
    return data.map((item) => {
        const address = item.address || {};
        const city = address.city || address.town || address.municipality ||
            address.village || address.county || item.name ||
            item.display_name?.split(',')[0]?.trim() || '';
        const country = address.country || '';
        if (!city || !country) return null;
        return {
            value: `nominatim:${city}:${country}`,
            label: `${city}, ${country}`,
            city,
            country,
            flag: codeToFlag(address.country_code || ''),
            type: 'city',
            searchText: normalizeText(`${city} ${country}`),
        };
    }).filter(Boolean);
};

// Async loader: local results plus worldwide geocoding. Each invocation owns
// its request, so origin and destination fields cannot cancel each other.
export const loadCityOptions = async (inputValue) => {
            const query = inputValue.trim();
            const norm = normalizeText(query);

            // Cities first, country-wide entries only when user explicitly searches a country name
            const allLocal = query
                ? locationOptions.filter((o) => o.searchText?.includes(norm))
                : locationOptions.slice(0, 30);
            const local = query
                ? [
                    ...allLocal.filter((o) => o.type === 'city').slice(0, 15),
                    ...allLocal.filter((o) => o.type === 'country').slice(0, 5),
                  ]
                : allLocal;

            if (!query || query.length < 2) {
                return local;
            }

            if (citySearchCache.has(norm)) {
                return uniqueCities([...local, ...citySearchCache.get(norm)]);
            }

            let worldwide = [];
            try {
                worldwide = await searchPhoton(query);
            } catch {
                // Photon can occasionally be unavailable; Nominatim is the
                // secondary worldwide source rather than leaving only local cities.
            }
            if (worldwide.length === 0) {
                try {
                    worldwide = await searchNominatim(query);
                } catch {
                    worldwide = [];
                }
            }
            const normalizedWorldwide = uniqueCities(worldwide).slice(0, 10);
            citySearchCache.set(norm, normalizedWorldwide);
            return uniqueCities([...local, ...normalizedWorldwide]);
};

// Client-side trip matching (used on Search page)
const getTripSide = (trip, side) => {
    const isOrigin = side === 'origin';
    const city = isOrigin ? (trip.origin || trip.fromLocation || '') : (trip.destination || trip.toLocation || '');
    const country = isOrigin ? (trip.fromCountry || '') : (trip.toCountry || '');
    return {
        cityNorm: normalizeText(city),
        countryNorm: normalizeCountry(country),
        combinedNorm: normalizeText(`${city} ${country}`),
    };
};

export const locationMatches = (trip, selected, side) => {
    if (!selected) return { matches: true, score: 0 };
    const tripSide = getTripSide(trip, side);
    const selectedCity = normalizeText(selected.city || '');
    const selectedCountry = normalizeCountry(selected.country || '');
    const selectedCombined = normalizeText(`${selected.city || ''} ${selected.country || ''}`);
    const isCountryWide = selected.type === 'country' || (!selected.city && selected.country);
    const isBus = normalizeText(trip.transportMode || trip.travelMeans || '').includes('bus');

    const countryMatch = selectedCountry
        ? tripSide.countryNorm === selectedCountry || tripSide.combinedNorm.includes(selectedCountry)
        : false;
    const cityMatch = selectedCity
        ? tripSide.cityNorm.includes(selectedCity) || selectedCity.includes(tripSide.cityNorm) || tripSide.combinedNorm.includes(selectedCity)
        : false;
    const customMatch = selectedCombined
        ? tripSide.combinedNorm.includes(selectedCombined) || selectedCombined.includes(tripSide.combinedNorm)
        : false;

    if (isCountryWide) return { matches: countryMatch || customMatch, score: countryMatch ? 40 : 10 };
    if (selectedCountry) {
        if (!countryMatch) return { matches: false, score: 0 };
        return { matches: true, score: (cityMatch ? 60 : 0) + (isBus ? 20 : 8) + 40 };
    }
    return { matches: cityMatch || customMatch, score: cityMatch ? 35 : 10 };
};
