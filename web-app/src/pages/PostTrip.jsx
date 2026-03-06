import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    MapPin,
    Calendar,
    Package,
    DollarSign,
    Plane,
    Bus,
    Car,
    Train,
    Ship,
    ChevronLeft,
    AlertCircle,
    CheckCircle,
    Wallet,
    ArrowRight
} from 'lucide-react';
import api from '../api';
import { locations, countries } from '../utils/countries';

const COUNTRY_OPTIONS = countries.sort((a, b) => a.label.localeCompare(b.label));

// Cities filtered by country
const getCitiesForCountry = (countryName) =>
    locations.filter(loc => loc.country === countryName);

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#054752] hover:text-[#5845D8]">
                <ChevronLeft size={24} />
                <span className="font-semibold">Back</span>
            </button>
            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>
            <div className="w-20" />
        </nav>
    );
};

export default function PostTrip() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [kycStatus, setKycStatus] = useState('');

    const [formData, setFormData] = useState({
        originCountry: '',
        originCity: '',
        destinationCountry: '',
        destinationCity: '',
        departureDate: '',
        arrivalDate: '',
        transportMode: 'air',
        availableWeight: '',
        additionalNotes: ''
    });

    const originCities = formData.originCountry ? getCitiesForCountry(formData.originCountry) : [];
    const destinationCities = formData.destinationCountry ? getCitiesForCountry(formData.destinationCountry) : [];

    useEffect(() => {
        const saved = localStorage.getItem('pending_trip_post');
        if (saved) {
            try { setFormData(JSON.parse(saved)); } catch (e) { }
        }

        // Auto-detect origin country
        const detectLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.country_name) {
                    setFormData(prev => ({
                        ...prev,
                        originCountry: data.country_name
                    }));
                }
            } catch (err) {
                console.error("IP detection failed:", err);
            }
        };
        detectLocation();

        if (isAuthenticated) checkKycStatus();
    }, [isAuthenticated]);

    const checkKycStatus = async () => {
        try {
            const res = await api.get('/api/bago/kyc/status');
            setKycStatus(res.data?.kycStatus || 'not_started');
        } catch {
            setKycStatus('not_started');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Reset city when country changes
            if (name === 'originCountry') updated.originCity = '';
            if (name === 'destinationCountry') updated.destinationCity = '';
            return updated;
        });
    };

    const getCountryFlag = (countryName) => {
        const found = COUNTRY_OPTIONS.find(c => c.label === countryName);
        return found?.flag || '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isAuthenticated) {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            setLoading(false);
            navigate('/signup');
            return;
        }

        if (kycStatus !== 'approved') {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            setLoading(false);
            navigate('/dashboard', { state: { message: 'Please complete Identity Verification before posting your trip.' } });
            return;
        }

        if (!formData.originCountry || !formData.destinationCountry) {
            setError('Please select both origin and destination countries.');
            setLoading(false);
            return;
        }

        if (parseFloat(formData.availableWeight) <= 0 || parseFloat(formData.availableWeight) > 50) {
            setError('Available weight must be between 1 and 50 kg');
            setLoading(false);
            return;
        }

        try {
            const originFlag = getCountryFlag(formData.originCountry);
            const destFlag = getCountryFlag(formData.destinationCountry);

            const backendData = {
                fromLocation: formData.originCity
                    ? `${formData.originCity}, ${formData.originCountry}`
                    : formData.originCountry,
                toLocation: formData.destinationCity
                    ? `${formData.destinationCity}, ${formData.destinationCountry}`
                    : formData.destinationCountry,
                departureDate: formData.departureDate,
                arrivalDate: formData.arrivalDate,
                availableKg: formData.availableWeight,
                travelMeans: formData.transportMode,
                notes: formData.additionalNotes
            };

            const response = await api.post('/api/bago/AddAtrip', backendData);
            if (response.status === 201) {
                localStorage.removeItem('pending_trip_post');
                setSuccess(true);
                setTimeout(() => navigate('/dashboard'), 2500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const transportModes = [
        { value: 'air', icon: Plane, label: 'Air' },
        { value: 'bus', icon: Bus, label: 'Bus' },
        { value: 'car', icon: Car, label: 'Car' },
        { value: 'train', icon: Train, label: 'Train' },
        { value: 'ship', icon: Ship, label: 'Ship' }
    ];

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-[#054752] mb-2">Post Your Trip</h1>
                    <p className="text-[#708c91] font-medium">Share your journey and earn by delivering packages</p>
                </div>

                {success ? (
                    <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center shadow-sm">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={44} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Trip Posted! 🎉</h2>
                        <p className="text-gray-500 mb-2">Your trip is now live. Package senders can find and book your available space.</p>
                        <p className="text-sm text-gray-400">Redirecting to your dashboard…</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                                <AlertCircle size={18} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* ── Route ── */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-[#054752] mb-5 flex items-center gap-2">
                                <MapPin size={20} className="text-[#5845D8]" />
                                Route
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Origin */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">From — Country</label>
                                        <select
                                            name="originCountry"
                                            value={formData.originCountry}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                                            required
                                        >
                                            <option value="">Select country…</option>
                                            {COUNTRY_OPTIONS.map(c => (
                                                <option key={c.name} value={c.name}>
                                                    {c.flag} {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {originCities.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">From — City</label>
                                            <select
                                                name="originCity"
                                                value={formData.originCity}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                                            >
                                                <option value="">Any city in {formData.originCountry}</option>
                                                {originCities.map(loc => (
                                                    <option key={loc.city} value={loc.city}>{loc.city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Destination */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">To — Country</label>
                                        <select
                                            name="destinationCountry"
                                            value={formData.destinationCountry}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                                            required
                                        >
                                            <option value="">Select country…</option>
                                            {COUNTRY_OPTIONS.map(c => (
                                                <option key={c.name} value={c.name}>
                                                    {c.flag} {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {destinationCities.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">To — City</label>
                                            <select
                                                name="destinationCity"
                                                value={formData.destinationCity}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm bg-white"
                                            >
                                                <option value="">Any city in {formData.destinationCountry}</option>
                                                {destinationCities.map(loc => (
                                                    <option key={loc.city} value={loc.city}>{loc.city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Route preview */}
                            {(formData.originCountry || formData.destinationCountry) && (
                                <div className="mt-4 bg-[#5845D8]/5 rounded-xl p-3 flex items-center gap-3 text-sm font-semibold text-[#054752]">
                                    <span>{getCountryFlag(formData.originCountry)} {formData.originCity || formData.originCountry || '…'}</span>
                                    <ArrowRight size={16} className="text-[#5845D8] flex-shrink-0" />
                                    <span>{getCountryFlag(formData.destinationCountry)} {formData.destinationCity || formData.destinationCountry || '…'}</span>
                                </div>
                            )}
                        </div>

                        {/* ── Dates ── */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-[#054752] mb-5 flex items-center gap-2">
                                <Calendar size={20} className="text-[#5845D8]" />
                                Travel Dates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">Departure Date</label>
                                    <input
                                        type="date"
                                        name="departureDate"
                                        value={formData.departureDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">Arrival Date</label>
                                    <input
                                        type="date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                        min={formData.departureDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Transport Mode ── */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-[#054752] mb-5">Transport Mode</h3>
                            <div className="grid grid-cols-5 gap-3">
                                {transportModes.map(({ value, icon: Icon, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, transportMode: value }))}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.transportMode === value
                                            ? 'border-[#5845D8] bg-[#5845D8]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon size={24} className={`mx-auto mb-1.5 ${formData.transportMode === value ? 'text-[#5845D8]' : 'text-gray-400'}`} />
                                        <span className={`text-xs font-bold ${formData.transportMode === value ? 'text-[#5845D8]' : 'text-gray-500'}`}>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Capacity ── */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-[#054752] mb-5 flex items-center gap-2">
                                <Package size={20} className="text-[#5845D8]" />
                                Capacity
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-[#708c91] uppercase mb-1.5 tracking-wide">Available Weight (kg)</label>
                                <input
                                    type="number"
                                    name="availableWeight"
                                    value={formData.availableWeight}
                                    onChange={handleChange}
                                    min="1"
                                    max="50"
                                    step="0.5"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none text-sm"
                                    placeholder="e.g., 10"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Maximum 50 kg per trip</p>
                            </div>
                            <div className="mt-4 bg-[#5845D8]/5 border border-[#5845D8]/20 rounded-xl p-4">
                                <h4 className="font-bold text-[#5845D8] flex items-center gap-2 text-sm mb-1">
                                    <Wallet size={16} /> Earnings via Bago Wallet
                                </h4>
                                <p className="text-xs text-[#054752] leading-relaxed">
                                    Earnings are credited to your Bago Wallet after delivery. Withdraw via <strong>Stripe Connect</strong> (Global) or <strong>Paystack</strong> (Africa).
                                </p>
                            </div>
                        </div>

                        {/* ── Notes ── */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <label className="block text-sm font-bold text-[#054752] mb-2">Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                            <textarea
                                name="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none resize-none text-sm"
                                placeholder="Any special requirements or information about your trip…"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold text-base hover:bg-[#4838B5] transition-colors disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Posting trip…' : 'Post Trip'}
                        </button>

                        <p className="text-xs text-gray-400 text-center pb-4">
                            By posting a trip, you agree to our <Link to="/terms" className="underline">terms of service</Link>.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
