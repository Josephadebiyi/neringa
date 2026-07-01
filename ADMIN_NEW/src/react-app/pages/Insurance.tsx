import { useState, useEffect } from 'react';
import { Download, RefreshCw, ShieldCheck, ShieldAlert, Shield, Save, Loader2 } from 'lucide-react';
import { getInsuredShipments, getInsuranceSettings, updateInsuranceSettings } from '../services/api';

interface InsuredShipment {
  id: string;
  trackingNumber: string;
  createdAt: string;
  insuranceStatus: string;
  insuranceCost: number;
  currency: string;
  senderName?: string;
  senderEmail?: string;
  fromLocation?: string;
  toLocation?: string;
  packageValue?: number;
}

type RegionInsurance = { enabled: boolean; ratePercent: number; minCost: number; maxCost: number };

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'covered' || s === 'approved')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold"><ShieldCheck className="w-3 h-3" />{status}</span>;
  if (s === 'pending' || s === 'processing')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold"><Shield className="w-3 h-3" />{status}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold"><ShieldAlert className="w-3 h-3" />{status || 'Unknown'}</span>;
}

function exportCsv(rows: InsuredShipment[]) {
  const headers = ['Tracking #', 'Date', 'Sender', 'Route', 'Insurance Status', 'Cost', 'Currency', 'Package Value'];
  const lines = rows.map(r => [
    r.trackingNumber, new Date(r.createdAt).toLocaleDateString(),
    r.senderName || r.senderEmail || '',
    `${r.fromLocation || ''} → ${r.toLocation || ''}`,
    r.insuranceStatus, r.insuranceCost, r.currency, r.packageValue || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `bago-insured-shipments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function RegionCard({
  label, value, onChange, saving,
}: {
  label: string;
  value: RegionInsurance;
  onChange: (v: RegionInsurance) => void;
  saving: boolean;
}) {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">{label}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => onChange({ ...value, enabled: !value.enabled })}
            className={`w-10 h-5 rounded-full transition-colors relative ${value.enabled ? 'bg-[#5C4BFD]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs font-semibold text-gray-500">{value.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'ratePercent' as const, label: 'Rate (%)', step: 0.1 },
          { key: 'minCost' as const, label: 'Min Cost (USD)', step: 0.5 },
          { key: 'maxCost' as const, label: 'Max Cost (USD)', step: 1 },
        ].map(({ key, label: lbl, step }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{lbl}</span>
            <input
              type="number"
              step={step}
              min={0}
              value={value[key]}
              disabled={saving}
              onChange={e => onChange({ ...value, [key]: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C4BFD]/20 focus:border-[#5C4BFD] disabled:opacity-50"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function InsurancePage() {
  // ── Shipments ────────────────────────────────────────────────────────────
  const [shipments, setShipments] = useState<InsuredShipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchShipments = async () => {
    setLoadingShipments(true);
    try {
      const res = await getInsuredShipments(filter !== 'all' ? filter : undefined);
      const data = res?.data || res?.shipments || res || [];
      setShipments(Array.isArray(data) ? data : []);
    } catch { setShipments([]); }
    finally { setLoadingShipments(false); }
  };

  useEffect(() => { fetchShipments(); }, [filter]);

  const filtered = shipments.filter(s =>
    !search ||
    s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.senderName?.toLowerCase().includes(search.toLowerCase()) ||
    s.senderEmail?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Settings ─────────────────────────────────────────────────────────────
  const blank: RegionInsurance = { enabled: true, ratePercent: 2, minCost: 1, maxCost: 50 };
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [africa, setAfrica] = useState<RegionInsurance>({ ...blank });
  const [europe, setEurope] = useState<RegionInsurance>({ ...blank });
  const [global, setGlobal] = useState<RegionInsurance>({ ...blank });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getInsuranceSettings();
        if (res?.success && res?.data) {
          const d = res.data;
          if (d.africa) setAfrica(d.africa);
          if (d.europe) setEurope(d.europe);
          if (d.global) setGlobal(d.global);
          if (typeof d.enabled === 'boolean') setGlobalEnabled(d.enabled);
        }
      } catch { /* keep defaults */ }
      setLoadingSettings(false);
    })();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await updateInsuranceSettings({ enabled: globalEnabled, africa, europe, global });
      setSaveMsg({ ok: res?.success !== false, text: res?.message || (res?.success !== false ? 'Settings saved.' : 'Save failed.') });
    } catch (e: any) {
      setSaveMsg({ ok: false, text: e?.message || 'Save failed.' });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">

      {/* ── Insured Shipments ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Insurance</h1>
            <p className="text-sm text-gray-400 mt-0.5">View insured shipments and configure coverage pricing</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchShipments}
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingShipments ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5C4BFD] text-white text-sm font-bold hover:bg-[#4B3CE8] disabled:opacity-40 transition-all"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by tracking # or sender…"
            className="flex-1 min-w-48 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5C4BFD]/20 focus:border-[#5C4BFD]"
          />
          {['all', 'active', 'pending', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                filter === f ? 'bg-[#5C4BFD] border-[#5C4BFD] text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loadingShipments ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading shipments…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Shield className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-semibold">No insured shipments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Tracking #', 'Date', 'Sender', 'Route', 'Status', 'Cost', 'Pkg Value'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.trackingNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-700">{s.senderName || s.senderEmail || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.fromLocation && s.toLocation ? `${s.fromLocation} → ${s.toLocation}` : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.insuranceStatus} /></td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{s.currency} {Number(s.insuranceCost || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500">{s.packageValue ? `${s.currency} ${Number(s.packageValue).toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 font-medium">
                {filtered.length} shipment{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Insurance Pricing Settings ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-gray-900">Coverage Pricing</h2>
            <p className="text-sm text-gray-400 mt-0.5">Set insurance rates by region — powered by MyCover.ai</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-semibold text-gray-600">Insurance globally</span>
            <div
              onClick={() => setGlobalEnabled(v => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${globalEnabled ? 'bg-[#5C4BFD]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${globalEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>

        {loadingSettings ? (
          <div className="flex items-center gap-2 text-gray-400 py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
          </div>
        ) : (
          <div className="space-y-4">
            <RegionCard label="Africa" value={africa} onChange={setAfrica} saving={saving} />
            <RegionCard label="Europe" value={europe} onChange={setEurope} saving={saving} />
            <RegionCard label="Global (Rest of world)" value={global} onChange={setGlobal} saving={saving} />

            {saveMsg && (
              <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${saveMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {saveMsg.text}
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#5C4BFD] hover:bg-[#4B3CE8] disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-all"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save pricing</>}
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
