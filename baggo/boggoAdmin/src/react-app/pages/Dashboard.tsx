import { useEffect, useState } from 'react';
import { TrendingUp, ArrowUpRight, RefreshCw, DollarSign, Users, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '../config/api';

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

// Interface for API response
interface DashboardResponse {
  success: boolean;
  error: boolean;
  message: string;
  data: {
    stats: DashboardStats;
    trackingData: TrackingData[];
    statusDistribution: StatusDistribution[];
    monthlyTrends: MonthlyTrend[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchDashboard();
  }, [currentPage]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_BASE_URL}/dashboard?page=${currentPage}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data: DashboardResponse = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      setStats(data.data.stats);
      setMonthlyTrends(data.data.monthlyTrends);
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
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-[#5240E8] rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Connection Error</h3>
        <p className="text-gray-500 mt-2 max-w-xs">{error}</p>
        <button
          onClick={() => fetchDashboard()}
          className="mt-6 px-6 py-2 bg-[#5240E8] text-white rounded-xl font-bold hover:bg-[#4030C8] transition-all font-sans"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#1e2749] to-[#5240E8]">
            Overview Dashboard
          </h1>
          <p className="text-gray-500 font-medium">Monitoring Bago platform performance and growth</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-gray-700">Live Status</span>
          </div>
          <button
            onClick={() => fetchDashboard()}
            className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card */}
        <div className="premium-card p-6 border-l-4 border-l-[#5240E8]">
          <div className="flex justify-between items-start">
            <div className="stats-icon-container bg-[#5240E8]/10 text-[#5240E8]">
              <DollarSign className="w-7 h-7" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
              <h3 className="text-2xl font-black text-[#1e2749] mt-1">${(stats?.totalIncome || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">+12.5%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">vs last month</span>
          </div>
        </div>

        {/* Trips Card */}
        <div className="premium-card p-6 border-l-4 border-l-[#8B5CF6]">
          <div className="flex justify-between items-start">
            <div className="stats-icon-container bg-[#8B5CF6]/10 text-[#8B5CF6]">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Trips</p>
              <h3 className="text-2xl font-black text-[#1e2749] mt-1">{(stats?.activeTrips || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">Live</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">on platform</span>
          </div>
        </div>

        {/* Google Users Card */}
        <div className="premium-card p-6 border-l-4 border-l-[#F59E0B]">
          <div className="flex justify-between items-start">
            <div className="stats-icon-container bg-[#F59E0B]/10 text-[#F59E0B]">
              <Users className="w-7 h-7" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Auth</p>
              <h3 className="text-2xl font-black text-[#1e2749] mt-1">{(stats?.googleUsers || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">Verified</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">via google</span>
          </div>
        </div>

        {/* Commission Card */}
        <div className="premium-card p-6 border-l-4 border-l-[#10B981]">
          <div className="flex justify-between items-start">
            <div className="stats-icon-container bg-[#10B981]/10 text-[#10B981]">
              <ArrowUpRight className="w-7 h-7" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profit</p>
              <h3 className="text-2xl font-black text-[#1e2749] mt-1">${(stats?.totalCommission || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">10% Fee</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">effective rate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 premium-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-[#1e2749]">Platform Growth</h2>
              <p className="text-gray-400 text-sm font-medium">Monthly package trends comparison</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#5240E8]"></span>
                <span className="text-xs font-bold text-gray-500 uppercase">2024</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-200"></span>
                <span className="text-xs font-bold text-gray-500 uppercase">2023</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="thisYear"
                  stroke="#5240E8"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#5240E8', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="lastYear"
                  stroke="#CBD5E1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Categories */}
        <div className="premium-card p-8 flex flex-col">
          <h2 className="text-xl font-bold text-[#1e2749] mb-2">User Compliance</h2>
          <p className="text-gray-400 text-sm font-medium mb-8">Verification status categories</p>

          <div className="space-y-4 flex-1">
            <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-green-600 uppercase tracking-widest">Verified Users</span>
                <span className="text-xl font-black text-green-700">{(stats?.verifiedUsers || 0)}</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats?.totalUsers ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Unverified</span>
                <span className="text-xl font-black text-orange-700">{(stats?.unverifiedUsers || 0)}</span>
              </div>
              <div className="w-full bg-orange-100 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats?.totalUsers ? (stats.unverifiedUsers / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verification Health</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-black text-[#1e2749]">
                    {stats?.totalUsers ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
                  </div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Trust Score</div>
                </div>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-black text-[#1e2749]">
                    {stats?.totalUsers ? Math.round((stats.googleUsers / stats.totalUsers) * 100) : 0}%
                  </div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Social Linked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action: Promo Email */}
      <div className="premium-card p-8 bg-gradient-to-br from-[#1e2749] to-[#0A0F1E] border-none relative overflow-hidden group">
        <div className="absolute top-[-50%] right-[-10%] w-[40%] h-[200%] bg-[#5240E8]/10 rotate-12 blur-[100px] group-hover:bg-[#5240E8]/20 transition-all duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5240E8]/20 border border-[#5240E8]/30 mb-4">
              <span className="w-1.5 h-1.5 bg-[#5240E8] rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-[#5240E8] uppercase tracking-widest">New Feature</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 text-center md:text-left">Targeted Promotional Engine</h2>
            <p className="text-slate-400 font-medium text-sm text-center md:text-left">
              Send beautifully crafted promotional emails to specific user categories.
              Upload images, define custom subjects, and engage your verified or unverified users directly.
            </p>
          </div>
          <a
            href="/promo-email"
            className="px-8 py-4 bg-[#5240E8] hover:bg-[#4030C8] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95] shadow-xl shadow-[#5240E8]/20 whitespace-nowrap"
          >
            Launch Promo Tool
          </a>
        </div>
      </div>
    </div>
  );
}

