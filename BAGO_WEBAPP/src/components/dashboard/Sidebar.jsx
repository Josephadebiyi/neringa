import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    MessageCircle,
    Plane,
    Package,
    Wallet,
    Gift,
    Settings,
    LogOut,
    X,
    Shield,
    CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api';

const GENERAL_ITEMS = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'chats', label: 'Messages', icon: MessageCircle, badge: true },
    { id: 'trips', label: 'My Trips', icon: Plane },
    { id: 'shipments', label: 'My Shipments', icon: Package },
    { id: 'deliveries', label: 'My Deliveries', icon: CheckCircle },
];

const ACCOUNT_ITEMS = [
    { id: 'earnings', label: 'Wallet', icon: Wallet },
    { id: 'referral', label: 'Referrals', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, user, logout, sidebarOpen, setSidebarOpen }) {
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
        const id = setInterval(fetchUnread, 30000);
        return () => clearInterval(id);
    }, [user]);

    const NavItem = ({ item }) => {
        const isActive = activeTab === item.id;
        const badge = item.badge ? unreadCount : 0;
        return (
            <button
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${
                    isActive
                        ? 'bg-[#5845D8] text-white shadow-lg shadow-[#5845D8]/25'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
            >
                <div className="flex items-center gap-3">
                    <item.icon
                        size={17}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70 transition-colors'}
                    />
                    <span className={`text-[11px] font-semibold tracking-wide ${isActive ? 'font-bold' : ''}`}>
                        {item.label}
                    </span>
                </div>
                {badge > 0 && !isActive && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-black shadow-lg shadow-red-500/20">
                        {badge}
                    </span>
                )}
            </button>
        );
    };

    const SectionLabel = ({ label }) => (
        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.25em] px-4 mb-2 mt-1">
            {label}
        </p>
    );

    return (
        <aside className={`
            fixed left-0 top-0 h-screen w-64 bg-[#012126] flex flex-col z-40
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
        `}>
            {/* Logo */}
            <div className="px-6 pt-7 pb-5 flex items-center justify-between">
                <Link to="/" className="group flex items-center gap-2">
                    <img
                        src="/bago_logo.png"
                        alt="Bago"
                        className="h-7 brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <span className="hidden text-white font-black text-xl tracking-tight">bago</span>
                </Link>
                <button
                    className="md:hidden p-1.5 rounded-xl text-white/30 hover:text-white/70 transition-colors"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Nav */}
            <div className="flex-1 px-4 overflow-y-auto space-y-5 py-2">
                <div>
                    <SectionLabel label="GENERAL" />
                    <div className="space-y-1">
                        {GENERAL_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
                    </div>
                </div>
                <div>
                    <SectionLabel label="PREFERENCES" />
                    <div className="space-y-1">
                        {ACCOUNT_ITEMS.map(item => <NavItem key={item.id} item={item} />)}
                    </div>
                </div>
            </div>

            {/* User card + Logout */}
            <div className="p-4 border-t border-white/[0.06] mt-auto">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border-2 border-white/10">
                        {user?.image
                            ? <img src={user.image} alt="" className="w-full h-full object-cover" />
                            : (user?.firstName?.charAt(0) || 'B')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-[9px] text-white/30 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all group"
                >
                    <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
