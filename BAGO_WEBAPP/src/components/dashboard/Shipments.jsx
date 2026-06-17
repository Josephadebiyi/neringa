import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
    Package, Clock, ChevronRight, AlertTriangle, ShieldCheck,
    RefreshCw, X, MessageSquare, User, ArrowLeft, ZoomIn, MapPin,
} from 'lucide-react';

const asArray = (value) => Array.isArray(value) ? value : [];
const rid = (req) => req?._id || req?.id || req?.requestId;
const pkg = (req) => req?.package || req?.packageDetails || {};
const packageImage = (req) => {
    const p = pkg(req);
    return req?.image || req?.imageUrl || req?.image_url || p.image || p.imageUrl || p.image_url || '';
};
const originCity = (req) => {
    const p = pkg(req);
    return req?.originCity || req?.from_city || req?.fromCity || p.fromCity || p.from_city || '—';
};
const destinationCity = (req) => {
    const p = pkg(req);
    return req?.destinationCity || req?.to_city || req?.toCity || p.toCity || p.to_city || '—';
};

// Map backend status codes to clean, readable labels
const statusLabel = (req) => {
    const s = (req?.status || '').toLowerCase();
    if (s === 'delivering' && !req?.senderReceived) return 'Delivered — Awaiting Your Confirmation';
    if (s === 'delivering') return 'Package Delivered';
    const map = {
        draft:      'Searching for Traveler',
        pending:    'Awaiting Traveler Acceptance',
        accepted:   'Accepted — In Progress',
        intransit:  'In Transit',
        'in-transit': 'In Transit',
        completed:  'Completed',
        rejected:   'Rejected',
        cancelled:  'Cancelled',
        canceled:   'Cancelled',
        disputed:   'Disputed',
    };
    return map[s] || 'Processing';
};

const statusColor = (req) => {
    const s = (req?.status || '').toLowerCase();
    if (s === 'completed') return 'text-green-600 bg-green-50';
    if (s === 'accepted') return 'text-indigo-600 bg-indigo-50';
    if (s === 'intransit' || s === 'in-transit') return 'text-blue-600 bg-blue-50';
    if (s === 'delivering') return 'text-amber-600 bg-amber-50';
    if (s === 'rejected' || s === 'cancelled' || s === 'canceled') return 'text-red-600 bg-red-50';
    if (s === 'disputed') return 'text-red-700 bg-red-100';
    return 'text-gray-500 bg-gray-50';
};

const insuranceInfo = (req) => {
    if (req?.insurance !== true && req?.package?.insurance !== true) {
        return { label: 'Not added', tone: 'gray' };
    }
    const policyId = req?.insurancePolicyId || req?.insurance_policy_id;
    const s = String(req?.insuranceStatus || req?.insurance_status || (policyId ? 'active' : 'pending')).toLowerCase();
    if (policyId || s === 'active' || s === 'policy.issued' || s === 'policy.activated') {
        return { label: 'Active — Item covered', tone: 'green' };
    }
    if (s === 'failed') return { label: 'Protection failed — contact support', tone: 'red' };
    if (s === 'cancelled' || s === 'canceled') return { label: 'Cancelled', tone: 'red' };
    return { label: 'Being activated', tone: 'purple' };
};

const getReceiverInfo = (req) => {
    const p = pkg(req);
    const rd = req?.recipient_details || req?.recipientDetails || p.recipient_details || p.recipientDetails || {};
    return {
        name:  req?.receiverName || req?.receiver_name || p.receiverName || p.receiver_name || rd.receiverName || rd.receiver_name || '',
        phone: req?.receiverPhone || req?.receiver_phone || p.receiverPhone || p.receiver_phone || rd.receiverPhone || rd.receiver_phone || '',
        email: req?.receiverEmail || req?.receiver_email || p.receiverEmail || p.receiver_email || rd.receiverEmail || rd.receiver_email || '',
    };
};

