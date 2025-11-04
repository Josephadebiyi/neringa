import { useEffect, useState } from "react";
import { Send, Bell, Users, UserCheck, Target, Calendar, CheckCircle, Clock } from "lucide-react";

interface PushNotification {
  id: number;
  title: string;
  message: string;
  target_type: string;
  target_users?: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  status: string;
  sent_at?: string;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    target_type: 'all',
    target_users: [] as number[]
  });

  const [users, setUsers] = useState<Array<{id: number, email: string, first_name: string, last_name: string}>>([]);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/push-notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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

  const handleSendNotification = async () => {
    try {
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
      
      if (response.ok) {
        fetchNotifications();
        setShowSendModal(false);
        setNewNotification({ title: '', message: '', target_type: 'all', target_users: [] });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all': return <Users className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'travelers': return <UserCheck className="w-4 h-4" />;
      case 'specific': return <Target className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600">Send notifications to app users</p>
        </div>
        <button 
          onClick={() => setShowSendModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Send Notification</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
          <div className="text-gray-600 text-sm">Total Sent</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {notifications.reduce((sum, n) => sum + n.sent_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Recipients</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {notifications.reduce((sum, n) => sum + n.delivered_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Delivered</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {notifications.reduce((sum, n) => sum + n.opened_count, 0)}
          </div>
          <div className="text-gray-600 text-sm">Opened</div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Notification</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Target</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{notification.title}</div>
                        <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getTargetIcon(notification.target_type)}
                      <span className="text-gray-900 capitalize">
                        {notification.target_type === 'specific' 
                          ? `${JSON.parse(notification.target_users || '[]').length} users`
                          : notification.target_type
                        }
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {notification.status === 'sent' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        Sent: {notification.sent_count} | Delivered: {notification.delivered_count}
                      </div>
                      <div className="text-sm text-gray-600">
                        Opened: {notification.opened_count} ({notification.sent_count > 0 ? Math.round((notification.opened_count / notification.sent_count) * 100) : 0}%)
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {notification.sent_at 
                          ? new Date(notification.sent_at).toLocaleDateString()
                          : 'Not sent'
                        }
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Push Notification</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Notification title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    placeholder="Notification message"
                    rows={3}
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                  <select
                    value={newNotification.target_type}
                    onChange={(e) => setNewNotification({...newNotification, target_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="users">Regular Users Only</option>
                    <option value="travelers">Travelers Only</option>
                    <option value="specific">Specific Users</option>
                  </select>
                </div>
                
                {newNotification.target_type === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Users</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {users.map(user => (
                        <label key={user.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={newNotification.target_users.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewNotification({
                                  ...newNotification, 
                                  target_users: [...newNotification.target_users, user.id]
                                });
                              } else {
                                setNewNotification({
                                  ...newNotification, 
                                  target_users: newNotification.target_users.filter(id => id !== user.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {user.first_name} {user.last_name} ({user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSendNotification}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Notification</span>
                </button>
                <button
                  onClick={() => setShowSendModal(false)}
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
