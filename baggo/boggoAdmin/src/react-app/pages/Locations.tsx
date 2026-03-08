import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    MapPin,
    Globe,
    Loader2,
    Check,
    X,
    AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Location {
    _id: string;
    name: string;
    code: string;
    type: string;
    isActive: boolean;
    isAfrican: boolean;
    supportedCurrencies: string[];
    createdAt: string;
}

interface LocationFormData {
    name: string;
    code: string;
    type: string;
    isAfrican: boolean;
    supportedCurrencies: string[];
}

const initialFormData: LocationFormData = {
    name: '',
    code: '',
    type: 'country',
    isAfrican: false,
    supportedCurrencies: ['NGN'],
};

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState<LocationFormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/locations`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setLocations(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch locations');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const url = editingLocation
                ? `${API_BASE_URL}/locations/${editingLocation._id}`
                : `${API_BASE_URL}/locations`;

            const response = await fetch(url, {
                method: editingLocation ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                await fetchLocations();
                handleCloseModal();
            } else {
                setError(data.message || 'Failed to save location');
            }
        } catch (err) {
            setError('Failed to save location');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (location: Location) => {
        try {
            const response = await fetch(`${API_BASE_URL}/locations/${location._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: !location.isActive }),
            });
            const data = await response.json();
            if (data.success) {
                setLocations(locations.map(l => l._id === location._id ? { ...l, isActive: !l.isActive } : l));
            }
        } catch (err) {
            console.error('Failed to toggle status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/locations/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setLocations(locations.filter(l => l._id !== id));
            }
        } catch (err) {
            console.error('Failed to delete');
        }
    };

    const handleEdit = (location: Location) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            code: location.code,
            type: location.type,
            isAfrican: location.isAfrican,
            supportedCurrencies: location.supportedCurrencies,
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingLocation(null);
        setFormData(initialFormData);
        setError(null);
    };

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
                        Operating Locations
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Manage active regions and registration rules</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#5240E8] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#5240E8]/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Location
                </button>
            </div>

            {/* Info Card */}
            <div className="premium-card p-6 bg-blue-50/50 border-blue-100/50">
                <div className="flex gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 h-fit">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900">Regional Rules</h4>
                        <p className="text-gray-600 font-medium max-w-2xl mt-1">
                            Active locations define where users can sign up and where shipments can originate or end.
                            African locations are automatically routed through regional payment gateways.
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search active regions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 focus:border-[#5240E8] outline-none shadow-sm transition-all"
                    />
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                    <button className="px-4 py-2 text-sm font-bold bg-[#5240E8] text-white rounded-lg">All</button>
                    <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">African</button>
                    <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900">International</button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-12 h-12 border-4 border-[#5240E8]/20 border-t-[#5240E8] rounded-full animate-spin"></div>
                </div>
            ) : filteredLocations.length === 0 ? (
                <div className="premium-card p-12 text-center">
                    <div className="stats-icon-container bg-gray-50 text-gray-300 mx-auto mb-4">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No locations found</h3>
                    <p className="text-gray-500 font-medium mt-2">Start by adding a country or region to the Bago network.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLocations.map((loc) => (
                        <div key={loc._id} className="premium-card p-6 border-t-4 border-t-[#5240E8]">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400">
                                    {loc.code}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(loc)}
                                        className="p-2 text-gray-400 hover:text-[#5240E8] hover:bg-[#5240E8]/5 rounded-xl transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loc._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-[#1e2749]">{loc.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${loc.isAfrican ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    {loc.isAfrican ? 'Africa' : 'Global'}
                                </span>
                                <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {loc.type}
                                </span>
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-50">
                                <div className="flex -space-x-2">
                                    {loc.supportedCurrencies.map(curr => (
                                        <div key={curr} className="w-8 h-8 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400" title={curr}>
                                            {curr.substring(0, 1)}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleToggleStatus(loc)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loc.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    {loc.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-2xl font-black text-[#1e2749]">
                                {editingLocation ? 'Edit Region' : 'Configure New Region'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-2xl shadow-sm transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Location Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Nigeria"
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">ISO Code</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={3}
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g., NG"
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setFormData(prev => ({ ...prev, isAfrican: !prev.isAfrican }))}
                                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center gap-3 ${formData.isAfrican
                                        ? 'border-[#5240E8] bg-[#5240E8]/5'
                                        : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${formData.isAfrican ? 'border-[#5240E8] bg-[#5240E8]' : 'border-gray-300'
                                        }`}>
                                        {formData.isAfrican && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`font-bold text-sm ${formData.isAfrican ? 'text-[#5240E8]' : 'text-gray-500'}`}>
                                        African Region
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full h-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="country">Country</option>
                                        <option value="region">Broad Region</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Default Currencies</label>
                                <div className="flex flex-wrap gap-2">
                                    {CURRENCIES.map(curr => {
                                        const isSelected = formData.supportedCurrencies.includes(curr);
                                        return (
                                            <button
                                                key={curr}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        supportedCurrencies: isSelected
                                                            ? prev.supportedCurrencies.filter(c => c !== curr)
                                                            : [...prev.supportedCurrencies, curr]
                                                    }));
                                                }}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isSelected
                                                    ? 'bg-[#5240E8] text-white'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {curr}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-bold">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] px-8 py-4 bg-[#5240E8] text-white rounded-2xl font-black hover:bg-[#4030C8] shadow-lg shadow-[#5240E8]/30 transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingLocation ? 'Save Changes' : 'Initialize Region'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
