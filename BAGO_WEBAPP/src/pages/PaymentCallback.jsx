import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import api from '../api';
import { CHECKOUT_STASH_KEY } from './PaymentCheckout';

const PAYMENT_PENDING_MESSAGE =
    'We are confirming your payment. If your bank has already charged you, your shipment will be created automatically shortly.';

// Lands here after Flutterwave's hosted checkout redirects back. Flutterwave
// appends transaction_id/tx_ref/status query params to whatever redirect_url
// was passed at initialize time (see PaymentCheckout.jsx).
export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        const transactionId = searchParams.get('transaction_id') || searchParams.get('transactionId');
        const flutterwaveStatus = searchParams.get('status');
        if (!transactionId) {
            setStatus('error');
            setMessage('No payment reference found. Please contact support.');
            return;
        }
        if (flutterwaveStatus === 'cancelled') {
            setStatus('error');
            setMessage('Payment was cancelled. You can try again below.');
            return;
        }
        completePayment(transactionId);
    }, []);

    const completePayment = async (transactionId) => {
        try {
            const raw = sessionStorage.getItem(CHECKOUT_STASH_KEY);
            if (!raw) {
                setStatus('error');
                setMessage('Payment session expired. Please try again.');
                return;
            }
            const pending = JSON.parse(raw);

            const verify = await api.get(`/api/payments/flutterwave/verify/${transactionId}`);
            if (!verify.data?.success) {
                setStatus('pending');
                setMessage(PAYMENT_PENDING_MESSAGE);
                return;
            }

            let res;
            if (pending.isAddKgMode) {
                res = await api.post('/api/bago/RequestPackage', {
                    requestId: pending.requestId,
                    additionalKg: pending.additionalKg,
                    paymentReference: transactionId,
                    paymentProvider: 'flutterwave',
                });
            } else {
                res = await api.post('/api/bago/RequestPackage', {
                    travelerId: pending.travelerId,
                    packageId: pending.packageId,
                    tripId: pending.tripId,
                    amount: pending.amount,
                    currency: pending.currency,
                    estimatedDeparture: pending.estimatedDeparture,
                    insurance: pending.insurance,
                    insuranceCost: pending.insuranceCost || 0,
                    paymentReference: transactionId,
                    paymentProvider: 'flutterwave',
                    termsAccepted: true,
                });
            }

            sessionStorage.removeItem(CHECKOUT_STASH_KEY);

            if ([200, 201, 202].includes(res.status) || res.data?.success) {
                const req = res.data.request || res.data.data || res.data;
                setStatus('success');
                setTimeout(() => {
                    navigate('/shipping-success', {
                        replace: true,
                        state: {
                            requestId: req?.id || req?._id || pending.requestId,
                            trackingNumber: req?.trackingNumber,
                            amount: pending.amount,
                            currency: pending.currency,
                            paymentMethod: 'flutterwave',
                            isAddKg: pending.isAddKgMode,
                            additionalKg: pending.additionalKg,
                        },
                    });
                }, 1500);
            } else {
                console.error('[payment-callback]', res.data);
                setStatus('pending');
                setMessage(PAYMENT_PENDING_MESSAGE);
            }
        } catch (err) {
            console.error('[payment-callback]', err);
            setStatus('pending');
            setMessage(PAYMENT_PENDING_MESSAGE);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                {status === 'processing' && (
                    <>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5845D8]/10 rounded-full mb-6">
                            <Loader size={40} className="text-[#5845D8] animate-spin" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Processing Payment</h1>
                        <p className="text-gray-500 text-sm">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Confirmed!</h1>
                        <p className="text-gray-500 text-sm">Redirecting to your shipment details...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                            <XCircle size={40} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Error</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/send-package')}
                            className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#4838B5] transition-all"
                        >
                            Try Again
                        </button>
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5845D8]/10 rounded-full mb-6">
                            <Clock size={40} className="text-[#5845D8]" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Still Confirming</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard?tab=shipments')}
                            className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#4838B5] transition-all"
                        >
                            View Shipments
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
