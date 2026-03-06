import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
    MapPin,
    Package,
    Weight,
    DollarSign,
    ChevronLeft,
    AlertCircle,
    FileText,
    Info,
    User,
    Check
} from 'lucide-react';
import api from '../api';
import { countries } from '../utils/countries';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#054752] hover:text-[#5845D8]">
                    <ChevronLeft size={20} />
                    <span className="font-bold text-xs">Back</span>
                </button>
            </div>

            <Link to="/" className="flex items-center">
                <img src="/bago_logo.png" alt="Bago" className="h-7 w-auto" />
            </Link>

            <div className="w-16"></div>
        </nav>
    );
};

export default function SendPackage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [priceLoading, setPriceLoading] = useState(false);
    const [error, setError] = useState('');
    const [platformRate, setPlatformRate] = useState(0);
    const [currency, setCurrency] = useState('USD');
    const [kycStatus, setKycStatus] = useState('');
    const location = useLocation();
    const selectedTrip = location.state?.trip;

    const [formData, setFormData] = useState({
        packageName: '',
        packageDescription: '',
        packageWeight: '',
        packageValue: '',
        fromCity: selectedTrip?.origin || '',
        fromCountry: selectedTrip?.originCountry || '',
        toCity: selectedTrip?.destination || '',
        toCountry: selectedTrip?.destinationCountry || '',
        deliveryDeadline: selectedTrip?.departureDate || '',
        specialInstructions: '',
        fragile: false,
        perishable: false,
        requiresRefrigeration: false
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            checkKycStatus();
            if (selectedTrip) {
                fetchPricing();
            }
        }
    }, [isAuthenticated, navigate]);

    const fetchPricing = async () => {
        setPriceLoading(true);
        try {
            // Helper to get country code from name
            const getCountryCode = (locationStr) => {
                if (!locationStr) return 'US';
                const parts = locationStr.split(',');
                const countryName = parts[parts.length - 1].trim();
                const country = countries.find(c => c.label.toLowerCase() === countryName.toLowerCase());
                return country ? country.value : 'US';
            };

            const fromParts = selectedTrip.fromLocation.split(',');
            const toParts = selectedTrip.toLocation.split(',');

            const payload = {
                fromCity: fromParts[0].trim(),
                fromCountryCode: getCountryCode(selectedTrip.fromLocation),
                toCity: toParts[0].trim(),
                toCountryCode: getCountryCode(selectedTrip.toLocation),
                weightKg: formData.packageWeight || 1
            };

            const response = await api.post('/api/routes/trip-pricing', payload);
            if (response.data.success) {
                setPlatformRate(response.data.route.basePricePerKg);
                setCurrency(response.data.route.currency || 'USD');
            }
        } catch (error) {
            console.error('Failed to fetch pricing:', error);
            // Fallback to a default if admin hasn't set it? 
            // Or show error. The user wants admin to set it.
            setPlatformRate(15); // Higher fallback to be safe
        } finally {
            setPriceLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTrip && formData.packageWeight) {
            fetchPricing();
        }
    }, [formData.packageWeight]);

    const checkKycStatus = async () => {
        try {
            const response = await api.get('/api/bago/kyc/status');
            if (response.data.success) {
                setKycStatus(response.data.kycStatus || 'not_started');
            }
        } catch (error) {
            console.error('Failed to check KYC status:', error);
            setKycStatus('not_started');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (parseFloat(formData.packageWeight) <= 0 || parseFloat(formData.packageWeight) > 50) {
            setError('Package weight must be between 0.1 and 50 kg');
            setLoading(false);
            return;
        }

        try {
            if (selectedTrip) {
                // 1. Create Package first
                const packageResponse = await api.post('/api/bago/createPackage', {
                    fromCountry: formData.fromCountry,
                    fromCity: formData.fromCity,
                    toCountry: formData.toCountry,
                    toCity: formData.toCity,
                    packageWeight: formData.packageWeight,
                    receiverName: formData.receiverName,
                    receiverPhone: formData.receiverPhone,
                    description: `${formData.packageName}: ${formData.packageDescription}`,
                    value: formData.packageValue
                });

                if (packageResponse.status === 201) {
                    const packageId = packageResponse.data.package._id;

                    // 2. Create Shipping Request
                    const requestResponse = await api.post('/api/bago/RequestPackage', {
                        travelerId: selectedTrip.user,
                        packageId: packageId,
                        tripId: selectedTrip._id,
                        amount: estimatedCost,
                        estimatedDeparture: selectedTrip.departureDate,
                        insurance: false,
                        insuranceCost: 0
                    });

                    if (requestResponse.status === 201) {
                        navigate('/dashboard', { state: { message: 'Shipping request sent successfully!' } });
                    }
                }
            } else {
                // General search for travelers
                navigate(`/search?origin=${formData.fromCity}&destination=${formData.toCity}`, {
                    state: { packageDetails: formData }
                });
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to process request. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };
    const estimatedCost = formData.packageWeight ? (parseFloat(formData.packageWeight) * platformRate).toFixed(2) : 0;

    if (kycStatus !== 'approved' && kycStatus !== '') {
        return (
            <div className="min-h-screen bg-[#F8F6F3]">
                <Navbar />
                <div className="max-w-2xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                        <AlertCircle size={64} className="text-amber-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Identity Verification Required</h2>
                        <p className="text-gray-600 mb-6">
                            You need to verify your identity before sending packages. This helps ensure the safety and trust of our community.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-[#5845D8] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#4838B5] transition-colors"
                        >
                            Go to Dashboard to Verify
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 py-6 font-sans">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-[#054752] mb-1">
                        {selectedTrip ? 'Send Shipping Request' : 'Send a Package'}
                    </h1>
                    <p className="text-[#708c91] font-semibold text-sm">
                        {selectedTrip ? `Requesting space from ${selectedTrip.firstName || 'Traveler'}` : 'Find a trusted traveler to deliver your package'}
                    </p>
                </div>

                {selectedTrip && (
                    <div className="bg-[#5845D8]/5 border border-[#5845D8]/10 rounded-[24px] p-5 mb-6 flex flex-col md:flex-row gap-5 items-center">
                        <div className="w-14 h-14 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                            {selectedTrip.firstName?.charAt(0) || 'T'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-[#054752]">Traveler Info</h3>
                            <p className="text-[#708c91] font-bold text-sm tracking-tight">{selectedTrip.origin} → {selectedTrip.destination}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{new Date(selectedTrip.departureDate).toLocaleDateString()} • {selectedTrip.transportMode} traveler</p>
                        </div>
                        <div className="text-right bg-white p-3 rounded-xl border border-gray-50 shadow-sm min-w-[130px]">
                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Rate</p>
                            <p className="text-xl font-black text-[#5845D8]">
                                {priceLoading ? '...' : `${currency === 'NGN' ? '₦' : '$'}${platformRate}/kg`}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-[24px] p-6 md:p-8 border border-gray-100 shadow-sm">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 flex items-center gap-2 text-[11px] font-bold">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {estimatedCost > 0 && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Check className="text-green-600" size={16} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-green-800 uppercase tracking-widest">Estimated Shipping Cost</p>
                                    <p className="text-xs text-green-700 font-bold">Based on weight: {formData.packageWeight} kg</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-green-600">
                                    {currency === 'NGN' ? '₦' : '$'}{estimatedCost}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Package Information */}
                    <div className="mb-8">
                        <h3 className="text-sm font-black text-[#054752] mb-5 flex items-center gap-2 uppercase tracking-widest">
                            <Package size={16} className="text-[#5845D8]" />
                            Package Info
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">Package Name</label>
                                <input
                                    type="text"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="e.g., Electronics, Documents, Clothing"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">Description</label>
                                <textarea
                                    name="packageDescription"
                                    value={formData.packageDescription}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none resize-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="Provide detailed description of the contents..."
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1 flex items-center gap-1.5">
                                        <Weight size={14} />
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="packageWeight"
                                        value={formData.packageWeight}
                                        onChange={handleChange}
                                        min="0.1"
                                        max="50"
                                        step="0.1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                        placeholder="e.g., 2.5"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1 flex items-center gap-1.5">
                                        <DollarSign size={14} />
                                        Value (USD)
                                    </label>
                                    <input
                                        type="number"
                                        name="packageValue"
                                        value={formData.packageValue}
                                        onChange={handleChange}
                                        min="1"
                                        step="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                        placeholder="e.g., 100"
                                        required
                                    />
                                    <p className="text-[9px] text-gray-400 font-bold mt-1.5 ml-1 uppercase tracking-tighter">For insurance purposes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receiver Information */}
                    <div className="mb-8">
                        <h3 className="text-sm font-black text-[#054752] mb-5 flex items-center gap-2 uppercase tracking-widest">
                            <User size={16} className="text-[#5845D8]" />
                            Receiver Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">Receiver Name</label>
                                <input
                                    type="text"
                                    name="receiverName"
                                    value={formData.receiverName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="receiverPhone"
                                    value={formData.receiverPhone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="+1234567890"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Route */}
                    <div className="mb-8">
                        <h3 className="text-sm font-black text-[#054752] mb-5 flex items-center gap-2 uppercase tracking-widest">
                            <MapPin size={16} className="text-[#5845D8]" />
                            Delivery Route
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">From City</label>
                                <input
                                    type="text"
                                    name="fromCity"
                                    value={formData.fromCity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="e.g., New York"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">From Country</label>
                                <input
                                    type="text"
                                    name="fromCountry"
                                    value={formData.fromCountry}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="e.g., United States"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">To City</label>
                                <input
                                    type="text"
                                    name="toCity"
                                    value={formData.toCity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="e.g., London"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">To Country</label>
                                <input
                                    type="text"
                                    name="toCountry"
                                    value={formData.toCountry}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                                    placeholder="e.g., United Kingdom"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Deadline */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-[#708c91] uppercase mb-1.5 tracking-wider ml-1">Deadline Date</label>
                        <input
                            type="date"
                            name="deliveryDeadline"
                            value={formData.deliveryDeadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none text-xs font-bold bg-gray-50 hover:bg-white transition-all flex-row-reverse"
                            required
                        />
                    </div>

                    {/* Package Attributes */}
                    <div className="mb-8">
                        <h3 className="text-sm font-black text-[#054752] mb-4 uppercase tracking-widest">Attributes</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="fragile"
                                    checked={formData.fragile}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5845D8] focus:ring-[#5845D8]"
                                />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-[#054752] transition-colors">Fragile - Handle with care</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="perishable"
                                    checked={formData.perishable}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5845D8] focus:ring-[#5845D8]"
                                />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-[#054752] transition-colors">Perishable goods</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="requiresRefrigeration"
                                    checked={formData.requiresRefrigeration}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5845D8] focus:ring-[#5845D8]"
                                />
                                <span className="text-xs font-bold text-gray-500 group-hover:text-[#054752] transition-colors">Requires refrigeration</span>
                            </label>
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-[#708c91] uppercase mb-2 ml-1 flex items-center gap-1.5 tracking-wider">
                            <FileText size={14} />
                            Special Instructions <span className="text-gray-400 font-normal lowercase">(optional)</span>
                        </label>
                        <textarea
                            name="specialInstructions"
                            value={formData.specialInstructions}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-[#5845D8] outline-none resize-none text-xs font-bold bg-gray-50 hover:bg-white transition-all"
                            placeholder="Any special handling requirements or delivery instructions..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#4838B5] transition-all shadow-lg shadow-[#5845D8]/20 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (selectedTrip ? 'Send Shipping Request' : 'Find Travelers')}
                    </button>

                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center mt-6 px-6 leading-relaxed">
                        By sending a package, you agree to our <Link to="/terms" className="underline">terms</Link> & <Link to="/privacy" className="underline">shipping guidelines</Link>.
                    </p>
                </form>
            </div>
        </div>
    );
}
