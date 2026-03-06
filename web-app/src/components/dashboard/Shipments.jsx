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
        <div className="space-y-6">
            <div className="mb-10">
                <h2 className="text-3xl font-black text-[#054752]">My Shipments</h2>
                <p className="text-gray-500 font-medium">Track and manage your package deliveries.</p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-[#054752] mb-2 text-center">No active shipments</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">You haven't requested any deliveries yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-[#5845D8] flex-shrink-0">
                                <Package size={32} />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <span className="text-lg font-black text-[#054752]">{req.originCity || 'Dubai'}</span>
                                    <ChevronRight size={18} className="text-gray-300" />
                                    <span className="text-lg font-black text-[#054752]">{req.destinationCity || 'Lagos'}</span>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={14} /> Tracking: {req.trackingNumber || 'BAGO-XXXX'}</span>
                                    <span className="flex items-center gap-1 text-[#5845D8]"><User size={14} /> Traveler: {req.travelerName || 'John D.'}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getStatusColor(req.status)}`}>
                                    {req.status || 'Pending'}
                                </span>
                                <div className="flex gap-2">
                                    <button className="p-2.5 rounded-xl border border-gray-100 text-[#054752] hover:bg-gray-50 transition-all shadow-sm">
                                        <MessageSquare size={18} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedRequest(req)}
                                        className="flex items-center gap-2 px-5 py-2.5 border border-red-100 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all shadow-sm shadow-red-50"
                                    >
                                        <AlertTriangle size={18} />
                                        Raise Dispute
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dispute Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="relative bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100/50">
                        {/* Corner Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>

                        <div className="relative z-10">
                            <div className="p-8 md:p-10 border-b border-gray-50 flex flex-col items-center gap-4 bg-red-50/20">
                                <div className="w-20 h-20 bg-white text-red-500 rounded-[24px] flex items-center justify-center shadow-lg shadow-red-500/10">
                                    <AlertTriangle size={36} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-[#054752] uppercase tracking-tight">Open a Dispute</h3>
                                    <p className="text-xs text-red-600 font-black mt-1 uppercase tracking-widest">Order #{selectedRequest.trackingNumber}</p>
                                </div>
                            </div>
                            <form onSubmit={handleRaiseDispute} className="p-8 md:p-10 space-y-8">
                                <div className="bg-[#F8F6F3] p-5 rounded-2xl border border-gray-100 flex gap-3 italic">
                                    <div className="text-red-500 shrink-0 mt-0.5"><AlertCircle size={16} /></div>
                                    <p className="text-xs font-semibold text-[#054752]/70 leading-relaxed">
                                        Raising a dispute will pause payment release to the traveler. Our support team will investigate and mediate.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-extrabold text-[#054752] uppercase tracking-[0.2em] ml-1">Reason for Dispute</label>
                                    <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        placeholder="Please describe exactly what happened (e.g. package damaged, traveler unreachable, items missing...)"
                                        className="w-full px-6 py-5 bg-[#F8F6F3] rounded-3xl border border-transparent outline-none text-sm font-medium min-h-[140px] focus:ring-4 focus:ring-red-500/5 focus:border-red-500/30 transition-all text-[#054752]"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRequest(null)}
                                        className="flex-1 py-5 rounded-2xl font-black text-gray-400 hover:text-gray-600 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingDispute}
                                        className="flex-[2] bg-red-500 text-white py-5 rounded-[22px] font-black text-lg shadow-2xl shadow-red-500/20 hover:bg-black hover:shadow-black/10 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmittingDispute ? <RefreshCw className="animate-spin" size={20} /> : 'Submit Dispute'}
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

