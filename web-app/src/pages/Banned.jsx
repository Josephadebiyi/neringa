import React from 'react';
import { Link } from 'react-router-dom';
import { Ban, AlertCircle, Mail } from 'lucide-react';

export default function Banned() {
    return (
        <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-6">
            <div className="max-w-xl w-full">
                <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-[#012126]/5 border border-gray-100 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-bl-full -mr-20 -mt-20 z-0"></div>

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Ban size={48} />
                        </div>

                        <h1 className="text-4xl font-black text-[#012126] mb-4 uppercase tracking-tight">Account Restricted</h1>
                        <p className="text-gray-500 text-lg font-medium mb-10 leading-relaxed">
                            Your account has been permanently banned for violating our community guidelines or terms of service.
                        </p>

                        <div className="bg-[#F8F6F3] rounded-3xl p-6 mb-10 border border-gray-200/50 flex items-start gap-4 text-left">
                            <AlertCircle className="text-red-500 shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="font-bold text-[#012126] mb-1">What can I do?</h4>
                                <p className="text-sm text-gray-500 font-medium">If you believe this is a mistake, you can appeal this decision by contacting our support team.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <a
                                href="mailto:support@bggo.com"
                                className="flex-1 bg-[#012126] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-xl shadow-[#012126]/20"
                            >
                                <Mail size={20} /> Contact Support
                            </a>
                            <Link
                                to="/"
                                className="flex-1 bg-white text-[#012126] border-2 border-gray-100 font-black py-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
                            >
                                Back to Home
                            </Link>
                        </div>

                        <p className="mt-12 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Reference ID: BAGO-992-BANNED</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
