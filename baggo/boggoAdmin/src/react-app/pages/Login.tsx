import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Lock,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // Brief delay for smoother transition
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5240E8]/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-[#1E293B]/50 backdrop-blur-xl rounded-[40px] border border-white/5 shadow-2xl overflow-hidden relative z-10">

        {/* Left Side - Visual/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#5240E8] to-[#3B28C9] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black text-white tracking-tighter uppercase italic">Bago Admin</span>
            </div>

            <h1 className="text-5xl font-black text-white leading-tight mb-6">
              Manage the future <br /> of <span className="text-white/70 italic text-4xl">Logistics.</span>
            </h1>
            <p className="text-white/60 text-lg font-medium max-w-md leading-relaxed">
              Access your administrative terminal to manage staff, monitor shipments, and handle global support tickets in real-time.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <div className="text-white font-black text-2xl mb-1">99.9%</div>
              <div className="text-white/50 text-xs font-bold uppercase tracking-widest">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
              <div className="text-white font-black text-2xl mb-1">24/7</div>
              <div className="text-white/50 text-xs font-bold uppercase tracking-widest">Monitoring</div>
            </div>
          </div>

          {/* Abstract dots pattern */}
          <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 border border-white/10 rounded-full"></div>
          <div className="absolute bottom-[-100px] left-[-100px] w-64 h-64 border border-white/10 rounded-full"></div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="bg-[#5240E8] p-2.5 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase italic">Bago</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-2">Terminal Login</h2>
            <p className="text-slate-400 font-medium tracking-tight">Enter your secure credentials to proceed.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-red-500 p-1 rounded-full">
                  <X className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Internal ID</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#5240E8] transition-colors">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_username"
                  className="w-full bg-[#0F172A]/50 border-2 border-slate-800 rounded-[22px] py-4 pl-14 pr-6 text-white placeholder:text-slate-600 focus:border-[#5240E8] focus:ring-4 focus:ring-[#5240E8]/10 outline-none transition-all font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Access Key</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#5240E8] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0F172A]/50 border-2 border-slate-800 rounded-[22px] py-4 pl-14 pr-14 text-white placeholder:text-slate-600 focus:border-[#5240E8] focus:ring-4 focus:ring-[#5240E8]/10 outline-none transition-all font-bold tracking-[0.2em]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5240E8] hover:bg-[#4030C8] text-white py-5 rounded-[22px] font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#5240E8]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Initiating Session...</span>
                </>
              ) : (
                <>
                  <span>Begin Terminal Session</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase">
        © 2024 Bago Logistics Terminal • Security Protocol v4.2
      </div>
    </div>
  );
}

// Add a simple X icon for the error message
function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
