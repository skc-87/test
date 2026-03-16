import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import FileUploadForm from "../components/FileUploadForm";
import HandwritingSamplesTable from "../components/HandwritingSamplesTable";
import AssignmentsTable from "../components/AssignmentsTable";
import FaceRegistrationModule from "../components/FaceRegistrationModule";
import ClassAttendanceModule from "../components/ClassAttendanceModule";
import EventManager from "../components/EventManager";
import DashboardLayout from "../components/DashboardLayout";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { GradientText } from "../components/reactbits";

const TeacherDashboard = () => {
  const FILES_API_URL = `${API_BASE_URL}/api/files`;
  const FACE_API_URL = `${API_BASE_URL}/api/model`;
  const EVENT_API_URL = `${API_BASE_URL}/api`;

  const [handwritingSamples, setHandwritingSamples] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const { user } = useAuth();

  const token = sessionStorage.getItem("authToken");

  const handleEvaluate = async (fileId, marks) => {
    try {
      await axios.put(
        `${FILES_API_URL}/evaluate/${fileId}`,
        { marks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Marks saved successfully!");
      fetchFiles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Oops! Something went wrong.");
    }
  };

  const handleUpload = async ({ studentId, studentName, file }) => {
    if ((!studentId && !studentName) || !file) {
      toast.error("Please provide student info and select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("file", file);
    formData.append("fileCategory", "handwriting_sample");
    formData.append("studentName", studentName);
    setIsUploading(true);
    try {
      await axios.post(`${FILES_API_URL}/upload/teacher`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("File uploaded successfully!");
      fetchFiles();
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${FILES_API_URL}/all-files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHandwritingSamples(res.data.handwritingSamples || []);
      setAssignments(res.data.assignments || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching files.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  const sectionTitles = { attendance: "Smart Attendance", registration: "Student & Sample Management", events: "Event Management", records: "Student Records" };
  const sectionSubtitles = { attendance: "Take attendance using face recognition technology", registration: "Register student faces and upload handwriting samples", events: "Create events, generate passes, and scan QR codes", records: "View assignments and handwriting samples" };

  return (
    <DashboardLayout
      role="teacher"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={sectionTitles[activeTab]}
      subtitle={sectionSubtitles[activeTab]}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {activeTab === "attendance" && (
            <div className="card p-6 lg:p-8">
              <ClassAttendanceModule token={token} apiUrl={FACE_API_URL} />
            </div>
          )}

          {activeTab === "registration" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>Face Registration</GradientText></h3>
                    <p className="text-xs text-slate-500">Register student faces for attendance</p>
                  </div>
                </div>
                <FaceRegistrationModule token={token} apiUrl={FACE_API_URL} />
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900"><GradientText colors={["#8b5cf6", "#a78bfa", "#8b5cf6"]} animationSpeed={4}>Upload Samples</GradientText></h3>
                    <p className="text-xs text-slate-500">Upload handwriting samples for verification</p>
                  </div>
                </div>
                <FileUploadForm onUpload={handleUpload} isLoading={isUploading} />
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="card p-6 lg:p-8">
              <EventManager token={token} apiUrl={EVENT_API_URL} />
            </div>
          )}

          {activeTab === "records" && (
            <div className="space-y-6">
              <div className="card p-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>Assignments</GradientText></h3>
                <AssignmentsTable
                  data={assignments}
                  isLoading={isLoading}
                  API_BASE_URL={FILES_API_URL}
                  searchTerm={searchTerm}
                  handleEvaluate={handleEvaluate}
                />
              </div>
              <div className="card p-6">
                <h3 className="text-base font-semibold text-slate-900"><GradientText colors={["#06b6d4", "#3b82f6", "#06b6d4"]} animationSpeed={4}>Handwriting Samples</GradientText></h3>
                <HandwritingSamplesTable
                  data={handwritingSamples}
                  isLoading={isLoading}
                  API_BASE_URL={FILES_API_URL}
                  searchTerm={searchTerm}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default TeacherDashboard;