import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  BookMarked,
  Clock,
  DollarSign,
  AlertCircle,
  BookCheck,
} from "lucide-react";
import ManageBooks from "../components/ManageBooks";
import IssueReturnBooks from "../components/IssueReturnBooks";
import ViewBooks from "../components/ViewBooks";
import BookTransactions from "../components/BookTransactions";
import RegisterBook from "../components/RegisterBook";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/LibrarianUI/StatCard";
import OverdueAlertCard from "../components/LibrarianUI/OverdueAlertCard";
import TransactionItem from "../components/LibrarianUI/TransactionItem";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import "../styles/LibrarianDashboard.css";

const LibrarianDashboard = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    fineCollected: 0,
  });
  const [overdueAlerts, setOverdueAlerts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentDetails, setStudentDetails] = useState({});

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("Please login again");
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/library/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err.message);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load library statistics");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueAlerts = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/library/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "overdue", limit: 5 },
      });
      const overdueBooks = response.data?.transactions || [];
      setOverdueAlerts(overdueBooks);
    } catch (err) {
      console.error("Error fetching overdue alerts:", err);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/library/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 5, page: 1 },
      });
      const transactions = response.data?.transactions || [];
      setRecentTransactions(transactions);

      // Fetch student details for transactions
      const studentDetailsMap = {};
      const fetchPromises = [];
      for (const transaction of transactions) {
        if (transaction.student && typeof transaction.student === "string") {
          const studentId = transaction.student;
          fetchPromises.push(
            axios
              .get(`${API_BASE_URL}/api/library/students/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) => {
                studentDetailsMap[studentId] = res.data;
              })
              .catch(() => { })
          );
        }
      }
      await Promise.all(fetchPromises);
      setStudentDetails(studentDetailsMap);
    } catch (err) {
      console.error("Error fetching recent transactions:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOverdueAlerts();
    fetchRecentTransactions();
  }, []);

  const calculateDaysLate = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const sendReminder = async (transactionId, studentId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      // This would be implemented on the backend
      console.log("Reminder sent for transaction:", transactionId);
      // await axios.post(`${API_BASE_URL}/api/library/send-reminder`, { transactionId }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (err) {
      console.error("Error sending reminder:", err);
    }
  };

  const tabTitles = [
    "Dashboard",
    "Browse Books",
    "Register Book",
    "Manage Books",
    "Issue & Return",
    "Transactions",
  ];

  const tabSubtitles = [
    "Library overview and alerts",
    "Search and explore the catalog",
    "Register new books into the library",
    "Edit and manage existing books",
    "Issue and process returns",
    "View borrowing history",
  ];

  const renderDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Books"
          value={stats.totalBooks}
          icon={BookOpen}
          subtitle="In collection"
          loading={loading}
          color="blue"
        />
        <StatCard
          title="Books Issued"
          value={stats.issuedBooks}
          icon={BookMarked}
          subtitle="Currently borrowed"
          loading={loading}
          color="orange"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueBooks}
          icon={Clock}
          subtitle="Need attention"
          loading={loading}
          color="red"
        />
        <StatCard
          title="Fine Collected"
          value={stats.fineCollected || 0}
          icon={DollarSign}
          subtitle="Total recovered"
          loading={loading}
          color="green"
        />
      </div>

      {error && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 90, 95, 0.1)',
          border: '1px solid #FF5A5F',
          color: '#FF5A5F',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #2D7FF9',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
            Loading library data...
          </p>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Overdue Alerts */}
          <div className="dashboard-section">
            <div className="dashboard-section__title">
              <AlertCircle size={20} style={{ color: '#FFA726' }} />
              Overdue Book Alerts
            </div>
            {overdueAlerts.length > 0 ? (
              <div>
                {overdueAlerts.map((alert) => (
                  <OverdueAlertCard
                    key={alert._id}
                    book={alert.book}
                    student={alert.student}
                    daysLate={calculateDaysLate(alert.due_date)}
                    onSendReminder={() => sendReminder(alert._id, alert.student?._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="dashboard-section__empty">
                <p>✓ No overdue books - All good!</p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="dashboard-section">
            <div className="dashboard-section__title">
              <BookCheck size={20} style={{ color: '#2D7FF9' }} />
              Recent Transactions
            </div>
            {recentTransactions.length > 0 ? (
              <div>
                {recentTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction._id}
                    transaction={transaction}
                    studentDetails={studentDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="dashboard-section__empty">
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout
      role="librarian"
      activeTab={tabValue}
      onTabChange={setTabValue}
      title={tabTitles[tabValue]}
      subtitle={tabSubtitles[tabValue]}
    >
      {tabValue === 0 ? (
        renderDashboard()
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tabValue}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              background: '#f5f7fa',
              padding: '24px',
              borderRadius: '12px',
            }}
          >
            {tabValue === 1 && <ViewBooks onStatsUpdate={fetchStats} />}
            {tabValue === 2 && <RegisterBook onStatsUpdate={fetchStats} />}
            {tabValue === 3 && <ManageBooks onStatsUpdate={fetchStats} />}
            {tabValue === 4 && <IssueReturnBooks onStatsUpdate={fetchStats} />}
            {tabValue === 5 && <BookTransactions onStatsUpdate={fetchStats} />}
          </motion.div>
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
};

export default LibrarianDashboard;