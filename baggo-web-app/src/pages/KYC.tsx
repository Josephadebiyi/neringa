import React, { useState } from 'react';
import { ShieldCheck, Camera, FileText, CheckCircle2, Loader2, ArrowRight, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const KYC: React.FC = () => {
    const { updateUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [idType, setIdType] = useState<string>('');

    const handleUpload = async () => {
        setIsUploading(true);
        // Simulate API call for ID verification
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsUploading(false);
        setStep(step + 1);
    };

    const completeVerification = () => {
        updateUser({ kycStatus: 'Verified' });
        navigate('/profile');
    };

    return (
        <div className="pt-32 pb-40 px-6 min-h-screen bg-slate-50/30 flex items-center justify-center">
            <div className="max-w-2xl w-full">

                {/* Stepper Header */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= s ? 'bg-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20' : 'bg-slate-200 text-slate-400'
                                }`}>
                                {step > s ? <CheckCircle2 size={20} /> : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-1 bg-slate-200 rounded-full overflow-hidden`}>
                                <div className={`h-full bg-brand-primary transition-all duration-1000 ${step > s ? 'w-full' : 'w-0'}`} />
                            </div>}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[4rem] p-12 md:p-16 shadow-2xl border-2 border-slate-50 relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 -z-10" />

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8">
                                <ShieldCheck className="text-brand-primary" size={40} />
                            </div>
                            <h1 className="text-4xl font-black mb-6 tracking-tight italic uppercase">Identity Verification</h1>
                            <p className="text-slate-500 font-bold mb-10 leading-relaxed">
                                To ensure the safety of our community, all Bago members must verify their identity.
                                This takes less than 2 minutes.
                            </p>

                            <div className="grid gap-4 mb-12">
                                {['Passport', 'Driver\'s License', 'National ID Card'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setIdType(type)}
                                        className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${idType === type ? 'border-brand-primary bg-brand-primary/5 shadow-lg' : 'border-slate-100 hover:border-brand-primary/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                <FileText size={20} className={idType === type ? 'text-brand-primary' : 'text-slate-400'} />
                                            </div>
                                            <span className={`font-black uppercase tracking-widest text-sm ${idType === type ? 'text-slate-900' : 'text-slate-400'}`}>{type}</span>
                                        </div>
                                        <ArrowRight size={20} className={`transition-all ${idType === type ? 'text-brand-primary translate-x-0' : 'text-slate-200 -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={!idType}
                                onClick={() => setStep(2)}
                                className="btn-bold-primary w-full py-6 text-xl tracking-tighter disabled:opacity-30 disabled:grayscale transition-all"
                            >
                                CONTINUE TO UPLOAD
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 text-center">
                            <div className="w-24 h-24 bg-brand-secondary/10 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto">
                                <Camera className="text-brand-secondary" size={48} />
                            </div>
                            <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter">Snap a Photo</h2>
                            <p className="text-slate-500 font-bold mb-12 leading-relaxed">
                                Position your <span className="text-brand-primary">{idType}</span> within the frame.
                                Make sure all corners are visible.
                            </p>

                            <div
                                className={`aspect-[4/3] rounded-[3rem] border-4 border-dashed mb-12 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${isUploading ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 hover:border-brand-primary/20 hover:bg-slate-50/50'
                                    }`}
                                onClick={!isUploading ? handleUpload : undefined}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 className="animate-spin text-brand-primary" size={64} />
                                        <div className="space-y-2">
                                            <p className="font-black text-brand-primary uppercase tracking-[0.2em] text-xs">Analyzing Image...</p>
                                            <p className="text-[10px] text-slate-400 font-bold lowercase italic">Bago AI is scanning for authenticity</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white p-6 rounded-full shadow-xl mb-4 group-hover:scale-110 transition-transform duration-500">
                                            <UploadCloud size={40} className="text-brand-primary" />
                                        </div>
                                        <p className="font-black uppercase tracking-widest text-xs text-slate-400">Tap to upload or take photo</p>
                                    </>
                                )}
                            </div>

                            {!isUploading && (
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-brand-primary transition-colors"
                                >
                                    Go back and change document
                                </button>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in zoom-in duration-700 text-center py-8">
                            <div className="relative mb-12">
                                <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
                                    <CheckCircle2 color="white" size={64} />
                                </div>
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
                            </div>

                            <h2 className="text-5xl font-black mb-4 uppercase italic tracking-tighter text-slate-900">Verified!</h2>
                            <p className="text-slate-500 font-bold mb-12 leading-relaxed max-w-sm mx-auto">
                                Congratulations! Your identity has been confirmed by our AI system.
                                You are now a trusted member of Bago.
                            </p>

                            <button
                                onClick={completeVerification}
                                className="btn-bold-primary w-full py-6 text-xl tracking-tighter"
                            >
                                START USING BAGO
                            </button>
                        </div>
                    )}

                </div>

                <div className="mt-12 flex items-center justify-center gap-3 italic font-bold text-slate-400 text-sm">
                    <ShieldCheck size={18} className="text-brand-primary opacity-50" />
                    Secure 256-bit encrypted verification. Bago never stores raw ID data.
                </div>
            </div>
        </div>
    );
};

export default KYC;
