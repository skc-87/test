import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserCheck, UserX, Trash2, Search, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, User, Lock, ArrowRightLeft, AlertTriangle,
  GraduationCap, BookOpen, ShieldAlert, Loader2,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { CountUp, SpotlightCard } from "../components/reactbits";

const toastConfig = {
  position: "top-right", autoClose: 2000, hideProgressBar: false,
  closeOnClick: true, pauseOnHover: true, draggable: true,
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100", spotlight: "rgba(79, 70, 229, 0.12)" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", spotlight: "rgba(245, 158, 11, 0.12)" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100", spotlight: "rgba(139, 92, 246, 0.12)" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", spotlight: "rgba(16, 185, 129, 0.12)" },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <SpotlightCard spotlightColor={c.spotlight} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 leading-none">
            {value != null ? (
              <CountUp
                to={typeof value === 'number' ? value : parseInt(value) || 0}
                from={0} duration={1.5}
                className="text-3xl font-extrabold text-slate-900"
                separator=","
              />
            ) : "--"}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon size={22} className={c.text} />
        </div>
      </div>
    </SpotlightCard>
  );
};

const RoleBadge = ({ role }) => {
  const c = { student: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200", teacher: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", librarian: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${c[role] || "bg-slate-100 text-slate-700"}`}>{role}</span>;
};

const StatusBadge = ({ status }) => {
  const c = { pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", rejected: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${c[status] || "bg-slate-100 text-slate-700"}`}>{status}</span>;
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("pending"); const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]); const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true); const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState(""); const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); const [profileLoading, setProfileLoading] = useState(false);
  const [transferEmail, setTransferEmail] = useState(""); const [transferPassword, setTransferPassword] = useState("");
  const [transferLoading, setTransferLoading] = useState(false); const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const { data } = await axios.get(`${API_BASE_URL}/api/admin/stats`); setStats(data); }
    catch (err) { console.error("Stats fetch error:", err.message); }
  }, []);
  const fetchPending = useCallback(async () => {
    try { const { data } = await axios.get(`${API_BASE_URL}/api/admin/pending`); setPendingUsers(data.users); }
    catch (err) { console.error("Pending fetch error:", err.message); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const params = { page: currentPage, limit: 15 };
      if (searchQuery) params.search = searchQuery; if (roleFilter) params.role = roleFilter; if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, { params }); setUsers(data.users); setTotalPages(data.totalPages);
    } catch (err) { console.error("Users fetch error:", err.message); }
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    (async () => { setLoading(true); await Promise.all([fetchStats(), fetchPending(), fetchUsers()]); setLoading(false); })();
  }, [fetchStats, fetchPending, fetchUsers]);

  const refreshAll = () => Promise.all([fetchStats(), fetchPending(), fetchUsers()]);
  const handleApprove = async (userId, userName) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "approve" }));
    try { const { data } = await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/approve`); toast.success(data.message, toastConfig); await refreshAll(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to approve user", toastConfig); }
    finally { setActionLoading((prev) => ({ ...prev, [userId]: null })); }
  };
  const handleReject = async (userId, userName) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "reject" }));
    try { const { data } = await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/reject`); toast.success(data.message, toastConfig); await refreshAll(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to reject user", toastConfig); }
    finally { setActionLoading((prev) => ({ ...prev, [userId]: null })); }
  };
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) return;
    setActionLoading((prev) => ({ ...prev, [userId]: "delete" }));
    try { const { data } = await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`); toast.success(data.message, toastConfig); await refreshAll(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to delete user", toastConfig); }
    finally { setActionLoading((prev) => ({ ...prev, [userId]: null })); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return (
      <DashboardLayout role="admin" activeTab={activeTab} onTabChange={setActiveTab} pendingCount={0}>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={40} className="text-indigo-600 animate-spin" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading admin dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const tabTitles = { pending: "Pending Requests", users: "All Users", settings: "Settings" };
  const tabSubtitles = {
    pending: `${pendingUsers.length} request${pendingUsers.length !== 1 ? "s" : ""} awaiting review`,
    users: "Manage user accounts and permissions",
    settings: "Update your profile and admin settings",
  };

  return (
    <DashboardLayout
      role="admin" activeTab={activeTab} onTabChange={setActiveTab}
      pendingCount={pendingUsers.length} title={tabTitles[activeTab]} subtitle={tabSubtitles[activeTab]}
    >
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="indigo" />
          <StatCard label="Pending" value={stats.pendingRequests} icon={UserCheck} color="amber" />
          <StatCard label="Teachers" value={stats.teachers} icon={GraduationCap} color="violet" />
          <StatCard label="Librarians" value={stats.librarians} icon={BookOpen} color="emerald" />
        </div>
      )}
      <AnimatePresence mode="wait">
        {activeTab === "pending" && (
          <motion.div key="pending" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }}>
            {pendingUsers.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-500" /></div>
                <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3><p className="text-slate-500 mt-1">No pending approval requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <motion.div key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="card p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{user.name}</h3><p className="text-xs text-slate-500">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1"><RoleBadge role={user.role} /><span className="text-[11px] text-slate-400">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleApprove(user._id, user.name)} disabled={!!actionLoading[user._id]}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {actionLoading[user._id] === "approve" ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                          Approve
                        </button>
                        <button onClick={() => handleReject(user._id, user.name)} disabled={!!actionLoading[user._id]}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {actionLoading[user._id] === "reject" ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                          Reject
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {activeTab === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <div className="card p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search by name or email..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="librarian">Librarians</option>
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                    {["User","Role","Status","Registered"].map(h => <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}
                    <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No users found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4"><div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{user.name?.charAt(0)?.toUpperCase() || "?"}</div>
                            <div><p className="text-sm font-semibold text-slate-900">{user.name}</p><p className="text-[11px] text-slate-500">{user.email}</p></div>
                          </div></td>
                          <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                          <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {user.status === "pending" && (
                                <>
                                  <button onClick={() => handleApprove(user._id, user.name)} disabled={!!actionLoading[user._id]} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                                    <UserCheck size={16} />
                                  </button>
                                  <button onClick={() => handleReject(user._id, user.name)} disabled={!!actionLoading[user._id]} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50" title="Reject">
                                    <UserX size={16} />
                                  </button>
                                </>
                              )}
                              {user.status === "rejected" && (
                                <button onClick={() => handleApprove(user._id, user.name)} disabled={!!actionLoading[user._id]} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50" title="Approve">
                                  <UserCheck size={16} />
                                </button>
                              )}
                              <button onClick={() => handleDelete(user._id, user.name)} disabled={!!actionLoading[user._id]} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {activeTab === "settings" && (
          <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }} className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><User size={20} className="text-indigo-600" /></div>
                <div><h3 className="text-lg font-semibold text-slate-900">Update Profile</h3><p className="text-sm text-slate-500">Change your name or password</p></div>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPassword && newPassword !== confirmPassword) {
                    toast.error("New passwords do not match", toastConfig); return;
                  }
                  if (newPassword && newPassword.length < 8) {
                    toast.error("New password must be at least 8 characters", toastConfig); return;
                  }
                  if (!profileName.trim() && !newPassword) {
                    toast.error("Nothing to update", toastConfig); return;
                  }
                  setProfileLoading(true);
                  try {
                    const body = {};
                    if (profileName.trim()) body.name = profileName.trim();
                    if (newPassword) {
                      body.currentPassword = currentPassword;
                      body.newPassword = newPassword;
                    }
                    const { data } = await axios.put(`${API_BASE_URL}/api/admin/profile`, body);
                    toast.success(data.message, toastConfig);
                    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to update profile", toastConfig);
                  } finally { setProfileLoading(false); }
                }}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter new name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <hr className="border-slate-100" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required to change password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {profileLoading && <Loader2 size={16} className="animate-spin" />}
                  Update Profile
                </motion.button>
              </form>
            </div>
            <div className="card border-rose-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center"><AlertTriangle size={20} className="text-rose-600" /></div>
                <div><h3 className="text-lg font-semibold text-rose-900">Transfer Admin Role</h3><p className="text-sm text-rose-600">This action is irreversible from the UI. You will lose admin access.</p></div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-rose-800">
                  <strong>Warning:</strong> Transferring admin will promote the target user to admin and demote your account
                  to a teacher role. You will be immediately logged out and will no longer have admin privileges.
                </p>
              </div>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target User Email</label>
                  <input type="email" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)}
                    placeholder="Enter the email of the new admin"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Current Password</label>
                  <input type="password" value={transferPassword} onChange={(e) => setTransferPassword(e.target.value)}
                    placeholder="Confirm with your password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm text-slate-900 outline-none" />
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="button"
                  disabled={transferLoading || !transferEmail || !transferPassword}
                  onClick={() => setShowTransferConfirm(true)}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <ArrowRightLeft size={16} />
                  Transfer Admin Role
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        {showTransferConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0"><AlertTriangle size={24} className="text-rose-600" /></div>
                <div><h3 className="text-lg font-bold text-slate-900">Confirm Admin Transfer</h3><p className="text-sm text-slate-500">This action cannot be undone from the UI</p></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  You are about to transfer admin privileges to <strong>{transferEmail}</strong>.
                  Your account will be demoted to teacher and you will be logged out immediately.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowTransferConfirm(false)} disabled={transferLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={transferLoading}
                  onClick={async () => {
                    setTransferLoading(true);
                    try {
                      const { data } = await axios.put(`${API_BASE_URL}/api/admin/transfer`, {
                        targetEmail: transferEmail, currentPassword: transferPassword,
                      });
                      toast.success(data.message, { ...toastConfig, autoClose: 5000 });
                      setShowTransferConfirm(false);
                      setTimeout(() => { logout(); }, 2000);
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Failed to transfer admin role", toastConfig);
                    } finally { setTransferLoading(false); }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {transferLoading && <Loader2 size={16} className="animate-spin" />}
                  Yes, Transfer Admin
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AdminDashboard;
