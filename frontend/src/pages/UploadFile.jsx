import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import CompareHandwriting from "../components/CompareHandwriting";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import StudentLibrary from "../components/StudentLibrary";
import { API_BASE_URL } from "../config";
import DashboardLayout from "../components/DashboardLayout";
import {
  Loader2, Upload, CheckCircle, CloudUpload, FileText,
  Clock, Ticket, MapPin, Calendar, X, RefreshCw, QrCode
} from "lucide-react";
import { GradientText, SpotlightCard, CountUp } from "../components/reactbits";

const Spinner = ({ size = "h-5 w-5", color = "border-white" }) => (
  <span className={`inline-block ${size} rounded-full border-2 border-t-transparent ${color} animate-spin`} />
);

const UploadFile = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [isReadyForComparison, setIsReadyForComparison] = useState(false);
  const [eventPasses, setEventPasses] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState("library");

  const tabTitles = { library: "My Library", events: "Event Passes", upload: "Upload & Verify", history: "Submission History" };
  const tabSubtitles = { library: "View your borrowed books", events: "View your event passes", upload: "Submit and verify assignments", history: "Track your submissions" };
  const currentSubtitle = studentId
    ? `ID: ${studentId}  ·  ${tabSubtitles[activeTab]}`
    : tabSubtitles[activeTab];

  useEffect(() => {
    document.body.style.overflow = showQRModal ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showQRModal]);

  const onComparisonFailed = (wasDeleted) => {
    toast.info(wasDeleted
      ? "The failed assignment file has been removed. Please upload a new one."
      : "Comparison could not be completed. Your assignment is still saved — please try again later.");
    if (wasDeleted) setIsReadyForComparison(false);
    fetchAssignments();
  };

  const fetchAssignments = async () => {
    if (!studentId) return;
    setIsFetching(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const { data } = await axios.get(`${API_BASE_URL}/api/files/student-assignments/${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAssignments(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch assignments");
    } finally { setIsFetching(false); }
  };

  const fetchEventPasses = async () => {
    if (!studentId) return;
    setLoadingEvents(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const { data } = await axios.get(`${API_BASE_URL}/api/student/events/passes`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) setEventPasses(data.passes);
    } catch (error) {
      console.error("Failed to fetch event passes:", error.message);
    } finally { setLoadingEvents(false); }
  };

  const handleUpload = async () => {
    if (!file) { toast.error("Please select a file before uploading."); return; }
    const token = sessionStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileCategory", "assignment");
    formData.append("studentName", user?.name || "Student");
    setLoading(true);
    toast.info("Uploading your assignment...", { autoClose: 2000 });
    try {
      await axios.post(`${API_BASE_URL}/api/files/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      toast.success("Assignment uploaded successfully! Ready for verification.");
      setFile(null);
      setIsReadyForComparison(true);
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed!");
    } finally {
      setLoading(false);
    }
  };

  const showEventQRCode = (pass) => { setSelectedEvent(pass); setShowQRModal(true); };
  const closeQRModal = () => { setShowQRModal(false); setSelectedEvent(null); };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    const studentData = sessionStorage.getItem("student");
    if (userData && userData !== "undefined") {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        if (parsed?._id) setStudentId(parsed._id);
      } catch (error) { console.error("Error parsing user data:", error.message); }
    }
    if (studentData && studentData !== "undefined") {
      try {
        const parsed = JSON.parse(studentData);
        setStudent(parsed);
      } catch (error) { console.error("Error parsing student data:", error.message); }
    }
  }, []);

  useEffect(() => {
    if (studentId) { fetchAssignments(); fetchEventPasses(); }
  }, [studentId]);

  return (
    <DashboardLayout role="student" activeTab={activeTab} onTabChange={setActiveTab} title={tabTitles[activeTab]} subtitle={currentSubtitle}>
        <AnimatePresence mode="wait">
          {activeTab === "library" && (
            <motion.div key="library" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }} className="card p-4 sm:p-6">
              <StudentLibrary />
            </motion.div>
          )}

          {activeTab === "events" && (
            <motion.div key="events" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <div className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Ticket size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>My Event Passes</GradientText></h2>
                      <p className="text-sm text-slate-500"><CountUp from={0} to={eventPasses.length} separator="" duration={0.8} className="font-semibold" /> pass{eventPasses.length !== 1 ? "es" : ""}</p>
                    </div>
                  </div>
                  <button onClick={fetchEventPasses} disabled={loadingEvents} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50">
                    {loadingEvents ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {loadingEvents ? "Refreshing" : "Refresh"}
                  </button>
                </div>
              {loadingEvents ? (
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Loader2 size={40} className="animate-spin text-indigo-500" />
                  <p className="mt-4 text-sm">Loading event passes...</p>
                </div>
              ) : eventPasses.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Ticket size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No Event Passes Yet</h3>
                  <p className="text-sm text-slate-500">You haven't been assigned any event passes yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {eventPasses.map((pass, idx) => (
                    <SpotlightCard key={pass.passId} spotlightColor="rgba(99, 102, 241, 0.15)" className="h-full">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition" />
                      <div className="flex justify-between items-start mb-3">
                        <div className="pr-2">
                          <h3 className="text-base font-bold text-slate-800 leading-tight">{pass.event.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{pass.event.organizer}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${pass.isUsed ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {pass.isUsed ? "Used" : "Active"}
                        </span>
                      </div>
                      <div className="space-y-1.5 mb-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(pass.event.date).toLocaleDateString()} at {pass.event.time}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {pass.event.venue}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs mb-4 line-clamp-2">{pass.event.description}</p>
                      <button
                        onClick={() => showEventQRCode(pass)}
                        disabled={pass.isUsed}
                        className={`w-full py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          pass.isUsed
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/50"
                        }`}
                      >
                        {pass.isUsed ? "Pass Used" : <><QrCode size={16} /> Show QR Code</>}
                      </button>
                    </motion.div>
                    </SpotlightCard>
                  ))}
                </div>
              )}
              </div>
            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }} className="card p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <FileText size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>Assignment Submission & Verification</GradientText></h2>
                  <p className="text-sm text-slate-500">Upload then verify your handwriting</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow shadow-indigo-200">1</div>
                  <h3 className="text-lg font-semibold text-slate-800">Upload Your File</h3>
                </div>
                <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="mb-4">
                  <label className={`flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
                    ${dragActive ? "border-indigo-400 bg-indigo-50/60" : file ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"}`}>
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      {file ? <CheckCircle size={32} className="text-emerald-500" /> : <CloudUpload size={32} className="text-slate-400" />}
                      <p className="text-sm text-slate-600 text-center px-3">
                        {file ? (
                          <span className="font-medium text-emerald-700">{file.name}</span>
                        ) : (
                          <><span className="font-medium text-indigo-600">Click to browse</span> or drag & drop</>
                        )}
                      </p>
                    </div>
                    <input type="file" onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} className="hidden" />
                  </label>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className={`w-full py-3 rounded-xl text-white font-semibold flex justify-center items-center gap-2 transition-all duration-300 ${
                    loading || !file
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? <><Spinner /> Uploading...</> : <><Upload size={20} /> Upload Assignment</>}
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">then</span></div>
              </div>

              <div className={`transition-all duration-500 ${isReadyForComparison ? "opacity-100" : "opacity-40"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold shadow transition-colors duration-500 ${isReadyForComparison ? "bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-200" : "bg-slate-300"}`}>2</div>
                  <h3 className="text-lg font-semibold text-slate-800">Verify Handwriting</h3>
                </div>
                <p className="text-slate-500 text-sm mb-4 ml-11">After uploading, verify your handwriting against the sample you provided.</p>
                <div className="ml-11">
                  {studentId && (
                    <CompareHandwriting studentId={studentId} isReadyForComparison={isReadyForComparison} onComparisonFailed={onComparisonFailed} />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: "easeOut" }}>
              <div className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Clock size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>Submission History</GradientText></h2>
                      <p className="text-sm text-slate-500"><CountUp from={0} to={assignments.length} separator="" duration={0.8} className="font-semibold" /> submission{assignments.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <button onClick={fetchAssignments} disabled={isFetching} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50">
                    {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {isFetching ? "Refreshing" : "Refresh"}
                  </button>
                </div>
              {isFetching ? (
                <div className="flex flex-col items-center py-12 text-slate-400">
                  <Loader2 size={40} className="animate-spin text-indigo-500" />
                  <p className="mt-4 text-sm">Loading submissions...</p>
                </div>
              ) : assignments.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assignments.map((assignment) => (
                        <tr key={assignment._id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-5 py-4 font-medium text-slate-800">{assignment.fileName}</td>
                          <td className="px-5 py-4 text-slate-500">{new Date(assignment.uploadDate).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            {assignment.marks ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Graded
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-700">{assignment.marks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50/60 rounded-2xl">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText size={28} />
                  </div>
                  <h4 className="text-base font-semibold text-slate-700 mb-1">No Assignments Yet</h4>
                  <p className="text-sm text-slate-500">Upload your first assignment to see it here.</p>
                </div>
              )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showQRModal && selectedEvent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeQRModal} />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <button onClick={closeQRModal} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
                <div className="p-6">
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">Event Pass</h3>
                    <p className="text-sm font-medium text-slate-600 mt-1">{selectedEvent.event.title}</p>
                    <div className="flex items-center justify-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{new Date(selectedEvent.event.date).toLocaleDateString()} at {selectedEvent.event.time}</span>
                      <span>&middot;</span>
                      <span>{selectedEvent.event.venue}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-5">
                    <QRCodeSVG value={selectedEvent.qrCode} size={200} level="H" includeMargin={true} className="mx-auto" />
                  </div>
                  <div className="flex justify-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedEvent.isUsed ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                      {selectedEvent.isUsed ? "Pass Used" : "Active Pass"}
                    </span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3">
                    <p className="text-xs text-indigo-600 text-center"><strong>How to use:</strong> Show this QR code at the event entrance</p>
                  </div>
                  {selectedEvent.isUsed && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                      <p className="text-xs font-medium text-rose-600 text-center">Used on {new Date(selectedEvent.usedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DashboardLayout>
  );
};

export default UploadFile;
