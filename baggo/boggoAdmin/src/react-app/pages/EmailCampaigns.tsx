import { useEffect, useState } from "react";
import { Mail, Send, Users, UserCheck, Target, Calendar, CheckCircle, Clock, Eye, MousePointer } from "lucide-react";

interface EmailCampaign {
  id: number;
  subject: string;
  content: string;
  target_type: string;
  target_users?: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  status: string;
  sent_at?: string;
  created_at: string;
}

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newCampaign, setNewCampaign] = useState({
    subject: '',
    content: '',
    target_type: 'all_users',
    target_users: [] as number[]
  });

  const [users, setUsers] = useState<Array<{id: number, email: string, first_name: string, last_name: string, user_type: string}>>([]);

  useEffect(() => {
    fetchCampaigns();
    fetchUsers();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign)
      });
      
      if (response.ok) {
        fetchCampaigns();
        setShowCreateModal(false);
        setNewCampaign({ subject: '', content: '', target_type: 'all_users', target_users: [] });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleSendCampaign = async (id: number) => {
    try {
      const response = await fetch(`/api/email-campaigns/${id}/send`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all_users': return <Users className="w-4 h-4" />;
      case 'all_travelers': return <UserCheck className="w-4 h-4" />;
      case 'specific_users': return <Target className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600">Create and send promotional emails to users</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{campaigns.length}</div>
          <div className="text-gray-600 text-sm">Total Campaigns</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {campaigns.reduce((sum, c) => sum + c.sent_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Emails Sent</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {campaigns.reduce((sum, c) => sum + c.delivered_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Delivered</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {campaigns.reduce((sum, c) => sum + c.opened_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Opened</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {campaigns.reduce((sum, c) => sum + c.clicked_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Clicked</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Email Campaigns</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Campaign</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Target</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{campaign.subject}</div>
                        <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {campaign.content.substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getTargetIcon(campaign.target_type)}
                      <span className="text-gray-900">
                        {campaign.target_type === 'specific_users' 
                          ? `${JSON.parse(campaign.target_users || '[]').length} users`
                          : campaign.target_type.replace('_', ' ')
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'sent' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : campaign.status === 'sending' ? (
                        <Clock className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Send className="w-3 h-3 text-gray-400" />
                        <span>{campaign.sent_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span>{campaign.delivered_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-blue-400" />
                        <span>{campaign.opened_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MousePointer className="w-3 h-3 text-purple-400" />
                        <span>{campaign.clicked_count}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Open Rate: {campaign.sent_count > 0 ? Math.round((campaign.opened_count / campaign.sent_count) * 100) : 0}%
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <button 
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Send
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Email Campaign</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    placeholder="Email subject"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                  <textarea
                    placeholder="Email content (HTML supported)"
                    rows={8}
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={newCampaign.target_type}
                    onChange={(e) => setNewCampaign({...newCampaign, target_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all_users">All Users</option>
                    <option value="all_travelers">All Travelers</option>
                    <option value="specific_users">Specific Users</option>
                  </select>
                </div>
                
                {newCampaign.target_type === 'specific_users' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Users</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={newCampaign.target_users.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCampaign({
                                  ...newCampaign, 
                                  target_users: [...newCampaign.target_users, user.id]
                                });
                              } else {
                                setNewCampaign({
                                  ...newCampaign, 
                                  target_users: newCampaign.target_users.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {user.first_name} {user.last_name} ({user.email})
                            <span className="text-xs text-gray-500 ml-1">- {user.user_type}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateCampaign}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
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
