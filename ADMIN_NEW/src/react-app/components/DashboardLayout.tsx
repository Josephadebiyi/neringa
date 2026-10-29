import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import PageErrorBoundary from "./PageErrorBoundary";
import { useAuth } from "../hooks/useAuth";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { useNavigate, useLocation } from "react-router-dom";
import { BAGO_BRAND } from "../config/brand";
import {
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
  Package,
  UserX,
  ShieldCheck,
  Building2,
  Grip,
  Inbox,
  Receipt,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItemDef {
  icon: any;
  label: string;
  path: string;
  group: string;
  roles?: string[]; // if omitted, visible to all roles
}

const allNavItems: NavItemDef[] = [
  { group: "Overview",   icon: LayoutDashboard, label: "Dashboard",         path: "/dashboard" },
  { group: "Overview",   icon: BarChart,        label: "Analytics",          path: "/analytics",        roles: ["SUPER_ADMIN"] },

  { group: "People",     icon: User,            label: "Users",              path: "/users",            roles: ["SUPER_ADMIN"] },
  { group: "People",     icon: Building2,       label: "Businesses",         path: "/businesses",       roles: ["SUPER_ADMIN"] },
  { group: "People",     icon: Users,           label: "Staff / Sub-Admins", path: "/staff",            roles: ["SUPER_ADMIN"] },
  { group: "People",     icon: IdCard,          label: "KYC Management",     path: "/kyc",              roles: ["SUPER_ADMIN", "SAFETY_ADMIN"] },
  { group: "People",     icon: UserX,           label: "Flagged Users",      path: "/flagged-users",    roles: ["SUPER_ADMIN", "SAFETY_ADMIN"] },

  { group: "Operations", icon: Plane,           label: "Listed Trips",       path: "/trips",            roles: ["SUPER_ADMIN"] },
  { group: "Operations", icon: ClipboardList,   label: "Orders",             path: "/orders",           roles: ["SUPER_ADMIN", "SUPPORT_ADMIN"] },
  { group: "Operations", icon: MapPin,          label: "Tracking",           path: "/tracking",         roles: ["SUPER_ADMIN", "SAFETY_ADMIN"] },
  { group: "Operations", icon: ShieldCheck,     label: "Insurance",          path: "/insurance",        roles: ["SUPER_ADMIN"] },
  { group: "Operations", icon: Package,         label: "Item Categories",    path: "/item-categories",  roles: ["SUPER_ADMIN"] },

  { group: "Care",       icon: MessageCircle,   label: "Support Tickets",    path: "/support",          roles: ["SUPER_ADMIN", "SUPPORT_ADMIN"] },
  { group: "Care",       icon: ShieldAlert,     label: "Disputes",           path: "/disputes",         roles: ["SUPER_ADMIN", "SAFETY_ADMIN"] },
  { group: "Care",       icon: RotateCcw,       label: "Refunds",            path: "/refund",           roles: ["SUPER_ADMIN"] },

  { group: "Finance",    icon: Receipt,         label: "Payments",           path: "/payments",         roles: ["SUPER_ADMIN"] },
  { group: "Finance",    icon: CreditCard,      label: "Withdrawals",        path: "/withdrawals",      roles: ["SUPER_ADMIN"] },
  { group: "Finance",    icon: Ticket,          label: "Promo Codes",        path: "/promo-codes",      roles: ["SUPER_ADMIN"] },

  { group: "Growth",     icon: Bell,            label: "Promo Engine",       path: "/promo-email",      roles: ["SUPER_ADMIN"] },
  { group: "Growth",     icon: Send,            label: "Broadcast Center",   path: "/push-notification", roles: ["SUPER_ADMIN"] },
  { group: "Growth",     icon: ImagePlay,       label: "Promo Banners",      path: "/banners",          roles: ["SUPER_ADMIN"] },

  { group: "Account",    icon: User,            label: "My Profile",         path: "/profile" },
  { group: "Account",    icon: Settings,        label: "System Settings",    path: "/settings",         roles: ["SUPER_ADMIN"] },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "A";
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { unreadSupportCount, clearSupportBadge } = useAdminSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    try { if (logout) await logout(); navigate("/login"); }
    catch (error) { console.error("Logout error:", error); }
    setMobileOpen(false);
    setMenuOpen(false);
  };

  const userRole = user?.role || "SUPER_ADMIN";
  const navItems = allNavItems.filter((item) => !item.roles || item.roles.includes(userRole));
  const groups = navItems.reduce<Record<string, NavItemDef[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || "Administrator";

  const canSeeSupport = navItems.some((i) => i.path === "/support");
  const canSeeSettings = navItems.some((i) => i.path === "/settings");

  const currentItem =
    navItems.find((i) => location.pathname === i.path) ||
    navItems.find((i) => location.pathname.startsWith(i.path + "/"));

  const go = (path: string) => {
    navigate(path);
    if (path === "/support") clearSupportBadge();
    setMobileOpen(false);
  };

  const sidebarW = collapsed ? "lg:w-[84px]" : "lg:w-[244px]";

  return (
    <div className="flex h-screen flex-col overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="flex h-[72px] shrink-0 items-center justify-between px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="icon-btn lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <Grip className="hidden h-5 w-5 text-gray-500 lg:block" />
          <div className="flex items-center gap-2.5">
            <img src={BAGO_BRAND.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/80" />
            <span className="text-[17px] font-semibold tracking-tight">{BAGO_BRAND.name}</span>
          </div>
          <span className="hidden h-5 w-px bg-gray-900/15 sm:block" />
          <span className="hidden truncate text-[15px] text-gray-600 sm:block">
            {currentItem?.label || "Admin Hub"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canSeeSupport && (
            <button
              onClick={() => go("/support")}
              className="icon-btn relative"
              title="Support inbox"
              aria-label="Support inbox"
            >
              <Inbox className="h-[18px] w-[18px]" />
              {unreadSupportCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#141714] px-1 text-[10px] font-semibold text-[#E3F77E]">
                  {unreadSupportCount > 9 ? "9+" : unreadSupportCount}
                </span>
              )}
            </button>
          )}
          {canSeeSettings && (
            <button onClick={() => go("/settings")} className="icon-btn hidden sm:inline-flex" title="System settings" aria-label="System settings">
              <Settings className="h-[18px] w-[18px]" />
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-gray-900/10 bg-white/55 py-1 pl-1 pr-3 transition hover:bg-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E3F77E] text-[12px] font-semibold text-[#141714]">
                {initials(displayName)}
              </span>
              <span className="hidden max-w-[160px] truncate text-[13px] font-medium sm:block">{displayName}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white bg-white/95 p-1.5 shadow-[0_24px_48px_-20px_rgba(20,23,20,0.35)] backdrop-blur-xl">
                <div className="px-3 py-2.5">
                  <p className="truncate text-[13px] font-semibold">{displayName}</p>
                  <p className="text-[11px] text-gray-500">{(userRole || "").replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); go("/profile"); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] hover:bg-gray-100"
                >
                  <User className="h-4 w-4" /> My profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 lg:gap-4 lg:px-4 lg:pb-4">

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside
          className={`
            glass-panel max-lg:bg-white/92 fixed inset-y-3 left-3 z-50 flex w-[260px] flex-col rounded-[28px] transition-all duration-200 ease-out
            lg:static lg:inset-auto lg:z-auto ${sidebarW}
            ${mobileOpen ? "translate-x-0" : "-translate-x-[110%] lg:translate-x-0"}
          `}
        >
          <div className={`flex h-[72px] shrink-0 items-center px-5 ${collapsed ? "lg:justify-center lg:px-0" : "justify-between"}`}>
            <span className={`text-[26px] font-medium tracking-tight ${collapsed ? "lg:hidden" : ""}`}>Menu</span>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="icon-btn hidden lg:inline-flex"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button onClick={() => setMobileOpen(false)} className="icon-btn lg:hidden" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 pb-3">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-3">
                <p className={`px-3 pb-1.5 pt-2 text-[12px] font-medium text-gray-500 ${collapsed ? "lg:hidden" : ""}`}>{group}</p>
                {collapsed && <div className="mx-auto my-2 hidden h-px w-8 bg-gray-900/10 lg:block" />}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                    const badge = item.path === "/support" && unreadSupportCount > 0 ? unreadSupportCount : 0;
                    return (
                      <div key={item.path} className="group relative">
                        <button
                          onClick={() => go(item.path)}
                          title={collapsed ? item.label : undefined}
                          className={`flex w-full items-center gap-3 rounded-full py-1.5 pl-1.5 pr-3 text-left transition-colors
                            ${collapsed ? "lg:justify-center lg:pr-1.5" : ""}
                            ${isActive ? "bg-[#E3F77E] text-[#141714]" : "text-gray-700 hover:bg-white/70"}
                          `}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors
                            ${isActive ? "border-[#141714]/10 bg-white/50" : "border-gray-900/10 bg-white/40 group-hover:bg-white"}`}>
                            <Icon className="h-[15px] w-[15px]" />
                          </span>
                          <span className={`flex-1 truncate text-[13.5px] ${isActive ? "font-medium" : ""} ${collapsed ? "lg:hidden" : ""}`}>
                            {item.label}
                          </span>
                          {badge > 0 && (
                            <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-[#141714] px-1 text-[10px] font-semibold text-[#E3F77E]
                              ${collapsed ? "lg:absolute lg:right-1 lg:top-0" : ""}`}>
                              {badge > 9 ? "9+" : badge}
                            </span>
                          )}
                        </button>
                        {collapsed && (
                          <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-[#141714] px-3 py-1.5 text-[12px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 p-3">
            <button
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
              className={`flex w-full items-center gap-3 rounded-full border border-gray-900/10 bg-white/50 py-1.5 pl-1.5 pr-3 text-left text-gray-700 transition hover:bg-white
                ${collapsed ? "lg:justify-center lg:pr-1.5" : ""}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#141714] text-white">
                <LogOut className="h-[15px] w-[15px]" />
              </span>
              <span className={`text-[13.5px] ${collapsed ? "lg:hidden" : ""}`}>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────── */}
        <main className="app-main main-surface relative min-w-0 flex-1 overflow-auto rounded-[28px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 rounded-t-[28px] bg-[radial-gradient(40rem_14rem_at_20%_0%,rgba(227,247,126,0.55),transparent_70%)]" />
          <div className="relative p-4 sm:p-6 lg:p-8">
            <PageErrorBoundary>
              {children}
            </PageErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