export default function Shipments({ onNavigateToChat }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [confirming, setConfirming] = useState(null);

    useEffect(() => { fetchMyRequests(); }, []);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/recentOrder');
            const payload = res.data?.data || res.data?.requests || res.data || [];
            const myShipments = asArray(payload).filter(r => r?.role === 'sender');
            setRequests(myShipments);
        } catch {
            // silently fail — UI shows empty state
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseDispute = async (e) => {
        e.preventDefault();
        if (!disputeReason.trim()) return;
        const id = rid(selectedRequest);
        if (!id) return;
        setIsSubmittingDispute(true);
        try {
            await api.post(`/api/bago/request/${id}/raise-dispute`, { reason: disputeReason });
            alert('Your dispute has been submitted. Bago support will review and contact you shortly.');
            setSelectedRequest(null);
            setDisputeReason('');
            fetchMyRequests();
        } catch {
            alert('Could not submit dispute. Please try again or contact support.');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const handleConfirmDelivery = async (id) => {
        if (!id) return;
        setConfirming(id);
        try {
            await api.put(`/api/bago/request/${id}/confirm-received`);
            await fetchMyRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not confirm delivery. Please try again.');
        } finally {
            setConfirming(null);
        }
    };

    const handleDownloadPDF = async (id, tracking) => {
        if (!id) return;
        setDownloading(id);
        try {
            const response = await api.get(`/api/bago/request/${id}/pdf`, { responseType: 'blob' });
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Server failed to generate PDF');
            }
            if (!response.data || response.data.size === 0) throw new Error('Received empty PDF');
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BAGO_Shipment_${tracking || 'Label'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to download PDF. Please try again.');
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <RefreshCw className="animate-spin text-[#5845D8]" size={40} />
        </div>
    );

    if (viewingDetails) {
        return (
            <ShipmentDetailPage
                req={viewingDetails}
                onBack={() => setViewingDetails(null)}
                onDownload={handleDownloadPDF}
                downloading={downloading}
                onNavigateToChat={onNavigateToChat}
                onDispute={() => { setSelectedRequest(viewingDetails); setViewingDetails(null); }}
                onConfirmDelivery={handleConfirmDelivery}
                confirming={confirming}
                getReceiverInfo={getReceiverInfo}
            />
        );
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="mb-8 px-1">
                <h2 className="text-lg font-black text-[#012126] tracking-tight uppercase">My Shipments</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">
                    Packages you have sent — track and manage your deliveries
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Package size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#012126] mb-1.5 uppercase tracking-tight">No shipments yet</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto font-bold uppercase tracking-wider opacity-60 leading-relaxed">
                        Once you send a package with a Bago traveler, your shipments will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req, index) => {
                        const id = rid(req);
                        const img = packageImage(req);
                        const s = (req.status || '').toLowerCase();
                        return (
                            <div key={id || index} className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-5 items-center group hover:border-[#5845D8]/20 transition-all">
                                {/* Package image */}
                                <div
                                    onClick={() => setViewingDetails(req)}
                                    className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-[#5845D8] flex-shrink-0 cursor-pointer border border-gray-100 shadow-sm hover:scale-105 transition-transform"
                                >
                                    {img ? (
                                        <img src={img} className="w-full h-full object-cover" alt="Item" />
                                    ) : (
                                        <Package size={22} />
                                    )}
                                </div>

                                {/* Route + chips */}
                                <div className="flex-1 text-center md:text-left">
                                    <div
                                        className="flex items-center justify-center md:justify-start gap-1.5 mb-2 cursor-pointer"
                                        onClick={() => setViewingDetails(req)}
                                    >
                                        <span className="text-xs font-black text-[#012126] uppercase tracking-tight">
                                            {originCity(req)}
                                        </span>
                                        <ChevronRight size={12} className="text-gray-300" />
                                        <span className="text-xs font-black text-[#012126] uppercase tracking-tight">
                                            {destinationCity(req)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
                                        {req.trackingNumber ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                                <Clock size={10} className="text-[#5845D8]" />
                                                <span className="text-[9px] font-black text-[#012126] uppercase tracking-widest">
                                                    {req.trackingNumber}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
                                                <Clock size={10} className="text-amber-500" />
                                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
                                                    Awaiting Traveler
                                                </span>
                                            </div>
                                        )}
                                        {req.travelerName ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50/60 rounded-lg border border-indigo-100/50 shadow-sm">
                                                <User size={10} className="text-[#5845D8]" />
                                                <span className="text-[9px] font-black text-[#012126]/70 uppercase tracking-widest">
                                                    Traveler: {req.travelerName}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                                <User size={10} className="text-gray-300" />
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    No Traveler Yet
                                                </span>
                                            </div>
                                        )}
                                        {s === 'accepted' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 shadow-sm">
                                                <ShieldCheck size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Funds in Escrow</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status + actions */}
                                <div className="flex flex-col items-center md:items-end gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${statusColor(req)}`}>
                                        {statusLabel(req)}
                                    </span>

                                    {s === 'delivering' && !req.senderReceived && (
                                        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-right max-w-xs">
                                            <p className="text-[9px] font-bold text-amber-800 mb-2">
                                                The traveler has marked this as delivered. Confirm receipt to release payment.
                                            </p>
                                            <button
                                                onClick={() => handleConfirmDelivery(id)}
                                                disabled={!id || confirming === id}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-white disabled:opacity-60"
                                            >
                                                {confirming === id ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                                                Confirm Received
                                            </button>
                                        </div>
                                    )}

                                    {req.travelerProof && (
                                        <div className="flex flex-col items-center md:items-end gap-1">
                                            <p className="text-[7px] font-black text-[#5845D8] uppercase tracking-widest italic">Delivery proof uploaded</p>
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                                <img
                                                    src={req.travelerProof}
                                                    className="w-full h-full object-cover"
                                                    alt="Delivery Proof"
                                                    onClick={() => window.open(req.travelerProof, '_blank', 'noopener,noreferrer')}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap justify-center md:justify-end">
                                        <button
                                            onClick={() => req.conversationId && onNavigateToChat(req.conversationId)}
                                            disabled={!req.conversationId}
                                            className="p-2 rounded-xl border border-gray-100 text-[#012126] hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={req.conversationId ? 'Chat with Traveler' : 'Chat available once traveler accepts'}
                                        >
                                            <MessageSquare size={14} />
                                        </button>
                                        <button
                                            onClick={() => setViewingDetails(req)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5845D8]/8 text-[#5845D8] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5845D8]/15 transition-all shadow-sm"
                                        >
                                            <Package size={14} />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleDownloadPDF(id, req.trackingNumber)}
                                            disabled={!id || downloading === id || !req.trackingNumber}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#5845D8] border border-[#5845D8] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={!req.trackingNumber ? 'Label available once a traveler accepts' : 'Download shipping label'}
                                        >
                                            {downloading === id ? <RefreshCw size={14} className="animate-spin" /> : null}
                                            {downloading === id ? 'Downloading…' : 'Download Label'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm"
                                        >
                                            <AlertTriangle size={14} />
                                            Report Issue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Dispute Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 font-sans">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-gray-100/50">
                        <div className="p-6 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/20">
                            <div className="w-14 h-14 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">Report an Issue</h3>
                                <p className="text-[9px] text-red-600 font-black mt-1 uppercase tracking-widest opacity-70">
                                    Order #{selectedRequest.trackingNumber || 'Pending'}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleRaiseDispute} className="p-6 space-y-6">
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-2.5">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-amber-800 leading-relaxed">
                                    Raising a dispute will pause the release of funds until Bago support reviews and resolves the issue.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Describe the issue</label>
                                <textarea
                                    value={disputeReason}
                                    onChange={e => setDisputeReason(e.target.value)}
                                    placeholder="e.g. Package arrived damaged, item missing, traveler unresponsive…"
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent outline-none text-xs font-bold min-h-[120px] focus:border-red-500/20 focus:bg-white transition-all"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelectedRequest(null)}
                                    className="flex-1 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmittingDispute}
                                    className="flex-[2] bg-red-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[2px] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSubmittingDispute ? <RefreshCw className="animate-spin" size={16} /> : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShipmentDetailPage({ req, onBack, onDownload, downloading, onNavigateToChat, onDispute, onConfirmDelivery, confirming, getReceiverInfo }) {
    const [imgFullscreen, setImgFullscreen] = useState(false);
    const id = rid(req);
    const imgUrl = packageImage(req);
    const receiver = getReceiverInfo(req);
    const p = pkg(req);
    const from = originCity(req);
    const to = destinationCity(req);
    const protection = insuranceInfo(req);
    const s = (req.status || '').toLowerCase();

    const pickupAddress = p.pickupAddress || req.pickupAddress || '';
    const deliveryAddress = p.deliveryAddress || req.deliveryAddress || '';
    const rawDeclared = p.value || p.declaredValue || req.declaredValue || 0;
    const declaredValue = Number(rawDeclared) > 0 ? rawDeclared : '';
    const amountPaid = req.amount || req.senderTotalAmount || req.agreedPrice || '';
    const currency = (req.currency || req.package?.currency || '').toUpperCase() || 'USD';
    const weight = req.weight || req.packageWeight || p.packageWeight || p.package_weight || 0;
    const category = req.category || p.category || '';
    const description = p.description || req.description || '';

    return (
        <div className="animate-in fade-in duration-300 font-sans">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#5845D8] font-black text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                    <ArrowLeft size={16} /> Back to Shipments
                </button>
                <div className="flex-1 h-[1px] bg-gray-100" />
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColor(req)}`}>
                    {statusLabel(req)}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left column */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Package image */}
                    <div
                        className="aspect-video bg-gray-100 rounded-[24px] overflow-hidden relative border border-gray-100 shadow-inner cursor-pointer group"
                        onClick={() => imgUrl && setImgFullscreen(true)}
                    >
                        {imgUrl ? (
                            <>
                                <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Package" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                                        <ZoomIn size={20} className="text-[#012126]" />
                                    </div>
                                </div>
                                <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-sm">
                                    Click to enlarge
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                                <Package size={48} className="opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">No Image Provided</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {description && (
                        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Item Description</p>
                            <p className="text-sm font-bold leading-relaxed text-[#012126]">{description}</p>
                        </div>
                    )}

                    {/* Addresses */}
                    {(pickupAddress || deliveryAddress) && (
                        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-4">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Addresses</p>
                            {pickupAddress && (
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#5845D8]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin size={13} className="text-[#5845D8]" />
                                    </div>
                                    <div>
                                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pickup Address</p>
                                        <p className="text-sm font-bold text-[#012126]">{pickupAddress}</p>
                                    </div>
                                </div>
                            )}
                            {deliveryAddress && (
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin size={13} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Delivery Address</p>
                                        <p className="text-sm font-bold text-[#012126]">{deliveryAddress}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivery proof */}
                    {req.travelerProof && (
                        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivery Proof</p>
                            <img
                                src={req.travelerProof}
                                className="w-full max-h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                alt="Delivery Proof"
                                onClick={() => window.open(req.travelerProof, '_blank', 'noopener,noreferrer')}
                            />
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Confirm delivery banner */}
                    {s === 'delivering' && !req.senderReceived && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-5">
                            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-2">Action Required</p>
                            <p className="text-xs font-bold text-amber-700 mb-3">
                                The traveler has marked this shipment as delivered. Please confirm receipt to release their payment.
                            </p>
                            <button
                                onClick={() => onConfirmDelivery(id)}
                                disabled={!id || confirming === id}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-60"
                            >
                                {confirming === id ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                Confirm Delivery Received
                            </button>
                        </div>
                    )}

                    {/* Route */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">Route</p>
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">From</p>
                                <p className="text-sm font-black text-[#012126] uppercase">{from}</p>
                            </div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-[#5845D8]/20 via-[#5845D8] to-[#5845D8]/20 rounded-full" />
                            <div className="text-right">
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">To</p>
                                <p className="text-sm font-black text-[#012126] uppercase">{to}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Tracking No.</p>
                                <p className="text-[10px] font-black text-[#5845D8]">
                                    {req.trackingNumber || 'Awaiting traveler'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Traveler</p>
                                <p className="text-[10px] font-black text-[#012126]">
                                    {req.travelerName || 'Not yet assigned'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Package + payment info */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">Package & Payment</p>
                        <div className="grid grid-cols-2 gap-3">
                            {weight ? (
                                <div className="p-3 bg-gray-50 rounded-[14px] border border-gray-100">
                                    <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Weight</p>
                                    <p className="text-sm font-black text-[#012126]">{weight} KG</p>
                                </div>
                            ) : null}
                            {category && (
                                <div className="p-3 bg-gray-50 rounded-[14px] border border-gray-100">
                                    <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Category</p>
                                    <p className="text-sm font-black text-[#012126] uppercase truncate">{category}</p>
                                </div>
                            )}
                            {declaredValue && (
                                <div className="p-3 bg-gray-50 rounded-[14px] border border-gray-100">
                                    <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Declared Value</p>
                                    <p className="text-sm font-black text-[#012126]">{currency} {Number(declaredValue).toLocaleString()}</p>
                                </div>
                            )}
                            {amountPaid && (
                                <div className="p-3 bg-indigo-50/60 rounded-[14px] border border-indigo-100/50">
                                    <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Amount Paid</p>
                                    <p className="text-sm font-black text-[#5845D8]">{currency} {Number(amountPaid).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Receiver */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">Receiver</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#5845D8]/10 flex items-center justify-center text-[#5845D8] shrink-0">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#012126]">{receiver.name || 'Not provided'}</p>
                                <p className="text-[9px] text-gray-500 font-bold">{receiver.phone || 'No phone'}</p>
                                {receiver.email && <p className="text-[9px] text-gray-400 font-bold break-all">{receiver.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Insurance */}
                    {req.insurance === true && (
                        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Item Protection</p>
                            <div className={`rounded-2xl px-4 py-3 text-[10px] font-black ${
                                protection.tone === 'green' ? 'bg-green-50 text-green-700' :
                                protection.tone === 'red' ? 'bg-red-50 text-red-600' :
                                'bg-[#5845D8]/8 text-[#5845D8]'
                            }`}>
                                {protection.label}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-3">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Actions</p>
                        {req.trackingNumber && (
                            <button
                                onClick={() => onDownload(id, req.trackingNumber)}
                                disabled={!id || downloading === id}
                                className="w-full flex items-center justify-center gap-2 bg-[#012126] text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                            >
                                {downloading === id ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                {downloading === id ? 'Downloading…' : 'Download Shipping Label'}
                            </button>
                        )}
                        {req.conversationId && (
                            <button
                                onClick={() => onNavigateToChat(req.conversationId)}
                                className="w-full flex items-center justify-center gap-2 bg-[#5845D8]/8 text-[#5845D8] py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5845D8]/15 transition-all border border-[#5845D8]/20"
                            >
                                <MessageSquare size={14} />
                                Chat with Traveler
                            </button>
                        )}
                        <button
                            onClick={onDispute}
                            className="w-full flex items-center justify-center gap-2 border border-red-100 text-red-500 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                        >
                            <AlertTriangle size={14} />
                            Report a Problem
                        </button>
                    </div>
                </div>
            </div>

            {imgFullscreen && imgUrl && (
                <div
                    className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
                    onClick={() => setImgFullscreen(false)}
                >
                    <button
                        onClick={() => setImgFullscreen(false)}
                        className="absolute top-6 right-6 text-white/60 hover:text-white bg-white/10 rounded-full p-2"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={imgUrl}
                        alt="Package"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
