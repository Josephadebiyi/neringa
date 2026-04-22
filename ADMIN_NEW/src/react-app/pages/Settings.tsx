import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Settings as SettingsIcon, Trash2 } from "lucide-react";
import {
  getInsuranceSettings,
  getSettings,
  requestAdminCredentialChange,
  updateInsuranceSettings,
  updateSettings,
  verifyAdminCredentialChange,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

type RegionInsurance = {
  fixedPrice: number;
  maxCoverageAmount: number;
  commissionPercentage: number;
  enabled: boolean;
  currency: string;
};

type CurrencyRateRow = {
  code: string;
  rate: string;
};

const defaultRows: CurrencyRateRow[] = [
  { code: "USD", rate: "1" },
  { code: "EUR", rate: "0.92" },
  { code: "GBP", rate: "0.79" },
  { code: "CAD", rate: "1.36" },
  { code: "NGN", rate: "1550" },
  { code: "GHS", rate: "15.2" },
  { code: "KES", rate: "129" },
  { code: "ZAR", rate: "18.5" },
];

const normalizeCode = (value: string) =>
  value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 3);

const normalizeRate = (value: string) => value.replace(/[^0-9.]/g, "");

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingInsurance, setSavingInsurance] = useState(false);
  const [savingCurrencies, setSavingCurrencies] = useState(false);
  const [sendingCredentialCode, setSendingCredentialCode] = useState(false);
  const [verifyingCredentialCode, setVerifyingCredentialCode] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState("USD");

  const [africaInsurance, setAfricaInsurance] = useState<RegionInsurance>({
    fixedPrice: 3000, maxCoverageAmount: 2000000, commissionPercentage: 15, enabled: true, currency: "NGN",
  });
  const [europeInsurance, setEuropeInsurance] = useState<RegionInsurance>({
    fixedPrice: 6, maxCoverageAmount: 10000, commissionPercentage: 15, enabled: true, currency: "USD",
  });
  const [globalInsurance, setGlobalInsurance] = useState<RegionInsurance>({
    fixedPrice: 6, maxCoverageAmount: 5000, commissionPercentage: 15, enabled: true, currency: "USD",
  });
  const [description, setDescription] = useState("Protect your shipment against loss, damage, or theft during transit.");
  const [terms, setTerms] = useState("Insurance coverage applies from pickup to delivery. Claims must be filed within 48 hours of delivery.");
  const [selectedRegion, setSelectedRegion] = useState<"africa" | "europe" | "global">("global");
  const [currencyRows, setCurrencyRows] = useState<CurrencyRateRow[]>(defaultRows);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextAdminEmail, setNextAdminEmail] = useState("");
  const [nextAdminPassword, setNextAdminPassword] = useState("");
  const [credentialOtp, setCredentialOtp] = useState("");

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [insuranceResult, generalResult] = await Promise.all([
        getInsuranceSettings(),
        getSettings(),
      ]);

      if (insuranceResult.success && insuranceResult.data) {
        if (insuranceResult.data.africa) setAfricaInsurance(insuranceResult.data.africa);
        if (insuranceResult.data.europe) setEuropeInsurance(insuranceResult.data.europe);
        if (insuranceResult.data.global) setGlobalInsurance(insuranceResult.data.global);
        setGlobalEnabled(Boolean(insuranceResult.data.enabled));
        if (insuranceResult.data.description) setDescription(insuranceResult.data.description);
        if (insuranceResult.data.terms) setTerms(insuranceResult.data.terms);
      }

      const settingsData = generalResult?.data;
      if (settingsData) {
        const nextBaseCurrency = String(settingsData.baseCurrency || "USD").trim().toUpperCase() || "USD";
        setBaseCurrency(nextBaseCurrency);

        const configuredRates = settingsData.exchangeRates && typeof settingsData.exchangeRates === "object"
          ? Object.entries(settingsData.exchangeRates)
          : [];
        const configuredSupported = Array.isArray(settingsData.supportedCurrencies)
          ? settingsData.supportedCurrencies.map((value: unknown) => normalizeCode(String(value || ""))).filter(Boolean)
          : [];

        const rowsFromSettings = configuredSupported.map((code: string) => {
          const matched = configuredRates.find(([key]) => normalizeCode(String(key)) === code);
          return {
            code,
            rate: matched ? String(matched[1]) : "",
          };
        });

        const merged = rowsFromSettings.length > 0 ? rowsFromSettings : defaultRows;
        if (!merged.some((row) => row.code === "USD")) {
          merged.unshift({ code: "USD", rate: "1" });
        }
        setCurrencyRows(merged);
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentRegionData = selectedRegion === "africa"
    ? africaInsurance
    : selectedRegion === "europe"
      ? europeInsurance
      : globalInsurance;

  const setRegionData = selectedRegion === "africa"
    ? setAfricaInsurance
    : selectedRegion === "europe"
      ? setEuropeInsurance
      : setGlobalInsurance;

  const updateRegionField = (field: keyof RegionInsurance, value: string | number | boolean) => {
    setRegionData((prev) => ({ ...prev, [field]: value }));
  };

  const cleanedCurrencyRows = useMemo(() => {
    const normalized = currencyRows
      .map((row) => ({
        code: normalizeCode(row.code),
        rate: normalizeRate(row.rate),
      }))
      .filter((row) => row.code);

    const deduped = new Map<string, CurrencyRateRow>();
    for (const row of normalized) {
      if (!deduped.has(row.code)) {
        deduped.set(row.code, row);
      }
    }

    if (!deduped.has("USD")) {
      deduped.set("USD", { code: "USD", rate: "1" });
    }

    return Array.from(deduped.values());
  }, [currencyRows]);

  const handleSaveInsurance = async () => {
    try {
      setSavingInsurance(true);
      const payload = {
        africa: africaInsurance,
        europe: europeInsurance,
        global: globalInsurance,
        enabled: globalEnabled,
        description: String(description || "").trim(),
        terms: String(terms || "").trim(),
      };

      const response = await updateInsuranceSettings(payload);
      if (response.success) {
        setMessage({ type: "success", text: "Insurance settings updated successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: response.message || "FAILED TO UPDATE INSURANCE SETTINGS" });
      }
    } catch (error: any) {
      console.error("Save insurance error:", error);
      setMessage({ type: "error", text: error.message || "FAILED TO UPDATE INSURANCE SETTINGS" });
    } finally {
      setSavingInsurance(false);
    }
  };

  const handleSaveCurrencies = async () => {
    try {
      setSavingCurrencies(true);

      const supportedCurrencies = cleanedCurrencyRows.map((row) => row.code);
      const exchangeRates = cleanedCurrencyRows.reduce<Record<string, number>>((acc, row) => {
        const parsed = Number(row.code === "USD" ? "1" : row.rate);
        if (Number.isFinite(parsed) && parsed > 0) {
          acc[row.code] = parsed;
        }
        return acc;
      }, {});

      exchangeRates.USD = 1;

      const response = await updateSettings({
        baseCurrency,
        supportedCurrencies,
        exchangeRates,
      });

      if (response.success) {
        setCurrencyRows(
          supportedCurrencies.map((code) => ({
            code,
            rate: String(exchangeRates[code]),
          })),
        );
        setMessage({ type: "success", text: "Currency settings updated successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: response.message || "FAILED TO UPDATE CURRENCY SETTINGS" });
      }
    } catch (error: any) {
      console.error("Save currency settings error:", error);
      setMessage({ type: "error", text: error.message || "FAILED TO UPDATE CURRENCY SETTINGS" });
    } finally {
      setSavingCurrencies(false);
    }
  };

  const updateCurrencyRow = (index: number, field: "code" | "rate", value: string) => {
    setCurrencyRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: field === "code" ? normalizeCode(value) : normalizeRate(value),
            }
          : row,
      ),
    );
  };

  const removeCurrencyRow = (index: number) => {
    setCurrencyRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const addCurrencyRow = () => {
    setCurrencyRows((prev) => [...prev, { code: "", rate: "" }]);
  };

  const handleRequestCredentialChange = async () => {
    try {
      setSendingCredentialCode(true);
      const response = await requestAdminCredentialChange({
        currentPassword,
        newEmail: nextAdminEmail,
        newPassword: nextAdminPassword,
      });
      setMessage({
        type: response.success ? "success" : "error",
        text: response.message || (response.success ? "Verification code sent" : "Failed to send verification code"),
      });
      if (response.success) {
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to send verification code" });
    } finally {
      setSendingCredentialCode(false);
    }
  };

  const handleVerifyCredentialChange = async () => {
    try {
      setVerifyingCredentialCode(true);
      const response = await verifyAdminCredentialChange({ otp: credentialOtp });
      setMessage({
        type: response.success ? "success" : "error",
        text: response.message || (response.success ? "Admin credentials updated successfully" : "Failed to verify code"),
      });
      if (response.success) {
        setCurrentPassword("");
        setCredentialOtp("");
      }
      setTimeout(() => setMessage(null), 4000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to verify credential change" });
    } finally {
      setVerifyingCredentialCode(false);
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#1e2749]">System Settings</h1>
          <p className="text-gray-500 font-medium">Control currencies, rates, and insurance behavior from one place.</p>
        </div>
        <div>
          {message && (
            <div
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                message.type === "success"
                  ? "bg-green-50 text-green-600 border border-green-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-[#5240e8] rounded-2xl flex items-center justify-center">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e2749] leading-tight">Currencies & Rates</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                Admin-controlled viewer pricing and app currency options
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveCurrencies}
            disabled={savingCurrencies}
            className="px-6 py-3 bg-[#1e2749] hover:bg-[#2a3663] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {savingCurrencies ? "Saving..." : "Save Currency Settings"}
            <Save size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              Base Currency
            </label>
            <input
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(normalizeCode(e.target.value) || "USD")}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm"
              disabled
            />
            <p className="text-[10px] text-gray-400 mt-2 px-1 font-medium">
              Kept on USD for safe rate management across the current app and backend.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {currencyRows.map((row, index) => {
            const isUsd = normalizeCode(row.code) === "USD";
            return (
              <div
                key={`${row.code}-${index}`}
                className="grid grid-cols-[120px_minmax(0,1fr)_44px] gap-3 items-center"
              >
                <input
                  value={row.code}
                  onChange={(e) => updateCurrencyRow(index, "code", e.target.value)}
                  placeholder="USD"
                  className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm uppercase"
                  disabled={isUsd}
                />
                <input
                  value={isUsd ? "1" : row.rate}
                  onChange={(e) => updateCurrencyRow(index, "rate", e.target.value)}
                  placeholder="1550"
                  className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl font-bold text-sm"
                  disabled={isUsd}
                />
                <button
                  type="button"
                  onClick={() => removeCurrencyRow(index)}
                  disabled={isUsd}
                  className="w-11 h-11 rounded-2xl border border-red-100 text-red-500 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">
            Add any 3-letter currency code here and it will become selectable in the app after settings refresh.
          </p>
          <button
            type="button"
            onClick={addCurrencyRow}
            className="px-5 py-3 bg-[#5240e8] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] flex items-center gap-2"
          >
            <Plus size={14} />
            Add Currency
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-lg font-black text-[#1e2749] leading-tight">Admin Login Credentials</h2>
            <p className="text-gray-500 font-medium">
              Signed in as {user?.email || "current admin email"}. Request a code, then confirm it to change the admin login safely.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm"
              placeholder="Enter current admin password"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              New Email
            </label>
            <input
              type="email"
              value={nextAdminEmail}
              onChange={(e) => setNextAdminEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              New Password
            </label>
            <input
              type="password"
              value={nextAdminPassword}
              onChange={(e) => setNextAdminPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
              Verification Code
            </label>
            <input
              value={credentialOtp}
              onChange={(e) => setCredentialOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm tracking-[0.25em]"
              placeholder="6-digit code"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleRequestCredentialChange}
            disabled={sendingCredentialCode}
            className="px-6 py-3 bg-[#5240e8] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] disabled:opacity-50"
          >
            {sendingCredentialCode ? "Sending..." : "Send Verification Code"}
          </button>
          <button
            onClick={handleVerifyCredentialChange}
            disabled={verifyingCredentialCode}
            className="px-6 py-3 bg-[#1e2749] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] disabled:opacity-50"
          >
            {verifyingCredentialCode ? "Verifying..." : "Apply Credential Change"}
          </button>
        </div>
      </div>

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
            className={`w-16 h-8 rounded-full transition-all duration-300 relative ${globalEnabled ? "bg-[#5240e8]" : "bg-gray-200"}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${globalEnabled ? "left-9" : "left-1"}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-black">
              {selectedRegion.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-sm font-black text-[#1e2749] uppercase tracking-[2px]">
              Regional Config: <span className="text-[#5240e8]">{selectedRegion}</span>
            </h2>
          </div>

          <div className="flex gap-4">
            {(["global", "africa", "europe"] as const).map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedRegion === region ? "bg-[#5240e8] text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                Fixed Insurance Price ({selectedRegion === "africa" ? "NGN" : "USD"})
              </label>
              <input
                type="text"
                value={currentRegionData.fixedPrice}
                onChange={(e) => updateRegionField("fixedPrice", Number(normalizeRate(e.target.value) || "0"))}
                className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl font-bold text-sm text-blue-700"
              />
              <p className="text-[9px] text-gray-400 mt-1.5 px-1 font-medium">
                This amount is converted to the user&apos;s selected app currency.
              </p>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">
                Max Coverage ({selectedRegion === "africa" ? "NGN" : "USD"})
              </label>
              <input
                type="text"
                value={currentRegionData.maxCoverageAmount}
                onChange={(e) => updateRegionField("maxCoverageAmount", Number(normalizeRate(e.target.value) || "0"))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2 px-1">
                Commission (%)
              </label>
              <input
                type="text"
                value={currentRegionData.commissionPercentage}
                onChange={(e) => updateRegionField("commissionPercentage", Number(normalizeRate(e.target.value) || "0"))}
                className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl font-bold text-sm text-indigo-700"
              />
            </div>
            <div className="flex items-center gap-4 px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Region Enabled</label>
              <input
                type="checkbox"
                checked={currentRegionData.enabled}
                onChange={(e) => updateRegionField("enabled", e.target.checked)}
                className="w-5 h-5 accent-[#5240e8]"
              />
            </div>
          </div>
        </div>

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
          onClick={handleSaveInsurance}
          disabled={savingInsurance}
          className="px-8 py-4 bg-[#1e2749] hover:bg-[#2a3663] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg flex items-center gap-2 group disabled:opacity-50"
        >
          {savingInsurance ? "Saving..." : "Save Insurance Settings"}
          <Save size={14} className="group-hover:translate-y-[-1px] transition-transform" />
        </button>
      </div>
    </div>
  );
}
