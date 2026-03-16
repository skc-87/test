import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { GraduationCap, LayoutDashboard, ChevronDown, LogOut, Shield, BookOpen, FlaskConical, User, Menu, X } from "lucide-react";
const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);
  const handleLogout = () => { logout(); navigate("/login"); };
  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "admin": return "/admin-dashboard";
      case "teacher": return "/teacher-dashboard";
      case "librarian": return "/librarian-dashboard";
      case "student": return "/upload";
      default: return "/";
    }
  };
  const getRoleBadgeColor = () => {
    if (!user) return "bg-slate-100 text-slate-600";
    switch (user.role) {
      case "admin": return "bg-rose-100 text-rose-700";
      case "teacher": return "bg-indigo-100 text-indigo-700";
      case "librarian": return "bg-emerald-100 text-emerald-700";
      case "student": return "bg-cyan-100 text-cyan-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };
  const getRoleIcon = () => {
    if (!user) return null;
    const iconMap = { admin: Shield, teacher: FlaskConical, librarian: BookOpen, student: GraduationCap };
    const Icon = iconMap[user.role];
    return Icon ? <Icon className="w-3.5 h-3.5" /> : null;
  };
  const isActive = (path) => location.pathname === path;
  if (location.pathname === "/") return null;
  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/50" : "bg-white/60 backdrop-blur-md border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? getDashboardPath() : "/"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">EduTrack</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to={getDashboardPath()} active={isActive(getDashboardPath())}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
            </div>
          )}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{user.name || "User"}</p>
                    <p className="text-xs text-slate-500 leading-tight capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor()}`}>
                            {getRoleIcon()}
                            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link to={getDashboardPath()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />My Dashboard
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                          <LogOut className="w-4 h-4" />Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <Link to="/login" className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${isActive("/login") ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Login</Link>
                <Link to="/signup" className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${isActive("/signup") ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Sign Up</Link>
              </div>
            )}
            {user && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
                {mobileMenuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
              </button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && user && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              <MobileNavLink to={getDashboardPath()} active={isActive(getDashboardPath())}>Dashboard</MobileNavLink>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">Sign Out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
const NavLink = ({ to, active, children }) => (
  <Link to={to} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>{children}</Link>
);
const MobileNavLink = ({ to, active, children }) => (
  <Link to={to} className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>{children}</Link>
);
export default Navbar;
