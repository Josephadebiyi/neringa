import { useEffect, useState } from "react";
import { Mail, Send, Users, UserCheck, Target, Calendar, CheckCircle, Clock } from "lucide-react";
import { getAllUsers, sendPromoEmail } from "../services/api";

export default function EmailCampaigns() {
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info' | '', text: string}>({ type: '', text: '' });
  
  const [newCampaign, setNewCampaign] = useState({
    subject: '',
    body: '',
    targetGroup: 'all',
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSendCampaign = async () => {
    if (!newCampaign.subject || !newCampaign.body) {
      setStatusMessage({ type: 'error', text: 'Subject Line and Email Content are required.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage({ type: 'info', text: 'Sending campaign to users... please wait.' });
      
      const result = await sendPromoEmail(newCampaign);
      
      if (result.success) {
        setStatusMessage({ type: 'success', text: `Success! ${result.message}` });
        setNewCampaign({ subject: '', body: '', targetGroup: 'all' });
        setTimeout(() => {
          setShowCreateModal(false);
          setStatusMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setStatusMessage({ type: 'error', text: result.message || 'Failed to send campaign.' });
      }
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'An error occurred while sending.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Promotions</h1>
          <p className="text-gray-600">Send personalized or bulk promotional emails to your community</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-200"
        >
          <Mail className="w-5 h-5" />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Hero / Info Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Engage Your Users</h2>
          <p className="text-indigo-100 mb-6">
            Keep your users updated with the latest news, discounts, and travel updates via beautiful HTML emails.
          </p>
          <div className="flex space-x-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex-1">
              <div className="text-xl font-bold">{users.length}</div>
              <div className="text-indigo-200 text-sm">Targetable Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex-1">
              <div className="text-xl font-bold">100%</div>
              <div className="text-indigo-200 text-sm">Delivery Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for Campaign History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No Sent Promotions Yet</h3>
        <p className="text-slate-500 max-w-sm mx-auto mt-2">
          Your promotion history will appear here once you start sending emails to your users.
        </p>
      </div>

      {/* Create Promotion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Draft New Promotion</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {statusMessage.text && (
                  <div className={`p-4 rounded-xl flex items-center space-x-3 ${
                    statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 
                    statusMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                     statusMessage.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    <span className="font-medium text-sm">{statusMessage.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    placeholder="e.g. Exciting New Discounts on Bago!"
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Body</label>
                  <textarea
                    placeholder="Enter your message content here..."
                    rows={8}
                    value={newCampaign.body}
                    onChange={(e) => setNewCampaign({...newCampaign, body: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none resize-none"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-slate-400">Pro tip: Use clear, engaging language to encourage user interaction.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Group</label>
                  <select
                    value={newCampaign.targetGroup}
                    onChange={(e) => setNewCampaign({...newCampaign, targetGroup: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none appearance-none"
                    disabled={loading}
                  >
                    <option value="all">All Users ({users.length})</option>
                    <option value="verified">Verified Users Only</option>
                    <option value="unverified">Unverified Users Only</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button
                  disabled={loading}
                  onClick={handleSendCampaign}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>{loading ? 'Sending...' : 'Send Promotion'}</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 px-4 rounded-xl font-bold transition-all"
                  disabled={loading}
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

// Additional icons needed
const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
