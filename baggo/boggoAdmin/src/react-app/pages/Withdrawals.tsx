import { useEffect, useState } from "react";
import { Search, Filter, CreditCard, User, Calendar, DollarSign, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

// Demo data to replace WithdrawalRequestType and WITHDRAWAL_STATUSES
const DEMO_WITHDRAWAL_STATUSES = ["pending", "approved", "processed", "failed", "cancelled"];

const demoWithdrawals = [
  {
    id: 1,
    user_id: 101,
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    amount: 250.00,
    payment_method: "bank_transfer",
    status: "pending",
    created_at: "2025-01-10T08:00:00Z",
    processed_at: null,
    failure_reason: null,
  },
  {
    id: 2,
    user_id: 102,
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@example.com",
    amount: 500.00,
    payment_method: "paypal",
    status: "processed",
    created_at: "2025-02-15T12:00:00Z",
    processed_at: "2025-02-16T10:00:00Z",
    failure_reason: null,
  },
  {
    id: 3,
    user_id: 103,
    first_name: "Bob",
    last_name: "Johnson",
    email: "bob.johnson@example.com",
    amount: 150.00,
    payment_method: "bank_transfer",
    status: "failed",
    created_at: "2025-03-01T09:00:00Z",
    processed_at: "2025-03-01T10:00:00Z",
    failure_reason: "Insufficient funds",
  },
  {
    id: 4,
    user_id: 104,
    first_name: "Alice",
    last_name: "Brown",
    email: "alice.brown@example.com",
    amount: 300.00,
    payment_method: "crypto",
    status: "approved",
    created_at: "2025-03-10T10:00:00Z",
    processed_at: null,
    failure_reason: null,
  },
];

// Interface for withdrawal requests, adjusted to use demo data
interface WithdrawalRequest {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
  processed_at?: string | null;
  failure_reason?: string | null;
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(demoWithdrawals);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      // Simulate API call with demo data
      setTimeout(() => {
        setWithdrawals(demoWithdrawals);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch =
      withdrawal.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const totalProcessedAmount = withdrawals
    .filter(w => w.status === 'processed')
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
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
            <CheckCircle className="w-4 h-4" />
            <span>Batch Approve</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
            <DollarSign className="w-4 h-4" />
            <span>Process Payments</span>
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
            {DEMO_WITHDRAWAL_STATUSES.map(status => (
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
                        {withdrawal.amount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 capitalize">
                        {withdrawal.payment_method || 'Not specified'}
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
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Approve
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Reject
                          </button>
                        </>
                      )}
                      {withdrawal.status === 'approved' && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Process
                        </button>
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