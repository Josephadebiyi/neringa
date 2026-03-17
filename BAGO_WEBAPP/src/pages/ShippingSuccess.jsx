import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, Download, Home, MessageSquare, ArrowRight } from 'lucide-react';
import api from '../api';

export default function ShippingSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    const {
        requestId,
        trackingNumber,
        paymentMethod,
        amount,
        currency
    } = location.state || {};

    useEffect(() => {
        if (!requestId) {
            navigate('/dashboard');
            return;
        }

        fetchRequestDetails();
    }, [requestId]);

    const fetchRequestDetails = async () => {
        try {
            const res = await api.get(`/api/bago/request/${requestId}/details`);
            if (res.data.success) {
                setRequest(res.data.data);
            }
        } catch (err) {
            // Silent fail - show basic info from state
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/api/bago/request/${requestId}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BAGO_Shipment_${trackingNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download shipping label. Please try again from your dashboard.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-500">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 sm:p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mb-4 shadow-lg animate-in zoom-in duration-300 delay-100">
                            <CheckCircle size={window.innerWidth < 640 ? 40 : 48} className="text-green-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 animate-in slide-in-from-bottom duration-300 delay-200">
                            Shipment Request Successful!
                        </h1>
                        <p className="text-green-100 text-sm animate-in slide-in-from-bottom duration-300 delay-300">
                            Your package is ready to be delivered
                        </p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Tracking Number */}
                    <div className="bg-[#5845D8]/5 border-2 border-[#5845D8]/20 rounded-2xl p-4 sm:p-6 text-center animate-in slide-in-from-bottom duration-300 delay-400">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">
                            Tracking Number
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-[#5845D8] tracking-wider break-all">
                            {trackingNumber || 'GENERATING...'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Use this to track your shipment
                        </p>
                    </div>

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in slide-in-from-bottom duration-300 delay-500">
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">
                                Payment Method
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900 capitalize">
                                {paymentMethod === 'wallet' ? 'Bago Wallet' : 'Card Payment'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">
                                Amount Paid
                            </p>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                                {currency} {amount?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                    </div>

                    {/* Package Details */}
                    {request && request.package && (
                        <div className="border border-gray-200 rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom duration-300 delay-600">
                            <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                                <Package size={16} className="text-[#5845D8]" />
                                Package Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block mb-1">Description</span>
                                    <p className="font-semibold text-gray-900">{request.package.description || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block mb-1">Weight</span>
                                    <p className="font-semibold text-gray-900">{request.package.packageWeight || 0} kg</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block mb-1">From</span>
                                    <p className="font-semibold text-gray-900">{request.package.fromCity || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-xs text-gray-500 block mb-1">To</span>
                                    <p className="font-semibold text-gray-900">{request.package.toCity || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 animate-in slide-in-from-bottom duration-300 delay-700">
                        <button
                            onClick={handleDownloadPDF}
                            className="w-full bg-[#5845D8] text-white py-3 sm:py-4 rounded-xl font-bold text-sm hover:bg-[#4838B5] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            <Download size={20} />
                            Download Shipping Label
                        </button>

                        <Link
                            to="/dashboard"
                            className="w-full bg-[#012126] text-white py-3 sm:py-4 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            <MessageSquare size={20} />
                            Go to Dashboard
                        </Link>

                        <Link
                            to="/"
                            className="w-full border-2 border-gray-200 text-gray-700 py-3 sm:py-4 rounded-xl font-bold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Home size={20} />
                            Back to Home
                        </Link>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 sm:p-5 animate-in slide-in-from-bottom duration-300 delay-800">
                        <h4 className="font-bold text-sm text-blue-900 mb-3 flex items-center gap-2">
                            <ArrowRight size={16} className="text-blue-600" />
                            What's Next?
                        </h4>
                        <ul className="space-y-2 text-xs text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">✓</span>
                                <span>Wait for the traveler to accept your request</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">✓</span>
                                <span>You'll receive notifications about your shipment status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">✓</span>
                                <span>Track your package using the tracking number above</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 font-bold">✓</span>
                                <span>Chat with the traveler directly from your dashboard</span>
                            </li>
                        </ul>
                    </div>

                    {/* Branding Footer */}
                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-widest">
                            Powered by <span className="font-bold text-[#5845D8]">Bago</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
