import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    ChevronDown,
    ExternalLink,
    LogOut,
    MessageCircle,
    Package,
    Plane,
    Settings,
    Sparkles,
} from 'lucide-react';
import { GENERAL_ITEMS, filterByStaffPermission, getAccountItems } from './Sidebar';

// Tabs that always sit in the dark pill bar; everything else goes under "More".
const PRIMARY_IDS = ['overview', 'trips', 'shipments', 'deliveries', 'chats', 'earnings'];
const PRIMARY_LABELS = {
    overview: 'Overview',
    trips: 'Trips',
    shipments: 'Shipments',
    deliveries: 'Deliveries',
    chats: 'Messages',
    earnings: 'Wallet',
};

function useClickOutside(ref, onOutside) {
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onOutside();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onOutside]);
}

function IconButton({ label, onClick, to, children, badge = 0 }) {
    const className =
        'relative w-11 h-11 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-[#171B22] hover:border-[#5845D8]/40 hover:text-[#5845D8] transition-colors';
    const content = (
        <>
            {children}
            {badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#F7F7FC]">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </>
    );
    if (to) {
        return (
            <Link to={to} aria-label={label} title={label} className={className}>
                {content}
            </Link>
        );
    }
    return (
        <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
            {content}
        </button>
    );
}

export default function TopNav({ activeTab, setActiveTab, user, logout, isBusinessAccount, unreadCount }) {
    const [moreOpen, setMoreOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const moreRef = useRef(null);
    const menuRef = useRef(null);
    useClickOutside(moreRef, () => setMoreOpen(false));
    useClickOutside(menuRef, () => setMenuOpen(false));

    const allItems = filterByStaffPermission(
        [...GENERAL_ITEMS, ...getAccountItems(isBusinessAccount, user)],
        user,
    );
    const primary = PRIMARY_IDS.map((id) => allItems.find((i) => i.id === id)).filter(Boolean);
    const more = allItems.filter((i) => !PRIMARY_IDS.includes(i.id));
    const activeInMore = more.find((i) => i.id === activeTab);

    const displayName = isBusinessAccount
        ? (user?.tradingName || user?.companyName || user?.firstName || 'Business')
        : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account';
    const initial = user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'B';
    const canSeeSettings = allItems.some((i) => i.id === 'settings');

    const go = (id) => {
        setActiveTab(id);
        setMoreOpen(false);
        setMenuOpen(false);
    };

    return (
        <header className="hidden lg:flex items-center gap-4 xl:gap-6">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Bago home">
                <img src="/bago_logo.png" alt="Bago" className="h-9 w-auto" />
                <span className="hidden 2xl:block text-[11px] leading-tight text-[#6B7280] font-medium max-w-[140px]">
                    Send packages.<br />Earn from trips.
                </span>
            </Link>

            {/* Pill navigation */}
            <nav className="flex-1 flex justify-center min-w-0">
                <div className="flex items-center gap-1 bg-[#171B22] rounded-full p-1.5 shadow-[0_10px_30px_rgba(23,27,34,0.18)]">
                    {primary.map((item) => {
                        const isActive = activeTab === item.id;
                        const badge = item.id === 'chats' ? unreadCount : 0;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => go(item.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`relative flex items-center gap-1.5 px-4 xl:px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'bg-[#5845D8] text-white shadow-[0_6px_16px_rgba(88,69,216,0.45)]'
                                        : 'text-white/75 hover:text-white'
                                }`}
                            >
                                {isActive && <Sparkles size={12} strokeWidth={2.5} />}
                                {PRIMARY_LABELS[item.id] || item.label}
                                {badge > 0 && !isActive && (
                                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                                        {badge > 99 ? '99+' : badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {more.length > 0 && (
                        <div className="relative" ref={moreRef}>
                            <button
                                type="button"
                                onClick={() => setMoreOpen((o) => !o)}
                                aria-expanded={moreOpen}
                                aria-haspopup="menu"
                                className={`flex items-center gap-1.5 px-4 xl:px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                                    activeInMore
                                        ? 'bg-[#5845D8] text-white shadow-[0_6px_16px_rgba(88,69,216,0.45)]'
                                        : 'text-white/75 hover:text-white'
                                }`}
                            >
                                <span className="max-w-[150px] truncate">{activeInMore ? activeInMore.label : 'More'}</span>
                                <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {moreOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white rounded-3xl border border-gray-100 shadow-[0_24px_60px_rgba(23,27,34,0.16)] p-2 z-50"
                                >
                                    {more.map((item) => {
                                        const isActive = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                role="menuitem"
                                                onClick={() => go(item.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left text-sm font-semibold transition-colors ${
                                                    isActive ? 'bg-[#5845D8]/10 text-[#5845D8]' : 'text-[#171B22] hover:bg-[#F3F4F6]'
                                                }`}
                                            >
                                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#5845D8] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                                    <item.icon size={15} />
                                                </span>
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
                <IconButton label="Post a trip" to="/post-trip">
                    <Plane size={17} />
                </IconButton>
                <IconButton label="Send a package" to="/search">
                    <Package size={17} />
                </IconButton>
                <span className="w-px h-7 bg-gray-200 mx-1" />
                <IconButton label="Messages" onClick={() => go('chats')} badge={unreadCount}>
                    <MessageCircle size={17} />
                </IconButton>
                <IconButton label="Notifications">
                    <Bell size={17} />
                </IconButton>
                {canSeeSettings && (
                    <IconButton label="Settings" onClick={() => go('settings')}>
                        <Settings size={17} />
                    </IconButton>
                )}

                {/* Account menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="Account menu"
                        aria-expanded={menuOpen}
                        className="w-11 h-11 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold overflow-hidden ring-2 ring-white shadow-sm"
                    >
                        {user?.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : initial}
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-[calc(100%+12px)] w-72 bg-white rounded-3xl border border-gray-100 shadow-[0_24px_60px_rgba(23,27,34,0.16)] p-2 z-50">
                            <div className="px-3 py-3 border-b border-gray-100 mb-1">
                                <p className="text-sm font-bold text-[#171B22] truncate">{displayName}</p>
                                <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
                                {isBusinessAccount && (
                                    <span className="inline-block mt-2 text-[11px] font-semibold text-[#5845D8] bg-[#5845D8]/10 px-2.5 py-1 rounded-full">
                                        Business account
                                    </span>
                                )}
                            </div>
                            <Link
                                to="/"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#171B22] hover:bg-[#F3F4F6]"
                            >
                                <ExternalLink size={15} className="text-[#6B7280]" /> Back to website
                            </Link>
                            <button
                                type="button"
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-[#EF4444] hover:bg-red-50"
                            >
                                <LogOut size={15} /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
