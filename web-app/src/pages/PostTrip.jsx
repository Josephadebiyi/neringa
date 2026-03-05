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
    Wallet
} from 'lucide-react';
import api from '../api';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#054752] hover:text-[#5845D8]">
                    <ChevronLeft size={24} />
                    <span className="font-semibold">Back</span>
                </button>
            </div>

            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
            </Link>

            <div className="w-20"></div>
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
        originCity: '',
        originCountry: '',
        destinationCity: '',
        destinationCountry: '',
        departureDate: '',
        arrivalDate: '',
        transportMode: 'air',
        availableWeight: '',
        additionalNotes: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('pending_trip_post');
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved trip", e);
            }
        }
        if (isAuthenticated) {
            checkKycStatus();
        }
    }, [isAuthenticated]);

    const checkKycStatus = async () => {
        try {
            const response = await api.get('/api/bago/getKyc');
            if (response.data.success) {
                // Determine status based on returned data
                const status = response.data.data?.kyc ? 'approved' : 'not_started';
                setKycStatus(status);
            }
        } catch (error) {
            console.error('Failed to check KYC status:', error);
            setKycStatus('not_started');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isAuthenticated) {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/signup');
            return;
        }

        if (kycStatus !== 'approved') {
            localStorage.setItem('pending_trip_post', JSON.stringify(formData));
            navigate('/dashboard', { state: { message: 'Please complete Identity Verification before posting your trip.' } });
            return;
        }

        if (parseFloat(formData.availableWeight) <= 0 || parseFloat(formData.availableWeight) > 50) {
            setError('Available weight must be between 1 and 50 kg');
            setLoading(false);
            return;
        }

        try {
            const backendData = {
                fromLocation: `${formData.originCity}, ${formData.originCountry}`,
                toLocation: `${formData.destinationCity}, ${formData.destinationCountry}`,
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
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post trip. Please verify your details and try again.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-[#054752] mb-2">Post Your Trip</h1>
                    <p className="text-[#708c91] font-medium">Share your journey and earn by delivering packages</p>
                </div>

                {success ? (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Trip Posted Successfully!</h2>
                        <p className="text-gray-600 mb-6">
                            Your trip is now live. Package senders can find and book your available space.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Trip Route */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-[#054752] mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-[#5845D8]" />
                                Trip Route
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Origin City</label>
                                    <input
                                        type="text"
                                        name="originCity"
                                        value={formData.originCity}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., New York"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Origin Country</label>
                                    <input
                                        type="text"
                                        name="originCountry"
                                        value={formData.originCountry}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., United States"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Destination City</label>
                                    <input
                                        type="text"
                                        name="destinationCity"
                                        value={formData.destinationCity}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., London"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Destination Country</label>
                                    <input
                                        type="text"
                                        name="destinationCountry"
                                        value={formData.destinationCountry}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., United Kingdom"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Trip Dates */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-[#054752] mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-[#5845D8]" />
                                Travel Dates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Departure Date</label>
                                    <input
                                        type="date"
                                        name="departureDate"
                                        value={formData.departureDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Arrival Date</label>
                                    <input
                                        type="date"
                                        name="arrivalDate"
                                        value={formData.arrivalDate}
                                        onChange={handleChange}
                                        min={formData.departureDate || new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transport Mode */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-[#054752] mb-4">Transport Mode</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                    { value: 'air', icon: Plane, label: 'Air' },
                                    { value: 'bus', icon: Bus, label: 'Bus' },
                                    { value: 'car', icon: Car, label: 'Car' },
                                    { value: 'train', icon: Train, label: 'Train' },
                                    { value: 'ship', icon: Ship, label: 'Ship' }
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, transportMode: mode.value })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.transportMode === mode.value
                                            ? 'border-[#5845D8] bg-[#5845D8]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <mode.icon
                                            size={28}
                                            className={`mx-auto mb-2 ${formData.transportMode === mode.value ? 'text-[#5845D8]' : 'text-gray-400'
                                                }`}
                                        />
                                        <span className={`text-sm font-semibold ${formData.transportMode === mode.value ? 'text-[#5845D8]' : 'text-gray-600'
                                            }`}>
                                            {mode.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-[#054752] mb-4 flex items-center gap-2">
                                <Package size={20} className="text-[#5845D8]" />
                                Package Capacity & Pricing
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2">Available Weight (kg)</label>
                                    <input
                                        type="number"
                                        name="availableWeight"
                                        value={formData.availableWeight}
                                        onChange={handleChange}
                                        min="1"
                                        max="50"
                                        step="0.5"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., 10"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Maximum 50 kg</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                                    <label className="block text-sm font-semibold text-[#054752] mb-2 flex items-center gap-2">
                                        <DollarSign size={16} />
                                        Fixed Price per kg
                                    </label>
                                    <p className="text-[#5845D8] font-bold text-lg">Platform Standard Rate</p>
                                    <p className="text-xs text-gray-500 mt-1">Shipping rates are fixed by the platform to ensure fairness for all members.</p>
                                </div>
                            </div>
                            <div className="bg-[#5845D8]/5 p-4 rounded-xl border border-[#5845D8]/20 mt-4 mt-6">
                                <h4 className="font-bold text-[#5845D8] flex items-center gap-2 mb-2">
                                    <Wallet size={18} /> Earnings & Payouts via Bago Wallet
                                </h4>
                                <p className="text-sm text-[#054752] leading-relaxed">
                                    When your delivery is complete, earnings are credited securely to your integrated Bago Wallet. Setup your payout method from your dashboard to withdraw funds directly to your bank account using <strong>Stripe Connect</strong> (Global) or <strong>Paystack</strong> (all African countries).
                                </p>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-[#054752] mb-2">Additional Notes (Optional)</label>
                            <textarea
                                name="additionalNotes"
                                value={formData.additionalNotes}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none resize-none"
                                placeholder="Any special requirements or information about your trip..."
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#4838B5] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Posting Trip...' : 'Post Trip'}
                        </button>

                        <p className="text-sm text-gray-500 text-center mt-4">
                            By posting a trip, you agree to our terms of service and community guidelines.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
