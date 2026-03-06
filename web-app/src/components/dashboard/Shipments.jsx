import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Package, MapPin, Calendar, Clock, ChevronRight, AlertTriangle, ShieldCheck, CheckCircle, RefreshCw, X, MessageSquare, User } from 'lucide-react';

export default function Shipments({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/bago/recentOrder'); // Adjust endpoint as needed for user-specific shipments
            setRequests(res.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch shipments", err);
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
            alert('Dispute raised successfully. Support team will contact you.');
            setSelectedRequest(null);
            setDisputeReason('');
            fetchMyRequests();
        } catch (err) {
            alert('Failed to raise dispute');
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

    if (loading) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-[#5845D8]" size={40} /></div>;

    return (
        <div className="space-y-6 font-sans">
            <div className="mb-8 px-1">
                <h2 className="text-lg font-black text-[#054752] tracking-tight uppercase">My Shipments</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70">Track and manage your package deliveries.</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[24px] p-12 text-center border border-dashed border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Package size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-black text-[#054752] mb-1.5 text-center uppercase tracking-tight">No active shipments</h3>
                    <p className="text-gray-400 text-[10px] max-w-xs mx-auto mb-8 font-bold uppercase tracking-wider opacity-60 leading-relaxed">You haven't requested any deliveries yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req._id} className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-5 items-center group hover:border-[#5845D8]/20 transition-all">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#5845D8] flex-shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-50 shadow-sm">
                                <Package size={20} />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5">
                                    <span className="text-xs font-black text-[#054752] uppercase tracking-tight">{req.originCity || 'Dubai'}</span>
                                    <ChevronRight size={12} className="text-gray-300" />
                                    <span className="text-xs font-black text-[#054752] uppercase tracking-tight">{req.destinationCity || 'Lagos'}</span>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-70">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {req.trackingNumber || 'BAGO-XXXX'}</span>
                                    <span className="flex items-center gap-1 text-[#5845D8]/70"><User size={10} /> Traveler: {req.travelerName || 'John D.'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(req.status)}`}>
                                    {req.status || 'Pending'}
                                </span>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-xl border border-gray-100 text-[#054752] hover:bg-gray-50 transition-all shadow-sm">
                                        <MessageSquare size={14} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-50 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm shadow-red-50"
                                    >
                                        <AlertTriangle size={14} />
                                        Dispute
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
                                    <h3 className="text-xl font-black text-[#054752] uppercase tracking-tight">Open a Dispute</h3>
                                    <p className="text-[9px] text-red-600 font-black mt-1 uppercase tracking-widest opacity-70">Order #{selectedRequest.trackingNumber}</p>
                                </div>
                            </div>
                            <form onSubmit={handleRaiseDispute} className="p-6 md:p-8 space-y-6">
                                <div className="bg-[#F8F6F3] p-4 rounded-xl border border-gray-50 flex gap-2.5 italic">
                                    <div className="text-red-500 shrink-0 mt-0.5"><AlertTriangle size={14} /></div>
                                    <p className="text-[10px] font-bold text-[#054752]/70 leading-relaxed uppercase tracking-wide">
                                        Raising a dispute will pause payment release to the traveler. Our team will investigate and mediate within 24-48h.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#054752] uppercase tracking-widest ml-1 cursor-none">Dispute Details</label>
                                    <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        placeholder="Please describe exactly what happened (e.g. package damaged, traveler unreachable...)"
                                        className="w-full px-5 py-4 bg-[#F8F6F3] rounded-2xl border border-transparent outline-none text-xs font-bold min-h-[120px] focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 transition-all text-[#054752] placeholder:text-gray-300"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequest(null)}
                                        className="flex-1 py-4 rounded-xl font-black text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all active:scale-95"
                                    >
                                        Cancel Request
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingDispute}
                                        className="flex-[2] bg-red-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[2px] shadow-lg shadow-red-500/20 hover:bg-black hover:shadow-black/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmittingDispute ? <RefreshCw className="animate-spin" size={16} /> : 'Submit Dispute'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

