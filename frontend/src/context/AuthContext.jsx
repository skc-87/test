import { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const AuthContext = createContext(null);

/**
 * AuthProvider – centralised auth state backed by sessionStorage.
 *
 * Provides:
 *   user     – { _id, name, role } or null
 *   token    – JWT string or null
 *   login()  – stores credentials and configures axios
 *   logout() – clears credentials and redirects
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => sessionStorage.getItem("authToken"));

  // Keep axios default header in sync with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Global 401 interceptor – auto-logout on expired / invalid token
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newToken, newUser, student) => {
    const userData = { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role };
    sessionStorage.setItem("authToken", newToken);
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem(
      "student",
      JSON.stringify(student ? {
        _id: student._id,
        mobile_number: student.mobile_number,
        department: student.department,
        year: student.year,
        max_books_allowed: student.max_books_allowed,
      } : null)
    );
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("student");
    setToken(null);
    setUser(null);
    // Redirect handled by ProtectedRoute / caller
  };

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default AuthContext;
