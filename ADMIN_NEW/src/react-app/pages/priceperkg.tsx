import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Scale,
  MapPin,
  Loader2,
  X,
  TrendingDown,
  DollarSign,
  AlertCircle
} from "lucide-react";

interface PricePerKg {
  _id?: string;
  from: string;
  to: string;
  category: string;
  pricePerKg: number;
  currency: string;
  minWeightKg: number;
  discountRate: number;
  createdAt?: string;
}

import { getPrices, updatePrice, createPrice, API_BASE } from "../services/api";

export default function PricePerKgPage() {
  const [prices, setPrices] = useState<PricePerKg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PricePerKg | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PricePerKg>({
    from: "",
    to: "",
    category: "",
    pricePerKg: 0,
    currency: "NGN",
    minWeightKg: 0,
    discountRate: 0,
  });

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const data = await getPrices();
      setPrices(data || []);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
      setError("Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      if (editingPrice && editingPrice._id) {
        await updatePrice(editingPrice._id, form.pricePerKg);
      } else {
        await createPrice({ route: `${form.from}-${form.to}`, price: form.pricePerKg });
      }

      await fetchPrices();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save price:", err);
      setError("Failed to save pricing configuration");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirm deletion of this price rule?")) return;
    try {
      const res = await fetch(`${API_BASE}/prices/delete/${id}`, {
        method: "DELETE",
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchPrices();
    } catch (err) {
      console.error(err);
      setError("Failed to delete price rule");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrice(null);
    setForm({
      from: "",
      to: "",
      category: "",
      pricePerKg: 0,
      currency: "NGN",
      minWeightKg: 0,
      discountRate: 0,
    });
    setError(null);
  };

  const filteredPrices = prices.filter(
    (item: PricePerKg) =>
      (item.from?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.to?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.category?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
            Variable Pricing
          </h1>
          <p className="text-gray-500 font-medium mt-1 text-lg">Set and manage cargo rates by weight & category</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5240E8] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#5240E8]/20 hover:scale-[1.02] transition-all active:scale-95 px-8"
        >
          <Plus className="w-5 h-5" />
          Add Pricing Rule
        </button>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Rules</p>
              <h3 className="text-2xl font-black text-[#1e2749]">{prices.length}</h3>
            </div>
          </div>
        </div>
        <div className="premium-card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Avg Discount</p>
              <h3 className="text-2xl font-black text-[#1e2749]">
                {(prices.reduce((acc, curr) => acc + curr.discountRate, 0) / (prices.length || 1) * 100).toFixed(1)}%
              </h3>
            </div>
          </div>
        </div>
        <div className="premium-card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Global Rate</p>
              <h3 className="text-2xl font-black text-[#1e2749]">$5.2/kg</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by route or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 focus:border-[#5240E8] outline-none shadow-sm transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-[#5240E8]/20 border-t-[#5240E8] rounded-full animate-spin"></div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">Synchronizing Data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping Route</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Base Price</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Min Order</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Discount</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPrices.map((price) => (
                  <tr key={price._id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-[#5240E8]">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1e2749] text-sm">{price.from} → {price.to}</p>
                          <p className="text-[10px] font-black text-gray-300 uppercase letter tracking-tighter mt-0.5">Static Route Mapping</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold capitalize">
                        {price.category}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-black text-[#1e2749] text-sm">
                          {price.currency} {(+(price.pricePerKg ?? 0)).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">Standard Weight Class</span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="font-bold text-gray-500 text-sm">{price.minWeightKg} kg</span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-black inline-flex items-center gap-1">
                        {price.discountRate * 100}% <TrendingDown className="w-3 h-3" />
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingPrice(price);
                            setForm(price);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-[#5240E8] hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all font-sans"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(price._id!)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all font-sans"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPrices.length === 0 && (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl mx-auto flex items-center justify-center text-gray-200 mb-6">
                  <Search className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-gray-800">No results found</h4>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">Adjust your filters or add a new pricing rule to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-[#1e2749]">
                  {editingPrice ? "Update Pricing" : "Configure Cargo Rate"}
                </h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Global Freight Management System</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-2xl shadow-sm transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Origin City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagos"
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category / Item Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electronics, Documents, Textiles"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Price Per KG</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={form.pricePerKg || ''}
                      onChange={(e) => setForm({ ...form, pricePerKg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#5240E8] text-xs">
                      {form.currency}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="NGN">NGN (Naira)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="GBP">GBP (Pounds)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Min Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.minWeightKg || ''}
                    onChange={(e) => setForm({ ...form, minWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Discount Rate (decimal)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.05"
                      value={form.discountRate || ''}
                      onChange={(e) => setForm({ ...form, discountRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 font-black text-xs">
                      {(form.discountRate * 100).toFixed(0)}% OFF
                    </div>
                  </div>
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
                  className="flex-[2] px-8 py-4 bg-[#5240E8] text-white rounded-2xl font-black hover:bg-[#4030C8] shadow-lg shadow-[#5240E8]/30 transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2 font-sans"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPrice ? "Confirm Update" : "Establish Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
