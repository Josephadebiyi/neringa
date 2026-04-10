import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Package, MapPin, Calendar, Clock, ChevronRight, CheckCircle, RefreshCw, X, MessageSquare, User, Camera, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Deliveries({ user, onNavigateToChat }) {
    const { t } = useLanguage();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null); // requestId being updated
    const [viewingDetails, setViewingDetails] = useState(null); // requestId being inspected
    const [selectedDispute, setSelectedDispute] = useState(null); // requestId being disputed
    const [detailsViewed, setDetailsViewed] = useState({}); // Tracking which requests were inspected
    const [statusNote, setStatusNote] = useState('');
    const [statusLocation, setStatusLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchMyDeliveries();
    }, []);

    const fetchMyDeliveries = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/recentOrder');
            // Filter where role is traveler
            setDeliveries(res.data?.data?.filter(d => d.role === 'traveler') || []);
        } catch (err) {
            setNotification({ show: true, message: 'Failed to fetch deliveries', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (requestId, status) => {
        setIsSubmitting(true);
        try {
            // 1. Update status
            await api.put(`/api/bago/updateRequestStatus/${requestId}`, {
                status,
                location: statusLocation,
                notes: statusNote
            });

            // 2. If it's a delivery proof being uploaded
            if (proofImage && (status === 'completed' || status === 'intransit')) {
                await api.put(`/api/bago/request/${requestId}/traveler-proof`, {
                    image: proofImage
                });
            }

            setNotification({
                show: true,
                message: status === 'completed' ? 'Delivery completed successfully!' : 'Status updated successfully!',
                type: 'success'
            });
            setUpdatingStatus(null);
            setStatusNote('');
            setStatusLocation('');
            setProofImage(null);
            fetchMyDeliveries();
        } catch (err) {
            setNotification({
                show: true,
                message: 'Failed to update status. Please try again.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRaiseDispute = async (requestId, reason) => {
        setIsSubmitting(true);
        try {
            await api.post(`/api/bago/request/${requestId}/raise-dispute`, {
                reason,
                raisedBy: 'traveler'
            });
            setNotification({
                show: true,
                message: 'Issue reported successfully. Support will contact you shortly.',
                type: 'success'
            });
            setSelectedDispute(null);
        } catch (err) {
            setNotification({
                show: true,
                message: 'Failed to report issue.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownloadPDF = async (requestId, tracking) => {
        setDownloading(requestId);
        try {
            const response = await api.get(`/api/bago/request/${requestId}/pdf`, {
                responseType: 'blob'
            });

            // Check if response is actually JSON error disguised as blob
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'Server failed to generate PDF');
            }

            // Verify we got a valid PDF blob
            if (!response.data || response.data.size === 0) {
                throw new Error('Received empty PDF file');
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BAGO_Shipment_${tracking || 'Label'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert(err.response?.data?.message || err.message || 'Failed to download PDF. Please try again or contact support.');
        } finally {
            setDownloading(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'pending': return 'text-amber-600 bg-amber-50';
            case 'intransit': return 'text-blue-600 bg-blue-50';
            case 'accepted': return 'text-indigo-600 bg-indigo-50';
            case 'rejected': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-[#5845D8]" size={40} /></div>;

    return (
        <div className="space-y-6 font-sans">
            <div className="mb-8 px-1">
                <h2 className="text-lg font-black text-[#012126] tracking-tight uppercase">{t('myDeliveries') || 'My Deliveries'}</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">{t('manageYourPackageDeliveries') || 'Manage packages you are carrying'}</p>
            </div>

            {deliveries.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Package size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#012126] mb-1.5 text-center uppercase tracking-tight">{t('noActiveDeliveries') || 'No active deliveries'}</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto mb-8 font-bold uppercase tracking-wider opacity-60 leading-relaxed">{t('noDeliveriesDesc') || "You haven't accepted any delivery requests yet."}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map(req => (
                        <div key={req._id} className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-5 items-center group hover:border-[#5845D8]/20 transition-all">
                            <div 
                                onClick={() => { setViewingDetails(req); setAcceptedTerms(false); }}
                                className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-[#5845D8] flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-50 shadow-sm cursor-zoom-in"
                            >
                                {req.package?.image || req.image ? (
                                    <img src={req.package?.image || req.image} className="w-full h-full object-cover" alt="Item" />
                                ) : (
                                    <Package size={20} />
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div 
                                    className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5 cursor-pointer group/route"
                                    onClick={() => setViewingDetails(req)}
                                >
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight group-hover/route:text-[#5845D8] transition-colors">{req.originCity}</span>
                                    <ChevronRight size={12} className="text-gray-300" />
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight group-hover/route:text-[#5845D8] transition-colors">{req.destinationCity}</span>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                        <Clock size={10} className="text-[#5845D8]" />
                                        <span className="text-[9px] font-black text-[#012126] uppercase tracking-widest">{req.trackingNumber || 'PENDING'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50/50 rounded-lg border border-indigo-100/50 shadow-sm">
                                        <User size={10} className="text-[#5845D8]" />
                                        <span className="text-[9px] font-black text-[#012126]/70 uppercase tracking-widest">{t('sender') || 'Sender'}: {req.senderName}</span>
                                    </div>
                                    {req.status?.toLowerCase() === 'accepted' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 shadow-sm">
                                            <ShieldCheck size={10} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Escrow Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(req.status)}`}>
                                    {req.status}
                                </span>
                                <div className="flex gap-2">
                                    {req.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => { setViewingDetails(req); setAcceptedTerms(false); }}
                                                className="flex items-center gap-1.5 bg-gray-100 text-[#012126] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-sm"
                                            >
                                                <Package size={14} />
                                                {t('viewDetails') || 'Inspect'}
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(req._id, 'accepted')}
                                                disabled={!detailsViewed[req._id]}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md ${
                                                    detailsViewed[req._id] 
                                                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/10' 
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none grayscale'
                                                }`}
                                                title={!detailsViewed[req._id] ? "You must inspect the package details first" : ""}
                                            >
                                                <CheckCircle size={14} />
                                                {t('accept') || 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(req._id, 'rejected')}
                                                className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-500/10"
                                            >
                                                <X size={14} />
                                                {t('reject') || 'Reject'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {req.status !== 'completed' && req.status !== 'rejected' && (
                                                <button
                                                    onClick={() => setUpdatingStatus(req)}
                                                    className="flex items-center gap-1.5 bg-[#5845D8] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#4838B5] transition-all shadow-md shadow-[#5845D8]/10"
                                                >
                                                    <CheckCircle size={14} />
                                                    {t('updateStatus') || 'Update Status'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <button 
                                        onClick={() => setSelectedDispute(req)}
                                        className="p-2 rounded-xl border border-red-50 text-red-400 hover:bg-red-50 transition-all shadow-sm"
                                        title="Report Problem"
                                    >
                                        <AlertTriangle size={14} />
                                    </button>
                                    <button 
                                        onClick={() => onNavigateToChat(req.conversationId)}
                                        className="p-2 rounded-xl border border-gray-100 text-[#012126] hover:bg-gray-50 transition-all shadow-sm"
                                        title="Chat with Sender"
                                    >
                                        <MessageSquare size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF(req._id, req.trackingNumber)}
                                        disabled={downloading === req._id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#5845D8] border border-[#5845D8] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all shadow-sm"
                                    >
                                        {downloading === req._id ? <RefreshCw size={14} className="animate-spin" /> : null}
                                        {downloading === req._id ? 'DOWNLOADING' : 'DOWNLOAD'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Traveler Report/Dispute Modal */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
                    <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100/50">
                        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/20">
                            <div className="w-14 h-14 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">Report Shipping Issue</h3>
                                <p className="text-[9px] text-red-600 font-black mt-1 uppercase tracking-widest opacity-70">Order #{selectedDispute.trackingNumber || 'Pending'}</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleRaiseDispute(selectedDispute._id, e.target.reason.value);
                        }} className="p-6 md:p-8 space-y-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed text-center px-4">
                                Are you experiencing issues with the pickup, package content, or sender? Reporting an issue will alert the Bago team for mediation.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Describe the problem</label>
                                <textarea
                                    name="reason"
                                    placeholder="Provide details about the issue..."
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-transparent outline-none text-xs font-bold min-h-[120px] focus:border-red-500/20 focus:bg-white transition-all text-[#012126] placeholder:text-gray-300"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDispute(null)}
                                    className="flex-1 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-[#012126] text-white py-4 rounded-xl font-black text-xs uppercase tracking-[2px] shadow-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {updatingStatus && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
                    <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100/50">
                        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col items-center gap-3 bg-gray-50/30">
                            <div className="w-14 h-14 bg-white text-[#5845D8] rounded-2xl flex items-center justify-center shadow-lg border border-gray-100">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">{t('updateDeliveryStatus') || 'Update Delivery Status'}</h3>
                                <p className="text-[9px] text-gray-500 font-black mt-1 uppercase tracking-widest opacity-70">Order #{updatingStatus.trackingNumber}</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleUpdateStatus(updatingStatus._id, 'intransit')}
                                    className="flex flex-col items-center gap-2 p-4 bg-blue-50/50 text-blue-600 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
                                >
                                    <Clock size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{t('markInTransit') || 'In Transit'}</span>
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(updatingStatus._id, 'completed')}
                                    className="flex flex-col items-center gap-2 p-4 bg-green-50/50 text-green-600 rounded-2xl border border-green-100 hover:bg-green-100 transition-all group"
                                >
                                    <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{t('markDelivered') || 'Delivered'}</span>
                                </button>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('currentLocation') || 'Current Location'}</label>
                                    <input
                                        type="text"
                                        value={statusLocation}
                                        onChange={(e) => setStatusLocation(e.target.value)}
                                        placeholder="e.g. Dubai International Airport"
                                        className="w-full px-5 py-3.5 bg-gray-50 rounded-xl border border-transparent outline-none focus:border-[#5845D8]/20 focus:bg-white text-xs font-bold transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('proofImage') || 'Proof of Delivery / Pickup'}</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-[#5845D8]/5 text-[#5845D8] rounded-xl border border-[#5845D8]/10 cursor-pointer hover:bg-[#5845D8]/10 transition-all">
                                            <Camera size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{proofImage ? 'Image Selected' : 'Upload Proof'}</span>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                        {proofImage && (
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm relative group">
                                                <img src={proofImage} className="w-full h-full object-cover" alt="Proof" />
                                                <button onClick={() => setProofImage(null)} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[7px] text-gray-400 font-bold uppercase tracking-wider mt-2 px-1 leading-relaxed italic">
                                        * Uploading a real-time image of the item or delivery point is required for secure handovers.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => setUpdatingStatus(null)}
                                    className="flex-1 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                                >
                                    {t('cancel') || 'Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspection Modal */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-[#012126] uppercase tracking-tight">Package Inspection</h3>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-70">Order #{viewingDetails.trackingNumber || 'Pending'}</p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Image Gallery */}
                            <div className="aspect-video bg-gray-100 rounded-[24px] overflow-hidden relative border border-gray-100 shadow-inner group">
                                {viewingDetails.package?.image || viewingDetails.image ? (
                                    <img 
                                        src={viewingDetails.package?.image || viewingDetails.image} 
                                        className="w-full h-full object-cover" 
                                        alt="Package" 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                                        <Package size={48} className="opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Image Provided</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">Main Item Photo</span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Weight</p>
                                    <p className="text-sm font-black text-[#012126]">{viewingDetails.weight || viewingDetails.package?.weight || 0} KG</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</p>
                                    <p className="text-sm font-black text-[#012126] uppercase tracking-tight">{viewingDetails.category || viewingDetails.package?.category || 'General'}</p>
                                </div>
                            </div>

                            {/* Receiver Info */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('receiverInfo') || 'Receiver Information'}</p>
                                <div className="p-6 bg-indigo-50/30 rounded-[24px] border border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-[#012126] uppercase">{viewingDetails.package?.receiverName || 'N/A'}</p>
                                        <p className="text-[9px] text-gray-500 font-bold mt-0.5">{viewingDetails.package?.receiverPhone || 'No Phone provided'}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5845D8] shadow-sm">
                                        <User size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Description</p>
                                <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-100 text-xs font-bold leading-relaxed text-[#012126]">
                                    {viewingDetails.package?.description || viewingDetails.description || 'No detailed description provided by the sender.'}
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-[24px] p-6 border border-amber-100 border-dashed">
                                <div className="flex gap-3">
                                    <ShieldCheck className="text-amber-500 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight mb-1">Safety Agreement</p>
                                        <p className="text-[9px] text-amber-700/80 font-medium leading-normal">
                                            By accepting this package, you confirm that you have reviewed the contents and they comply with airline safety and legal regulations. You are responsible for the safe delivery of these items.
                                        </p>
                                        <label className="flex items-center gap-2 mt-4 cursor-pointer group/terms">
                                            <input 
                                                type="checkbox" 
                                                checked={acceptedTerms}
                                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest group-hover/terms:text-[#5845D8] transition-colors">I accept the Terms & Conditions</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex gap-3">
                            {viewingDetails.status === 'pending' && !detailsViewed[viewingDetails._id] ? (
                                <button 
                                    onClick={() => {
                                        setDetailsViewed(prev => ({ ...prev, [viewingDetails._id]: true }));
                                        setViewingDetails(null);
                                    }}
                                    disabled={!acceptedTerms}
                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                                        acceptedTerms 
                                            ? 'bg-[#5845D8] text-white hover:bg-[#4838B5] shadow-indigo-500/20' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    Confirm Inspection
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setViewingDetails(null)}
                                    className="flex-1 bg-gray-100 text-[#012126] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Close Details
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification.show && (
                <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right duration-300">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
                        notification.type === 'success'
                            ? 'bg-green-500 text-white border-green-400'
                            : 'bg-red-500 text-white border-red-400'
                    }`}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} className="flex-shrink-0" />
                        ) : (
                            <AlertTriangle size={20} className="flex-shrink-0" />
                        )}
                        <p className="text-[11px] font-black uppercase tracking-wider">{notification.message}</p>
                        <button
                            onClick={() => setNotification({ show: false, message: '', type: '' })}
                            className="ml-2 hover:opacity-70 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
