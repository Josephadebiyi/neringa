import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Users, Plus, Loader2, Trash2, Pencil, X, Check, ShieldCheck } from 'lucide-react';

const PERMISSIONS = [
    { key: 'deliveries.manage', label: 'Deliveries', description: 'Accept bookings, start delivery, update shipment status and tracking.' },
    { key: 'accounts.view', label: 'View Accounts', description: 'View wallet balance, earnings and transaction history.' },
    { key: 'accounts.withdraw', label: 'Withdrawals', description: 'Request withdrawals from the business wallet.' },
    { key: 'chats.manage', label: 'Chats', description: 'View and respond to sender conversations.' },
];
const MAX_STAFF = 5;

const emptyForm = { email: '', password: '', fullName: '', permissions: [] };

export default function StaffAccounts() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const load = () => {
        setLoading(true);
        api.get('/api/bago/business/staff')
            .then((res) => setStaff(res.data?.data || []))
            .catch((err) => setError(err.response?.data?.message || 'Could not load staff accounts.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setFormError('');
        setShowForm(true);
    };

    const openEdit = (member) => {
        setEditingId(member.id);
        setForm({ email: member.email, password: '', fullName: member.fullName || '', permissions: member.permissions || [] });
        setFormError('');
        setShowForm(true);
    };

    const togglePermission = (key) => {
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter((p) => p !== key)
                : [...prev.permissions, key],
        }));
    };

    const toggleAll = () => {
        setForm((prev) => ({
            ...prev,
            permissions: prev.permissions.length === PERMISSIONS.length ? [] : PERMISSIONS.map((p) => p.key),
        }));
    };

    const handleSave = async () => {
        setFormError('');
        if (!editingId && (!form.email.trim() || !form.password.trim())) {
            setFormError('Email and password are required.');
            return;
        }
        if (form.password && form.password.length < 8) {
            setFormError('Password must be at least 8 characters.');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                const payload = { fullName: form.fullName, permissions: form.permissions };
                if (form.password) payload.password = form.password;
                await api.put(`/api/bago/business/staff/${editingId}`, payload);
            } else {
                await api.post('/api/bago/business/staff', form);
            }
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Could not save staff account.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (member) => {
        try {
            await api.put(`/api/bago/business/staff/${member.id}`, { isActive: !member.isActive });
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not update staff account.');
        }
    };

    const handleDelete = async (member) => {
        if (!window.confirm(`Remove ${member.email}? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/bago/business/staff/${member.id}`);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not remove staff account.');
        }
    };

    const activeCount = staff.filter((s) => s.isActive).length;

    return (
        <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="text-sm text-[#6B7280]">
                        {activeCount}/{MAX_STAFF} active staff — each gets their own login and a custom mix of permissions.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={activeCount >= MAX_STAFF}
                    className="flex items-center gap-2 bg-[#5845D8] text-white px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-[#4838B5] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus size={14} /> Add Staff
                </button>
            </div>

            {error && <p className="rounded-full bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="animate-spin text-[#5845D8]" size={32} /></div>
            ) : staff.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-[#ECEBF3] shadow-sm">
                    <Users size={32} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-[#171B22] mb-1">No staff accounts yet</p>
                    <p className="text-[#6B7280] text-xs ">Add up to 5 team members with scoped access.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[20px] border border-[#ECEBF3] shadow-sm overflow-hidden">
                    {staff.map((member) => (
                        <div key={member.id} className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-[#171B22] truncate">{member.fullName || member.email}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${member.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {member.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                <p className="text-xs text-[#6B7280] truncate">{member.email}</p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {member.permissions.length === 0 ? (
                                        <span className="text-xs font-bold text-[#9CA3AF]">No permissions granted</span>
                                    ) : member.permissions.map((p) => (
                                        <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold ">
                                            <ShieldCheck size={9} /> {PERMISSIONS.find((perm) => perm.key === p)?.label || p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => openEdit(member)} className="p-2 rounded-xl text-[#6B7280] hover:text-[#5845D8] hover:bg-[#5845D8]/5" title="Edit">
                                    <Pencil size={15} />
                                </button>
                                <button onClick={() => handleToggleActive(member)} className="p-2 rounded-xl text-[#6B7280] hover:text-amber-600 hover:bg-amber-50" title={member.isActive ? 'Disable' : 'Enable'}>
                                    <Check size={15} />
                                </button>
                                <button onClick={() => handleDelete(member)} className="p-2 rounded-xl text-[#6B7280] hover:text-red-600 hover:bg-red-50" title="Remove">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-[#171B22]">{editingId ? 'Edit Staff Account' : 'Add Staff Account'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-[#6B7280] hover:text-gray-700"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="block text-xs font-bold text-[#6B7280] mb-1">Full name</span>
                                <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold text-[#6B7280] mb-1">Email {!editingId && <span className="text-red-500">*</span>}</span>
                                <input type="email" value={form.email} disabled={!!editingId}
                                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-400" />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold text-[#6B7280] mb-1">
                                    {editingId ? 'New password (leave blank to keep current)' : 'Password *'}
                                </span>
                                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                            </label>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="block text-xs font-bold text-[#6B7280]">Permissions</span>
                                    <button type="button" onClick={toggleAll} className="text-[13px] font-semibold text-[#5845D8]">
                                        {form.permissions.length === PERMISSIONS.length ? 'Clear all' : 'Select all'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {PERMISSIONS.map((perm) => (
                                        <label key={perm.key} className="flex items-start gap-3 p-2.5 rounded-xl border border-[#ECEBF3] hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" className="mt-0.5" checked={form.permissions.includes(perm.key)}
                                                onChange={() => togglePermission(perm.key)} />
                                            <div>
                                                <p className="text-xs font-semibold text-[#171B22]">{perm.label}</p>
                                                <p className="text-[13px] text-[#6B7280]">{perm.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {formError && <p className="text-xs font-bold text-red-600">{formError}</p>}
                            <button onClick={handleSave} disabled={saving}
                                className="w-full py-3 bg-[#5845D8] text-white rounded-full text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
