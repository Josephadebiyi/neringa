import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { getInsuranceSettings, updateInsuranceSettings } from "../services/api";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [globalEnabled, setGlobalEnabled] = useState(true);

    const [africaInsurance, setAfricaInsurance] = useState({
        fixedPrice: 3000, maxCoverageAmount: 2000000, commissionPercentage: 15, enabled: true, currency: 'NGN'
    });
    const [europeInsurance, setEuropeInsurance] = useState({
        fixedPrice: 6, maxCoverageAmount: 10000, commissionPercentage: 15, enabled: true, currency: 'USD'
    });
    const [globalInsurance, setGlobalInsurance] = useState({
        fixedPrice: 6, maxCoverageAmount: 5000, commissionPercentage: 15, enabled: true, currency: 'USD'
    });
    const [description, setDescription] = useState('Protect your shipment against loss, damage, or theft during transit.');
    const [terms, setTerms] = useState('Insurance coverage applies from pickup to delivery. Claims must be filed within 48 hours of delivery.');
    const [selectedRegion, setSelectedRegion] = useState<'africa' | 'europe' | 'global'>('global');

    useEffect(() => {
        fetchInsuranceSettings();
    }, []);

    const fetchInsuranceSettings = async () => {
        try {
            const result = await getInsuranceSettings();
            if (result.success && result.data) {
                if (result.data.africa) setAfricaInsurance(result.data.africa);
                if (result.data.europe) setEuropeInsurance(result.data.europe);
                if (result.data.global) setGlobalInsurance(result.data.global);
                setGlobalEnabled(result.data.enabled);
                if (result.data.description) setDescription(result.data.description);
                if (result.data.terms) setTerms(result.data.terms);
            }
        } catch (error) {
            console.error('Fetch insurance error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRegion = async () => {
        try {
            setSaving(true);
            const payload = {
                africa: africaInsurance,
                europe: europeInsurance,
                global: globalInsurance,
                enabled: globalEnabled,
                description: String(description || '').trim(),
                terms: String(terms || '').trim()
            };

            const response = await updateInsuranceSettings(payload);

            if (response.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: response.message || 'FAILED TO UPDATE SETTINGS' });
            }
        } catch (error: any) {
            console.error('Save insurance error:', error);
            setMessage({ type: 'error', text: error.message || 'FAILED TO UPDATE SETTINGS' });
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

    const currentRegionData = selectedRegion === 'africa' ? africaInsurance : selectedRegion === 'europe' ? europeInsurance : globalInsurance;
    const setRegionData = selectedRegion === 'africa' ? setAfricaInsurance : selectedRegion === 'europe' ? setEuropeInsurance : setGlobalInsurance;

    const updateRegionField = (field: string, value: any) => {
        setRegionData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1e2749]">Insurance Settings</h1>
                    <p className="text-gray-500 font-medium">Configure regional insurance rules and fees</p>
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

            {/* Header / Global Toggle */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 text-[#5240e8] rounded-2xl flex items-center justify-center">
                            <SettingsIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#1e2749] leading-tight">Master Insurance Toggle</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">Global availability control</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setGlobalEnabled(!globalEnabled)}
                        className={`w-16 h-8 rounded-full transition-all duration-300 relative ${globalEnabled ? 'bg-[#5240e8]' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${globalEnabled ? 'left-9' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Region Selector */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-black">
                            {selectedRegion.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-sm font-black text-[#1e2749] uppercase tracking-[2px]">Regional Config: <span className="text-[#5240e8]">{selectedRegion}</span></h2>
                    </div>

                    <div className="flex gap-4">
                        {(['global', 'africa', 'europe'] as const).map(region => (
                            <button
                                key={region}
                                onClick={() => setSelectedRegion(region)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRegion === region ? 'bg-[#5240e8] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                {region}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                                Fixed Insurance Price ({selectedRegion === 'africa' ? 'NGN' : 'USD'})
                            </label>
                            <input
                                type="text"
                                value={(currentRegionData as any).fixedPrice}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    updateRegionField('fixedPrice', val === '' ? 0 : Number(val));
                                }}
                                className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl font-bold text-sm text-blue-700"
                                placeholder={selectedRegion === 'africa' ? '3000' : '6'}
                            />
                            <p className="text-[9px] text-gray-400 mt-1.5 px-1 font-medium">
                                This amount will be automatically converted to user's preferred currency
                            </p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Max Coverage ({selectedRegion === 'africa' ? 'NGN' : 'USD'})</label>
                            <input
                                type="text"
                                value={(currentRegionData as any).maxCoverageAmount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    updateRegionField('maxCoverageAmount', val === '' ? 0 : Number(val));
                                }}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 px-1">Commission (%)</label>
                            <input
                                type="text"
                                value={(currentRegionData as any).commissionPercentage}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    updateRegionField('commissionPercentage', val === '' ? 0 : Number(val));
                                }}
                                className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl font-bold text-sm text-indigo-700"
                            />
                        </div>
                        <div className="flex items-center gap-4 px-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Region Enabled</label>
                            <input
                                type="checkbox"
                                checked={currentRegionData.enabled}
                                onChange={(e) => updateRegionField('enabled', e.target.checked)}
                                className="w-5 h-5 accent-[#5240e8]"
                            />
                        </div>
                    </div>
                </div>

                {/* Description & Terms */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Save size={18} />
                        </div>
                        <h2 className="text-sm font-black text-[#1e2749] uppercase tracking-[2px]">Public Content & Terms</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Insurance Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-[#5240e8]/30 transition-all"
                                placeholder="Explain what the insurance covers..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Policy Terms & Conditions</label>
                            <textarea
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:border-[#5240e8]/30 transition-all"
                                placeholder="Legal terms, claim window, etc..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSaveRegion}
                    disabled={saving}
                    className="px-8 py-4 bg-[#1e2749] hover:bg-[#2a3663] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg flex items-center gap-2 group disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                    <Save size={14} className="group-hover:translate-y-[-1px] transition-transform" />
                </button>
            </div>
        </div>
    );
}
