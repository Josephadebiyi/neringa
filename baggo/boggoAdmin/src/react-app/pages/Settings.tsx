import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, Percent } from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function SettingsPage() {
    const [autoVerification, setAutoVerification] = useState(false);
    const [commissionPercentage, setCommissionPercentage] = useState(15);
    const [insurancePercentage, setInsurancePercentage] = useState(5);
    const [insuranceFixedAmount, setInsuranceFixedAmount] = useState(50);
    const [insuranceType, setInsuranceType] = useState<'percentage' | 'fixed'>('percentage');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/getCurrentSetting`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setAutoVerification(result.data.autoVerification || false);
                    setCommissionPercentage(result.data.commissionPercentage || 15);
                    setInsurancePercentage(result.data.insurancePercentage || 5);
                    setInsuranceFixedAmount(result.data.insuranceFixedAmount || 50);
                    setInsuranceType(result.data.insuranceType || 'percentage');
                }
            } else {
                console.error('Failed to fetch setting:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('adminToken');

            const response = await fetch(`${API_BASE_URL}/update-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    autoVerification,
                    commissionPercentage: Number(commissionPercentage),
                    insuranceType,
                    insurancePercentage: Number(insurancePercentage),
                    insuranceFixedAmount: Number(insuranceFixedAmount)
                }),
                credentials: 'include',
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Settings updated successfully' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessage({ type: 'error', text: errorData.message || 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1e2749]">Platform Settings</h1>
                    <p className="text-gray-500 font-medium">Configure global platform rules and fees</p>
                </div>
                <div>
                    {message && (
                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${message.type === 'success'
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KYC Verification Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <SettingsIcon size={20} />
                        </div>
                        <h2 className="text-sm font-black text-[#1e2749] uppercase tracking-[2px]">KYC Control</h2>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                            <div className="text-xs font-black text-[#1e2749] uppercase tracking-wide">Auto-Verification</div>
                            <div className="text-[10px] text-gray-400 font-bold mt-1">
                                {autoVerification ? 'Verified instantly' : 'Manual approval required'}
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoVerification}
                                onChange={(e) => setAutoVerification(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5240e8]"></div>
                        </label>
                    </div>
                </div>

                {/* Fees Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Percent size={20} />
                        </div>
                        <h2 className="text-sm font-black text-[#1e2749] uppercase tracking-[2px]">Fees & Insurance</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Platform Commission (%)</span>
                            <div className="relative mt-2">
                                <input
                                    type="number"
                                    step="any"
                                    value={commissionPercentage}
                                    onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240e8]/10 focus:border-[#5240e8] outline-none transition-all font-bold text-sm text-[#1e2749]"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5240e8] font-black">%</div>
                            </div>
                        </label>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => setInsuranceType('percentage')}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${insuranceType === 'percentage' ? 'bg-[#5240e8] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                >
                                    Percentage (%)
                                </button>
                                <button
                                    onClick={() => setInsuranceType('fixed')}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${insuranceType === 'fixed' ? 'bg-[#5240e8] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                >
                                    Fixed Amount ($)
                                </button>
                            </div>

                            {insuranceType === 'percentage' ? (
                                <label className="block animate-in fade-in duration-300">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Insurance Fee (%)</span>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={insurancePercentage}
                                            onChange={(e) => setInsurancePercentage(Number(e.target.value))}
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240e8]/10 focus:border-[#5240e8] outline-none transition-all font-bold text-sm text-[#1e2749]"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5240e8] font-black">%</div>
                                    </div>
                                </label>
                            ) : (
                                <label className="block animate-in fade-in duration-300">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fixed Insurance Price (USD)</span>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            step="any"
                                            value={insuranceFixedAmount}
                                            onChange={(e) => setInsuranceFixedAmount(Number(e.target.value))}
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240e8]/10 focus:border-[#5240e8] outline-none transition-all font-bold text-sm text-[#1e2749]"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5240e8] font-black">$</div>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-[#1e2749] hover:bg-[#2a3663] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg flex items-center gap-2 group disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                    <Save size={14} className="group-hover:translate-y-[-1px] transition-transform" />
                </button>
            </div>
        </div>
    );
}
