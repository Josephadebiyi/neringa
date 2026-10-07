import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, LayoutDashboard, UserCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

/**
 * Top bar for the standalone flows (post a trip, send a package, search),
 * matching the dashboard's TopNav: logo left, dark step pill centre, round actions right.
 */
export default function AppTopBar({ steps = null, step = 1, backLabel = 'Back' }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    return (
        <nav className="sticky top-0 z-50 w-full bg-[#F7F7FC]/90 backdrop-blur border-b border-[#ECEBF3]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-[76px] flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center shrink-0" aria-label="Bago home">
                    <img src="/bago_logo.png" alt="Bago" className="h-8 w-auto" />
                </Link>

                {steps && (
                    <div className="hidden md:flex items-center gap-1 bg-[#171B22] rounded-full p-1.5 shadow-[0_10px_30px_rgba(23,27,34,0.18)]">
                        {steps.map((label, i) => {
                            const n = i + 1;
                            const active = n === step;
                            const done = n < step;
                            return (
                                <span
                                    key={label}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap ${
                                        active ? 'bg-[#5845D8] text-white shadow-[0_6px_16px_rgba(88,69,216,0.45)]' : done ? 'text-white' : 'text-white/50'
                                    }`}
                                >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${active ? 'bg-white text-[#5845D8]' : done ? 'bg-emerald-400 text-[#171B22]' : 'bg-white/10'}`}>
                                        {done ? <Check size={12} strokeWidth={3} /> : n}
                                    </span>
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="h-11 pl-3 pr-4 rounded-full bg-white border border-gray-200/80 flex items-center gap-1.5 text-sm font-semibold text-[#171B22] hover:border-[#5845D8]/40 hover:text-[#5845D8] transition-colors"
                    >
                        <ArrowLeft size={17} />
                        <span className="hidden sm:inline">{backLabel}</span>
                    </button>
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            aria-label="Dashboard"
                            title="Dashboard"
                            className="w-11 h-11 rounded-full bg-[#5845D8] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(88,69,216,0.35)] hover:bg-[#4A38C9] transition-colors"
                        >
                            <LayoutDashboard size={17} />
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            aria-label="Sign in"
                            title="Sign in"
                            className="w-11 h-11 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-[#171B22] hover:text-[#5845D8] hover:border-[#5845D8]/40 transition-colors"
                        >
                            <UserCircle size={19} />
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
