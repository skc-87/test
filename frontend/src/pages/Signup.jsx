import { useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../config";
import {
  GraduationCap, UserPlus, User, Mail, Lock, Eye, EyeOff, Phone,
  Building2, CalendarDays, AlertTriangle, Loader2, ArrowLeft,
  CheckCircle, Clock, Check, BookOpen, FlaskConical,
} from "lucide-react";
import { GradientText, BlurText } from "../components/reactbits";

const toastConfig = {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

const inputClass =
  "w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400 outline-none";

const selectClass =
  "w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-900 appearance-none cursor-pointer outline-none";

const departments = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Electronics & Communication", "Information Technology",
  "Chemical Engineering", "Aerospace Engineering", "Biotechnology", "Other",
];

const years = [1, 2, 3, 4, 5];

const roleIcons = {
  student: <GraduationCap className="w-5 h-5" />,
  teacher: <FlaskConical className="w-5 h-5" />,
  librarian: <BookOpen className="w-5 h-5" />,
};

const InputField = ({ label, icon, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
      )}
      {children}
    </div>
  </div>
);

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [mobile_number, setMobileNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(null);
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { label: "Weak", color: "bg-red-500" },
      { label: "Fair", color: "bg-orange-500" },
      { label: "Good", color: "bg-yellow-500" },
      { label: "Strong", color: "bg-green-500" },
    ];
    return { score, ...levels[Math.min(score, 4) - 1] };
  }, [password]);

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields", toastConfig);
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters", toastConfig);
      return;
    }
    if (role === "student") {
      if (!mobile_number || !department || !year) {
        toast.error("Please fill in all student details", toastConfig);
        return;
      }
    }
    setLoading(true);
    try {
      const signupData = { name, email, password, role };
      if (role === "student") {
        signupData.mobile_number = mobile_number;
        signupData.department = department;
        signupData.year = parseInt(year);
      }
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, signupData);
      if (data.pending) {
        setSignupSuccess("pending");
        toast.info(data.message, { ...toastConfig, autoClose: 5000 });
        setTimeout(() => navigate("/login"), 4000);
      } else {
        setSignupSuccess("approved");
        toast.success("Signup successful! Redirecting to login...", toastConfig);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Signup failed";
      toast.error(errorMessage, toastConfig);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              <GradientText
                colors={["#ffffff", "#c7d2fe", "#a5b4fc", "#ffffff"]}
                animationSpeed={4}
              >
                Join EduTrack
              </GradientText>
            </h2>
            <p className="text-lg text-white/80 max-w-sm">
              Create your account and unlock the full power of smart education management.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 space-y-3 w-full max-w-xs"
          >
            {["Role-based dashboards", "AI-powered features", "Real-time collaboration"].map(
              (item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              )
            )}
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-slate-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mb-6">
            <BlurText
              text="Create account"
              className="text-3xl font-bold text-slate-900"
              delay={100}
              animateBy="words"
            />
            <p className="text-slate-500 mt-2">Fill in your details to get started</p>
          </div>

          {signupSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              {signupSuccess === "pending" ? (
                <>
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Pending Approval</h2>
                  <p className="text-slate-500 max-w-sm mx-auto mb-4">
                    Your <span className="font-semibold capitalize text-slate-700">{role}</span> account has been submitted for admin approval.
                    You&apos;ll be able to login once approved.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to login...
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
                  <p className="text-slate-500 mb-4">Your account has been created successfully.</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to login...
                  </div>
                </>
              )}
            </motion.div>
          ) : (
          <form onSubmit={handleSignup} className="space-y-4" autoComplete="on" noValidate>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">I am a</label>
              <div className="grid grid-cols-3 gap-3">
                {["student", "teacher", "librarian"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      role === r
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {roleIcons[r]}
                    <span className="text-xs font-semibold capitalize">{r}</span>
                  </button>
                ))}
              </div>
              {(role === "teacher" || role === "librarian") && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {role === "teacher" ? "Teacher" : "Librarian"} accounts may require admin approval.
                </p>
              )}
            </div>

            <InputField label="Full Name" icon={<User className="w-5 h-5" />}>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className={inputClass}
              />
            </InputField>

            <InputField label="Email address" icon={<Mail className="w-5 h-5" />}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={inputClass}
              />
            </InputField>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          level <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {role === "student" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Student Details
                    </h3>
                    <div className="space-y-4">
                      <InputField label="Mobile Number" icon={<Phone className="w-5 h-5" />}>
                        <input
                          type="tel"
                          placeholder="1234567890"
                          value={mobile_number}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          autoComplete="tel"
                          className={inputClass}
                          maxLength={10}
                        />
                      </InputField>
                      <InputField label="Department" icon={<Building2 className="w-5 h-5" />}>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </InputField>
                      <InputField label="Year" icon={<CalendarDays className="w-5 h-5" />}>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select Year</option>
                          {years.map((yr) => (
                            <option key={yr} value={yr}>Year {yr}</option>
                          ))}
                        </select>
                      </InputField>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-white shadow-lg transition-all duration-300 ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-xl hover:from-violet-700 hover:to-indigo-700"
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;