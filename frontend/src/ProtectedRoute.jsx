import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/AuthContext";

/**
 * ProtectedRoute – guards routes by authentication AND (optionally) role.
 *
 * Props:
 *   children      – the page component to render
 *   allowedRoles  – optional array of roles that may access this route
 *                   e.g. ["teacher"] or ["student", "teacher"]
 *                   If omitted, any authenticated user is allowed.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuth();
  const toastShownRef = useRef(false);

  const isAuthenticated = !!token;
  const hasRole =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    (user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (toastShownRef.current) return;
    if (!isAuthenticated) {
      toastShownRef.current = true;
      toast.error("You are not logged in! Redirecting...", { toastId: "auth-redirect", autoClose: 2000 });
    } else if (!hasRole) {
      toastShownRef.current = true;
      toast.error("Access denied. Insufficient permissions.", { toastId: "role-denied", autoClose: 2000 });
    }
  }, [isAuthenticated, hasRole]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
