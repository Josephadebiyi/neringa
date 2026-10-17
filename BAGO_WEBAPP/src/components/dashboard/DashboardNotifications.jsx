import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { notificationDestination } from '../../utils/notificationDestination';

const notificationId = (item) => item.id || item._id;

export default function DashboardNotifications({ open, setOpen, onCountChange }) {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [limit, setLimit] = useState(50);
    const busy = useRef(false);
    const controller = useRef(null);

    const refresh = useCallback(async () => {
        if (busy.current) return;
        busy.current = true;
        const request = new AbortController();
        controller.current = request;
        try {
            const response = await api.get('/api/bago/getNotifications', { signal: request.signal });
            if (response.data?.success !== true || !Array.isArray(response.data?.data?.notifications)) {
                throw new Error('Invalid notification response');
            }
            if (!request.signal.aborted) {
                setItems(response.data.data.notifications);
                setError('');
            }
        } catch {
            if (!request.signal.aborted) setError('Notifications could not be refreshed. Please try again.');
        } finally {
            if (!request.signal.aborted) setLoading(false);
            busy.current = false;
        }
    }, []);

    useEffect(() => {
        refresh();
        const check = () => { if (document.visibilityState === 'visible') refresh(); };
        const timer = window.setInterval(check, 20000);
        window.addEventListener('focus', check);
        document.addEventListener('visibilitychange', check);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', check);
            document.removeEventListener('visibilitychange', check);
            controller.current?.abort();
            busy.current = false;
        };
    }, [refresh]);

    const unread = items.filter((item) => !item.isRead);
    useEffect(() => { onCountChange(unread.length); }, [unread.length, onCountChange]);

    const markAllRead = async () => {
        setSaving(true);
        const ids = new Set(items.map(notificationId));
        try {
            await api.put('/api/bago/markAllNotificationsAsRead');
            setItems((current) => current.map((item) => ids.has(notificationId(item)) ? { ...item, isRead: true } : item));
            setError('');
        } catch {
            setError('Notifications could not be marked as read. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const view = (item) => {
        if (!item.isRead) {
            api.put(`/api/bago/markNotificationAsRead/${encodeURIComponent(notificationId(item))}`)
                .then(() => setItems((current) => current.map((entry) => notificationId(entry) === notificationId(item) ? { ...entry, isRead: true } : entry)))
                .catch(() => setError('The notification could not be marked as read.'));
        }
        navigate(notificationDestination(item));
    };

    const visible = open ? items.slice(0, limit) : unread.slice(0, 3);
    return (
        <section id="dashboard-notifications" aria-label="Dashboard notifications" className="mb-6 rounded-2xl border border-[#5845D8]/15 bg-white overflow-hidden scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4">
                <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="dashboard-notification-list" className="flex items-center gap-2 text-sm font-bold text-[#171B22]">
                    <Bell size={19} className="text-[#5845D8]" />
                    Notifications
                    {unread.length > 0 && <span className="rounded-full bg-[#5845D8] px-2 py-0.5 text-xs text-white">{unread.length} unread</span>}
                </button>
                <div className="flex items-center gap-4 text-xs font-semibold">
                    {unread.length > 0 && <button type="button" disabled={saving} onClick={markAllRead} className="flex items-center gap-1 text-[#5845D8] disabled:opacity-50"><CheckCheck size={15} />{saving ? 'Saving…' : 'Mark all read'}</button>}
                    <button type="button" onClick={refresh} aria-label="Refresh notifications" className="text-gray-500 hover:text-[#5845D8]"><RefreshCw size={15} /></button>
                    <button type="button" onClick={() => setOpen(!open)} className="text-[#5845D8]">{open ? 'Show less' : 'View all'}</button>
                </div>
            </div>
            <div aria-live="polite" className="sr-only">{unread.length} unread notifications</div>
            {error && <p role="alert" className="px-5 pb-3 text-sm text-amber-800">{error}</p>}
            <div id="dashboard-notification-list" className="max-h-96 overflow-y-auto">
                {visible.map((item) => (
                    <button key={notificationId(item)} type="button" onClick={() => view(item)} className={`w-full flex items-start gap-3 border-t border-gray-100 px-4 sm:px-5 py-4 text-left hover:bg-purple-50 transition-colors ${!item.isRead ? 'bg-[#5845D8]/5' : ''}`}>
                        <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${item.isRead ? 'bg-gray-200' : 'bg-[#5845D8]'}`} />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-[#171B22]">{item.title || 'Account update'}</span>
                            <span className="block mt-1 text-sm text-gray-600 break-words">{item.body || item.message}</span>
                            {item.createdAt && !Number.isNaN(Date.parse(item.createdAt)) && <time dateTime={item.createdAt} className="block mt-1 text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</time>}
                        </span>
                        <ChevronRight size={16} className="mt-1 shrink-0 text-gray-400" />
                    </button>
                ))}
                {!visible.length && !error && <p className="px-5 pb-4 text-sm text-gray-500">{loading ? 'Loading notifications…' : open ? 'No notifications yet.' : 'You’re all caught up.'}</p>}
            </div>
            {!open && unread.length > 3 && <button type="button" onClick={() => setOpen(true)} className="w-full border-t border-gray-100 py-3 text-sm font-semibold text-[#5845D8]">View all {unread.length} unread notifications</button>}
            {open && items.length > limit && <button type="button" onClick={() => setLimit((count) => count + 50)} className="w-full border-t border-gray-100 py-3 text-sm font-semibold text-[#5845D8]">Load more notifications</button>}
        </section>
    );
}
