import { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Mail,
  XCircle,
  Loader2,
  AlertCircle,
  Lock,
  RefreshCcw
} from "lucide-react";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../services/api";

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  userName: string;
  role: "SUPER_ADMIN" | "SAFETY_ADMIN" | "SUPPORT_ADMIN";
  isActive: boolean;
  createdAt: string;
}
const ROLES = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    icon: ShieldCheck,
    color: 'red',
    desc: 'Full system access and staff management'
  },
  {
    id: 'SAFETY_ADMIN',
    name: 'Safety Admin',
    icon: ShieldAlert,
    color: 'orange',
    desc: 'Compliance, KYC, and dispute resolution'
  },
  {
    id: 'SUPPORT_ADMIN',
    name: 'Support Admin',
    icon: Shield,
    color: 'blue',
    desc: 'User queries and shipment tracking'
  }
];

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userName: '',
    password: '',
    role: 'SUPPORT_ADMIN' as StaffMember['role']
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const resetForm = () => {
    setFormData({ fullName: '', email: '', userName: '', password: '', role: 'SUPPORT_ADMIN' });
    setEditingStaff(null);
    setShowModal(false);
    setError(null);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaff();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      fullName: member.fullName,
      email: member.email,
      userName: member.userName,
      password: '',
      role: member.role
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let data;
      if (editingStaff) {
        data = await updateStaff(editingStaff._id, formData);
      } else {
        data = await createStaff(formData);
      }

      if (data.success) {
        fetchStaff();
        resetForm();
      } else {
        setError(data.message || `Failed to ${editingStaff ? 'update' : 'create'} staff member`);
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const data = await deleteStaff(id);
      if (data.success) fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const filteredStaff = staff.filter(member =>
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
            Team Hierarchy
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage administrative access and role-based permissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#5240E8] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#5240E8]/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Provision Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map((role) => (
          <div key={role.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${role.color}-50 text-${role.color}-500`}>
                <role.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-[#1e2749]">{role.name}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {staff.filter(s => s.role === role.id).length} Active
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{role.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-50 bg-gray-50/10 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none text-sm font-medium transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-[#5240E8] animate-spin" />
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Synchronizing Permissions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Identity</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Auth Level</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Added</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStaff.map((member) => {
                  const roleInfo = ROLES.find(r => r.id === member.role);
                  return (
                    <tr key={member._id} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm bg-gradient-to-br ${member.role === 'SUPER_ADMIN' ? 'from-red-500 to-red-600' :
                            member.role === 'SAFETY_ADMIN' ? 'from-orange-400 to-orange-500' :
                              'from-[#5240E8] to-[#6366F1]'
                            }`}>
                            {member.fullName[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#1e2749] text-sm">{member.fullName}</div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                              <Mail className="w-3 h-3" /> {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-2">
                          {roleInfo && <roleInfo.icon className={`w-3 h-3 text-${roleInfo.color}-500`} />}
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${member.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-600' :
                            member.role === 'SAFETY_ADMIN' ? 'bg-orange-50 text-orange-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                            {member.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${member.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {member.isActive ? 'Operational' : 'Deactivated'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-8">
                        <span className="text-xs font-bold text-gray-400">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Staff"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(member._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Staff"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#1e2749]">
                    {editingStaff ? 'Edit Staff Member' : 'Provision Team'}
                  </h3>
                  <p className="text-gray-500 text-sm">Fill in the details below</p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 font-bold transition-all text-sm"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">Username</label>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={e => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 font-bold transition-all text-sm"
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 font-bold transition-all text-sm"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">Password {editingStaff && '(Optional)'}</label>
                  <div className="relative">
                    <input
                      type="password"
                      required={!editingStaff}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 font-bold transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2">System Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as StaffMember['role'] })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 font-bold transition-all text-sm appearance-none"
                  >
                    <option value="SUPPORT_ADMIN">Support Admin</option>
                    <option value="SAFETY_ADMIN">Safety Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] px-8 py-4 bg-[#5240E8] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5240E8]/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCcw className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : (
                      editingStaff ? 'Update Member' : 'Provision Member'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
