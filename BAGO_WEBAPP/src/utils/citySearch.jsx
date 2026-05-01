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

// Predefined option list (string labels — rendered by formatCityOptionLabel)
export const locationOptions = [
    ...countries.map((c) => ({
        value: `country:${c.label}`,
        label: `All cities in ${c.label}`,
        city: '',
        country: c.label,
        flag: c.flag,
        type: 'country',
        searchText: normalizeText(`${c.label} ${c.value}`),
    })),
    ...locations.map((loc) => ({
        value: `city:${loc.city}`,
        label: `${loc.city}, ${loc.country}`,
        city: loc.city,
        country: loc.country,
        flag: loc.flag,
        type: 'city',
        searchText: normalizeText(`${loc.city} ${loc.country} ${loc.label}`),
    })),
];

// Renders each option row inside the dropdown
export const formatCityOptionLabel = ({ flag, city, country, type }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{flag || '📍'}</span>
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

// Async loader: local filter + Nominatim live search
let _debounceTimer;
export const loadCityOptions = (inputValue) =>
    new Promise((resolve) => {
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(async () => {
            const norm = normalizeText(inputValue);

            // Always include matching predefined entries
            const local = inputValue
                ? locationOptions.filter((o) => o.searchText?.includes(norm)).slice(0, 20)
                : locationOptions.slice(0, 30);

            if (!inputValue || inputValue.length < 2) {
                resolve(local);
                return;
            }

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=jsonv2&addressdetails=1&limit=10`,
                    { headers: { 'User-Agent': 'BagoApp/1.0 (bago.delivery)' } }
                );
                const data = await res.json();

                const nominatim = data
                    .map((item) => {
                        const address = item.address || {};
                        const city =
                            address.city ||
                            address.town ||
                            address.municipality ||
                            address.village ||
                            address.county ||
                            item.display_name?.split(',')[0]?.trim() ||
                            '';
                        const country = address.country || '';
                        if (!city) return null;
                        return {
                            value: `nominatim:${city}:${country}`,
                            label: `${city}, ${country}`,
                            city,
                            country,
                            flag: codeToFlag(address.country_code || ''),
                            type: 'city',
                            searchText: normalizeText(`${city} ${country}`),
                        };
                    })
                    .filter(Boolean)
                    // Remove duplicates with local predefined list
                    .filter(
                        (r) =>
                            !local.some(
                                (l) =>
                                    l.city &&
                                    normalizeText(l.city) === normalizeText(r.city) &&
                                    normalizeCountry(l.country) === normalizeCountry(r.country)
                            )
                    );

                resolve([...local, ...nominatim]);
            } catch {
                resolve(local);
            }
        }, 300);
    });

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
