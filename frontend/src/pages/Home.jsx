import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PenTool, ClipboardList, BookOpen, QrCode, ArrowRight, ChevronDown,
  UserPlus, LayoutDashboard, Zap, GraduationCap, Shield, Sparkles,
  Users, BarChart3,
} from "lucide-react";
import { BlurText, GradientText, SpotlightCard, ShinyText } from "../components/reactbits";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: <PenTool className="w-7 h-7" />,
    title: "Handwriting Verification",
    desc: "AI-powered Siamese Network compares handwriting samples with high accuracy to verify student authenticity.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
  },
  {
    icon: <ClipboardList className="w-7 h-7" />,
    title: "Smart Attendance",
    desc: "Face recognition-based attendance system eliminates proxy attendance with real-time detection.",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50",
  },
  {
    icon: <BookOpen className="w-7 h-7" />,
    title: "Library Management",
    desc: "Complete library system with book tracking, issue/return workflows, fine calculations, and transaction history.",
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
  },
  {
    icon: <QrCode className="w-7 h-7" />,
    title: "Event & QR Passes",
    desc: "Create events, generate QR-code passes for students, and validate entry seamlessly.",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
  },
];

const stats = [
  { value: "AI", label: "Powered Analysis", icon: Sparkles },
  { value: "Real-time", label: "Face Detection", icon: Users },
  { value: "Secure", label: "Role-based Access", icon: Shield },
  { value: "QR", label: "Event Passes", icon: BarChart3 },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/30 to-violet-200/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-float" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-200/20 to-blue-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100/20 to-violet-100/20 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #4f46e5 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 text-sm font-medium mb-8 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <ShinyText text="Smart Education Platform" speed={3} className="text-indigo-700" />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mb-6"
          >
            <BlurText
              text="Welcome to"
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 justify-center"
              delay={80}
              animateBy="words"
            />
            <GradientText
              colors={["#4f46e5", "#7c3aed", "#06b6d4", "#4f46e5"]}
              animationSpeed={6}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mt-1"
            >
              EduTrack
            </GradientText>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            An all-in-one platform for smart attendance, AI-powered handwriting
            verification, library management, and event coordination.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg overflow-hidden btn-lift"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-slate-700 rounded-2xl shadow-md hover:shadow-lg border border-slate-200 transition-all duration-300 font-semibold text-lg btn-lift"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-slate-400" />
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-4">
              Core Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              <GradientText
                colors={["#4f46e5", "#7c3aed", "#06b6d4", "#4f46e5"]}
                animationSpeed={5}
              >
                Everything You Need
              </GradientText>
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Powerful tools designed for modern educational institutions
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <SpotlightCard
                  spotlightColor={
                    i === 0 ? "rgba(139, 92, 246, 0.15)" :
                    i === 1 ? "rgba(6, 182, 212, 0.15)" :
                    i === 2 ? "rgba(16, 185, 129, 0.15)" :
                    "rgba(249, 115, 22, 0.15)"
                  }
                  className="h-full hover:shadow-xl hover:border-slate-200 transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bg} text-slate-700 mb-5 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium mb-4">
              Getting Started
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              <GradientText
                colors={["#10b981", "#06b6d4", "#4f46e5", "#10b981"]}
                animationSpeed={5}
              >
                How It Works
              </GradientText>
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Get started in three simple steps
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up as a Student, Teacher, or Librarian with role-based access control.",
                icon: <UserPlus className="w-8 h-8" />,
              },
              {
                step: "02",
                title: "Access Dashboard",
                desc: "Each role gets a tailored dashboard with relevant tools and features.",
                icon: <LayoutDashboard className="w-8 h-8" />,
              },
              {
                step: "03",
                title: "Start Using",
                desc: "Upload assignments, take attendance, manage library, and create events instantly.",
                icon: <Zap className="w-8 h-8" />,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 mb-5">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden"
        >
          <div className="animated-gradient p-12 sm:p-16 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Institution?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join EduTrack and bring smart automation to attendance, assignments, library, and events.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all duration-300 btn-lift"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">EduTrack</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} EduTrack. Built for modern education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;