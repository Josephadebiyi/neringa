import { useEffect, useState } from "react";
import { Search, UserPlus, Edit, Trash2 } from "lucide-react";

interface StaffMember {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  { id: 'admin', name: 'Administrator', permissions: ['all'] },
  { id: 'manager', name: 'Manager', permissions: ['users', 'items', 'support', 'analytics'] },
  { id: 'support', name: 'Support Agent', permissions: ['support', 'tickets'] },
  { id: 'moderator', name: 'Moderator', permissions: ['users', 'items'] }
];

const AVAILABLE_PERMISSIONS = [
  'users', 'items', 'support', 'analytics', 'staff', 'settings', 'notifications', 'emails'
];

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  
  const [newStaff, setNewStaff] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'support',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });
      
      if (response.ok) {
        fetchStaff();
        setShowAddModal(false);
        setNewStaff({ email: '', first_name: '', last_name: '', role: 'support', permissions: [] });
      }
    } catch (error) {
      console.error('Failed to create staff:', error);
    }
  };

  

  const handleDeleteStaff = async (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchStaff();
        }
      } catch (error) {
        console.error('Failed to delete staff:', error);
      }
    }
  };

  const filteredStaff = staff.filter(member =>
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'moderator': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage team members and their permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
          <div className="text-gray-600 text-sm">Total Staff</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {staff.filter(s => s.role === 'admin').length}
          </div>
          <div className="text-gray-600 text-sm">Administrators</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {staff.filter(s => s.role === 'manager').length}
          </div>
          <div className="text-gray-600 text-sm">Managers</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {staff.filter(s => s.is_active).length}
          </div>
          <div className="text-gray-600 text-sm">Active Members</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Staff Member</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Permissions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Added</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-gray-500 text-sm">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.slice(0, 3).map(permission => (
                        <span key={permission} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {permission}
                        </span>
                      ))}
                      {member.permissions.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{member.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.is_active 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => console.log('Edit staff member:', member.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Staff Member</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={newStaff.first_name}
                    onChange={(e) => setNewStaff({...newStaff, first_name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={newStaff.last_name}
                    onChange={(e) => setNewStaff({...newStaff, last_name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <input
                  type="email"
                  placeholder="Email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ROLES.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.map(permission => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newStaff.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStaff({...newStaff, permissions: [...newStaff.permissions, permission]});
                            } else {
                              setNewStaff({...newStaff, permissions: newStaff.permissions.filter(p => p !== permission)});
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateStaff}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Create Staff Member
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
