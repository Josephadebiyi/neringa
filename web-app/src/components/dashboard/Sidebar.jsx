import React from 'react';
import {
    LayoutDashboard,
    MessageCircle,
    Plane,
    Package,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Shield
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ activeTab, setActiveTab, user, logout }) {
    const location = useLocation();

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'trips', label: 'My Trips', icon: Plane },
        { id: 'shipments', label: 'My Shipments', icon: Package },
        { id: 'chats', label: 'Messages', icon: MessageCircle, badge: 3 }, // Placeholder badge
        { id: 'earnings', label: 'Earnings', icon: Wallet },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-40 transition-all duration-300">
            <div className="p-6 mb-2">
                <Link to="/">
                    <img src="/bago_logo.png" alt="Bago" className="h-8" />
                </Link>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${activeTab === item.id
                                ? 'bg-[#5845D8] text-white shadow-md shadow-[#5845D8]/20'
                                : 'text-[#708c91] hover:bg-gray-50 hover:text-[#054752]'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </div>
                        {item.badge && activeTab !== item.id && (
                            <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-[#5845D8] text-white flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                        {user?.firstName?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-[#054752] truncate">{user?.firstName}</p>
                        <div className="flex items-center gap-1">
                            <Shield size={10} className="text-green-500" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{user?.kycStatus === 'approved' ? 'Verified' : 'Member'}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all"
                >
                    <LogOut size={20} />
                    <span className="text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
