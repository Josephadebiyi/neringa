import { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  RefreshCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { getFlaggedUsers, unflagUserById, banUserWithDevice, flagUserById, getFlaggedChats, getFlaggedConversation, unlockFlaggedConversation } from '../services/api';

interface FlaggedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  banned: boolean;
  isFlagged: boolean;
  flagReason?: string;
  flagSource?: string;
  flaggedAt?: string;
  kycStatus?: string;
  verifiedFullLegalName?: string;
  verifiedDateOfBirth?: string;
  deviceFingerprint?: string;
  profileImage?: string;
  createdAt: string;
}

interface FlaggedChat {
  id: string;
  conversationId: string;
  requestId?: string;
  senderName: string;
  senderEmail: string;
  messageContent: string;
  reasonCode: string;
  reason?: string;
  confidence?: number;
  classifierProvider?: string;
  enforcementAction: 'warning' | 'chat_locked';
  chatLocked: boolean;
  trackingNumber?: string;
  createdAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  duplicate_name_kyc: 'Duplicate name (KYC)',
  duplicate_name_db: 'Duplicate name (DB)',
  banned_device: 'Banned device',
  admin: 'Manual (admin)',
  admin_ban: 'Admin ban',
};

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  blocked_duplicate: { label: 'Blocked (duplicate)', cls: 'bg-red-100 text-red-700' },
  not_started: { label: 'Not started', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
};

