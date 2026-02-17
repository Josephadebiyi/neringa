import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MapPin, 
  DollarSign,
  Plane,
  Bus,
  Ship,
  Train,
  Car,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const API_BASE_URL = 'https://neringa.onrender.com/api/Adminbaggo';

interface Route {
  id: string;
  displayName: string;
  originCity: string;
  originCountry: string;
  originCountryCode: string;
  destinationCity: string;
  destinationCountry: string;
  destinationCountryCode: string;
  basePricePerKg: number;
  currency: string;
  travelerCommissionPercent: number;
  platformFeePercent: number;
  minWeightKg: number;
  maxWeightKg: number;
  estimatedDeliveryMinDays: number;
  estimatedDeliveryMaxDays: number;
  supportedTransportModes: string[];
  isAfricanRoute: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface RouteFormData {
  originCity: string;
  originCountry: string;
  originCountryCode: string;
  destinationCity: string;
  destinationCountry: string;
  destinationCountryCode: string;
  basePricePerKg: number;
  currency: string;
  travelerCommissionPercent: number;
  minWeightKg: number;
  maxWeightKg: number;
  estimatedDeliveryMinDays: number;
  estimatedDeliveryMaxDays: number;
  supportedTransportModes: string[];
  isActive: boolean;
  notes: string;
}

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];
const TRANSPORT_MODES = [
  { id: 'air', label: 'Air', icon: Plane },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'ship', label: 'Ship', icon: Ship },
  { id: 'train', label: 'Train', icon: Train },
  { id: 'car', label: 'Car', icon: Car },
];

const COMMON_COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
];

