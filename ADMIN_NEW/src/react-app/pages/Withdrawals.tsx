import { useEffect, useState } from "react";
import { Search, Filter, CreditCard, User, Calendar, DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { approveWithdrawal as approveWithdrawalRequest, getWithdrawals, updateWithdrawalStatus as updateStatus } from "../services/api";

// Interface for withdrawal requests from API
interface WithdrawalRequest {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at?: string | null;
  failure_reason?: string | null;
  description?: string;
  currency?: string;
  provider?: string | null;
  manualReviewRequired?: boolean;
  manualReviewReason?: string | null;
  paypalStatus?: string | null;
  paypalErrorMessage?: string | null;
  paypalDebugId?: string | null;
  payoutDetails?: {
    provider?: string | null;
    method?: string | null;
    status?: string | null;
    currency?: string | null;
    reference?: string | null;
    paypalEmail?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    recipientCode?: string | null;
  };
  source?: string;
}

function payoutSearchText(withdrawal: WithdrawalRequest) {
  const details = withdrawal.payoutDetails || {};
  return [
    withdrawal.provider,
    details.provider,
    details.method,
    details.paypalEmail,
    details.bankName,
    details.bankCode,
    details.accountNumber,
    details.accountName,
    details.recipientCode,
    details.reference,
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasPayoutDestination(withdrawal: WithdrawalRequest) {
  const details = withdrawal.payoutDetails || {};
  return Boolean(
    details.paypalEmail ||
    details.accountNumber ||
    details.recipientCode ||
    details.reference,
  );
}

const PENDING_WITHDRAWAL_STATUSES = new Set(['pending', 'pending_admin_approval', 'approved', 'processing']);
const APPROVABLE_WITHDRAWAL_STATUSES = new Set(['pending', 'pending_admin_approval']);
const COMPLETED_WITHDRAWAL_STATUSES = new Set(['completed', 'processed', 'paid']);
const FAILED_WITHDRAWAL_STATUSES = new Set(['failed', 'rejected', 'cancelled', 'canceled']);

function normalizeStatus(status?: string) {
  return String(status || '').trim().toLowerCase();
}

function isPendingWithdrawal(withdrawal: WithdrawalRequest) {
  return PENDING_WITHDRAWAL_STATUSES.has(normalizeStatus(withdrawal.status));
}

function isApprovableWithdrawal(withdrawal: WithdrawalRequest) {
  return APPROVABLE_WITHDRAWAL_STATUSES.has(normalizeStatus(withdrawal.status));
}

function isCompletedWithdrawal(withdrawal: WithdrawalRequest) {
  return COMPLETED_WITHDRAWAL_STATUSES.has(normalizeStatus(withdrawal.status));
}

function isFailedWithdrawal(withdrawal: WithdrawalRequest) {
  return FAILED_WITHDRAWAL_STATUSES.has(normalizeStatus(withdrawal.status));
}

function matchesStatusFilter(withdrawal: WithdrawalRequest, filter: string) {
  if (filter === 'all') return true;
  if (filter === 'pending') return isPendingWithdrawal(withdrawal);
  if (filter === 'completed') return isCompletedWithdrawal(withdrawal);
  if (filter === 'failed') return isFailedWithdrawal(withdrawal);
  return normalizeStatus(withdrawal.status) === filter;
}

function getStatusLabel(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === 'pending_admin_approval') return 'Pending Review';
  if (normalized === 'processing') return 'Processing';
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'processed') return 'Processed';
  return normalized || 'unknown';
}

function PayoutDetailsBlock({ withdrawal }: { withdrawal: WithdrawalRequest }) {
  const details = withdrawal.payoutDetails || {};
  const rows = [
    ['Provider', details.provider || withdrawal.provider],
    ['Method', details.method],
    ['Status', details.status],
    ['Currency', details.currency || withdrawal.currency],
    ['PayPal email', details.paypalEmail],
    ['Bank name', details.bankName],
    ['Bank code', details.bankCode],
    ['Account number', details.accountNumber],
    ['Account name', details.accountName],
    ['Recipient code', details.recipientCode],
    ['Reference', details.reference],
  ].filter(([, value]) => value);

  if (rows.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
        No payout destination is available. Do not approve until the user adds a payout method.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
      <div className="mb-2 font-bold uppercase tracking-wide text-gray-500">Payout destination</div>
      <div className="grid gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <span className="font-semibold text-gray-500">{label}</span>
            <span className="break-all font-medium text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const result = await getWithdrawals();
      if (result.success && result.data) {
        setWithdrawals(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, failureReason?: string) => {
    setActionError(null);
    try {
      setLoading(true);
      const result = await updateStatus(id, status, failureReason);
      if (result.success) {
        await fetchWithdrawals();
      } else {
        setActionError(result.message || 'Status update failed.');
      }
    } catch (error: any) {
      setActionError(error?.message || 'Status update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaidManually = async (withdrawal: WithdrawalRequest) => {
    if (!confirm(`Mark this ${withdrawal.currency} ${withdrawal.amount} withdrawal as manually paid?\n\nOnly do this if you have already sent the funds to the user outside the app.`)) return;
    setActionError(null);
    try {
      setLoading(true);
      const result = await updateStatus(withdrawal.id, 'completed', 'Manually paid by admin');
      if (result.success) {
        await fetchWithdrawals();
      } else {
        setActionError(result.message || 'Failed to mark as paid.');
      }
    } catch (error: any) {
      setActionError(error?.message || 'Failed to mark as paid.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawal: WithdrawalRequest) => {
    setActionError(null);
    try {
      setLoading(true);
      const needsAdminApproval = normalizeStatus(withdrawal.status) === 'pending_admin_approval';
      const result = needsAdminApproval
        ? await approveWithdrawalRequest(withdrawal.id)
        : await updateStatus(withdrawal.id, 'completed');
      if (result.success) {
        await fetchWithdrawals();
      } else {
        setActionError(result.message || 'Approval failed. Check server logs.');
      }
    } catch (error: any) {
      setActionError(error?.message || 'Approval failed. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    const pending = withdrawals.filter(w => isApprovableWithdrawal(w) && hasPayoutDestination(w));
    if (pending.length === 0) return;
    if (!confirm(`Approve all ${pending.length} pending withdrawal request(s)?`)) return;
    try {
      setBatchLoading(true);
      await Promise.all(pending.map(w => (
        normalizeStatus(w.status) === 'pending_admin_approval'
          ? approveWithdrawalRequest(w.id)
          : updateStatus(w.id, 'completed')
      )));
      await fetchWithdrawals();
    } catch (error) {
      console.error('Batch approve failed:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch =
      withdrawal.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payoutSearchText(withdrawal).includes(searchTerm.toLowerCase());

    const matchesStatus = matchesStatusFilter(withdrawal, statusFilter);

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const normalized = normalizeStatus(status);
    if (PENDING_WITHDRAWAL_STATUSES.has(normalized)) return 'bg-yellow-100 text-yellow-800';
    if (COMPLETED_WITHDRAWAL_STATUSES.has(normalized)) return 'bg-green-100 text-green-800';
    if (FAILED_WITHDRAWAL_STATUSES.has(normalized)) return 'bg-red-100 text-red-800';
    switch (normalized) {
      case 'approved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalized = normalizeStatus(status);
    if (PENDING_WITHDRAWAL_STATUSES.has(normalized)) return <Clock className="w-4 h-4 text-yellow-600" />;
    if (COMPLETED_WITHDRAWAL_STATUSES.has(normalized)) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (FAILED_WITHDRAWAL_STATUSES.has(normalized)) return <XCircle className="w-4 h-4 text-red-600" />;
    switch (normalized) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalPendingAmount = withdrawals
    .filter(isPendingWithdrawal)
    .reduce((sum, w) => sum + w.amount, 0);

  const totalProcessedAmount = withdrawals
    .filter(isCompletedWithdrawal)
    .reduce((sum, w) => sum + w.amount, 0);
  const pendingCount = withdrawals.filter(isPendingWithdrawal).length;
  const completedCount = withdrawals.filter(isCompletedWithdrawal).length;
  const failedCount = withdrawals.filter(isFailedWithdrawal).length;
  const approvablePendingCount = withdrawals.filter(w => isApprovableWithdrawal(w) && hasPayoutDestination(w)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action error banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-500 text-lg">⚠</span>
          <div className="flex-1">
            <p className="text-red-800 font-semibold text-sm">Approval failed</p>
            <p className="text-red-700 text-sm mt-0.5">{actionError}</p>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-600">Manage user withdrawal requests and payments</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleBatchApprove}
            disabled={batchLoading || approvablePendingCount === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            {batchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Batch Approve ({approvablePendingCount})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingCount}
          </div>
          <div className="text-gray-600 text-sm">Pending Requests</div>
          <div className="text-xs text-gray-500 mt-1">
            ${totalPendingAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {withdrawals.filter(w => w.status === 'approved').length}
          </div>
          <div className="text-gray-600 text-sm">Approved</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {completedCount}
          </div>
          <div className="text-gray-600 text-sm">Processed</div>
          <div className="text-xs text-gray-500 mt-1">
            ${totalProcessedAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {failedCount}
          </div>
          <div className="text-gray-600 text-sm">Failed</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by user name, email, or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {['pending', 'completed', 'failed'].map(status => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Withdrawal Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Requested</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Processed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {withdrawal.first_name && withdrawal.last_name
                            ? `${withdrawal.first_name} ${withdrawal.last_name}`
                            : withdrawal.email}
                        </div>
                        <div className="text-gray-500 text-sm">ID: {withdrawal.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-lg font-semibold text-gray-900">
                        {(+(withdrawal.amount ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 text-xs">
                        {withdrawal.description || 'Withdrawal'}
                      </span>
                    </div>
                    {(withdrawal.provider || withdrawal.paypalStatus || withdrawal.manualReviewRequired || withdrawal.paypalErrorMessage) && (
                      <div className="mt-2 space-y-1 text-xs">
                        {withdrawal.provider && (
                          <div className="font-semibold uppercase tracking-wide text-gray-500">
                            Provider: {withdrawal.provider}
                          </div>
                        )}
                        {withdrawal.manualReviewRequired && (
                          <div className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-700">
                            Manual review: {withdrawal.manualReviewReason || 'Provider action required'}
                          </div>
                        )}
                        {withdrawal.paypalStatus && (
                          <div className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">
                            PayPal status: {withdrawal.paypalStatus}
                          </div>
                        )}
                        {withdrawal.paypalErrorMessage && (
                          <div className="rounded bg-red-50 px-2 py-1 font-medium text-red-700">
                            PayPal error: {withdrawal.paypalErrorMessage}
                            {withdrawal.paypalDebugId ? ` (${withdrawal.paypalDebugId})` : ''}
                          </div>
                        )}
                      </div>
                    )}
                    <PayoutDetailsBlock withdrawal={withdrawal} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(withdrawal.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(withdrawal.status)}`}>
                        {getStatusLabel(withdrawal.status)}
                      </span>
                    </div>
                    {withdrawal.failure_reason && (
                      <div className="text-xs text-red-600 mt-1">
                        {withdrawal.failure_reason}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(withdrawal.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(withdrawal.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {withdrawal.processed_at ? (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(withdrawal.processed_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(withdrawal.processed_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not processed</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {isApprovableWithdrawal(withdrawal) && (
                        <>
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal)}
                            disabled={!hasPayoutDestination(withdrawal)}
                            title={!hasPayoutDestination(withdrawal) ? 'Payout destination is missing' : 'Approve — send via PayPal/Paystack'}
                            className="text-green-600 hover:text-green-800 text-sm font-medium disabled:cursor-not-allowed disabled:text-gray-300"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleMarkPaidManually(withdrawal)}
                            title="Mark as paid manually (already sent outside the app)"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection?');
                              if (reason) handleUpdateStatus(withdrawal.id, 'rejected', reason);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredWithdrawals.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No withdrawal requests found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
