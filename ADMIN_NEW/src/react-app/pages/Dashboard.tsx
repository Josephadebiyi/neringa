import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ArrowUpRight, RefreshCw, Users, AlertCircle, Euro, Percent, Hash, Loader, Check,
  IdCard, Hourglass, Package, ClipboardList, Plane, ShieldCheck,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from 'recharts';
import { getDashboardStats } from '../services/api';

// Interface for stats from API
interface DashboardStats {
  totalUsers: number;
  totalPackages: number;
  totalRequests: number;
  totalIncome: number;
  totalCommission: number;
  activeTrips: number;
  googleUsers: number;
  unverifiedUsers: number;
  verifiedUsers: number;
  pendingTripApprovals: number;
  pendingProtectionReviews: number;
}

// Interface for package data
interface Package {
  _id: string;
  userId: string;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  packageWeight: number;
  receiverName: string;
  receiverPhone: string;
  description: string;
  createdAt: string;
}

// Interface for request data
interface Request {
  _id: string;
  sender: string;
  traveler: string;
  package: string;
  trip?: string;
  status: string;
  insurance: boolean;
  insuranceCost: number;
  createdAt: string;
  updatedAt: string;
}

// Interface for tracking data
interface TrackingData {
  package: Package;
  requests: Request[];
}

// Interface for status distribution (pie chart)
interface StatusDistribution {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

// Interface for monthly trends (line chart)
interface MonthlyTrend {
  name: string;
  thisYear: number;
  lastYear: number;
}

// Interface for regional/country distribution
interface RegionalDistribution {
  country: string;
  count: number;
}

// Interface for API response
interface DashboardResponse {
  success: boolean;
  error: boolean;
  message: string;
  data: {
    stats: DashboardStats;
    notifications?: Array<{
      type: string;
      count: number;
      title: string;
      path: string;
    }>;
    trackingData: TrackingData[];
    statusDistribution: StatusDistribution[];
    monthlyTrends: MonthlyTrend[];
    regionalDistribution?: RegionalDistribution[];
    pagination: {
      totalCount: number;
      page: number;
      limit: number;
    };
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [regionalDistribution, setRegionalDistribution] = useState<RegionalDistribution[]>([]);
  const [notifications, setNotifications] = useState<NonNullable<DashboardResponse['data']['notifications']>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'growth' | 'regions' | 'compliance'>('growth');
  const [currentPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchDashboard();
  }, [currentPage]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const data: DashboardResponse = await getDashboardStats(currentPage, limit);
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Platform data is currently unavailable');
      }

