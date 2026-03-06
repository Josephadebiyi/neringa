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

export default function SendPackage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        }
    }, [isAuthenticated, navigate]);

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
    const platformRate = 12; // Example fixed price per kg
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

            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-[#054752] mb-2">
                        {selectedTrip ? 'Send Shipping Request' : 'Send a Package'}
                    </h1>
                    <p className="text-[#708c91] font-medium">
                        {selectedTrip ? `Requesting space from ${selectedTrip.firstName || 'Traveler'}` : 'Find a trusted traveler to deliver your package'}
                    </p>
                </div>

                {selectedTrip && (
                    <div className="bg-[#5845D8]/5 border border-[#5845D8]/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-16 h-16 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-2xl">
                            {selectedTrip.firstName?.charAt(0) || 'T'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#054752]">Traveler Info</h3>
                            <p className="text-[#708c91] font-medium">{selectedTrip.origin} → {selectedTrip.destination}</p>
                            <p className="text-sm text-gray-500">{new Date(selectedTrip.departureDate).toLocaleDateString()} • {selectedTrip.transportMode} traveler</p>
                        </div>
                        <div className="text-right bg-white p-4 rounded-xl border border-gray-100 shadow-sm min-w-[150px]">
                            <p className="text-xs text-gray-500 uppercase font-bold">Standard Rate</p>
                            <p className="text-2xl font-black text-[#5845D8]">${platformRate}/kg</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {estimatedCost > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Check className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-900 uppercase">Estimated Shipping Cost</p>
                                    <p className="text-xs text-green-700">Based on weight: {formData.packageWeight} kg</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-green-600">${estimatedCost}</p>
                            </div>
                        </div>
                    )}

                    {/* Package Information */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#054752] mb-4 flex items-center gap-2">
                            <Package size={20} className="text-[#5845D8]" />
                            Package Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">Package Name</label>
                                <input
                                    type="text"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="e.g., Electronics, Documents, Clothing"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">Package Description</label>
                                <textarea
                                    name="packageDescription"
                                    value={formData.packageDescription}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none resize-none"
                                    placeholder="Provide detailed description of the contents..."
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2 flex items-center gap-2">
                                        <Weight size={16} />
                                        Package Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        name="packageWeight"
                                        value={formData.packageWeight}
                                        onChange={handleChange}
                                        min="0.1"
                                        max="50"
                                        step="0.1"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., 2.5"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#054752] mb-2 flex items-center gap-2">
                                        <DollarSign size={16} />
                                        Package Value (USD)
                                    </label>
                                    <input
                                        type="number"
                                        name="packageValue"
                                        value={formData.packageValue}
                                        onChange={handleChange}
                                        min="1"
                                        step="1"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                        placeholder="e.g., 100"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">For insurance purposes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receiver Information */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#054752] mb-4 flex items-center gap-2">
                            <User size={20} className="text-[#5845D8]" />
                            Receiver Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">Receiver Name</label>
                                <input
                                    type="text"
                                    name="receiverName"
                                    value={formData.receiverName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">Receiver Phone</label>
                                <input
                                    type="tel"
                                    name="receiverPhone"
                                    value={formData.receiverPhone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="+1234567890"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Route */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#054752] mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-[#5845D8]" />
                            Delivery Route
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">From City</label>
                                <input
                                    type="text"
                                    name="fromCity"
                                    value={formData.fromCity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="e.g., New York"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">From Country</label>
                                <input
                                    type="text"
                                    name="fromCountry"
                                    value={formData.fromCountry}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="e.g., United States"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">To City</label>
                                <input
                                    type="text"
                                    name="toCity"
                                    value={formData.toCity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="e.g., London"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#054752] mb-2">To Country</label>
                                <input
                                    type="text"
                                    name="toCountry"
                                    value={formData.toCountry}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                                    placeholder="e.g., United Kingdom"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delivery Deadline */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-[#054752] mb-2">Delivery Deadline</label>
                        <input
                            type="date"
                            name="deliveryDeadline"
                            value={formData.deliveryDeadline}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none"
                            required
                        />
                    </div>

                    {/* Package Attributes */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-[#054752] mb-4">Package Attributes</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="fragile"
                                    checked={formData.fragile}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-[#5845D8] focus:ring-[#5845D8]"
                                />
                                <span className="text-sm font-medium text-gray-700">Fragile - Handle with care</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="perishable"
                                    checked={formData.perishable}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-[#5845D8] focus:ring-[#5845D8]"
                                />
                                <span className="text-sm font-medium text-gray-700">Perishable goods</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="requiresRefrigeration"
                                    checked={formData.requiresRefrigeration}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-300 text-[#5845D8] focus:ring-[#5845D8]"
                                />
                                <span className="text-sm font-medium text-gray-700">Requires refrigeration</span>
                            </label>
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-[#054752] mb-2 flex items-center gap-2">
                            <FileText size={16} />
                            Special Instructions (Optional)
                        </label>
                        <textarea
                            name="specialInstructions"
                            value={formData.specialInstructions}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5845D8] outline-none resize-none"
                            placeholder="Any special handling requirements or delivery instructions..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5845D8] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#4838B5] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (selectedTrip ? 'Send Shipping Request' : 'Find Travelers')}
                    </button>

                    <p className="text-sm text-gray-500 text-center mt-4">
                        By sending a package, you agree to our terms of service and shipping guidelines.
                    </p>
                </form>
            </div>
        </div>
    );
}
