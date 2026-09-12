import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Store, Plus, Edit3, Trash2, X } from 'lucide-react';

// A business's named per-kg service (e.g. "Express", "Standard") — not tied
// to a route or date. Modeled as a trip on the backend (is_business_service),
// so it's priced through the exact same checkout-preview pipeline a real
// trip uses and needs the same admin approval before senders can see it.
export default function BusinessServices({ user }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null); // null | 'new' | service object

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/api/bago/business-services');
            setServices(res.data?.services || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (service) => {
        if (!window.confirm(`Remove "${service.serviceName}"? Senders will no longer see it in search.`)) return;
        try {
            await api.delete(`/api/bago/business-services/${service.id}`);
            load();
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to remove service');
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-black text-[#012126]">Business Services</h2>
                    <p className="text-sm text-gray-500 font-semibold mt-1">
                        Named per-kg rates like "Express" or "Standard" — shown to senders alongside travelers' trips, priced the same way everywhere.
                    </p>
                </div>
                <button
                    onClick={() => setEditing('new')}
                    className="flex items-center gap-2 bg-[#5845D8] text-white px-4 py-2.5 rounded-xl font-black text-sm hover:bg-[#4838B5] transition-colors"
                >
                    <Plus size={16} /> Add service
                </button>
            </div>

            {loading ? (
                <div className="py-16 text-center text-gray-400 font-bold">Loading…</div>
            ) : error ? (
                <div className="py-16 text-center text-red-500 font-bold">{error}</div>
            ) : services.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                    <Store size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-bold text-sm">No services yet. Add your first named rate.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map((service) => (
                        <div key={service.id} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4">
                            <div className="w-11 h-11 rounded-xl bg-[#5845D8]/10 flex items-center justify-center flex-shrink-0">
                                <Store size={18} className="text-[#5845D8]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-sm text-[#012126]">{service.serviceName}</p>
                                <p className="text-xs text-gray-500 font-bold mt-0.5">
                                    {service.currency} {Number(service.pricePerKg).toFixed(2)}/kg
                                    {service.status === 'pending_admin_review' && (
                                        <span className="text-amber-600"> · Pending admin approval</span>
                                    )}
                                </p>
                            </div>
                            <button onClick={() => setEditing(service)} className="p-2 text-gray-400 hover:text-[#5845D8]">
                                <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDelete(service)} className="p-2 text-gray-400 hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <ServiceEditorModal
                    existing={editing === 'new' ? null : editing}
                    defaultCurrency={user?.preferredCurrency || 'USD'}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); load(); }}
                />
            )}
        </div>
    );
}

function ServiceEditorModal({ existing, defaultCurrency, onClose, onSaved }) {
    const [name, setName] = useState(existing?.serviceName || '');
    const [price, setPrice] = useState(existing ? String(existing.pricePerKg) : '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const trimmedName = name.trim();
        const numericPrice = parseFloat(price);
        if (!trimmedName) {
            setError('Enter a service name, e.g. "Express".');
            return;
        }
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            setError('Enter a valid price per kg.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (existing) {
                await api.put(`/api/bago/business-services/${existing.id}`, { name: trimmedName, pricePerKg: numericPrice });
            } else {
                await api.post('/api/bago/business-services', { name: trimmedName, pricePerKg: numericPrice, currency: defaultCurrency });
            }
            onSaved();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save service');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-lg text-[#012126]">{existing ? 'Edit service' : 'Add a service'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Service name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Express, Standard"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-[#5845D8]/30"
                />
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Price per kg ({defaultCurrency})</label>
                <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-[#5845D8]/30"
                />
                {error && <p className="text-red-500 text-xs font-bold mb-3">{error}</p>}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-black text-sm hover:bg-[#4838B5] transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving…' : existing ? 'Save changes' : 'Add service'}
                </button>
            </div>
        </div>
    );
}
