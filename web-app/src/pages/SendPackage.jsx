import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
    Check,
    ArrowRight
} from 'lucide-react';
import api from '../api';
import { countries } from '../utils/countries';

const Navbar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <nav className="w-full bg-white border-b border-gray-100 py-2.5 px-6 md:px-12 flex justify-between items-center z-50 sticky top-0">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#012126] hover:text-[#5845D8]">
                    <ChevronLeft size={20} />
                    <span className="font-bold text-xs">{t('back')}</span>
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
    const { t } = useLanguage();
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
        requiresRefrigeration: false,
        receiverName: '',
        receiverPhone: '',
        packageImage: null,
        imagePreview: null
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    packageImage: reader.result,
                    imagePreview: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

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
            setPlatformRate(15);
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

    const estimatedCost = (parseFloat(formData.packageWeight || 0) * platformRate).toFixed(2);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (kycStatus !== 'approved') {
            setError('Please verify your identity to send a package.');
            setLoading(false);
            navigate('/verify', {
                state: {
                    message: 'Please complete identity verification to send a package.',
                    from: '/send-package'
                }
            });
            return;
        }

        if (!formData.packageImage) {
            setError('Please upload an image of the item.');
            setLoading(false);
            return;
        }

        if (parseFloat(formData.packageWeight) <= 0 || parseFloat(formData.packageWeight) > 50) {
            setError(t('packageWeightError'));
            setLoading(false);
            return;
        }

        try {
            if (selectedTrip) {
                const packageResponse = await api.post('/api/bago/createPackage', {
                    fromCountry: formData.fromCountry,
                    fromCity: formData.fromCity,
                    toCountry: formData.toCountry,
                    toCity: formData.toCity,
                    packageWeight: formData.packageWeight,
                    receiverName: formData.receiverName,
                    receiverPhone: formData.receiverPhone,
                    description: `${formData.packageName}: ${formData.packageDescription}`,
                    value: formData.packageValue,
                    image: formData.packageImage
                });

                if (packageResponse.status === 201) {
                    const packageId = packageResponse.data.package._id;
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
                        navigate('/dashboard', { state: { message: t('requestSentSuccess') } });
                    }
                }
            } else {
                navigate(`/search?origin=${formData.fromCity}&destination=${formData.toCity}`, {
                    state: { packageDetails: formData }
                });
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F6F3]">
            <Navbar />

            <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-10 font-sans">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-[#012126] mb-3 tracking-tight">{t('sendPackageTitle')}</h1>
                    <div className="h-1 w-20 bg-[#5845D8] rounded-full"></div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Package Details Section */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('packageDetails')}</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('itemLabel')}</label>
                                    <input
                                        required
                                        type="text"
                                        name="packageName"
                                        placeholder={t('itemPlaceholder')}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        value={formData.packageName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('descriptionLabel')}</label>
                                    <textarea
                                        required
                                        name="packageDescription"
                                        rows="3"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm resize-none"
                                        value={formData.packageDescription}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('weightLabel')}</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="number"
                                                name="packageWeight"
                                                step="0.1"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                                value={formData.packageWeight}
                                                onChange={handleChange}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">KG</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('declarationLabel')}</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="number"
                                                name="packageValue"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                                value={formData.packageValue}
                                                onChange={handleChange}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">USD</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-3 tracking-[0.15em] ml-1">{t('itemImage') || 'Item Image'}</label>
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div
                                            onClick={() => document.getElementById('item-image').click()}
                                            className={`w-full md:w-48 h-48 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all ${formData.imagePreview ? 'border-[#5845D8] bg-[#5845D8]/5' : 'border-gray-100 hover:border-[#5845D8]/20 bg-gray-50/30'}`}
                                        >
                                            {formData.imagePreview ? (
                                                <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-[22px]" />
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-300 mb-3">
                                                        <Package size={24} />
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">{t('clickToUpload') || 'Click to upload'}</p>
                                                </>
                                            )}
                                            <input
                                                id="item-image"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3 pt-2">
                                            <div className="flex items-start gap-2 text-gray-400">
                                                <Info size={14} className="shrink-0 mt-0.5" />
                                                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-wider">
                                                    {t('imageUploadTells') || 'Uploading a clear image of your item helps travelers verify content and provides security for both parties during delivery.'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-green-600 font-black text-[9px] uppercase tracking-widest">
                                                    <Check size={12} /> {t('secureStorage') || 'Secure Storage'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-widest">
                                                    <User size={12} /> {t('travelerOnly') || 'Traveler Only Access'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recipient Section */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('recipientDetails')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('receiverNameLabel')}</label>
                                    <input
                                        required
                                        type="text"
                                        name="receiverName"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        value={formData.receiverName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('receiverPhoneLabel')}</label>
                                    <input
                                        required
                                        type="tel"
                                        name="receiverPhone"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm"
                                        value={formData.receiverPhone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Options */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-sm font-black text-[#012126] uppercase tracking-[2px]">{t('shippingOptions')}</h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.fragile ? 'bg-[#5845D8]/5 border-[#5845D8] shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input type="checkbox" name="fragile" checked={formData.fragile} onChange={handleChange} className="hidden" />
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${formData.fragile ? 'bg-[#5845D8] text-white' : 'bg-gray-100 text-transparent'}`}>
                                        <Check size={12} />
                                    </div>
                                    <span className="text-[10px] font-black text-[#012126] uppercase tracking-tight">{t('fragileLabel')}</span>
                                </label>

                                <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.perishable ? 'bg-orange-50 border-orange-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input type="checkbox" name="perishable" checked={formData.perishable} onChange={handleChange} className="hidden" />
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${formData.perishable ? 'bg-orange-500 text-white' : 'bg-gray-100 text-transparent'}`}>
                                        <Check size={12} />
                                    </div>
                                    <span className="text-[10px] font-black text-[#012126] uppercase tracking-tight">{t('perishableLabel')}</span>
                                </label>

                                <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${formData.requiresRefrigeration ? 'bg-blue-50 border-blue-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <input type="checkbox" name="requiresRefrigeration" checked={formData.requiresRefrigeration} onChange={handleChange} className="hidden" />
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${formData.requiresRefrigeration ? 'bg-blue-500 text-white' : 'bg-gray-100 text-transparent'}`}>
                                        <Check size={12} />
                                    </div>
                                    <span className="text-[10px] font-black text-[#012126] uppercase tracking-tight">{t('refrigerationLabel')}</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-[0.15em] ml-1">{t('specialInstructionsLabel')}</label>
                                <textarea
                                    name="specialInstructions"
                                    rows="2"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:border-[#5845D8]/30 outline-none text-[11px] font-black uppercase tracking-tight bg-gray-50/50 hover:bg-white transition-all text-[#012126] focus:bg-white focus:shadow-sm resize-none"
                                    value={formData.specialInstructions}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#012126] rounded-[32px] p-8 text-white sticky top-28 shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mb-16"></div>
                            <h3 className="text-base font-black mb-8 border-b border-white/10 pb-4 uppercase tracking-[2px]">{t('summary')}</h3>

                            <div className="space-y-6 mb-10">
                                {selectedTrip && (
                                    <>
                                        <div>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('from')}</p>
                                            <p className="text-xs font-black uppercase truncate">{selectedTrip.fromLocation}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('to')}</p>
                                            <p className="text-xs font-black uppercase truncate">{selectedTrip.toLocation}</p>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between items-end border-t border-white/10 pt-6">
                                    <div>
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('estimatedCost')}</p>
                                        <p className="text-2xl font-black">{currency} {estimatedCost}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">{t('serviceFee')}</p>
                                        <p className="text-[10px] font-black">INCLUDED</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-6 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-[9px] font-bold leading-tight uppercase">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#5845D8] hover:bg-[#4838B5] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : t('requestShipping')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="mt-6 text-[8px] font-bold text-white/30 text-center uppercase tracking-widest leading-relaxed">
                                {t('byJoiningAgree')} <Link to="/terms" className="text-white/60 underline hover:text-white transition-colors">{t('terms')}</Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
