import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search as SearchIcon,
    MapPin,
    Calendar,
    Users,
    Star,
    ArrowRight,
    Filter,
    SlidersHorizontal,
    Package,
    Plane,
    UserCircle,
    ChevronLeft,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api';
import AsyncCreatableSelect from 'react-select/async-creatable';
import {
    normalizeText,
    normalizeCountry,
    locationOptions,
    loadCityOptions,
    formatCityOptionLabel,
    makeCustomLocation,
    locationMatches,
} from '../utils/citySearch.jsx';


const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="lg:hidden flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8]">
                    <ChevronLeft size={20} />
                    <span className="font-bold text-xs">{t('back')}</span>
                </button>
                <Link to="/" className="flex items-center">
                    <img src="/bago_logo.png" alt="Bago" className="h-7 w-auto" />
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <Link to="/login" className="flex items-center p-1 hover:bg-gray-50 rounded-full transition-all">
                    <UserCircle size={28} className="text-[#d9d9d9] hover:text-[#012126] transition-colors" />
                </Link>
            </div>
        </nav>
    );
};

const TripCard = ({ trip, weight, surchargeMultiplier = 1.2075 }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { t } = useLanguage();
    const isVerified = trip.isVerified === true ||
        trip.kycStatus === 'approved' ||
        trip.isKycCompleted === true ||
        trip.kyc === true;

    const handleBookingClick = async (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            localStorage.setItem('pending_booking', JSON.stringify({ trip }));
            navigate('/signup');
            return;
        }

        try {
            const response = await api.get('/api/bago/kyc/status');
            const status = response.data?.kycStatus;
            const phoneVerified = response.data?.phoneVerified === true || user?.phoneVerified === true;

            if (status !== 'approved') {
                localStorage.setItem('pending_booking', JSON.stringify({ trip }));
                navigate('/verify');
            } else if (!phoneVerified) {
                localStorage.setItem('pending_booking', JSON.stringify({ trip }));
                navigate('/dashboard?tab=settings', {
                    state: { message: 'Please verify your phone number to continue.' }
                });
            } else {
                navigate(`/send-package`, { state: { trip, weight } });
            }
        } catch (error) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden hover:shadow-[0_18px_45px_rgba(1,33,38,0.08)] hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer">
            {/* Top — dark travel header */}
            <div className="bg-[#012126] px-5 pt-5 pb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5845D8]/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                {/* Traveler row */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm border-2 border-[#5845D8]/30 shadow-lg shadow-[#5845D8]/20">
                            {trip.firstName?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <p className="text-white font-black text-[11px] tracking-tight leading-none">
                                {trip.firstName || t('traveler')}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Star size={8} fill="currentColor" className="text-amber-400" />
                                <span className="text-[8px] text-white/50 font-bold">{trip.rating || '4.9'}</span>
                                {isVerified && (
                                    <span className="flex items-center gap-0.5 text-[7px] text-emerald-400 font-black bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                        <ShieldCheck size={7} /> {t('verified') || 'Verified'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {trip.transportMode && (
                        <div className="flex items-center gap-1 bg-white/[0.07] border border-white/10 rounded-full px-2.5 py-1">
                            <Plane size={9} className="text-white/50" />
                            <span className="text-[7px] text-white/50 font-black uppercase tracking-widest">
                                {trip.transportMode}
                            </span>
                        </div>
                    )}
                </div>

                {/* Route: CODE ────✈──── CODE */}
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <p className="text-white text-[28px] font-black tracking-tighter leading-none">
                            {(trip.origin || trip.originCity || 'ORG').split(',')[0].slice(0, 3).toUpperCase()}
                        </p>
                        <p className="text-white/35 text-[8px] font-bold mt-1 uppercase truncate max-w-[75px]">
                            {(trip.origin || trip.originCity || '').split(',')[0]}
                        </p>
                        {trip.departureDate && (
                            <p className="text-[#9B8EF5] text-[8px] font-black mt-1.5">
                                {new Date(trip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-1 items-center mx-3 gap-1.5">
                        <div className="flex-1 border-t border-dashed border-white/10" />
                        <div className="w-7 h-7 bg-[#5845D8] rounded-full flex items-center justify-center shadow-lg shadow-[#5845D8]/40 flex-shrink-0">
                            <Plane size={12} className="text-white" />
                        </div>
                        <div className="flex-1 border-t border-dashed border-white/10" />
                    </div>

                    <div className="text-right">
                        <p className="text-white text-[28px] font-black tracking-tighter leading-none">
                            {(trip.destination || trip.destinationCity || 'DST').split(',')[0].slice(0, 3).toUpperCase()}
                        </p>
                        <p className="text-white/35 text-[8px] font-bold mt-1 uppercase truncate max-w-[75px] text-right">
                            {(trip.destination || trip.destinationCity || '').split(',')[0]}
                        </p>
                        {trip.landmark && (
                            <p className="text-[#9B8EF5] text-[8px] font-black mt-1.5 text-right truncate max-w-[75px]">
                                📍 {trip.landmark}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Boarding-pass tear line */}
            <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#F8F6F3] -ml-2 flex-shrink-0 border-r border-gray-100" />
                <div className="flex-1 border-t border-dashed border-gray-200" />
                <div className="w-4 h-4 rounded-full bg-[#F8F6F3] -mr-2 flex-shrink-0 border-l border-gray-100" />
            </div>

            {/* Bottom — rate + CTA */}
            <div className="px-5 pt-3 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{t('spaceAvailable') || 'Space Available'}</p>
                        <p className="text-[#012126] font-black text-sm">{trip.availableWeight || '5'} KG</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{t('rate') || 'Rate'}</p>
                        <p className="text-[#5845D8] font-black text-lg tracking-tight">
                            {trip.pricePerKg
                                ? `${trip.currency || '$'} ${(trip.pricePerKg * surchargeMultiplier).toFixed(2)}/kg`
                                : t('rateStandard')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleBookingClick}
                    className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#5845D8]/20"
                >
                    {t('sendRequestBtn')}
                    <Package size={13} />
                </button>
            </div>
        </div>
    );
};

const FilterPanel = ({ filters, setFilters, onApply }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm sticky top-24 font-sans">
            <h3 className="font-black text-[#012126] text-[11px] uppercase tracking-[2px] mb-6 flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-[#5845D8]" />
                {t('filters')}
            </h3>

            <div className="space-y-5">
                {/* Date Range */}
                <div>
                    <label className="block text-[10px] font-black text-[#6B7280] uppercase mb-2 tracking-wider ml-1">{t('travelDate')}</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 flex-row-reverse"
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    />
                </div>

                {/* Transport Mode */}
                <div>
                    <label className="block text-[10px] font-black text-[#6B7280] uppercase mb-2 tracking-wider ml-1">{t('transportAndWeight')}</label>
                    <select
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 appearance-none"
                        value={filters.transportMode}
                        onChange={(e) => setFilters({ ...filters, transportMode: e.target.value })}
                    >
                        <option value="">{t('allModes')}</option>
                        <option value="airplane">{t('airplane')}</option>
                        <option value="bus">{t('bus')}</option>
                        <option value="car">{t('car')}</option>
                        <option value="train">{t('train')}</option>
                        <option value="ship">{t('ship')}</option>
                    </select>
                </div>

                {/* Weight Needed */}
                <div>
                    <label className="block text-[10px] font-black text-[#6B7280] uppercase mb-2 tracking-wider ml-1">{t('weightKg')}</label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50"
                        value={filters.weight}
                        onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
                        placeholder="e.g., 5"
                    />
                </div>

                <div className="pt-2">
                    <button
                        onClick={onApply}
                        className="w-full bg-[#5845D8] text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[1px] hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/20"
                    >
                        {t('applyFilters')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Search() {
    const { t } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [surchargeMultiplier, setSurchargeMultiplier] = useState(1.2075);

    const findInitialLocation = (cityParam, countryParam) => {
        if (!cityParam && !countryParam) return null;
        const cityNorm = normalizeText(cityParam || '');
        const countryNorm = normalizeCountry(countryParam || '');
        return locationOptions.find(o => (
            cityNorm && normalizeText(o.city) === cityNorm &&
            (!countryNorm || normalizeCountry(o.country) === countryNorm)
        )) || locationOptions.find(o => (
            !cityNorm && countryNorm && o.type === 'country' && normalizeCountry(o.country) === countryNorm
        )) || makeCustomLocation(countryParam ? `${cityParam || ''}, ${countryParam}`.replace(/^,\s*/, '') : cityParam);
    };

    const initialOrigin = searchParams.get('origin') || searchParams.get('originCountry')
        ? findInitialLocation(searchParams.get('origin'), searchParams.get('originCountry'))
        : null;

    const initialDestination = searchParams.get('destination') || searchParams.get('destinationCountry')
        ? findInitialLocation(searchParams.get('destination'), searchParams.get('destinationCountry'))
        : null;

    const [filters, setFilters] = useState({
        origin: initialOrigin,
        destination: initialDestination,
        date: searchParams.get('date') || '',
        transportMode: '',
        maxPrice: 50,
        weight: ''
    });

    useEffect(() => {
        fetchTrips();
        api.get('/api/config/pricing-config')
            .then(r => { if (r.data?.surchargeMultiplier) setSurchargeMultiplier(r.data.surchargeMultiplier); })
            .catch(() => {});
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/bago/getTravelers');
            if (response.data.success && response.data.data) {
                const { gettravelers, findUsers } = response.data.data;

                if (Array.isArray(gettravelers)) {
                    // Map and join traveler info
                    const currentUserId = user?._id || user?.id;
                    const joinedTrips = gettravelers
                        .filter(trip => trip.user !== currentUserId) // Filter out own trips
                        .map(trip => {
                            const traveler = Array.isArray(findUsers) ? findUsers.find(u => u._id === trip.user) : null;
                            const kycStatus = traveler?.kycStatus || traveler?.kyc_status || trip.kycStatus || trip.kyc_status;
                            return {
                                ...trip,
                                firstName: traveler?.name || traveler?.firstName || t('traveler'),
                                origin: trip.fromLocation,
                                destination: trip.toLocation,
                                departureDate: trip.departureDate,
                                availableWeight: trip.availableKg,
                                transportMode: trip.travelMeans,
                                pricePerKg: trip.pricePerKg,
                                currency: trip.currency,
                                landmark: trip.landmark,
                                fromCountry: trip.fromCountry,
                                toCountry: trip.toCountry,
                                kycStatus,
                                isKycCompleted: Boolean(
                                    traveler?.isKycCompleted ||
                                    traveler?.is_kyc_completed ||
                                    traveler?.kycApproved ||
                                    traveler?.kyc ||
                                    trip.isKycCompleted ||
                                    trip.kyc
                                ),
                                isVerified: kycStatus === 'approved' ||
                                    traveler?.isKycCompleted === true ||
                                    traveler?.is_kyc_completed === true ||
                                    traveler?.kycApproved === true ||
                                    traveler?.kyc === true ||
                                    trip.isKycCompleted === true ||
                                    trip.kyc === true,
                                rating: traveler?.rating || (4.5 + Math.random() * 0.5).toFixed(1) // Fallback rating
                            };
                        });

                    let filtered = joinedTrips;

                    if (filters.origin && filters.destination) {
                        filtered = filtered
                            .map(t => {
                                const originMatch = locationMatches(t, filters.origin, 'origin');
                                const destinationMatch = locationMatches(t, filters.destination, 'destination');
                                return { ...t, routeMatchScore: originMatch.score + destinationMatch.score, routeMatches: originMatch.matches && destinationMatch.matches };
                            })
                            .filter(t => t.routeMatches)
                            .sort((a, b) => (b.routeMatchScore || 0) - (a.routeMatchScore || 0));
                    } else if (filters.origin) {
                        filtered = filtered
                            .map(t => {
                                const originMatch = locationMatches(t, filters.origin, 'origin');
                                return { ...t, routeMatchScore: originMatch.score, routeMatches: originMatch.matches };
                            })
                            .filter(t => t.routeMatches)
                            .sort((a, b) => (b.routeMatchScore || 0) - (a.routeMatchScore || 0));
                    } else if (filters.destination) {
                        filtered = filtered
                            .map(t => {
                                const destinationMatch = locationMatches(t, filters.destination, 'destination');
                                return { ...t, routeMatchScore: destinationMatch.score, routeMatches: destinationMatch.matches };
                            })
                            .filter(t => t.routeMatches)
                            .sort((a, b) => (b.routeMatchScore || 0) - (a.routeMatchScore || 0));
                    }

                    if (filters.weight) {
                        filtered = filtered.filter(t => t.availableWeight >= parseFloat(filters.weight));
                    }
                    if (filters.transportMode) {
                        filtered = filtered.filter(t => t.transportMode === filters.transportMode);
                    }

                    setTrips(filtered);
                }
            }
        } catch (error) {
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        fetchTrips();
    };

    const searchSelectStyles = {
        control: (base) => ({
            ...base,
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            minHeight: '28px'
        }),
        valueContainer: (base) => ({ ...base, padding: 0 }),
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
        placeholder: (base) => ({
            ...base,
            color: '#9CA3AF',
            fontSize: '15px',
            fontWeight: 500
        }),
        singleValue: (base) => ({
            ...base,
            color: '#012126',
            fontSize: '15px',
            fontWeight: 700
        }),
        indicatorsContainer: (base) => ({ ...base, display: 'none' }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-8 md:py-10 font-sans">
                {/* Search Header */}
                <div className="mb-6 px-1 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#5845D8]/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#5845D8] mb-3">
                        <span className="h-2 w-2 rounded-full bg-[#5845D8]" />
                        Smart route matching
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-[#012126] mb-1 leading-tight tracking-tight uppercase">
                        {t('availableTravelers')}
                    </h1>
                    <p className="text-[#6B7280] font-bold text-sm">
                        {filters.origin && filters.destination
                            ? `${filters.origin.city || filters.origin.country} → ${filters.destination.city || filters.destination.country}`
                            : t('findTravelersDesc')}
                    </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#012126] shadow-sm border border-gray-100 w-fit">
                        {trips.length} {trips.length === 1 ? 'route' : 'routes'} found
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-[28px] shadow-[0_18px_45px_rgba(1,33,38,0.06)] border border-gray-100 overflow-visible mb-8 max-w-[1100px]">
                    <div className="flex flex-col md:flex-row md:items-center">
                        <div className="flex flex-1 items-center px-5 py-4 min-h-[58px] md:min-h-[68px]">
                            <MapPin size={20} className={`${filters.origin ? 'text-[#5845D8]' : 'text-gray-400'} shrink-0`} />
                            <div className="flex-1 min-w-0 ml-4">
                                <AsyncCreatableSelect
                                    loadOptions={loadCityOptions}
                                    defaultOptions={locationOptions.slice(0, 30)}
                                    value={filters.origin}
                                    onChange={(val) => setFilters({ ...filters, origin: val })}
                                    onCreateOption={(inputValue) => setFilters({ ...filters, origin: makeCustomLocation(inputValue) })}
                                    placeholder={t('enterPickupCity') || 'Departure city or country'}
                                    styles={searchSelectStyles}
                                    formatOptionLabel={formatCityOptionLabel}
                                    isClearable
                                    formatCreateLabel={(inputValue) => `Search "${inputValue}"`}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>
                            {filters.origin && <ShieldCheck size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                        </div>

                        <div className="h-px md:h-9 md:w-px bg-gray-100 mx-5 md:mx-0" />

                        <div className="flex flex-1 items-center px-5 py-4 min-h-[58px] md:min-h-[68px]">
                            <MapPin size={20} className={`${filters.destination ? 'text-[#5845D8]' : 'text-gray-400'} shrink-0`} />
                            <div className="flex-1 min-w-0 ml-4">
                                <AsyncCreatableSelect
                                    loadOptions={loadCityOptions}
                                    defaultOptions={locationOptions.slice(0, 30)}
                                    value={filters.destination}
                                    onChange={(val) => setFilters({ ...filters, destination: val })}
                                    onCreateOption={(inputValue) => setFilters({ ...filters, destination: makeCustomLocation(inputValue) })}
                                    placeholder={t('enterDestination') || 'Destination city or country'}
                                    styles={searchSelectStyles}
                                    formatOptionLabel={formatCityOptionLabel}
                                    isClearable
                                    formatCreateLabel={(inputValue) => `Search "${inputValue}"`}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </div>
                            {filters.destination && <ShieldCheck size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                        </div>

                        <div className="h-px md:h-9 md:w-px bg-gray-100 mx-5 md:mx-0" />

                        <label className="flex flex-1 items-center px-5 py-4 min-h-[58px] md:min-h-[68px] cursor-pointer">
                            <Calendar size={20} className={`${filters.date ? 'text-[#5845D8]' : 'text-gray-400'} shrink-0`} />
                            <input
                                type="date"
                                className={`ml-4 flex-1 min-w-0 bg-transparent outline-none text-[15px] font-bold cursor-pointer ${filters.date ? 'text-[#012126]' : 'text-gray-400'}`}
                                value={filters.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                            {filters.date && <ShieldCheck size={16} className="text-[#5845D8] ml-3 shrink-0" />}
                        </label>

                        <button
                            onClick={handleApplyFilters}
                            className="h-[56px] md:h-[68px] md:px-9 bg-[#5845D8] text-white font-extrabold rounded-b-[28px] md:rounded-b-none md:rounded-r-[28px] hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-lg shadow-[#5845D8]/15"
                        >
                            <SearchIcon size={18} strokeWidth={3} />
                            {t('findTravelerButton') || t('findRoutesBtn') || 'Find traveler'}
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="hidden lg:block lg:col-span-1">
                        <FilterPanel
                            filters={filters}
                            setFilters={setFilters}
                            onApply={handleApplyFilters}
                        />
                    </div>

                    {/* Trip Listings */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5845D8]"></div>
                            </div>
                        ) : trips.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {trips.map((trip) => (
                                    <TripCard key={trip._id} trip={trip} weight={filters.weight} surchargeMultiplier={surchargeMultiplier} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[36px] p-8 md:p-12 text-center border border-gray-100 shadow-sm">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#5845D8]/8 text-[#5845D8]">
                                    <Package size={38} strokeWidth={1.6} />
                                </div>
                                <h3 className="text-2xl font-black text-[#012126] mb-2 tracking-tight">{t('noTripsFound')}</h3>
                                <p className="text-[#6B7280] font-bold text-sm mb-8 max-w-md mx-auto leading-relaxed">
                                    {t('tryAdjusting') || 'Try a country-wide search, a nearby major city, or a bus-friendly route inside the same country.'}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <button
                                        onClick={() => setFilters({ ...filters, origin: null, destination: null })}
                                        className="w-full sm:w-auto bg-[#F8F6F3] text-[#012126] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                                    >
                                        Clear route
                                    </button>
                                    <Link
                                        to="/post-trip"
                                        className="w-full sm:w-auto inline-block bg-[#5845D8] text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#5845D8]/20 hover:bg-[#4838B5] transition-all"
                                    >
                                        {t('postYourTrip')}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Filters Button */}
                <button className="lg:hidden fixed bottom-28 right-6 bg-[#5845D8] text-white p-5 rounded-full shadow-2xl hover:bg-[#4838B5] transition-all z-10 active:scale-90">
                    <Filter size={24} />
                </button>
            </div>
        </div>
    );
}
