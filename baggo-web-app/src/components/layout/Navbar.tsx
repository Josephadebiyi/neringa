import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const navLinks = [
        { name: 'Search', path: '/search' },
        { name: 'How it Works', path: '/how' },
        { name: 'Support', path: '/support' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="relative">
            <nav
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b-2 border-slate-50 py-3 shadow-sm' : 'bg-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="active:scale-95 transition-transform hover:rotate-3 duration-300">
                    <img src="/logo.png" alt="Bago Logo" className="w-16 h-16 object-contain" />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-10">
                    <div className="flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-black transition-colors hover:text-brand-primary ${isActive(link.path) ? 'text-brand-primary' : 'text-slate-500'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/add-trip" className="flex items-center gap-2 text-sm font-black text-brand-primary hover:bg-brand-primary/5 px-4 py-2 rounded-xl transition-all">
                                    <Plus size={18} />
                                    Post Trip
                                </Link>
                                <Link to="/profile" className="flex items-center gap-3 p-1 pr-4 bg-slate-50 rounded-full border-2 border-slate-100 hover:bg-white hover:border-brand-primary/20 transition-all group">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-black uppercase">
                                        {user?.firstName?.charAt(0)}
                                    </div>
                                    <span className="text-sm font-black text-slate-900 capitalize">{user?.firstName}</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-brand-primary transition-colors">
                                    <LogIn size={18} />
                                    Sign In
                                </Link>
                                <Link to="/signup" className="btn-bold-primary px-6 py-2.5 text-sm !rounded-xl">
                                    Join Community
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Icon */}
                <button
                    className="md:hidden p-2 text-slate-900 active:scale-90 transition-transform"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Dropdown - Fixed positioning with high z-index */}
            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <div
                        className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90]"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Mobile menu */}
                    <div className="md:hidden fixed top-[88px] left-0 right-0 z-[95] bg-white border-t-2 border-slate-50 p-6 shadow-2xl max-h-[calc(100vh-88px)] overflow-y-auto animate-in slide-in-from-top-4">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-lg font-black p-4 rounded-2xl transition-colors ${isActive(link.path) ? 'bg-brand-primary/5 text-brand-primary' : 'text-slate-900 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-slate-100 my-2" />
                            {!isAuthenticated ? (
                                <Link to="/signup" className="btn-bold-primary w-full text-center py-4" onClick={() => setIsOpen(false)}>
                                    Get Started
                                </Link>
                            ) : (
                                <Link to="/profile" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors" onClick={() => setIsOpen(false)}>
                                    <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center text-white text-xl font-black capitalize">
                                        {user?.firstName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 capitalize">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs font-black text-brand-primary uppercase tracking-widest">View Account</p>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </>
            )}
            </nav>
        </header>
    );
};

export default Navbar;
