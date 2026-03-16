import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GradientText } from "./reactbits";
import {
  LayoutDashboard, Users, ClipboardCheck, UserPlus, CalendarDays, FolderOpen,
  BookOpen, BookMarked, ArrowLeftRight, Receipt, Settings, LogOut, ChevronLeft,
  Menu, X, GraduationCap, Shield, Library, Upload, Ticket, FileText, Search,
} from "lucide-react";
const navConfig = {
  admin: [
    { key: "pending", label: "Pending Requests", icon: Users, badge: true },
    { key: "users", label: "All Users", icon: Search },
    { key: "settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { key: "attendance", label: "Attendance", icon: ClipboardCheck },
    { key: "registration", label: "Registration", icon: UserPlus },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "records", label: "Records", icon: FolderOpen },
  ],
  librarian: [
    { key: 0, label: "Dashboard", icon: LayoutDashboard },
    { key: 1, label: "Browse Books", icon: Search },
    { key: 2, label: "Register Book", icon: BookOpen },
    { key: 3, label: "Manage Books", icon: BookMarked },
    { key: 4, label: "Issue & Return", icon: ArrowLeftRight },
    { key: 5, label: "Transactions", icon: Receipt },
  ],
  student: [
    { key: "library", label: "Library", icon: BookOpen },
    { key: "events", label: "Event Passes", icon: Ticket },
    { key: "upload", label: "Upload & Verify", icon: Upload },
    { key: "history", label: "Submissions", icon: FileText },
  ],
};
const roleConfig = {
  admin: { label: "Administrator", color: "from-rose-500 to-pink-600", badge: "bg-rose-500/10 text-rose-400", icon: Shield },
  teacher: { label: "Teacher", color: "from-indigo-500 to-violet-600", badge: "bg-indigo-500/10 text-indigo-400", icon: GraduationCap },
  librarian: { label: "Librarian", color: "from-emerald-500 to-teal-600", badge: "bg-emerald-500/10 text-emerald-400", icon: Library },
  student: { label: "Student", color: "from-cyan-500 to-blue-600", badge: "bg-cyan-500/10 text-cyan-400", icon: GraduationCap },
};
const DashboardLayout = ({ children, role, activeTab, onTabChange, pendingCount, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = navConfig[role] || [];
  const config = roleConfig[role] || roleConfig.student;
  const RoleIcon = config.icon;
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);
  const initials = useMemo(
    () => (user?.name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    [user?.name]
  );
  const handleLogout = () => { logout(); navigate("/login"); };
  const handleNavClick = (key) => { onTabChange(key); setMobileOpen(false); };
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 group cursor-default">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <GradientText colors={["#ffffff", "#c7d2fe", "#a5b4fc", "#e0e7ff", "#ffffff"]} animationSpeed={4} className="text-lg font-bold tracking-tight">EduTrack</GradientText>
              <span className={`block text-[10px] font-semibold uppercase tracking-[0.15em] ${config.badge} px-1.5 py-0.5 rounded mt-0.5 w-fit`}>{config.label}</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        )}
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400">
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {(!collapsed || isMobile) && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Navigation</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => handleNavClick(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive ? "bg-white/[0.1] text-white shadow-sm" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"}`}
              title={collapsed && !isMobile ? item.label : undefined}>
              {isActive && (
                <motion.div layoutId={`sidebar-indicator-${role}`} className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b ${config.color}`} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              )}
              <Icon size={20} className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
              {item.badge && pendingCount > 0 && (!collapsed || isMobile) && (
                <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{pendingCount}</span>
              )}
              {item.badge && pendingCount > 0 && collapsed && !isMobile && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{pendingCount > 9 ? "9+" : pendingCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.06] px-3 py-4 space-y-2">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md`}>{initials}</div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || ""}</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <LogOut size={18} />{(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar hidden lg:flex ${collapsed ? 'cursor-pointer' : ''}`}
        style={{ width: collapsed ? "var(--sidebar-collapsed-width)" : undefined }}
        onClick={collapsed ? () => setCollapsed(false) : undefined}>
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden flex flex-col" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <main className="dashboard-content" style={{ marginLeft: collapsed ? "var(--sidebar-collapsed-width)" : undefined }}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">{title || `Welcome back, ${user?.name?.split(" ")[0] || "User"}`}</h1>
                {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.badge}`}>
                <RoleIcon size={14} />{config.label}
              </span>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-sm font-bold shadow-md lg:hidden`}>{initials}</div>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};
export default DashboardLayout;
