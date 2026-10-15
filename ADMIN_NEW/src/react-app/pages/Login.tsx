import React, { useState, useEffect } from 'react';
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
import { DEFAULT_ADMIN_ROUTE, useAuth } from '../hooks/useAuth';

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
      navigate(DEFAULT_ADMIN_ROUTE, { replace: true });
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
        navigate(DEFAULT_ADMIN_ROUTE, { replace: true });
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="relative z-10 grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-[36px] border border-white/90 bg-white/55 shadow-[0_40px_80px_-40px_rgba(20,23,20,0.35)] backdrop-blur-2xl lg:grid-cols-[1.05fr_1fr]">

        {/* Left: brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#E3F77E_0%,#C9EFD9_55%,#CDBAF6_100%)] p-10 lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#141714]/15 bg-white/50">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <span className="text-[20px] font-medium tracking-tight">Bago Admin</span>
          </div>

          <div>
            <h1 className="display-num text-[64px] text-[#141714]">
              Run the<br />network<span className="text-[#141714]/45">.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-[#141714]/65">
              Manage staff, monitor shipments and handle support tickets in real time.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 rounded-[22px] bg-white/55 p-4">
              <div className="display-num text-[34px]">99.9%</div>
              <div className="mt-1 text-[12px] text-[#141714]/60">Uptime</div>
            </div>
            <div className="flex-1 rounded-[22px] bg-[#141714] p-4 text-white">
              <div className="display-num text-[34px]">24/7</div>
              <div className="mt-1 text-[12px] text-white/55">Monitoring</div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
          <div className="mb-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E3F77E]">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <span className="text-[19px] font-medium">Bago Admin</span>
            </div>
            <h2 className="text-[40px] font-light leading-tight tracking-tight">Welcome back</h2>
            <p className="mt-1 text-[15px] text-gray-500">Sign in with your admin credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 rounded-full border border-red-100 bg-red-50 py-2 pl-2 pr-5 text-red-700 animate-in fade-in slide-in-from-top-4 duration-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500">
                  <X className="h-3 w-3 text-white" />
                </span>
                <span className="text-[13px] font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="ml-4 text-[12px] text-gray-500">Username</label>
              <div className="group relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#141714]">
                  <UserIcon className="h-[18px] w-[18px]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_username"
                  autoComplete="username"
                  className="w-full rounded-full border border-gray-900/10 bg-white/80 py-3.5 pl-13 pr-6 text-[15px] text-[#141714] outline-none transition-all placeholder:text-gray-400 focus:border-[#141714]/40 focus:bg-white focus:ring-4 focus:ring-[#E3F77E]/70"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-4 text-[12px] text-gray-500">Password</label>
              <div className="group relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#141714]">
                  <Lock className="h-[18px] w-[18px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-full border border-gray-900/10 bg-white/80 py-3.5 pl-13 pr-14 text-[15px] text-[#141714] outline-none transition-all placeholder:text-gray-400 focus:border-[#141714]/40 focus:bg-white focus:ring-4 focus:ring-[#E3F77E]/70"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#141714]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-between rounded-full bg-[#141714] py-2 pl-7 pr-2 text-[15px] text-white transition-all hover:bg-black disabled:opacity-60"
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E3F77E] text-[#141714] transition-transform group-hover:translate-x-0.5">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              </span>
            </button>
          </form>
        </div>
      </div>

      <div className="absolute bottom-5 text-[11px] text-gray-500">
        © {new Date().getFullYear()} Bago Logistics
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
