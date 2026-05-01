import { useEffect, useState } from 'react';
import {
    Package,
    Plus,
    Pencil,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    X,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import {
    getItemCategories,
    createItemCategory,
    updateItemCategory,
    deleteItemCategory,
} from '../services/api';

type RiskLevel = 'allowed' | 'medium' | 'prohibited';

interface ItemCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    risk_level: RiskLevel;
    is_active: boolean;
    created_at: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    allowed: {
        label: 'Allowed',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    },
    medium: {
        label: 'Medium Risk',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    },
    prohibited: {
        label: 'Prohibited',
        color: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
    },
};

const BLANK_FORM = {
    name: '',
    slug: '',
    description: '',
    risk_level: 'allowed' as RiskLevel,
    is_active: true,
};

export default function ItemCategories() {
    const [categories, setCategories] = useState<ItemCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [saving, setSaving] = useState(false);
    const [filterRisk, setFilterRisk] = useState<RiskLevel | 'all'>('all');

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await getItemCategories();
            if (data?.categories) setCategories(data.categories);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const autoSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const openCreate = () => {
        setEditingId(null);
        setForm(BLANK_FORM);
        setIsModalOpen(true);
    };

    const openEdit = (cat: ItemCategory) => {
        setEditingId(cat.id);
        setForm({
            name: cat.name,
            slug: cat.slug,
            description: cat.description ?? '',
            risk_level: cat.risk_level,
            is_active: cat.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updateItemCategory(editingId, {
                    name: form.name,
                    description: form.description || undefined,
                    risk_level: form.risk_level,
                    is_active: form.is_active,
                });
            } else {
                await createItemCategory({
                    name: form.name,
                    slug: form.slug || autoSlug(form.name),
                    description: form.description || undefined,
                    risk_level: form.risk_level,
                    is_active: form.is_active,
                });
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (err: any) {
            alert(err.message ?? 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (cat: ItemCategory) => {
        try {
            await updateItemCategory(cat.id, { is_active: !cat.is_active });
            fetchCategories();
        } catch (err: any) {
            alert(err.message ?? 'Failed to update');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this item category?')) return;
        try {
            await deleteItemCategory(id);
            fetchCategories();
        } catch (err: any) {
            alert(err.message ?? 'Delete failed');
        }
    };

    const filtered = filterRisk === 'all' ? categories : categories.filter(c => c.risk_level === filterRisk);
    const counts = {
        allowed: categories.filter(c => c.risk_level === 'allowed').length,
        medium: categories.filter(c => c.risk_level === 'medium').length,
        prohibited: categories.filter(c => c.risk_level === 'prohibited').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
                        Item Categories
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Manage allowed, medium-risk, and prohibited shipment items</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-[#5240E8] text-white px-8 py-3.5 rounded-[22px] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#5240E8]/20 hover:scale-[1.05] transition-all active:scale-[0.95]"
                >
                    <Plus className="w-5 h-5" />
                    Add Category
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {(['allowed', 'medium', 'prohibited'] as RiskLevel[]).map(risk => {
                    const cfg = RISK_CONFIG[risk];
                    return (
                        <button
                            key={risk}
                            onClick={() => setFilterRisk(filterRisk === risk ? 'all' : risk)}
                            className={`premium-card p-5 text-left transition-all border-2 ${filterRisk === risk ? cfg.border : 'border-transparent'}`}
                        >
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${cfg.bg} ${cfg.color} mb-3`}>
                                {cfg.icon}
                                {cfg.label}
                            </div>
                            <p className="text-3xl font-black text-[#1e2749]">{counts[risk]}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">categories</p>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <Loader2 className="w-10 h-10 text-[#5240E8] animate-spin" />
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading categories…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-3">
                        <Package className="w-12 h-12 text-gray-200" />
                        <p className="text-gray-400 font-bold">No categories found</p>
                        <button onClick={openCreate} className="text-[#5240E8] text-sm font-black">Add one now</button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name / Slug</th>
                                <th className="text-left px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk</th>
                                <th className="text-left px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Description</th>
                                <th className="text-center px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</th>
                                <th className="text-right px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((cat, i) => {
                                const cfg = RISK_CONFIG[cat.risk_level];
                                return (
                                    <tr key={cat.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-[#1e2749] text-sm">{cat.name}</p>
                                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{cat.slug}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                                                {cfg.icon}
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <p className="text-xs text-gray-500 max-w-xs truncate">{cat.description ?? '—'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => toggleActive(cat)} className="transition-all hover:scale-110">
                                                {cat.is_active
                                                    ? <ToggleRight className="w-7 h-7 text-[#5240E8]" />
                                                    : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(cat)}
                                                    className="p-2 hover:bg-[#5240E8]/10 text-[#5240E8] rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0a0c10]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-[#1e2749]">
                                    {editingId ? 'Edit Category' : 'Add Category'}
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {editingId ? 'Update item category details' : 'Define a new shipment item category'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : autoSlug(e.target.value) })}
                                    placeholder="e.g. Electronics"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                                    required
                                />
                            </div>

                            {/* Slug (only for create) */}
                            {!editingId && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Slug (auto-generated)</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm({ ...form, slug: e.target.value })}
                                        placeholder="electronics"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-mono text-sm"
                                    />
                                </div>
                            )}

                            {/* Risk Level */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Level</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['allowed', 'medium', 'prohibited'] as RiskLevel[]).map(risk => {
                                        const cfg = RISK_CONFIG[risk];
                                        const selected = form.risk_level === risk;
                                        return (
                                            <button
                                                key={risk}
                                                type="button"
                                                onClick={() => setForm({ ...form, risk_level: risk })}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all font-bold text-xs ${selected ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-slate-100 text-gray-400 hover:border-slate-200'}`}
                                            >
                                                {cfg.icon}
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description (optional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={2}
                                    placeholder="Brief description of items in this category…"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div>
                                    <p className="text-sm font-black text-[#1e2749]">Active</p>
                                    <p className="text-xs text-gray-400 font-medium">Inactive categories are hidden from senders</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${form.is_active ? 'bg-[#5240E8]' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${form.is_active ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-[#5240E8] text-white rounded-[20px] font-black text-sm uppercase tracking-widest shadow-lg shadow-[#5240E8]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingId ? 'Save Changes' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
