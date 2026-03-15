import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Package, MapPin, Calendar, Clock, ChevronRight, CheckCircle, RefreshCw, X, MessageSquare, User, Camera, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Deliveries({ user }) {
    const { t } = useLanguage();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null); // requestId being updated
    const [statusNote, setStatusNote] = useState('');
    const [statusLocation, setStatusLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proofImage, setProofImage] = useState(null);
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
                            <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-[#5845D8] flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-50 shadow-sm">
                                {req.package?.image || req.image ? (
                                    <img src={req.package?.image || req.image} className="w-full h-full object-cover" alt="Item" />
                                ) : (
                                    <Package size={20} />
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5">
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight">{req.originCity}</span>
                                    <ChevronRight size={12} className="text-gray-300" />
                                    <span className="text-xs font-black text-[#012126] uppercase tracking-tight">{req.destinationCity}</span>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-70">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {req.trackingNumber}</span>
                                    <span className="flex items-center gap-1 text-[#5845D8]/70"><User size={10} /> {t('sender') || 'Sender'}: {req.senderName}</span>
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
                                                onClick={() => handleUpdateStatus(req._id, 'accepted')}
                                                className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-md shadow-green-500/10"
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
                                    <button className="p-2 rounded-xl border border-gray-100 text-[#012126] hover:bg-gray-50 transition-all shadow-sm">
                                        <MessageSquare size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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