export default function FlaggedUsers() {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<FlaggedUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [flaggedChats, setFlaggedChats] = useState<FlaggedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [unlockingChat, setUnlockingChat] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const [data, chatData] = await Promise.all([
        getFlaggedUsers(p),
        getFlaggedChats(1, 50),
      ]);
      setUsers(data.data || []);
      setFlaggedChats(chatData.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(page); }, [page]);

  const handleAllow = async (user: FlaggedUser) => {
    if (!confirm(`Allow ${user.firstName} ${user.lastName} — this will clear the flag and restore KYC if blocked?`)) return;
    setActionLoading(user.id + '_allow');
    try {
      await unflagUserById(user.id);
      await load(page);
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanWithDevice = async () => {
    if (!selected) return;
    setActionLoading(selected.id + '_ban');
    try {
      await banUserWithDevice(selected.id, banReason || 'Admin ban');
      setShowBanModal(false);
      setBanReason('');
      setSelected(null);
      await load(page);
    } catch (e: any) {
      alert(e.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const openBanModal = (user: FlaggedUser) => {
    setSelected(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const kycBadge = (status?: string) => {
    const key = (status || '').toLowerCase();
    const b = KYC_BADGE[key] || { label: status || '—', cls: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.cls}`}>{b.label}</span>;
  };

  const openFlaggedChat = async (conversationId: string) => {
    setChatLoading(true);
    try {
      setSelectedChat(await getFlaggedConversation(conversationId));
    } catch (e: any) {
      alert(e.message || 'Could not load the flagged conversation');
    } finally {
      setChatLoading(false);
    }
  };

  const handleUnlockChat = async () => {
    const conversationId = selectedChat?.conversation?.id;
    if (!conversationId) return;
    const note = window.prompt('Why are you unlocking this chat? This note is kept in the audit record.');
    if (!note?.trim()) return;
    setUnlockingChat(true);
    try {
      await unlockFlaggedConversation(conversationId, note.trim());
      setSelectedChat(await getFlaggedConversation(conversationId));
      const chatData = await getFlaggedChats(1, 50);
      setFlaggedChats(chatData.data || []);
    } catch (e: any) {
      alert(e.message || 'Could not unlock the chat');
    } finally {
      setUnlockingChat(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Flagged Users
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} user{total !== 1 ? 's' : ''} flagged or banned</p>
        </div>
        <button onClick={() => load(page)} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium">No flagged users</p>
          <p className="text-sm mt-1">All clear — no users are currently flagged or banned.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Flag</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">KYC</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Device</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                      <div className="text-gray-500 text-xs">{u.email}</div>
                      {u.verifiedFullLegalName && u.verifiedFullLegalName !== `${u.firstName} ${u.lastName}` && (
                        <div className="text-xs text-blue-600 mt-0.5">KYC: {u.verifiedFullLegalName}</div>
                      )}
                      <div className="text-xs text-gray-400">{u.country}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isFlagged && (
                        <div className="flex items-start gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-amber-700">{SOURCE_LABELS[u.flagSource || ''] || u.flagSource || 'Flagged'}</div>
                            {u.flagReason && <div className="text-xs text-gray-500 mt-0.5">{u.flagReason}</div>}
                            {u.flaggedAt && <div className="text-xs text-gray-400">{new Date(u.flaggedAt).toLocaleDateString()}</div>}
                          </div>
                        </div>
                      )}
                      {!u.isFlagged && u.banned && (
                        <span className="text-xs text-red-600 font-medium">Banned (not flagged)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{kycBadge(u.kycStatus)}</td>
                    <td className="px-4 py-3">
                      {u.deviceFingerprint ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span className="font-mono">{u.deviceFingerprint.slice(0, 12)}…</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.banned ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Banned</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Flagged</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!u.banned && (
                          <button
                            onClick={() => handleAllow(u)}
                            disabled={actionLoading === u.id + '_allow'}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50"
                          >
                            {actionLoading === u.id + '_allow' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                            Allow
                          </button>
                        )}
                        {!u.banned && (
                          <button
                            onClick={() => openBanModal(u)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100"
                          >
                            <Ban className="w-3 h-3" />
                            Ban + Block Device
                          </button>
                        )}
                        {u.banned && (
                          <button
                            onClick={() => handleAllow(u)}
                            disabled={actionLoading === u.id + '_allow'}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 border rounded-lg text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
                          >
                            {actionLoading === u.id + '_allow' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                            Unban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Flagged shipment chats
          </h2>
          <p className="text-sm text-gray-500">Messages blocked for attempted off-platform business, with the AI/rule reason and enforcement action.</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">User / Order</th>
                <th className="px-4 py-3 text-left">Flagged message</th>
                <th className="px-4 py-3 text-left">Why flagged</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flaggedChats.map(chat => (
                <tr key={chat.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{chat.senderName || 'User'}</div>
                    <div className="text-xs text-gray-500">{chat.senderEmail}</div>
                    <div className="text-xs text-indigo-600">{chat.trackingNumber || chat.requestId || 'No order'}</div>
                  </td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="line-clamp-3 text-gray-800">{chat.messageContent}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(chat.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-amber-700">{chat.reasonCode.replaceAll('_', ' ')}</div>
                    <div className="text-xs text-gray-500">{chat.reason}</div>
                    <div className="text-xs text-gray-400">{chat.classifierProvider}{chat.confidence != null ? ` · ${Math.round(Number(chat.confidence) * 100)}%` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${chat.enforcementAction === 'chat_locked' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {chat.enforcementAction === 'chat_locked' ? 'Chat locked' : 'Warning'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openFlaggedChat(chat.conversationId)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-gray-50">
                      View full chat
                    </button>
                  </td>
                </tr>
              ))}
              {!flaggedChats.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No shipment chats have been flagged.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(chatLoading || selectedChat) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Flagged conversation</h2>
                <p className="text-xs text-gray-500">Includes blocked attempts, warnings, and surrounding messages.</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedChat?.conversation?.chatLocked && (
                  <button
                    onClick={handleUnlockChat}
                    disabled={unlockingChat}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {unlockingChat ? 'Unlocking…' : 'Unlock chat'}
                  </button>
                )}
                {!selectedChat?.conversation?.chatLocked && selectedChat?.conversation && (
                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Chat unlocked</span>
                )}
                <button onClick={() => setSelectedChat(null)} className="text-gray-500">Close</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              {chatLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> :
                (selectedChat?.messages || []).map((message: any) => (
                  <div key={message.id} className={`rounded-lg p-3 border ${message.metadata?.policyFlagged ? 'bg-red-50 border-red-200' : message.metadata?.policyNotice ? 'bg-amber-50 border-amber-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="font-semibold">{message.sender_name || message.sender_id || 'System'}</span>
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.metadata?.policyFlagged && <p className="text-xs font-bold text-red-600 mt-2">Blocked: {message.metadata.policyReasonCode}</p>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Ban + Block Device modal */}
      {showBanModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Ban + Block Device</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will ban <strong>{selected.firstName} {selected.lastName}</strong> and block their device fingerprint so new registrations from this device are automatically rejected.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3}
              placeholder="e.g. Duplicate account — evading ban"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
            />
            {!selected.deviceFingerprint && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                No device fingerprint stored for this user — device blocking will not apply.
              </p>
            )}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setShowBanModal(false); setSelected(null); }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBanWithDevice}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
