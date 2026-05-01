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

const TripCard = ({ trip, weight }) => {
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
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 hover:border-[#5845D8]/20 hover:shadow-[0_18px_45px_rgba(1,33,38,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer group shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5845D8] to-[#7C65FF] text-white flex items-center justify-center font-black text-base shadow-sm border-2 border-white">
                            {trip.firstName?.charAt(0) || 'T'}
                        </div>
                        <div>
                            <h3 className="font-bold text-[#012126] text-sm tracking-tight">{trip.firstName || t('traveler')}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-black">
                                    <Star size={10} fill="currentColor" />
                                    <span>{trip.rating || '4.9'}</span>
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                                        isVerified
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    <ShieldCheck size={9} />
                                    {isVerified
                                        ? (t('verified') || 'Verified')
                                        : (t('unverified') || 'Unverified')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-5 rounded-2xl bg-[#F8F6F3]/70 p-3">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#5845D8]" />
                            <span className="font-bold text-[#012126] text-xs leading-tight">{trip.origin || trip.originCity}</span>
                            <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-bold text-[#012126] text-xs leading-tight">{trip.destination || trip.destinationCity}</span>
                                {trip.landmark && (
                                    <span className="text-[9px] text-[#5845D8] font-black uppercase tracking-tight opacity-70 mt-0.5">
                                        📍 {trip.landmark}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400" />
                                <span>{trip.departureDate ? new Date(trip.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}</span>
                            </div>
                            {trip.transportMode && (
                                <div className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm">
                                    <Plane size={12} className="text-[#5845D8]" />
                                    <span>{t(trip.transportMode.toLowerCase())}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 mb-4 px-1">
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-0.5 opacity-60">{t('spaceAvailable') || 'Space'}</p>
                            <p className="font-bold text-[#012126] text-xs">{trip.availableWeight || '5'} KG</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-0.5 opacity-60">{t('rate') || 'Rate'}</p>
                            <p className="font-black text-[#5845D8] text-sm italic tracking-tight">
                                {trip.pricePerKg ? `${trip.currency || '$'} ${trip.pricePerKg.toLocaleString()}/KG` : t('rateStandard')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleBookingClick}
                className="w-full bg-[#5845D8] text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#4838B5] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg shadow-[#5845D8]/15"
            >
                {t('sendRequestBtn')}
                <Package size={14} />
            </button>
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
                                    <TripCard key={trip._id} trip={trip} weight={filters.weight} />
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
