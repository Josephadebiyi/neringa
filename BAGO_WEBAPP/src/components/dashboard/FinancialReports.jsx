import React, { useEffect, useState } from 'react';
import api from '../../api';
import { FileText, Download, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R' };

function getSymbol(currency) {
    return CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '');
}

function formatMoney(amount, currency) {
    return `${getSymbol(currency)}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function exportTransactionsCsv(transactions, filename = 'bago-financial-report') {
    const headers = ['Date', 'Description', 'Type', 'Status', 'Amount', 'Currency'];
    const rows = transactions.map(t => [
        new Date(t.created_at || t.createdAt).toLocaleDateString(),
        t.description || '',
        t.type || '',
        t.status || '',
        t.displayAmount ?? t.amount ?? 0,
        t.displayCurrency || t.currency || '',
    ]);
    const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

export default function FinancialReports({ user }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [report, setReport] = useState(null);
    const [balance, setBalance] = useState(0);
    const [exportingCsv, setExportingCsv] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [pdfError, setPdfError] = useState('');

    const fetchReport = async (params = {}) => {
        setLoading(true);
        setError('');
        try {
            const [reportRes, walletRes] = await Promise.all([
                api.get('/api/bago/wallet/transactions/export', { params }),
                api.get('/api/bago/getWallet'),
            ]);
            if (reportRes.data?.success) {
                setReport(reportRes.data);
            }
            const w = walletRes.data?.data || walletRes.data || {};
            setBalance(w.displayBalance ?? w.balance ?? 0);
        } catch (e) {
            setError(e?.response?.data?.message || 'Could not load financial report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    const handleFilter = () => {
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        fetchReport(params);
    };

    const handleExportCsv = () => {
        if (!report?.transactions?.length) return;
        setExportingCsv(true);
        try {
            exportTransactionsCsv(report.transactions);
        } finally {
            setExportingCsv(false);
        }
    };

    const handleExportPdf = async () => {
        setExportingPdf(true);
        setPdfError('');
        try {
            const params = {};
            if (from) params.from = from;
            if (to) params.to = to;
            const res = await api.get('/api/bago/wallet/report/pdf', { params, responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `bago-financial-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            setPdfError('Could not download the PDF report. Please try again.');
        } finally {
            setExportingPdf(false);
        }
    };

    const currency = report?.currency || 'USD';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-lg font-black text-[#111827]">Financial Reports</h2>
                    <p className="text-xs text-gray-400 font-medium mt-1">Download your transaction history and earnings summary.</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">From</label>
                        <input
                            type="date"
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5845D8]/20"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">To</label>
                        <input
                            type="date"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5845D8]/20"
                        />
                    </div>
                    <button
                        onClick={handleFilter}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black disabled:opacity-50"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-2xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Received', value: report?.totalReceived, icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Total Withdrawn', value: report?.totalWithdrawn, icon: TrendingDown, color: 'text-red-500' },
                    { label: 'Net Total', value: report?.netTotal, icon: FileText, color: 'text-[#5845D8]' },
                    { label: 'Current Balance', value: balance, icon: Wallet, color: 'text-gray-700' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <Icon className={`w-4 h-4 mb-2 ${color}`} />
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                        <p className="text-lg font-black text-[#111827] mt-0.5">
                            {loading ? '—' : formatMoney(value, currency)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleExportCsv}
                    disabled={exportingCsv || !report?.transactions?.length}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-black disabled:opacity-50"
                >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                </button>
                <button
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#5845D8] hover:bg-[#4a3ac2] text-white rounded-xl text-xs font-black disabled:opacity-50"
                >
                    {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    Download PDF Report
                </button>
            </div>
            {pdfError && (
                <p className="text-xs font-bold text-red-600">{pdfError}</p>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Transactions</h3>
                </div>
                {loading ? (
                    <div className="p-10 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                    </div>
                ) : !report?.transactions?.length ? (
                    <div className="p-10 text-center text-gray-400 text-sm">No transactions in this period.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Description</th>
                                    <th className="px-5 py-3">Type</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.transactions.map(t => (
                                    <tr key={t.id} className="border-b border-gray-50 last:border-0">
                                        <td className="px-5 py-3 text-gray-500">{new Date(t.created_at || t.createdAt).toLocaleDateString()}</td>
                                        <td className="px-5 py-3 font-semibold text-gray-800">{t.description || '—'}</td>
                                        <td className="px-5 py-3 text-gray-500 capitalize">{(t.type || '').replace(/_/g, ' ')}</td>
                                        <td className="px-5 py-3 text-gray-500 capitalize">{(t.status || '').replace(/_/g, ' ')}</td>
                                        <td className="px-5 py-3 text-right font-black text-gray-900">
                                            {formatMoney(t.displayAmount ?? t.amount, t.displayCurrency || t.currency || currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