      setStats(data.data.stats || null);
      setMonthlyTrends(data.data.monthlyTrends || []);
      setRegionalDistribution(data.data.regionalDistribution || []);
      setNotifications(data.data.notifications || []);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-white rounded-full"></div>
          <div className="w-14 h-14 border-[3px] border-[#141714] rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-medium text-gray-900">Connection error</h3>
        <p className="text-gray-500 mt-2 max-w-xs">{error}</p>
        <button onClick={() => fetchDashboard()} className="pill pill-ink mt-6 px-6 py-2.5">
          Try again
        </button>
      </div>
    );
  }

  const totalUsers = stats?.totalUsers || 0;
  const verified = stats?.verifiedUsers || 0;
  const unverified = stats?.unverifiedUsers || 0;
  const google = stats?.googleUsers || 0;
  const income = stats?.totalIncome || 0;
  const commission = stats?.totalCommission || 0;
  const pct = (n: number) => (totalUsers ? (n / totalUsers) * 100 : 0);
  const trustScore = Math.round(pct(verified));
  const socialLinked = Math.round(pct(google));
  const effectiveRate = income ? `${((commission / income) * 100).toFixed(1)}%` : '—';

  const [incomeWhole, incomeCents] = income
    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(/(?=[.,]\d{2}$)/);
  const wholeParts = incomeWhole.split(/(?=[,.]\d{3}(?:[,.]|$))/);

  const tiles = [
    { label: 'Active trips', value: stats?.activeTrips || 0, hint: 'live on platform', to: '/trips', icon: TrendingUp },
    { label: 'Registered users', value: totalUsers, hint: `${google.toLocaleString()} via Google`, to: '/users', icon: Users },
    { label: 'Packages', value: stats?.totalPackages || 0, hint: 'created by senders', to: '/orders', icon: Package },
    { label: 'Requests', value: stats?.totalRequests || 0, hint: 'shipment requests', to: '/orders', icon: ClipboardList },
    { label: 'Pending trip approvals', value: stats?.pendingTripApprovals || 0, hint: 'awaiting review', to: '/trips', icon: Plane },
    { label: 'Protection reviews', value: stats?.pendingProtectionReviews || 0, hint: 'insurance queue', to: '/insurance', icon: ShieldCheck },
  ];

  const activityColors = ['bg-[#CDBAF6]', 'bg-[#FFF07A]', 'bg-[#86F5A8]', 'bg-[#FFC9A8]'];

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'growth', label: 'Growth' },
    { id: 'regions', label: 'Regions' },
    { id: 'compliance', label: 'Compliance' },
  ];

  return (
    <div className="space-y-8 rise-in">
      {/* ── Hero: revenue headline ─────────────────────────────── */}
      <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-5">
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gray-900/15 bg-white/40 sm:flex">
            <Euro className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
          </div>
          <div>
            <p className="mb-1 text-[13px] text-gray-500">Total revenue · EUR</p>
            <h1 className="display-num flex items-baseline text-[52px] sm:text-[76px]">
              <span className="mr-2 text-[0.55em] text-gray-700">€</span>
              {wholeParts.map((part, i) => (
                <span key={i} className={i === 0 ? 'text-[#141714]' : 'text-gray-500'}>{part}</span>
              ))}
              <span className="text-[0.45em] text-gray-500">{incomeCents || '.00'}</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 xl:flex xl:items-center xl:gap-8">
          <Meta icon={Percent} label="Commission" value={`€${commission.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
          <Meta icon={Hash} label="Effective rate" value={effectiveRate} />
          <Meta icon={Loader} label="Status" value={<span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-[#1F8F7E]" />Live</span>} />
          <button onClick={() => fetchDashboard()} className="icon-btn" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── Verification bar (Paid / Credits / Balance pattern) ── */}
      <section>
        <div className="mb-2 hidden grid-cols-[1fr_1fr_1.4fr] gap-2 text-[12px] text-gray-500 md:grid">
          <span>Verified</span><span>Unverified</span><span>Trust score</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#86F5A8] p-1.5 pr-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#141714]/15 bg-white/40">
              <Check className="h-4 w-4" />
            </span>
            <span className="text-[17px]">{verified.toLocaleString()}</span>
            <span className="ml-auto text-[12px] text-[#141714]/60">{Math.round(pct(verified))}%</span>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#FFF07A] p-1.5 pr-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#141714]/15 bg-white/40">
              <IdCard className="h-4 w-4" />
            </span>
            <span className="text-[17px]">{unverified.toLocaleString()}</span>
            <span className="ml-auto text-[12px] text-[#141714]/60">{Math.round(pct(unverified))}%</span>
          </div>
          <div className="flex flex-[1.4] items-center gap-2 overflow-hidden rounded-full border border-dashed border-gray-900/25 bg-white/40 p-1.5">
            <span className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-dashed border-gray-900/25 bg-white/70 px-3">
              <Hourglass className="h-4 w-4 text-gray-600" />
              <span className="text-[15px]">{trustScore}%</span>
            </span>
            <span className="hatch h-9 flex-1 rounded-full opacity-60" />
            <span className="shrink-0 whitespace-nowrap rounded-full bg-white/70 px-3 py-2 text-[12px] text-gray-600">
              Social linked <b className="ml-1 text-[15px] font-medium text-[#141714]">{socialLinked}%</b>
            </span>
          </div>
          <Link to="/kyc" className="pill pill-ink justify-center px-6 py-3 md:py-0">
            Review KYC
          </Link>
        </div>
      </section>

      {/* ── Review queue alerts ───────────────────────────────── */}
      {notifications.length > 0 && (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {notifications.map((notification) => (
            <Link
              key={notification.type}
              to={notification.path}
              className="group flex items-center justify-between rounded-full border border-white bg-white/75 p-1.5 pr-2 transition hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#FFF07A] px-2 text-[14px] font-semibold">
                  {notification.count > 99 ? '99+' : notification.count}
                </span>
                <div>
                  <p className="text-[14px] font-medium">{notification.title}</p>
                  <p className="text-[12px] text-gray-500">Open the review queue</p>
                </div>
              </div>
              <span className="icon-btn h-9 w-9 group-hover:bg-[#E3F77E]"><ArrowUpRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </section>
      )}

      {/* ── Tabbed workspace + activity column ────────────────── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {/* Folder-style tabs */}
          <div className="flex items-end gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-t-[22px] px-6 transition-colors ${
                  tab === t.id
                    ? 'bg-white/85 pb-3 pt-4 text-[22px] text-[#141714]'
                    : 'mb-1 rounded-b-[22px] bg-white/35 py-2 text-[15px] text-gray-600 hover:bg-white/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-[28px] rounded-tl-none border border-white bg-white/85 p-5 sm:p-7">
            {tab === 'growth' && (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[34px] font-light leading-none">
                      {monthlyTrends.reduce((a, m) => a + (m.thisYear || 0), 0).toLocaleString()}
                      <span className="ml-2 text-[14px] text-gray-500">packages this year</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="pill py-1.5 text-[12px]"><span className="h-2.5 w-2.5 rounded-full bg-[#1F8F7E]" />{new Date().getFullYear()}</span>
                    <span className="pill py-1.5 text-[12px]"><span className="h-2.5 w-2.5 rounded-full bg-gray-300" />{new Date().getFullYear() - 1}</span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends}>
                      <defs>
                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1F8F7E" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#1F8F7E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#E3E6E3" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9AA09B', fontSize: 12 }} dy={12} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9AA09B', fontSize: 12 }} width={36} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, border: '1px solid #fff', boxShadow: '0 16px 40px -20px rgba(20,23,20,.35)', fontFamily: 'Urbanist' }}
                      />
                      <Area type="monotone" dataKey="lastYear" stroke="#CDD1CD" strokeWidth={2} strokeDasharray="5 5" fill="transparent" dot={false} />
                      <Area type="monotone" dataKey="thisYear" stroke="#1F8F7E" strokeWidth={3} fill="url(#growthFill)"
                        dot={{ r: 3.5, fill: '#fff', strokeWidth: 2, stroke: '#1F8F7E' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#141714' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {tab === 'regions' && (
              <>
                <p className="mb-6 text-[34px] font-light leading-none">
                  {regionalDistribution.length}
                  <span className="ml-2 text-[14px] text-gray-500">countries with users</span>
                </p>
                {regionalDistribution.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-400">No regional data available yet.</p>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionalDistribution} layout="vertical" margin={{ left: 8 }}>
                        <CartesianGrid strokeDasharray="3 6" horizontal={false} stroke="#E3E6E3" />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9AA09B', fontSize: 12 }} />
                        <YAxis type="category" dataKey="country" axisLine={false} tickLine={false} width={110} tick={{ fill: '#141714', fontSize: 13 }} />
                        <Tooltip cursor={{ fill: 'rgba(227,247,126,0.35)' }} contentStyle={{ borderRadius: 16, border: '1px solid #fff', fontFamily: 'Urbanist' }} />
                        <Bar dataKey="count" fill="#1F8F7E" radius={[0, 999, 999, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            {tab === 'compliance' && (
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[260px_1fr]">
                <ScoreRing value={trustScore} />
                <div className="space-y-4">
                  {[
                    { label: 'Verified users', value: verified, bar: 'bg-[#86F5A8]' },
                    { label: 'Unverified users', value: unverified, bar: 'bg-[#FFF07A]' },
                    { label: 'Google sign-ups', value: google, bar: 'bg-[#CDBAF6]' },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-[14px] text-gray-600">{row.label}</span>
                        <span className="text-[20px] font-light">{row.value.toLocaleString()}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`${row.bar} h-3 rounded-full transition-all duration-1000`} style={{ width: `${pct(row.value)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity column */}
        <aside className="flex flex-col">
          <div className="flex justify-end">
            <span className="rounded-t-[22px] bg-white/85 px-6 pb-3 pt-4 text-[22px]">Activity</span>
          </div>
          <div className="flex-1 rounded-[28px] rounded-tr-none border border-white bg-white/85 p-5">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-[15px] text-gray-600">Needs attention</span>
              <span className="text-[30px] font-light leading-none">
                {notifications.reduce((a, n) => a + n.count, 0)}
                <span className="ml-1 text-[12px] text-gray-500">items</span>
              </span>
            </div>
            <div className="space-y-2">
              {notifications.length === 0 && (
                <div className="rounded-[22px] bg-[#86F5A8]/60 p-4">
                  <p className="text-[16px]">All queues are clear</p>
                  <p className="mt-1 text-[12px] text-[#141714]/60">Nothing waiting for review right now.</p>
                </div>
              )}
              {notifications.map((n, i) => (
                <Link key={n.type} to={n.path} className={`group block rounded-[22px] ${activityColors[i % activityColors.length]} p-4 transition hover:brightness-[1.03]`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[16px] leading-snug">{n.title}</p>
                      <p className="mt-1 text-[12px] text-[#141714]/60">{n.count} waiting</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 group-hover:bg-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
              <Link to="/promo-email" className="group block rounded-[22px] bg-[#141714] p-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] leading-snug">Targeted promo engine</p>
                    <p className="mt-1 text-[12px] text-white/55">Email verified or unverified users with custom campaigns.</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3F77E] text-[#141714]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {/* ── Stat tiles (item-card pattern) ───────────────────── */}
      <section>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-[34px] font-light leading-none">{tiles.length}</span>
          <span className="text-[14px] text-gray-500">Platform metrics</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.label} to={t.to} className="soft-card group flex flex-col p-4 hover:bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-5 w-5 text-gray-700" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="text-[15px]">{t.label}</p>
                    <p className="text-[12px] text-gray-500">{t.hint}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <span className="display-num text-[40px]">{t.value.toLocaleString()}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition group-hover:bg-[#E3F77E]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-900/12 bg-white/40">
        <Icon className="h-4 w-4 text-gray-600" strokeWidth={1.6} />
      </span>
      <div>
        <p className="text-[11px] text-gray-500">{label}</p>
        <p className="text-[17px] leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* Stadium-shaped tick ring, after the "Lead Score" card */
function ScoreRing({ value }: { value: number }) {
  const ticks = 72;
  const lit = Math.round((Math.max(0, Math.min(100, value)) / 100) * ticks);
  const w = 260, h = 150, r = 60, cx = w / 2, cy = h / 2, half = (w - 2 * r) / 2 - 12;
  // Points around a stadium (rounded rectangle with semicircle ends)
  const perim = 4 * half + 2 * Math.PI * r;
  const pointAt = (d: number): [number, number, number] => {
    const s = d % perim;
    if (s < 2 * half) return [cx - half + s, cy - r, -Math.PI / 2];
    if (s < 2 * half + Math.PI * r) {
      const a = -Math.PI / 2 + (s - 2 * half) / r;
      return [cx + half + r * Math.cos(a), cy + r * Math.sin(a), a];
    }
    if (s < 4 * half + Math.PI * r) return [cx + half - (s - 2 * half - Math.PI * r), cy + r, Math.PI / 2];
    const a = Math.PI / 2 + (s - 4 * half - Math.PI * r) / r;
    return [cx - half + r * Math.cos(a), cy + r * Math.sin(a), a];
  };
  const grade = value >= 80 ? 'A' : value >= 60 ? 'B' : value >= 40 ? 'C' : 'D';
  return (
    <div className="relative mx-auto w-[260px]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {Array.from({ length: ticks }).map((_, i) => {
          const [x, y, a] = pointAt(half + (i / ticks) * perim);
          const nx = Math.cos(a), ny = Math.sin(a);
          return (
            <line key={i} x1={x - nx * 7} y1={y - ny * 7} x2={x + nx * 7} y2={y + ny * 7}
              stroke={i < lit ? '#1F8F7E' : '#D9DDD9'} strokeWidth={2.4} strokeLinecap="round" />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        <span className="display-num text-[54px]">{value}</span>
        <div>
          <p className="text-[13px]">Grade {grade}</p>
          <p className="text-[11px] text-gray-500">trust score</p>
        </div>
      </div>
    </div>
  );
}
