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
  Check,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from '../config/api';

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

const API_BASE = `${API_BASE_URL}/staff`;

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        fetchStaff();
        setShowModal(false);
        setFormData({ fullName: '', email: '', userName: '', password: '', role: 'SUPPORT_ADMIN' });
      } else {
        setError(data.message || 'Failed to create staff member');
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
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) fetchStaff();
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
      {/* Header */}
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

      {/* Role Cards Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map((role) => (
          <div key={role.id} className="premium-card p-6 border-b-4" style={{ borderBottomColor: `var(--${role.color}-500)` }}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${role.color}-50 text-${role.color}-600`}>
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

      {/* Main Table Area */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none text-sm font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-[#5240E8] animate-spin" />
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Synchronizing Permissions...</p>
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
                          <button className="p-2 text-gray-400 hover:text-[#5240E8] transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member._id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Provision Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-[#1e2749]">Provision Team</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Assign secure administrative credentials</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-2xl shadow-sm transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Secure Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Administrative Role</label>
                  <div className="grid grid-cols-1 gap-2">
                    {ROLES.map(role => (
                      <div
                        key={role.id}
                        onClick={() => setFormData({ ...formData, role: role.id as StaffMember['role'] })}
                        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex items-center justify-between ${formData.role === role.id
                          ? 'border-[#5240E8] bg-[#5240E8]/5'
                          : 'border-gray-50 bg-gray-50 hover:border-gray-100'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl bg-white shadow-sm text-${role.color}-600`}>
                            <role.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={`font-black text-sm ${formData.role === role.id ? 'text-[#5240E8]' : 'text-[#1e2749]'}`}>{role.name}</p>
                            <p className="text-[10px] font-medium text-gray-400">{role.desc}</p>
                          </div>
                        </div>
                        {formData.role === role.id && <Check className="w-5 h-5 text-[#5240E8]" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-bold">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] bg-[#5240E8] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#5240E8]/30 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Finalize Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
