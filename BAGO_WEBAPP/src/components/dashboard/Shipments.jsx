import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Package, Clock, ChevronRight, AlertTriangle, ShieldCheck, RefreshCw, X, MessageSquare, User, ArrowLeft, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Shipments({ onNavigateToChat }) {
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [confirming, setConfirming] = useState(null);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/recentOrder');
            const myShipments = (res.data?.data || []).filter(req => req.role === 'sender');
            setRequests(myShipments);
        } catch (err) {
            console.error('Failed to load shipments:', err);
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
            case 'delivering': return 'text-amber-600 bg-amber-50';
            case 'in-transit': return 'text-blue-600 bg-blue-50';
            case 'disputed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusLabel = (req) => {
        if (req.status === 'delivering' && !req.senderReceived) return 'Awaiting Sender Confirmation';
        return req.status || 'Pending';
    };

    const getReceiverInfo = (request) => {
        const pkg = request?.package || {};
        const recipient = request?.recipient_details || request?.recipientDetails || pkg.recipient_details || pkg.recipientDetails || {};
        return {
            name: request?.receiverName || request?.receiver_name || pkg.receiverName || pkg.receiver_name || recipient.receiver_name || recipient.receiverName || '',
            phone: request?.receiverPhone || request?.receiver_phone || pkg.receiverPhone || pkg.receiver_phone || recipient.receiver_phone || recipient.receiverPhone || '',
            email: request?.receiverEmail || request?.receiver_email || pkg.receiverEmail || pkg.receiver_email || recipient.receiver_email || recipient.receiverEmail || '',
        };
    };

    const handleConfirmDelivery = async (requestId) => {
        setConfirming(requestId);
        try {
            await api.put(`/api/bago/request/${requestId}/confirm-received`);
            await fetchMyRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not confirm delivery. Please try again.');
        } finally {
            setConfirming(null);
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
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight">{req.originCity || req.from_city || '—'}</span>
                                    <ChevronRight size={12} className="text-gray-300" />
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight">{req.destinationCity || req.to_city || '—'}</span>
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
                                    {getStatusLabel(req)}
                                </span>
                                {req.status === 'delivering' && !req.senderReceived && (
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3 text-right max-w-xs">
                                        <p className="text-[9px] font-bold text-amber-800 mb-2">
                                            The traveler marked this shipment as delivered. Confirm receipt to release payment, or report an issue.
                                        </p>
                                        <button
                                            onClick={() => handleConfirmDelivery(req._id)}
                                            disabled={confirming === req._id}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-white disabled:opacity-60"
                                        >
                                            {confirming === req._id ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                                            Confirm Delivery
                                        </button>
                                    </div>
                                )}
                                {req.travelerProof && (
                                    <div className="flex flex-col items-center md:items-end gap-1.5 mt-1">
                                        <p className="text-[7px] font-black text-[#5845D8] uppercase tracking-widest uppercase italic">{t('travelerUploadedProof')}</p>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                            <img src={req.travelerProof} className="w-full h-full object-cover" alt="Delivery Proof" onClick={() => window.open(req.travelerProof, '_blank', 'noopener,noreferrer')} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
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

            {/* Full-page Shipment Detail View */}
            {viewingDetails && <ShipmentDetailPage
                req={viewingDetails}
                onBack={() => setViewingDetails(null)}
                onDownload={handleDownloadPDF}
                downloading={downloading}
                onNavigateToChat={onNavigateToChat}
                onDispute={() => { setSelectedRequest(viewingDetails); setViewingDetails(null); }}
                getReceiverInfo={getReceiverInfo}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                t={t}
            />}
        </div>
    );
}

function ShipmentDetailPage({ req, onBack, onDownload, downloading, onNavigateToChat, onDispute, getReceiverInfo, getStatusColor, getStatusLabel, t }) {
    const [imgFullscreen, setImgFullscreen] = useState(false);
    const imgUrl = req.package?.image || req.image;
    const receiver = getReceiverInfo(req);

    return (
        <div className="animate-in fade-in duration-300">
            {/* Back header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#5845D8] font-black text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                    <ArrowLeft size={16} /> Back to Shipments
                </button>
                <div className="flex-1 h-[1px] bg-gray-100" />
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                    {getStatusLabel(req)}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left – image + description */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Package Image */}
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
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-2">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('packageDescription')}</p>
                        <p className="text-sm font-bold leading-relaxed text-[#012126]">
                            {req.package?.description || req.description || t('noDescriptionProvided')}
                        </p>
                    </div>

                    {/* Delivery proof */}
                    {req.travelerProof && (
                        <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-3">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('travelerUploadedProof')}</p>
                            <img
                                src={req.travelerProof}
                                className="w-full max-h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                alt="Delivery Proof"
                                onClick={() => window.open(req.travelerProof, '_blank', 'noopener,noreferrer')}
                            />
                        </div>
                    )}
                </div>

                {/* Right – details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Route */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">Route</p>
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{t('from')}</p>
                                <p className="text-sm font-black text-[#012126] uppercase">{req.originCity || '—'}</p>
                            </div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-[#5845D8]/20 via-[#5845D8] to-[#5845D8]/20 rounded-full" />
                            <div className="text-right">
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{t('to')}</p>
                                <p className="text-sm font-black text-[#012126] uppercase">{req.destinationCity || '—'}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Tracking No.</p>
                                <p className="text-[10px] font-black text-[#5845D8]">{req.trackingNumber || 'BAGO-PENDING'}</p>
                            </div>
                            <div>
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{t('travelerName')}</p>
                                <p className="text-[10px] font-black text-[#012126]">{req.travelerName || t('reviewingTraveler')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Package info */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">Package Info</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-[16px] border border-gray-100">
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1.5">{t('weight')}</p>
                                <p className="text-base font-black text-[#012126]">{req.weight || req.package?.packageWeight || 0} KG</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-[16px] border border-gray-100">
                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1.5">{t('packageCategory')}</p>
                                <p className="text-base font-black text-[#012126] uppercase tracking-tight truncate">
                                    {req.category || t('general')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Receiver */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('receiverInformation')}</p>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#5845D8]/10 flex items-center justify-center text-[#5845D8] shrink-0">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#012126]">{receiver.name || t('notFound')}</p>
                                <p className="text-[9px] text-gray-500 font-bold">{receiver.phone || t('noPhoneProvided')}</p>
                                {receiver.email && <p className="text-[9px] text-gray-400 font-bold break-all">{receiver.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-3">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-4">Actions</p>
                        {req.trackingNumber && (
                            <button
                                onClick={() => onDownload(req._id, req.trackingNumber)}
                                disabled={downloading === req._id}
                                className="w-full flex items-center justify-center gap-2 bg-[#012126] text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                            >
                                {downloading === req._id ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                {downloading === req._id ? 'Downloading…' : t('downloadLabel') || 'Download Label'}
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
                            {t('dispute') || 'Raise Dispute'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen image lightbox */}
            {imgFullscreen && imgUrl && (
                <div
                    className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setImgFullscreen(false)}
                >
                    <button
                        onClick={() => setImgFullscreen(false)}
                        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors bg-white/10 rounded-full p-2"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={imgUrl}
                        alt="Package"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
