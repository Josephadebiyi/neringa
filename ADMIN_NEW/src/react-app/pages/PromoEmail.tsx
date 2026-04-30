import { useState, useRef } from 'react';
import {
    Send,
    Users,
    ShieldCheck,
    ShieldAlert,
    Loader2,
    ArrowLeft,
    X,
    Upload,
    Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_API, sendPromoEmail } from '../services/api';

export default function PromoEmail() {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targetGroup, setTargetGroup] = useState<'all' | 'verified' | 'unverified'>('all');
    const [bodyImages, setBodyImages] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<{ name: string, url: string }[]>([]);
    const [uploading, setUploading] = useState<'body' | 'attachment' | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const bodyImageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'body' | 'attachment') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'body' && bodyImages.length >= 2) return;

        setUploading(type);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${ADMIN_API}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                if (type === 'body') {
                    setBodyImages([...bodyImages, data.url]);
                } else {
                    setAttachments([...attachments, { name: file.name, url: data.url }]);
                }
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: `Upload Error: ${err.message}` });
        } finally {
            setUploading(null);
        }
    };

    const removeBodyImage = (index: number) => {
        setBodyImages(bodyImages.filter((_, i) => i !== index));
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const result = await sendPromoEmail({
                subject,
                body,
                targetGroup,
                images: bodyImages,
                fileAttachments: attachments
            });

            if (result.success) {
                setMessage({ type: 'success', text: `Successfully sent to targeted users!` });
                setSubject('');
                setBody('');
                setBodyImages([]);
                setAttachments([]);
            } else {
                throw new Error(result.message || 'Failed to send emails');
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
                        Promo Engine
                    </h1>
                    <p className="text-gray-500 font-medium">Draft and dispatch promotional broadcasts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Side */}
                <div className="premium-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {message.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                <p className="text-sm font-bold">{message.text}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Audience</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'all', label: 'All Users', icon: Users },
                                    { id: 'verified', label: 'Verified', icon: ShieldCheck },
                                    { id: 'unverified', label: 'Unverified', icon: ShieldAlert },
                                ].map((group) => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setTargetGroup(group.id as any)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${targetGroup === group.id
                                            ? 'border-[#5240E8] bg-[#5240E8]/5 text-[#5240E8]'
                                            : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100'
                                            }`}
                                    >
                                        <group.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{group.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Line</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Exciting updates from Bago Logistics!"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 focus:border-[#5240E8] outline-none transition-all font-bold placeholder:text-gray-300"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Type your promotional message here..."
                                rows={6}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5240E8]/10 focus:border-[#5240E8] outline-none transition-all font-medium placeholder:text-gray-300 resize-none"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Body Media (Max 2)</label>
                                <p className="text-[9px] text-gray-400 mb-2 italic">These will be embedded into the message body.</p>
                                <input
                                    type="file"
                                    ref={bodyImageInputRef}
                                    onChange={(e) => handleFileUpload(e, 'body')}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    {bodyImages.map((img, i) => (
                                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                            <img src={img} alt="Preview" className="w-full h-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => removeBodyImage(i)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black text-white rounded-full transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {bodyImages.length < 2 && (
                                        <button
                                            type="button"
                                            onClick={() => bodyImageInputRef.current?.click()}
                                            disabled={uploading !== null}
                                            className="aspect-video rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#5240E8] hover:text-[#5240E8] transition-all bg-gray-50/50"
                                        >
                                            {uploading === 'body' ? (
                                                <Loader2 className="w-6 h-6 animate-spin text-[#5240E8]" />
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Add Body Media</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Attachments (Files)</label>
                                <p className="text-[9px] text-gray-400 mb-2 italic">These will show as downloadable files at the bottom.</p>
                                <input
                                    type="file"
                                    ref={attachmentInputRef}
                                    onChange={(e) => handleFileUpload(e, 'attachment')}
                                    className="hidden"
                                />

                                <div className="space-y-2">
                                    {attachments.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                                    <Upload className="w-4 h-4 text-[#5240E8]" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(i)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => attachmentInputRef.current?.click()}
                                        disabled={uploading !== null}
                                        className="w-full p-4 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center gap-3 text-gray-400 hover:border-[#5240E8] hover:text-[#5240E8] transition-all bg-gray-50/50"
                                    >
                                        {uploading === 'attachment' ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-[#5240E8]" />
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Attach Document</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-[#5240E8] hover:bg-[#4030C8] text-white rounded-[22px] font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#5240E8]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Sending Broadcast...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Dispatch Promo</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Preview Side */}
                <div className="hidden lg:flex flex-col">
                    <div className="p-4 bg-slate-900 rounded-t-[32px] border-x border-t border-slate-800 flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        </div>
                        <div className="bg-slate-800 rounded-lg px-3 py-1 text-[10px] text-slate-400 font-bold flex-1 text-center">
                            Email Preview: {subject || 'Subject Line'}
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-100 p-8 rounded-b-[32px] border-x border-b border-gray-200 overflow-y-auto max-h-[700px]">
                        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm overflow-hidden pb-8">
                            <div className="bg-[#5240E8] p-6 text-center">
                                <img src="https://res.cloudinary.com/dmito8es3/image/upload/v1761919738/Bago_New_2_gh1gmn.png" alt="Bago" width="100" className="mx-auto" />
                            </div>
                            <div className="p-8">
                                <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {body || 'Your promotional message will appear here...'}
                                </div>
                                {bodyImages.map((img, i) => (
                                    <div key={i} className="mt-6 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                        <img src={img} alt="Promo" className="w-full h-auto" />
                                    </div>
                                ))}
                                <div className="text-center mt-8">
                                    <button className="px-8 py-3 bg-[#5240E8] text-white rounded-xl font-bold text-sm">
                                        Explore Bago
                                    </button>
                                </div>
                            </div>

                            {attachments.length > 0 && (
                                <div className="px-8 mt-4">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Attached Files</div>
                                    <div className="space-y-2">
                                        {attachments.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                <Upload className="w-3 h-3 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-600 truncate">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-12 p-6 bg-gray-50 text-center border-t border-gray-100">
                                <p className="text-[10px] text-gray-400">© 2024 Bago Logistics Terminal. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
