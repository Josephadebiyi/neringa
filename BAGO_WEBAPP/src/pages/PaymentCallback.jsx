import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import api from '../api';
import { canRetryPaymentConfirmation, confirmPaymentWithRetry } from '../utils/paymentCheckout';

const PAYMENT_PENDING_MESSAGE =
    'We are confirming your payment. If your bank has already charged you, check your shipments before paying again. You can check this payment again below.';

// Both providers return here; booking is confirmed only after server-side verification.
export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [retryCount, setRetryCount] = useState(0);
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        let alive = true;
        setStatus('processing');
        setMessage('Confirming your payment and shipment...');
        const provider = searchParams.get('provider') || 'flutterwave';
        const reference = provider === 'stripe'
            ? searchParams.get('payment_intent')
            : searchParams.get('transaction_id') || searchParams.get('transactionId');
        const returnedStatus = searchParams.get('status') || searchParams.get('redirect_status');
        if (['cancelled', 'canceled', 'failed'].includes(returnedStatus)) {
            setStatus('error');
            setMessage('Payment was not completed. You can return to checkout and try again.');
            return;
        }
        if (!reference || !['stripe', 'flutterwave'].includes(provider)) {
            setStatus('error');
            setMessage('No valid payment reference found. Please contact support before paying again.');
            return;
        }
        (async () => {
            try {
                const result = await confirmPaymentWithRetry(provider, reference, api, {
                    isActive: () => alive,
                    onRetry: () => { if (alive) setMessage('Confirmation is taking a little longer. Checking again automatically...'); },
                });
                if (!result || !alive) return;
                const { pending, request } = result;
                if (!alive) return;
                setStatus('success');
                navigate('/shipping-success', {
                    replace: true,
                    state: { requestId: request?.id || request?._id || pending.requestId,
                        trackingNumber: request?.trackingNumber, amount: pending.amount,
                        currency: pending.currency, paymentMethod: provider,
                        isAddKg: pending.isAddKgMode, additionalKg: pending.additionalKg },
                });
            } catch (error) {
                if (alive) {
                    setStatus(canRetryPaymentConfirmation(error) ? 'pending' : 'error');
                    setMessage(canRetryPaymentConfirmation(error) ? PAYMENT_PENDING_MESSAGE
                        : 'We could not confirm this checkout. Check your shipments or contact send@sendwithbago.com before paying again.');
                }
            }
        })();
        return () => { alive = false; };
    }, [searchParams, navigate, retryCount]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                {status === 'processing' && (
                    <>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5845D8]/10 rounded-full mb-6">
                            <Loader size={40} className="text-[#5845D8] animate-spin" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Confirming Payment</h1>
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
                            onClick={() => navigate('/dashboard?tab=shipments')}
                            className="w-full bg-[#5845D8] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#4838B5] transition-all"
                        >
                            View Shipments
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
                        <button onClick={() => setRetryCount(value => value + 1)} className="w-full border border-[#5845D8] text-[#5845D8] py-3 rounded-xl font-bold text-sm mb-3">Check Payment Again</button>
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
