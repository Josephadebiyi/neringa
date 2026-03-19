import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Package, MapPin, Calendar, Clock, ChevronRight, AlertTriangle, ShieldCheck, CheckCircle, RefreshCw, X, MessageSquare, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Shipments({ user, onNavigateToChat }) {
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/recentOrder');
            // Show only where the current user is the sender
            const myShipments = (res.data?.data || []).filter(req => req.role === 'sender');
            setRequests(myShipments);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    const handleRaiseDispute = async (e) => {
        e.preventDefault();
        if (!disputeReason.trim()) return;
        setIsSubmittingDispute(true);
        try {
            await api.post(`/api/bago/request/${selectedRequest._id}/raise-dispute`, {
                reason: disputeReason
            });
            alert(t('disputeSuccessMsg'));
            setSelectedRequest(null);
            setDisputeReason('');
            fetchMyRequests();
        } catch (err) {
            alert(t('failRaiseDispute'));
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-50';
            case 'pending': return 'text-amber-600 bg-amber-50';
            case 'in-transit': return 'text-blue-600 bg-blue-50';
            case 'disputed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
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

    if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-[#5845D8]" size={40} /></div>;

    return (
        <div className="space-y-6 font-sans">
            <div className="mb-8 px-1">
                <h2 className="text-lg font-black text-[#012126] tracking-tight uppercase">{t('myShipments')}</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">{t('trackManageDeliveries')}</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Package size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#012126] mb-1.5 text-center uppercase tracking-tight">{t('noActiveShipments')}</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto mb-8 font-bold uppercase tracking-wider opacity-60 leading-relaxed">{t('noActiveShipmentsDesc')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req._id} className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-5 items-center group hover:border-[#5845D8]/20 transition-all">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-[#5845D8] flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-50 shadow-sm">
                                {req.package?.image || req.image ? (
                                    <img src={req.package?.image || req.image} className="w-full h-full object-cover" alt="Item" />
                                ) : (
                                    <Package size={20} />
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5">
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight">{req.originCity || 'Dubai'}</span>
                                    <ChevronRight size={12} className="text-gray-300" />
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight">{req.destinationCity || 'Lagos'}</span>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                                        <Clock size={10} className="text-[#5845D8]" />
                                        <span className="text-[9px] font-black text-[#012126] uppercase tracking-widest">{req.trackingNumber || 'BAGO-PENDING'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50/50 rounded-lg border border-indigo-100/50 shadow-sm">
                                        <User size={10} className="text-[#5845D8]" />
                                        <span className="text-[9px] font-black text-[#012126]/70 uppercase tracking-widest">{t('traveler')}: {req.travelerName || 'Reviewing...'}</span>
                                    </div>
                                    {req.status?.toLowerCase() === 'accepted' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 shadow-sm">
                                            <ShieldCheck size={10} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{t('fundsInEscrow')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(req.status)}`}>
                                    {req.status || 'Pending'}
                                </span>
                                {req.travelerProof && (
                                    <div className="flex flex-col items-center md:items-end gap-1.5 mt-1">
                                        <p className="text-[7px] font-black text-[#5845D8] uppercase tracking-widest uppercase italic">{t('travelerUploadedProof')}</p>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                            <img src={req.travelerProof} className="w-full h-full object-cover" alt="Delivery Proof" onClick={() => window.open(req.travelerProof, '_blank')} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onNavigateToChat(req.conversationId)}
                                        className="p-2 rounded-xl border border-gray-100 text-[#012126] hover:bg-gray-50 transition-all shadow-sm"
                                        title="Chat with Traveler"
                                    >
                                        <MessageSquare size={14} />
                                    </button>
                                    <button
                                        onClick={() => setViewingDetails(req)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-[#012126] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm"
                                    >
                                        <Package size={14} />
                                        {t('viewDetails') || 'Details'}
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF(req._id, req.trackingNumber)}
                                        disabled={downloading === req._id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#5845D8] border border-[#5845D8] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5845D8] hover:text-white transition-all shadow-sm"
                                    >
                                        {downloading === req._id ? <RefreshCw size={14} className="animate-spin" /> : null}
                                        {downloading === req._id ? t('downloading') || 'DOWNLOADING' : t('download') || 'DOWNLOAD'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm shadow-red-50"
                                    >
                                        <AlertTriangle size={14} />
                                        {t('dispute')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dispute Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
                    <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100/50">
                        <div className="relative z-10">
                            <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col items-center gap-3 bg-red-50/20">
                                <div className="w-14 h-14 bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10 border border-red-50">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-[#012126] uppercase tracking-tight">{t('openADispute')}</h3>
                                    <p className="text-[9px] text-red-600 font-black mt-1 uppercase tracking-widest opacity-70">{t('order')} #{selectedRequest.trackingNumber}</p>
                                </div>
                            </div>
                            <form onSubmit={handleRaiseDispute} className="p-6 md:p-8 space-y-6">
                                <div className="bg-[#F8F6F3] p-4 rounded-xl border border-gray-50 flex gap-2.5 italic">
                                    <div className="text-red-500 shrink-0 mt-0.5"><AlertTriangle size={14} /></div>
                                    <p className="text-[10px] font-bold text-[#012126]/70 leading-relaxed uppercase tracking-wide">
                                        {t('disputePauseNotice')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#012126] uppercase tracking-widest ml-1 cursor-none">{t('disputeDetails')}</label>
                                    <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        placeholder={t('disputePlaceholder')}
                                        className="w-full px-5 py-4 bg-[#F8F6F3] rounded-2xl border border-transparent outline-none text-xs font-bold min-h-[120px] focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 transition-all text-[#012126] placeholder:text-gray-300"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequest(null)}
                                        className="flex-1 py-4 rounded-xl font-black text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all active:scale-95"
                                    >
                                        {t('cancelRequest')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingDispute}
                                        className="flex-[2] bg-red-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[2px] shadow-lg shadow-red-500/20 hover:bg-black hover:shadow-black/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmittingDispute ? <RefreshCw className="animate-spin" size={16} /> : t('submitDispute')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspection Details Modal */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-[#012126] uppercase tracking-tight">{t('shipmentDetails')}</h3>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest opacity-70">{t('order')} #{viewingDetails.trackingNumber || t('pending')}</p>
                            </div>
                            <button onClick={() => setViewingDetails(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Package Image */}
                            <div className="aspect-video bg-gray-100 rounded-[24px] overflow-hidden relative border border-gray-100 shadow-inner group">
                                {viewingDetails.package?.image || viewingDetails.image ? (
                                    <img src={viewingDetails.package?.image || viewingDetails.image} className="w-full h-full object-cover" alt="Package" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                                        <Package size={48} className="opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Image Provided</span>
                                    </div>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('weight')}</p>
                                    <p className="text-sm font-black text-[#012126]">{viewingDetails.weight || viewingDetails.package?.packageWeight || 0} KG</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('packageCategory')}</p>
                                    <p className="text-sm font-black text-[#012126] uppercase tracking-tight">{t(viewingDetails.category?.toLowerCase()) || viewingDetails.category || t('general')}</p>
                                </div>
                            </div>


                            {/* Receiver Info */}
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('receiverInformation')}</p>
                                <div className="p-6 bg-indigo-50/30 rounded-[24px] border border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-[#012126] uppercase">{viewingDetails.package?.receiverName || t('notFound')}</p>
                                        <p className="text-[9px] text-gray-500 font-bold mt-0.5">{viewingDetails.package?.receiverPhone || t('noPhoneProvided')}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#5845D8] shadow-sm">
                                        <User size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('packageDescription')}</p>
                                <div className="p-6 bg-gray-50 rounded-[24px] border border-gray-100 text-xs font-bold leading-relaxed text-[#012126]">
                                    {viewingDetails.package?.description || viewingDetails.description || t('noDescriptionProvided')}
                                </div>
                            </div>

                            {/* Tracking Info */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Route & Delivery</p>
                                <div className="bg-[#5845D8]/5 p-6 rounded-[24px] border border-[#5845D8]/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-left">
                                            <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{t('from')}</p>
                                            <p className="text-xs font-black text-[#012126] uppercase">{viewingDetails.originCity}</p>
                                        </div>
                                        <div className="h-[1px] flex-1 bg-gray-200 mx-4 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#5845D8] shadow-sm shadow-[#5845D8]/20"></div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{t('to')}</p>
                                            <p className="text-xs font-black text-[#012126] uppercase">{viewingDetails.destinationCity}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-[#5845D8]/10 flex items-center justify-between gap-4">
                                       <div>
                                            <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{t('travelerName')}</p>
                                            <p className="text-[10px] font-black text-[#5845D8] uppercase">{viewingDetails.travelerName || t('reviewingTraveler')}</p>
                                       </div>
                                       {viewingDetails.trackingNumber && (
                                           <div className="text-right">
                                                <button 
                                                    onClick={() => handleDownloadPDF(viewingDetails._id, viewingDetails.trackingNumber)}
                                                    className="inline-flex items-center gap-2 bg-[#012126] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                                >
                                                    <ShieldCheck size={12} />
                                                    {t('downloadLabel')}
                                                </button>
                                           </div>
                                       )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                            <button 
                                onClick={() => setViewingDetails(null)}
                                className="w-full bg-[#012126] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                            >
                                {t('closeOverview')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

