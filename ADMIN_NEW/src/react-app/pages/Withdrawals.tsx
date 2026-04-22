import { useEffect, useState } from "react";
import { Search, Filter, CreditCard, User, Calendar, DollarSign, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { getWithdrawals, updateWithdrawalStatus as updateStatus } from "../services/api";

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
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    try {
      setLoading(true);
      const result = await updateStatus(id, status, failureReason);
      if (result.success) {
        await fetchWithdrawals();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    const pending = withdrawals.filter(w => w.status === 'pending');
    if (pending.length === 0) return;
    if (!confirm(`Approve all ${pending.length} pending withdrawal request(s)?`)) return;
    try {
      setBatchLoading(true);
      await Promise.all(pending.map(w => updateStatus(w.id, 'completed')));
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
      withdrawal.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalProcessedAmount = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-600">Manage user withdrawal requests and payments</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleBatchApprove}
            disabled={batchLoading || withdrawals.filter(w => w.status === 'pending').length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            {batchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Batch Approve ({withdrawals.filter(w => w.status === 'pending').length})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {withdrawals.filter(w => w.status === 'pending').length}
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
            {withdrawals.filter(w => w.status === 'processed').length}
          </div>
          <div className="text-gray-600 text-sm">Processed</div>
          <div className="text-xs text-gray-500 mt-1">
            ${totalProcessedAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {withdrawals.filter(w => w.status === 'failed').length}
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
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(withdrawal.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
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
                      {withdrawal.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(withdrawal.id, 'completed')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection?');
                              if (reason) handleUpdateStatus(withdrawal.id, 'failed', reason);
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