import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const BottomNav: React.FC = () => {
    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Search', path: '/search', icon: Search },
        { name: 'Add Trip', path: '/add-trip', icon: PlusSquare },
        { name: 'Inbox', path: '/messages', icon: MessageCircle },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between max-w-lg mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex flex-col items-center gap-1 transition-all duration-300",
                            isActive ? "text-brand-primary scale-110" : "text-slate-400"
                        )}
                    >
                        <item.icon size={22} className={cn("transition-transform", "group-active:scale-90")} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
