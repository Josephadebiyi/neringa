import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Package, Clock, CheckCircle, RefreshCw, X,
    MessageSquare, User, Camera, ShieldCheck, AlertTriangle,
    ZoomIn, MapPin, ArrowRight, Truck,
} from 'lucide-react';

const asArray = (v) => Array.isArray(v) ? v : [];
const rid = (r) => r?._id || r?.id || r?.requestId;
const pkg = (r) => r?.package || r?.packageDetails || {};
const imgFor = (r) => {
    const p = pkg(r);
    return r?.image || r?.imageUrl || p.image || p.imageUrl || p.image_url || '';
};
const fv = (obj, paths, fb = '') => {
    for (const p of paths) {
        const v = p.split('.').reduce((o, k) => o?.[k], obj);
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    }
    return fb;
};

const STATUS_UPDATE_OPTIONS = [
    {
        value: 'intransit',
        label: 'In Transit',
        description: 'The shipment has been picked up and is moving to the destination.',
        icon: Clock,
    },
    {
        value: 'delivered',
        label: 'Delivered to Recipient',
        description: 'The item has reached the receiver. The sender must still confirm before funds are released.',
        icon: CheckCircle,
    },
];

export default function Deliveries({ onNavigateToChat }) {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(null);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [detailsViewed, setDetailsViewed] = useState({});
    const [statusNote, setStatusNote] = useState('');
    const [statusLocation, setStatusLocation] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState([false, false, false]);
    const [toast, setToast] = useState({ show: false, msg: '', ok: true });

    useEffect(() => { fetchDeliveries(); }, []);
    useEffect(() => { setAcceptedTerms([false, false, false]); }, [viewingDetails]);
    useEffect(() => {
        if (!toast.show) return;
        const t = setTimeout(() => setToast(s => ({ ...s, show: false })), 4000);
        return () => clearTimeout(t);
    }, [toast.show]);

    const notify = (msg, ok = true) => setToast({ show: true, msg, ok });

    const resetStatusModal = () => {
        setUpdatingStatus(null);
        setSelectedStatus('');
        setStatusNote('');
        setStatusLocation('');
        setProofImage(null);
    };

    const openStatusModal = (req) => {
        const status = String(req?.status || '').toLowerCase();
        setUpdatingStatus(req);
        setSelectedStatus(status === 'intransit' ? 'delivered' : 'intransit');
        setStatusNote('');
        setStatusLocation('');
        setProofImage(null);
    };

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            // Use the dedicated traveler endpoint for incoming requests
            const [incomingRes, recentRes] = await Promise.all([
                api.get('/api/bago/incoming-requests').catch(() => ({ data: {} })),
                api.get('/api/bago/recentOrder').catch(() => ({ data: {} })),
            ]);
            const incoming = asArray(incomingRes.data?.data || incomingRes.data?.requests || []);
            const recent   = asArray(recentRes.data?.data || []).filter(d => d?.role === 'traveler');
            // Merge, deduplicate by id — incoming takes priority (more fields)
            const seen = new Set();
            const merged = [...incoming, ...recent].filter(r => {
                const id = rid(r);
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            });
            setDeliveries(merged);
        } catch {
            notify('Could not load deliveries. Please refresh.', false);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId, status) => {
        if (!requestId) return;
        setIsSubmitting(true);
        try {
            await api.put(`/api/bago/updateRequestStatus/${requestId}`, {
                status, location: statusLocation, notes: statusNote,
            });
            if (proofImage && (status === 'delivered' || status === 'intransit')) {
                await api.put(`/api/bago/request/${requestId}/traveler-proof`, { image: proofImage });
            }
            notify(status === 'delivered'
                ? 'Sender notified. Funds stay in escrow until they confirm receipt.'
                : 'Status updated.');
            resetStatusModal();
            fetchDeliveries();
        } catch {
            notify('Failed to update status. Please try again.', false);
        } finally { setIsSubmitting(false); }
    };

    const handleAcceptPending = (req) => {
        const id = rid(req);
        if (!id) return;
        if (!detailsViewed[id]) { setViewingDetails(req); return; }
        handleUpdateStatus(id, 'accepted');
    };

    const handleRaiseDispute = async (requestId, reason) => {
        setIsSubmitting(true);
        try {
            await api.post(`/api/bago/request/${requestId}/raise-dispute`, { reason, raisedBy: 'traveler' });
            notify('Issue reported. Bago support will contact you shortly.');
            setSelectedDispute(null);
        } catch { notify('Failed to report issue.', false); }
        finally { setIsSubmitting(false); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProofImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const statusColor = (s) => {
        switch ((s || '').toLowerCase()) {
            case 'completed':  return 'text-green-600 bg-green-50';
            case 'delivering': return 'text-amber-600 bg-amber-50';
            case 'pending':    return 'text-amber-600 bg-amber-50';
            case 'intransit':  return 'text-blue-600 bg-blue-50';
            case 'accepted':   return 'text-indigo-600 bg-indigo-50';
            case 'rejected':   return 'text-red-600 bg-red-50';
            default:           return 'text-gray-600 bg-gray-50';
        }
    };

    const statusLabel = (s) => {
        switch ((s || '').toLowerCase()) {
            case 'accepted': return 'Accepted';
            case 'intransit': return 'In Transit';
            case 'delivering': return 'Delivered — Awaiting Sender';
            case 'completed': return 'Completed';
            case 'rejected': return 'Rejected';
            case 'cancelled':
            case 'canceled': return 'Cancelled';
            default: return 'Processing';
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <RefreshCw className="animate-spin text-[#5845D8]" size={40} />
        </div>
    );

    return (
        <div className="space-y-6 font-sans">
            <div className="mb-8 px-1">
                <h2 className="text-lg font-black text-[#111827] tracking-tight uppercase">My Deliveries</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">
                    Packages you are carrying — accept requests and update delivery status
                </p>
            </div>

            {deliveries.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Package size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#111827] mb-1.5 uppercase tracking-tight">No delivery requests yet</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto font-bold uppercase tracking-wider opacity-60 leading-relaxed">
                        When senders match their package to your trip, requests will appear here for you to accept or reject.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((req, index) => {
                        const id = rid(req);
                        const p = pkg(req);
                        const status = (req.status || '').toLowerCase();
                        const isPending = status === 'pending';
                        return (
                            <div key={id || index} className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-5 items-center group hover:border-[#5845D8]/20 transition-all">
                                <div
                                    onClick={() => { setViewingDetails(req); setAcceptedTerms([false, false, false]); }}
                                    className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-[#5845D8] flex-shrink-0 cursor-zoom-in border border-gray-100 shadow-sm"
                                >
                                    {imgFor(req) ? (
                                        <img src={imgFor(req)} className="w-full h-full object-cover" alt="Item" />
                                    ) : (
                                        <Package size={22} />
                                    )}
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5 cursor-pointer"
                                        onClick={() => setViewingDetails(req)}>
                                        <span className="text-xs font-black text-[#111827] uppercase tracking-tight">
                                            {req.originCity || p.fromCity || '—'}
                                        </span>
                                        <ArrowRight size={12} className="text-gray-300" />
                                        <span className="text-xs font-black text-[#111827] uppercase tracking-tight">
                                            {req.destinationCity || p.toCity || '—'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                            <Clock size={10} className="text-[#5845D8]" />
                                            <span className="text-[9px] font-black text-[#111827] uppercase tracking-widest">
                                                {req.trackingNumber || 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50/50 rounded-lg border border-indigo-100/50 shadow-sm">
                                            <User size={10} className="text-[#5845D8]" />
                                            <span className="text-[9px] font-black text-[#111827]/70 uppercase tracking-widest">
                                                Sender: {req.senderName || req.sender?.firstName || '—'}
                                            </span>
                                        </div>
                                        {p.packageWeight ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                                <span className="text-[9px] font-black text-[#111827]/60 uppercase tracking-widest">
                                                    {p.packageWeight} KG
                                                </span>
                                            </div>
                                        ) : null}
                                        {status === 'accepted' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 shadow-sm">
                                                <ShieldCheck size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Escrow Active</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center md:items-end gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${statusColor(req.status)}`}>
                                        {isPending ? 'Awaiting Your Response' : statusLabel(req.status)}
                                    </span>
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        {isPending ? (
                                            <>
                                                <button
                                                    onClick={() => { setViewingDetails(req); setAcceptedTerms([false, false, false]); }}
                                                    className="flex items-center gap-1.5 bg-gray-100 text-[#111827] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-sm"
                                                >
                                                    <Package size={13} /> Inspect
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptPending(req)}
                                                    disabled={isSubmitting}
                                                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md shadow-green-500/10"
                                                >
                                                    <CheckCircle size={13} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(id, 'rejected')}
                                                    disabled={isSubmitting}
                                                    className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-500/10"
                                                >
                                                    <X size={13} /> Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {status !== 'completed' && status !== 'rejected' && (
                                                    <button
                                                        onClick={() => openStatusModal(req)}
                                                        className="flex items-center gap-1.5 bg-[#5845D8] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/10"
                                                    >
                                                        <CheckCircle size={13} /> Update Status
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button
                                            onClick={() => setSelectedDispute(req)}
                                            className="p-2 rounded-xl border border-red-50 text-red-400 hover:bg-red-50 transition-all shadow-sm"
                                            title="Report Problem"
                                        >
                                            <AlertTriangle size={13} />
                                        </button>
                                        <button
                                            onClick={() => req.conversationId && onNavigateToChat(req.conversationId)}
                                            disabled={!req.conversationId}
                                            className="p-2 rounded-xl border border-gray-100 text-[#111827] hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={req.conversationId ? 'Chat with Sender' : 'Chat available after acceptance'}
                                        >
                                            <MessageSquare size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Dispute Modal ─── */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6 font-sans">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50">
                        <div className="p-6 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/20">
                            <div className="w-14 h-14 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#111827] uppercase tracking-tight">Report an Issue</h3>
                                <p className="text-[9px] text-red-600 font-black mt-1 uppercase tracking-widest opacity-70">
                                    Order #{selectedDispute.trackingNumber || 'Pending'}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleRaiseDispute(rid(selectedDispute), e.target.reason.value);
                        }} className="p-6 space-y-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed text-center px-4">
                                Are you having issues with the pickup, package content, or sender? This will alert the Bago team for mediation.
                            </p>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Describe the problem</label>
                                <textarea name="reason" placeholder="Provide details about the issue..."
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent outline-none text-xs font-bold min-h-[120px] focus:border-red-500/20 focus:bg-white transition-all" required />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelectedDispute(null)}
                                    className="flex-1 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600">Cancel</button>
                                <button type="submit" disabled={isSubmitting}
                                    className="flex-[2] bg-[#5845D8] text-white py-4 rounded-xl font-black text-xs uppercase tracking-[2px] shadow-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Status Update Modal ─── */}
            {updatingStatus && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 font-sans">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50">
                        <div className="p-6 border-b border-gray-50 flex flex-col items-center gap-3 bg-gray-50/30">
                            <div className="w-14 h-14 bg-white text-[#5845D8] rounded-2xl flex items-center justify-center shadow-lg border border-gray-100">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#111827] uppercase tracking-tight">Update Delivery Status</h3>
                                <p className="text-[9px] text-gray-500 font-black mt-1 uppercase tracking-widest opacity-70">
                                    Order #{updatingStatus.trackingNumber}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select the new status</label>
                                <div className="space-y-2">
                                    {STATUS_UPDATE_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        const active = selectedStatus === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setSelectedStatus(option.value)}
                                                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                                    active
                                                        ? 'border-[#5845D8] bg-[#5845D8]/8 shadow-sm'
                                                        : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                        active ? 'bg-[#5845D8] text-white' : 'bg-white text-gray-400'
                                                    }`}>
                                                        <Icon size={17} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#111827] uppercase tracking-widest">{option.label}</p>
                                                        <p className="mt-1 text-[10px] font-bold leading-relaxed text-gray-500">{option.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Location (optional)</label>
                                    <input type="text" value={statusLocation} onChange={e => setStatusLocation(e.target.value)}
                                        placeholder="e.g. Dubai International Airport"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border border-transparent outline-none focus:border-[#5845D8]/20 focus:bg-white text-xs font-bold transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Proof Photo {selectedStatus === 'delivered' ? '(required)' : '(optional)'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-[#5845D8]/5 text-[#5845D8] rounded-xl border border-[#5845D8]/10 cursor-pointer hover:bg-[#5845D8]/10 transition-all">
                                            <Camera size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {proofImage ? 'Photo Selected ✓' : 'Upload Photo'}
                                            </span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                        {proofImage && (
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm relative group">
                                                <img src={proofImage} className="w-full h-full object-cover" alt="Proof" />
                                                <button onClick={() => setProofImage(null)}
                                                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {selectedStatus === 'delivered' && !proofImage && (
                                <div className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800">
                                    <Truck size={15} className="mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold leading-relaxed">
                                        Upload a delivery proof photo before marking this shipment as delivered.
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4 border-t border-gray-50">
                                <button onClick={resetStatusModal}
                                    className="flex-1 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600">Cancel</button>
                                <button
                                    onClick={() => handleUpdateStatus(rid(updatingStatus), selectedStatus)}
                                    disabled={!selectedStatus || isSubmitting || (selectedStatus === 'delivered' && !proofImage)}
                                    className="flex-[2] bg-[#5845D8] text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-[#5845D8]/20 hover:bg-[#4838B5] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                    OK, Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Package Inspection Modal (before accept) ─── */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-[#111827] uppercase tracking-tight">Package Inspection</h3>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-70">
                                    Review all details before accepting
                                </p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Image */}
                            <button type="button"
                                onClick={() => imgFor(viewingDetails) && setPreviewImage(imgFor(viewingDetails))}
                                className="aspect-video w-full bg-gray-100 rounded-[20px] overflow-hidden relative border border-gray-100 shadow-inner group text-left">
                                {imgFor(viewingDetails) ? (
                                    <>
                                        <img src={imgFor(viewingDetails)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Package" />
                                        <div className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-white/95 text-[#111827] text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                            <ZoomIn size={14} /> Zoom
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                                        <Package size={48} className="opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Image Provided</span>
                                    </div>
                                )}
                            </button>

                            {/* Key details grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    ['Sender', fv(viewingDetails, ['senderName', 'sender.firstName'])],
                                    ['Sender Phone', fv(viewingDetails, ['senderPhone', 'sender.phone'])],
                                    ['From', fv(viewingDetails, ['originCity', 'package.fromCity'])],
                                    ['To', fv(viewingDetails, ['destinationCity', 'package.toCity'])],
                                    ['Pickup Address', fv(viewingDetails, ['package.pickupAddress', 'pickupAddress'])],
                                    ['Delivery Address', fv(viewingDetails, ['package.deliveryAddress', 'deliveryAddress'])],
                                    ['Receiver Name', fv(viewingDetails, ['package.receiverName', 'receiverName'])],
                                    ['Receiver Phone', fv(viewingDetails, ['package.receiverPhone', 'receiverPhone'])],
                                    ['Weight', (pkg(viewingDetails).packageWeight || fv(viewingDetails, ['weight'])) + ' KG'],
                                    ['Category', fv(viewingDetails, ['package.category', 'category'], 'General')],
                                    ['Declared Value', fv(viewingDetails, ['package.value', 'declaredValue', 'package.declaredValue'])],
                                    ['Agreed Amount', `${viewingDetails.currency || ''} ${viewingDetails.amount || viewingDetails.agreedPrice || '—'}`],
                                    ['Your Payout', `${viewingDetails.currency || ''} ${viewingDetails.travelerPayout || '—'}`],
                                    ['Tracking', viewingDetails.trackingNumber || 'Pending'],
                                ].filter(([, v]) => v && v.trim() && v !== ' ' && v !== 'undefined undefined' && v !== ' KG').map(([label, value]) => (
                                    <div key={label} className="p-4 bg-gray-50 rounded-[14px] border border-gray-100">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                        <p className="text-sm font-black text-[#111827] break-words">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            {(pkg(viewingDetails).description || viewingDetails.description) && (
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Description</p>
                                    <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100 text-xs font-bold leading-relaxed text-[#111827]">
                                        {pkg(viewingDetails).description || viewingDetails.description}
                                    </div>
                                </div>
                            )}

                            {/* Terms */}
                            {(viewingDetails.status || '').toLowerCase() === 'pending' && (
                                <div className="bg-amber-50 rounded-[20px] p-6 border border-amber-100 border-dashed">
                                    <div className="flex gap-3">
                                        <ShieldCheck className="text-amber-500 flex-shrink-0" size={20} />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight mb-1">
                                                Before You Accept
                                            </p>
                                            <p className="text-[9px] text-amber-700/80 font-medium leading-normal mb-4">
                                                By accepting, I confirm that:
                                            </p>
                                            <div className="space-y-2">
                                                {[
                                                    'I have inspected the package details and contents description.',
                                                    'I understand the item does not contain prohibited or restricted goods.',
                                                    'I agree to Bago\'s terms and take responsibility for safe delivery.',
                                                ].map((label, i) => (
                                                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={acceptedTerms[i]}
                                                            onChange={e => setAcceptedTerms(prev => { const n = [...prev]; n[i] = e.target.checked; return n; })}
                                                            className="w-4 h-4 mt-0.5 rounded border-amber-300 text-amber-600 cursor-pointer flex-shrink-0" />
                                                        <span className="text-[9px] font-semibold text-amber-800 leading-relaxed">{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex gap-3">
                            {(viewingDetails.status || '').toLowerCase() === 'pending' ? (
                                <>
                                    <button
                                        onClick={() => {
                                            const id = rid(viewingDetails);
                                            if (!id) return;
                                            setDetailsViewed(prev => ({ ...prev, [id]: true }));
                                            setViewingDetails(null);
                                            handleUpdateStatus(id, 'rejected');
                                        }}
                                        className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            const id = rid(viewingDetails);
                                            if (!id) return;
                                            setDetailsViewed(prev => ({ ...prev, [id]: true }));
                                            setViewingDetails(null);
                                            handleUpdateStatus(id, 'accepted');
                                        }}
                                        disabled={!acceptedTerms.every(Boolean) || isSubmitting}
                                        className={`flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                                            acceptedTerms.every(Boolean) && !isSubmitting
                                                ? 'bg-[#5845D8] text-white hover:bg-[#4838B5] shadow-indigo-500/20'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                        }`}
                                    >
                                        {isSubmitting ? 'Accepting…' : 'Accept Delivery Request'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setViewingDetails(null)}
                                    className="flex-1 bg-gray-100 text-[#111827] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {previewImage && (
                <div className="fixed inset-0 z-[220] bg-black/90 p-4 flex items-center justify-center">
                    <button onClick={() => setPreviewImage(null)}
                        className="absolute top-5 right-5 h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                        <X size={22} />
                    </button>
                    <img src={previewImage} alt="Item" className="max-h-[92vh] max-w-[96vw] object-contain rounded-xl" />
                </div>
            )}

            {toast.show && (
                <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right duration-300">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                        toast.ok ? 'bg-green-500 text-white border-green-400' : 'bg-red-500 text-white border-red-400'
                    }`}>
                        {toast.ok ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <p className="text-[11px] font-black uppercase tracking-wider">{toast.msg}</p>
                        <button onClick={() => setToast(s => ({ ...s, show: false }))} className="ml-2 hover:opacity-70">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
