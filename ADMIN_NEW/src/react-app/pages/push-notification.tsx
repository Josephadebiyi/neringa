"use client";
import { useState, useEffect } from "react";
import {
  Bell,
  Loader2,
  X,
  Send,
  History,
  Users,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Layers
} from "lucide-react";

import { sendPushNotification, getPushHistory } from "../services/api";

interface Notification {
  title: string;
  body: string;
  sentAt: string;
  recipientCount: number;
  status: 'SUCCESS' | 'FAILED';
}

interface PushHistoryItem {
  id?: number;
  title: string;
  message?: string;
  body?: string;
  sent_count?: number;
  status?: string;
  sent_at?: string;
  created_at?: string;
}

export default function PushNotificationPage() {
  const [history, setHistory] = useState<Notification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  useEffect(() => {
    getPushHistory().then((result) => {
      const raw: PushHistoryItem[] = result?.data || result?.notifications || (Array.isArray(result) ? result : []);
      if (raw.length > 0) {
        setHistory(raw.map((item) => ({
          title: item.title,
          body: item.message || item.body || '',
          sentAt: item.sent_at || item.created_at || new Date().toISOString(),
          recipientCount: item.sent_count || 0,
          status: item.status === 'failed' ? 'FAILED' : 'SUCCESS',
        })));
      }
    }).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    try {
      setLoading(true);
      const data = await sendPushNotification(form);
      setHistory(prev => [{
        ...form,
        sentAt: new Date().toISOString(),
        recipientCount: data.recipientCount || data.count || 0,
        status: 'SUCCESS'
      }, ...prev]);
      setShowModal(false);
      setForm({ title: "", body: "" });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalReach = history.reduce((sum, n) => sum + n.recipientCount, 0);
  const successCount = history.filter(n => n.status === 'SUCCESS').length;
  const deliveryRate = history.length > 0 ? Math.round((successCount / history.length) * 100) : 0;

  const stats = [
    { label: 'Total Reach', value: totalReach.toLocaleString(), sub: 'Recipients Notified', colorClass: 'bg-blue-50 text-blue-600', icon: Smartphone },
    { label: 'Delivery Rate', value: `${deliveryRate}%`, sub: 'Successful Sends', colorClass: 'bg-green-50 text-green-600', icon: CheckCircle2 },
    { label: 'Total Sent', value: history.length.toString(), sub: 'All Time', colorClass: 'bg-purple-50 text-purple-600', icon: Layers },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
            Broadcast Hub
          </h1>
          <p className="text-gray-500 font-medium mt-1">Deploy real-time engagement protocols to all active endpoints</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1e2749] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all active:scale-95"
        >
          <Send className="w-5 h-5" />
          Initiate Broadcast
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.colorClass}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
            </div>
            <h3 className="text-3xl font-black text-[#1e2749]">{stat.value}</h3>
            <p className="text-xs font-bold text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* History Log */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-[#5240E8]" />
            <h2 className="font-black text-[#1e2749] text-sm uppercase tracking-widest">Transmission Logs</h2>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-200" />
            </div>
            <p className="font-bold text-[#1e2749]">Registry Empty</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">No notification events have been logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/30">
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Content Pipeline</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Reach</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((n, i) => (
                  <tr key={i} className="group hover:bg-gray-50/30 transition-colors">
                    <td className="py-5 px-8">
                      <div>
                        <div className="font-bold text-[#1e2749] text-sm">{n.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{n.body}</div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl w-fit">
                        <Users className="w-3.5 h-3.5" />
                        {n.recipientCount} Recipients
                      </div>
                    </td>
                    <td className="py-5 px-8 text-xs font-bold text-gray-400">
                      {new Date(n.sentAt).toLocaleString()}
                    </td>
                    <td className="py-5 px-8">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {n.status === 'SUCCESS' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <button className="p-2 text-gray-400 hover:text-[#5240E8] transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-[#1e2749]">New Broadcast</h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Deploy global push notification</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-2xl shadow-sm transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Engagement Title</label>
                <input
                  type="text"
                  placeholder="e.g. New Route Available!"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Payload Content</label>
                <textarea
                  placeholder="Draft your message..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 outline-none font-bold text-sm min-h-[140px] resize-none"
                />
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                  Warning: This action will trigger instant delivery to all active device tokens. Verify content integrity before finalizing deployment.
                </p>
              </div>

              <button
                onClick={handleSend}
                disabled={loading || !form.title.trim() || !form.body.trim()}
                className="w-full bg-[#5240E8] text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#5240E8]/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? "Transmitting..." : "Initialize Transmission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
