import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadFile from "./pages/UploadFile";
import ProtectedRoute from "./ProtectedRoute";
import TeacherDashboard from "./pages/TeacherDashboard";
import LibrarianDashboard from './pages/LibrarianDashboard';
import AdminDashboard from "./pages/AdminDashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Dashboard routes where the sidebar replaces the navbar
const dashboardRoutes = ["/teacher-dashboard", "/librarian-dashboard", "/upload", "/admin-dashboard"];

// Simple 404 page
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
    <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
    <p className="text-xl text-slate-500 mb-6">Page not found</p>
    <Link to="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
      Go Home
    </Link>
  </div>
);

/** Wrapper that conditionally renders Navbar */
const AppShell = () => {
  const location = useLocation();
  const hiddenNavbar = dashboardRoutes.includes(location.pathname);

  return (
    <>
      {!hiddenNavbar && <Navbar />}
      <ToastContainer position="top-right" autoClose={2000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/librarian-dashboard"
          element={
            <ProtectedRoute allowedRoles={["librarian"]}>
              <LibrarianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <UploadFile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppShell />
      </Router>
    </ErrorBoundary>
  );
}

export default App;