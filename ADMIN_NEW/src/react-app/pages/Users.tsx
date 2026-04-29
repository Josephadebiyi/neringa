import { useEffect, useState } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Edit,
  X,
  CreditCard,
  Target,
  Ban,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { getUsers, banUser as toggleBan, deleteUser, updateUser } from '../services/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  Address: string;
  dateOfBirth: string;
  createdAt: string;
  banned: boolean;
  escrowBalance: number;
  country?: string;
  signupMethod?: 'email' | 'google' | 'apple';
  signupSource?: 'ios' | 'android' | 'web' | 'app';
  kycStatus?: string;
  kycData?: any;
}

interface UsersResponse {
  data: User[];
  totalCount: number;
  page: number;
  limit: number;
  success: boolean;
  error: boolean;
  message: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'banned'>('active');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data: UsersResponse = await getUsers(currentPage, limit, activeTab === 'banned');
      if (data.success) {
        setUsers(data.data);
        setTotalCount(data.totalCount || data.data.length);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (userId: string, currentBanned: boolean) => {
    setBanningUserId(userId);
    try {
      const res = await toggleBan(userId, !currentBanned);
      if (res.success) fetchUsers();
    } catch (error) {
      console.error('Failed to update ban status:', error);
    } finally {
      setBanningUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await deleteUser(userId);
      if (res.success) fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await updateUser(editingUser._id, editingUser);
      if (res.success) {
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };
  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Source', 'Auth Method', 'KYC Status', 'Joined Date'];
    const csvData = users.map(user => [
      user.firstName || '',
      user.lastName || '',
      user.email || '',
      user.phone || '',
      user.country || '',
      user.signupSource || 'app',
      user.signupMethod || 'email',
      user.kycStatus || 'pending',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bago_users_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
            User Management
          </h1>
          <p className="text-gray-500 font-medium mt-1">Directory of {activeTab} accounts and compliance profiles</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-[#1e2749] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-black transition-all active:scale-95"
        >
          <Download className="w-5 h-5" />
          Export {activeTab} Users
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-2xl w-fit border border-gray-100">
        <button
          onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-[#5240E8] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Active Directory
        </button>
        <button
          onClick={() => { setActiveTab('banned'); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'banned' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-red-400'}`}
        >
          Banned List
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 focus:border-[#5240E8] outline-none shadow-sm transition-all font-medium"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-[#5240E8] animate-spin" />
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Accessing Secure Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Country</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Source</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Auth</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">KYC</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Escrow</th>
                  <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400 font-bold italic">No {activeTab} users found matching your criteria.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border ${user.banned ? 'bg-red-50 text-red-400 border-red-100' : 'bg-gradient-to-br from-[#5240E8]/10 to-[#5240E8]/5 border-[#5240E8]/10 text-[#5240E8]'
                            }`}>
                            {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-[#1e2749] text-sm flex items-center gap-2">
                              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Anonymous User'}
                              {user.signupMethod === 'google' && (
                                <div className="p-1 bg-white border border-gray-100 shadow-sm rounded-lg" title="Signed up with Google">
                                  <Target className="w-3 h-3 text-blue-500 fill-blue-500" />
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-8 uppercase">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${user.signupMethod === 'google' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {user.signupMethod || 'email'}
                        </span>
                      </td>
                      <td className="py-5 px-8">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${user.kycStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                          user.kycStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                          {user.kycStatus === 'approved' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {user.kycStatus || 'pending'}
                        </span>
                      </td>
                      <td className="py-5 px-8">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-xl font-black text-xs border border-slate-100">
                          <CreditCard className="w-3 h-3 opacity-30" />
                          €{(+( user.escrowBalance ?? 0)).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingUser(user); setIsEditModalOpen(true); }}
                            className="p-2 bg-gray-50 text-gray-400 hover:text-[#5240E8] hover:bg-[#5240E8]/5 rounded-xl transition-all"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleBanToggle(user._id, user.banned)}
                            disabled={banningUserId === user._id}
                            className={`p-2 rounded-xl transition-all ${user.banned
                              ? 'bg-green-50 text-green-600 hover:bg-green-100'
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                              }`}
                            title={user.banned ? "Unban" : "Ban"}
                          >
                            {banningUserId === user._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.banned ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="p-2 bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-gray-50/50 px-8 py-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-[#5240E8] disabled:opacity-50 transition-all font-black text-xs uppercase"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-[#5240E8] disabled:opacity-50 transition-all font-black text-xs uppercase"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1e2749]">Edit Profile</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Modify User Attributes</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#5240E8] outline-none transition-all font-bold"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-4 bg-[#5240E8] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#4030C8] shadow-lg shadow-[#5240E8]/20 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