const initialFormData: RouteFormData = {
  originCity: '',
  originCountry: '',
  originCountryCode: '',
  destinationCity: '',
  destinationCountry: '',
  destinationCountryCode: '',
  basePricePerKg: 5000,
  currency: 'NGN',
  travelerCommissionPercent: 70,
  minWeightKg: 0.5,
  maxWeightKg: 30,
  estimatedDeliveryMinDays: 3,
  estimatedDeliveryMaxDays: 7,
  supportedTransportModes: ['air', 'bus'],
  isActive: true,
  notes: '',
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/routes`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setRoutes(data.routes || []);
      } else {
        setError(data.message || 'Failed to fetch routes');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Fetch routes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingRoute 
        ? `${API_BASE_URL}/routes/${editingRoute.id}`
        : `${API_BASE_URL}/routes`;
      
      const response = await fetch(url, {
        method: editingRoute ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRoutes();
        handleCloseModal();
      } else {
        setError(data.message || 'Failed to save route');
      }
    } catch (err) {
      setError('Failed to save route');
      console.error('Save route error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (routeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        await fetchRoutes();
        setDeleteConfirm(null);
      } else {
        setError(data.message || 'Failed to delete route');
      }
    } catch (err) {
      setError('Failed to delete route');
      console.error('Delete route error:', err);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      originCity: route.originCity,
      originCountry: route.originCountry,
      originCountryCode: route.originCountryCode,
      destinationCity: route.destinationCity,
      destinationCountry: route.destinationCountry,
      destinationCountryCode: route.destinationCountryCode,
      basePricePerKg: route.basePricePerKg,
      currency: route.currency,
      travelerCommissionPercent: route.travelerCommissionPercent,
      minWeightKg: route.minWeightKg,
      maxWeightKg: route.maxWeightKg,
      estimatedDeliveryMinDays: route.estimatedDeliveryMinDays,
      estimatedDeliveryMaxDays: route.estimatedDeliveryMaxDays,
      supportedTransportModes: route.supportedTransportModes,
      isActive: route.isActive,
      notes: route.notes || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoute(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleCountrySelect = (field: 'origin' | 'destination', country: { code: string; name: string }) => {
    if (field === 'origin') {
      setFormData(prev => ({
        ...prev,
        originCountry: country.name,
        originCountryCode: country.code,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        destinationCountry: country.name,
        destinationCountryCode: country.code,
      }));
    }
  };

  const toggleTransportMode = (mode: string) => {
    setFormData(prev => ({
      ...prev,
      supportedTransportModes: prev.supportedTransportModes.includes(mode)
        ? prev.supportedTransportModes.filter(m => m !== mode)
        : [...prev.supportedTransportModes, mode],
    }));
  };

  const filteredRoutes = routes.filter(route => 
    route.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.originCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destinationCity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      NGN: '₦',
      USD: '$',
      GBP: '£',
      EUR: '€',
      GHS: 'GH₵',
      KES: 'KSh',
      ZAR: 'R',
    };
    return `${symbols[currency] || currency}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Pricing</h1>
          <p className="text-gray-600 mt-1">Manage shipping routes and set pricing</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5240E8] text-white px-4 py-2.5 rounded-lg hover:bg-[#4030C8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Route
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
        />
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#5240E8]" />
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No routes found</h3>
            <p className="text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Click "Add Route" to create your first route'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Route</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Price/kg</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Commission</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Weight Range</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Transport</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          route.isAfricanRoute ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <MapPin className={`w-5 h-5 ${
                            route.isAfricanRoute ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {route.originCity} → {route.destinationCity}
                          </div>
                          <div className="text-sm text-gray-500">
                            {route.originCountryCode} → {route.destinationCountryCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(route.basePricePerKg, route.currency)}
                      </div>
                      <div className="text-xs text-gray-500">per kg</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-green-600">{route.travelerCommissionPercent}%</span>
                        <span className="text-gray-400"> / </span>
                        <span className="text-gray-500">{route.platformFeePercent}%</span>
                      </div>
                      <div className="text-xs text-gray-400">Traveler / Platform</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {route.minWeightKg} - {route.maxWeightKg} kg
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {route.supportedTransportModes.map(mode => {
                          const transport = TRANSPORT_MODES.find(t => t.id === mode);
                          if (!transport) return null;
                          const Icon = transport.icon;
                          return (
                            <div
                              key={mode}
                              className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center"
                              title={transport.label}
                            >
                              <Icon className="w-4 h-4 text-gray-600" />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        route.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {route.isActive ? (
                          <>
                            <Check className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(route)}
                          className="p-2 text-gray-600 hover:text-[#5240E8] hover:bg-[#5240E8]/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === route.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(route.id)}
                              className="p-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(route.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Origin */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  Origin
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.originCity}
                      onChange={(e) => setFormData(prev => ({ ...prev, originCity: e.target.value }))}
                      placeholder="e.g., Lagos"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={formData.originCountryCode}
                      onChange={(e) => {
                        const country = COMMON_COUNTRIES.find(c => c.code === e.target.value);
                        if (country) handleCountrySelect('origin', country);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                      required
                    >
                      <option value="">Select country</option>
                      {COMMON_COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Destination
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.destinationCity}
                      onChange={(e) => setFormData(prev => ({ ...prev, destinationCity: e.target.value }))}
                      placeholder="e.g., London"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={formData.destinationCountryCode}
                      onChange={(e) => {
                        const country = COMMON_COUNTRIES.find(c => c.code === e.target.value);
                        if (country) handleCountrySelect('destination', country);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                      required
                    >
                      <option value="">Select country</option>
                      {COMMON_COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#5240E8]" />
                  Pricing
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg</label>
                    <input
                      type="number"
                      value={formData.basePricePerKg}
                      onChange={(e) => setFormData(prev => ({ ...prev, basePricePerKg: Number(e.target.value) }))}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Traveler Commission %</label>
                    <input
                      type="number"
                      value={formData.travelerCommissionPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, travelerCommissionPercent: Number(e.target.value) }))}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Platform fee will be: {100 - formData.travelerCommissionPercent}%
                </p>
              </div>

              {/* Weight Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.minWeightKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, minWeightKg: Number(e.target.value) }))}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.maxWeightKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxWeightKg: Number(e.target.value) }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Delivery Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Delivery Days</label>
                  <input
                    type="number"
                    value={formData.estimatedDeliveryMinDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryMinDays: Number(e.target.value) }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Delivery Days</label>
                  <input
                    type="number"
                    value={formData.estimatedDeliveryMaxDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryMaxDays: Number(e.target.value) }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Transport Modes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Supported Transport</label>
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_MODES.map(mode => {
                    const Icon = mode.icon;
                    const isSelected = formData.supportedTransportModes.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => toggleTransportMode(mode.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[#5240E8] text-white border-[#5240E8]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#5240E8]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about this route..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5240E8] focus:border-transparent resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formData.isActive ? 'bg-[#5240E8]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.isActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {formData.isActive ? 'Route is active' : 'Route is inactive'}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#5240E8] text-white rounded-lg hover:bg-[#4030C8] transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
