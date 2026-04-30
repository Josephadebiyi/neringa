import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../api';

export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        if (!reference) {
            setStatus('error');
            setMessage('No payment reference found. Please contact support.');
            return;
        }
        completePayment(reference);
    }, []);

    const completePayment = async (reference) => {
        try {
            const raw = sessionStorage.getItem('bagoPendingShipment');
            if (!raw) {
                setStatus('error');
                setMessage('Payment session expired. Please try again.');
                return;
            }

            const pending = JSON.parse(raw);

            const res = await api.post('/api/bago/RequestPackage', {
                travelerId: pending.travelerId,
                packageId: pending.packageId,
                tripId: pending.tripId,
                amount: pending.amount,
                currency: pending.currency,
                estimatedDeparture: pending.estimatedDeparture,
                insurance: pending.insurance,
                insuranceCost: pending.insuranceCost || 0,
                paymentReference: reference,
                paymentProvider: 'paystack',
                termsAccepted: true,
            });

            sessionStorage.removeItem('bagoPendingShipment');

            if (res.status === 201 || res.data?.success) {
                const req = res.data.request;
                setStatus('success');
                setTimeout(() => {
                    navigate('/shipping-success', {
                        replace: true,
                        state: {
                            requestId: req?.id || req?._id,
                            trackingNumber: req?.trackingNumber,
                            amount: pending.amount,
                            currency: pending.currency,
                            paymentMethod: 'paystack',
                        },
                    });
                }, 1500);
            } else {
                setStatus('error');
                setMessage(res.data?.message || 'Failed to create shipment request.');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || err.message || 'Payment verification failed. Please contact support.');
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
            </div>
        </div>
    );
}
