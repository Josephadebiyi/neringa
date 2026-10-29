import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { getPayments, retryPaymentBooking } from "../services/api";

interface Payment {
  id: string;
  createdAt: string;
  provider: string;
  paymentMethod: string | null;
  status: string;
  amount: number;
  currency: string;
  reference: string | null;
  providerTransactionId: string | null;
  customer: { id: string; name: string | null; email: string | null };
  shipmentId: string | null;
  needsAttention: boolean;
  alertedAt: string | null;
  lastRetry: { at: string; outcome: string } | null;
}

const FILTERS = [
  { id: "attention", label: "Needs attention" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Not paid" },
  { id: "all", label: "All" },
];

function providerDashboardUrl(payment: Payment) {
  if (payment.provider === "stripe" && payment.reference) {
    return `https://dashboard.stripe.com/payments/${payment.reference}`;
  }
  if (payment.provider === "flutterwave" && payment.providerTransactionId) {
    return `https://app.flutterwave.com/dashboard/transactions/list/${payment.providerTransactionId}`;
  }
  return null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("attention");
  const [provider, setProvider] = useState("");
  const [search, setSearch] = useState("");
  const [needsAttention, setNeedsAttention] = useState(0);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getPayments(filter, search.trim(), provider);
      setPayments(result?.data || []);
      setNeedsAttention(result?.needsAttention || 0);
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "Could not load payments." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, provider]);

  const retry = async (payment: Payment) => {
    if (!confirm(`Retry booking for ${payment.currency} ${payment.amount.toFixed(2)} (${payment.reference})?\n\nBago re-checks the payment with ${payment.provider} and creates the booking if it was paid.`)) return;
    setRetrying(payment.id);
    setNotice(null);
    try {
      const result = await retryPaymentBooking(payment.id);
      setNotice({ type: "ok", text: result?.message || "Booking created." });
      await load();
    } catch (error: any) {
      setNotice({ type: "error", text: error?.message || "Retry failed." });
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Every customer payment, with its provider reference and booking.</p>
        </div>
        {needsAttention > 0 && (
          <button onClick={() => setFilter("attention")}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" /> {needsAttention} paid without a booking
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map((item) => (
          <button key={item.id} onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === item.id ? "bg-[#5845D8] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {item.label}
          </button>
        ))}
        <select value={provider} onChange={(e) => setProvider(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm">
          <option value="">All providers</option>
          <option value="stripe">Stripe</option>
          <option value="flutterwave">Flutterwave</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Customer email or payment reference"
              className="w-full rounded-full border border-gray-200 py-1.5 pl-9 pr-3 text-sm" />
          </div>
          <button type="submit" className="rounded-full border border-gray-200 bg-white p-2" aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </form>
      </div>

      {notice && (
        <div className={`rounded-xl px-4 py-3 text-sm ${notice.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {notice.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Provider / method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => {
              const link = providerDashboardUrl(payment);
              return (
                <tr key={payment.id} className={payment.needsAttention ? "bg-red-50/40" : ""}>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{new Date(payment.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{payment.customer.name || "—"}</div>
                    <div className="text-xs text-gray-500">{payment.customer.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">{payment.currency} {payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="capitalize">{payment.provider}</div>
                    <div className="text-xs text-gray-500">{payment.paymentMethod || "—"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {link ? <a href={link} target="_blank" rel="noreferrer" className="text-[#5845D8] hover:underline">{payment.reference}</a> : payment.reference}
                    {payment.providerTransactionId && payment.provider === "flutterwave" && (
                      <div className="text-gray-500">Txn {payment.providerTransactionId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{payment.status}</td>
                  <td className="px-4 py-3">
                    {payment.shipmentId ? (
                      <span className="flex items-center gap-1 text-green-700"><CheckCircle className="h-4 w-4" /> Booked</span>
                    ) : payment.needsAttention ? (
                      <span className="flex items-center gap-1 text-red-700"><XCircle className="h-4 w-4" /> Paid, no booking</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                    {payment.lastRetry && <div className="text-xs text-gray-500">Retried {new Date(payment.lastRetry.at).toLocaleString()}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!payment.shipmentId && (
                      <button onClick={() => retry(payment)} disabled={retrying === payment.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#5845D8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                        {retrying === payment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Retry booking
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!payments.length && !loading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No payments match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
