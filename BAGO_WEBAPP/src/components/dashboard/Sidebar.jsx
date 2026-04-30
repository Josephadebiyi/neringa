import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    MessageCircle,
    Plane,
    Package,
    Wallet,
    MapPinned,
    Settings,
    LogOut,
    X,
    Shield,
    CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api';

export default function Sidebar({ activeTab, setActiveTab, user, logout, sidebarOpen, setSidebarOpen }) {
    const { t } = useLanguage();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const res = await api.get('/api/bago/conversations/unread');
                setUnreadCount(res.data?.data?.count || 0);
            } catch (_) {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const menuItems = [
        { id: 'overview', label: t('overview'), icon: LayoutDashboard },
        { id: 'trips', label: t('myTrips'), icon: Plane },
        { id: 'shipments', label: t('myShipments'), icon: Package },
        { id: 'deliveries', label: t('myDeliveries') || 'My Deliveries', icon: CheckCircle },
        { id: 'chats', label: t('chats'), icon: MessageCircle, badge: unreadCount },
        { id: 'earnings', label: t('earnings'), icon: Wallet },
        { id: 'tracking', label: 'Live Map', icon: MapPinned },
        { id: 'settings', label: t('settings'), icon: Settings },
    ];

    return (
        <aside className={`
            fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40
            transition-transform duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.02)]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
        `}>
            <div className="p-8 mb-4 flex items-center justify-between">
                <Link to="/" className="group block">
                    <img src="/bago_logo.png" alt="Bago" className="h-7 group-hover:scale-105 transition-transform duration-300" />
                </Link>
                <button
                    className="md:hidden p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:text-[#5845D8] transition-colors"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 px-4 space-y-1.5">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl transition-all group relative overflow-hidden ${activeTab === item.id
                            ? 'bg-[#5845D8] text-white shadow-xl shadow-[#5845D8]/15 active:scale-95'
                            : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#012126]'
                            }`}
                    >
                        <div className="flex items-center gap-3.5 relative z-10">
                            <item.icon size={18} strokeWidth={activeTab === item.id ? 3 : 2} className={activeTab === item.id ? 'text-white' : 'text-[#5845D8]/40 group-hover:text-[#5845D8] transition-colors'} />
                            <span className={`font-black text-[10px] uppercase tracking-[0.1em] ${activeTab === item.id ? 'tracking-wider' : 'opacity-80'}`}>{item.label}</span>
                        </div>
                        {item.badge && activeTab !== item.id && (
                            <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-black shadow-lg shadow-red-500/20 relative z-10">
                                {item.badge}
                            </span>
                        )}
                        {activeTab === item.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-50"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-50 bg-gray-50/30 font-sans mt-auto">
                <div className="flex items-center gap-3 mb-6 p-2 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="w-10 h-10 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-md shadow-[#5845D8]/10 group overflow-hidden">
                        {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : user?.firstName?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-black text-[#012126] truncate uppercase tracking-tight">{user?.firstName} {user?.lastName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Shield size={9} className={user?.kycStatus === 'approved' ? "text-green-500" : "text-gray-300"} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${user?.kycStatus === 'approved' ? "text-green-500" : "text-gray-400 opacity-60"}`}>{user?.kycStatus === 'approved' ? t('verified') : t('member')}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3.5 px-6 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 font-black transition-all group active:scale-95"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[9px] uppercase tracking-[0.2em]">{t('signOut')}</span>
                </button>
            </div>
        </aside>
    );
}
