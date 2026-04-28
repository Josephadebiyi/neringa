import type { ReactNode } from "react";
import { useState } from "react";
import PageErrorBoundary from "./PageErrorBoundary";
import { useAuth } from "../hooks/useAuth";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { useNavigate, useLocation } from "react-router-dom";
import { BAGO_BRAND } from "../config/brand";
import {
  Home,
  CreditCard,
  MessageCircle,
  User,
  Settings,
  BarChart,
  Menu,
  X,
  IdCard,
  Bell,
  ChevronDown,
  LogOut,
  Plane,
  Ticket,
  Users,
  MapPin,
  Send,
  RotateCcw,
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  ImagePlay,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path?: string;
  action?: () => void;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard",         path: "/dashboard" },
  { icon: User,            label: "Users",              path: "/users" },
  { icon: Users,           label: "Staff / Sub-Admins", path: "/staff" },
  { icon: Plane,           label: "Listed Trips",       path: "/trips" },
  { icon: IdCard,          label: "KYC Management",     path: "/kyc" },
  { icon: ClipboardList,   label: "Orders",             path: "/orders" },
  { icon: MapPin,          label: "Tracking",           path: "/tracking" },
  { icon: Bell,            label: "Promo Engine",       path: "/promo-email" },
  { icon: Ticket,          label: "Promo Codes",        path: "/promo-codes" },
  { icon: MessageCircle,   label: "Support Tickets",    path: "/support" },
  { icon: ShieldAlert,     label: "Disputes",           path: "/disputes" },
  { icon: RotateCcw,       label: "Refunds",            path: "/refund" },
  { icon: CreditCard,      label: "Withdrawals",        path: "/withdrawals" },
  { icon: Send,            label: "Broadcast Center",   path: "/push-notification" },
  { icon: ImagePlay,       label: "Promo Banners",      path: "/banners" },
  { icon: User,            label: "My Profile",         path: "/profile" },
  { icon: BarChart,        label: "Analytics",          path: "/analytics" },
  { icon: Settings,        label: "System Settings",    path: "/settings" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { unreadSupportCount, clearSupportBadge } = useAdminSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);

  const handleLogout = async () => {
    try { if (logout) await logout(); navigate("/login"); }
    catch (error) { console.error("Logout error:", error); }
    setMobileOpen(false);
  };

  const sidebarW = collapsed ? "w-16" : "w-64";

  return (
    <div className="flex h-screen bg-[#F4F6FB]">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200 ease-in-out
        bg-[linear-gradient(180deg,#1E2749_0%,#202C58_45%,#2A3770_100%)]
        ${sidebarW} lg:static
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>

        {/* Logo */}
        <div className={`flex h-20 shrink-0 items-center px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 p-1.5 shadow">
              <img src={BAGO_BRAND.logoUrl} alt={BAGO_BRAND.name} className="h-7 w-7 rounded-lg object-cover" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 shadow">
                  <img src={BAGO_BRAND.logoUrl} alt={BAGO_BRAND.name} className="h-8 w-8 rounded-xl object-cover" />
                </div>
                <div>
                  <span className="block text-xl font-black tracking-tight text-white">{BAGO_BRAND.name}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Admin</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white lg:hidden">
                <X className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive  = item.path && location.pathname === item.path;
            const isSupport = item.path === "/support";
            const badge     = isSupport && unreadSupportCount > 0 ? unreadSupportCount : 0;

            return (
              <div key={item.label} className="relative group">
                <button
                  onClick={() => {
                    if (item.path) { navigate(item.path); if (isSupport) clearSupportBadge(); }
                    setMobileOpen(false);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left transition-all duration-150
                    ${collapsed ? "justify-center" : "gap-3"}
                    ${isActive ? "bg-white/10 text-white border-r-2 border-[#5C4BFD]" : "text-gray-300 hover:bg-white/5 hover:text-white"}
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="flex-1 text-[13px] font-medium">{item.label}</span>}
                  {badge > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </button>

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {item.label}
                    {badge > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px]">{badge}</span>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Logout */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
              className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-gray-300 transition-all hover:bg-white/5 hover:text-white
                ${collapsed ? "justify-center" : "gap-3"}
              `}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-[13px] font-medium">Logout</span>}
            </button>
            {collapsed && (
              <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Logout
              </div>
            )}
          </div>
        </nav>

        {/* Bottom: user info */}
        <div className={`shrink-0 border-t border-white/10 p-3 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <User className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white">Operator</p>
                <p className="truncate text-[11px] text-white/50">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || "Administrator"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#E7EAF0] bg-white/90 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)} className="text-gray-500 hover:text-gray-900 lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(p => !p)}
              className="hidden items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:flex"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed
                ? <PanelLeftOpen className="h-5 w-5" />
                : <PanelLeftClose className="h-5 w-5" />
              }
            </button>
          </div>

          {/* User dropdown */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-gray-500">{BAGO_BRAND.adminLabel}</span>
            <div className="group relative">
              <div className="flex cursor-pointer items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-[14px] font-medium text-gray-900">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || "Administrator"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              <div className="pointer-events-none absolute right-0 mt-2 w-40 rounded-lg bg-white opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-100">
          <div className="p-6">
            <PageErrorBoundary>
              {children}
            </PageErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
