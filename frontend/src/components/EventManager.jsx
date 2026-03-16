import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientText, ShinyText } from "./reactbits";
const tabs = [
  { key: "create", label: "Create Event", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> },
  { key: "passes", label: "Generate Passes", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg> },
  { key: "scanner", label: "QR Scanner", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg> },
  { key: "events", label: "My Events", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
];
const fadeTab = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.25 } }, exit: { opacity: 0, y: -8, transition: { duration: 0.15 } } };
const InputField = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
    {children}
  </div>
);
const inputCls = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition text-sm";
const EventManager = ({ token, apiUrl }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scannerResult, setScannerResult] = useState(null);
  const [qrInput, setQrInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", time: "", venue: "", organizer: "" });
  useEffect(() => { fetchEvents(); fetchStudents(); }, [token, apiUrl]);
  const fetchEvents = async () => {
    try { const response = await axios.get(`${apiUrl}/events`, { headers: { Authorization: `Bearer ${token}` } }); setEvents(response.data.events || []); }
    catch (error) { toast.error("Failed to fetch events"); }
  };
  const fetchStudents = async () => {
    try { const response = await axios.get(`${apiUrl}/events/students/list`, { headers: { Authorization: `Bearer ${token}` } }); setStudents(response.data.students || []); }
    catch (error) { toast.error("Failed to fetch students"); }
  };
  const handleCreateEvent = async (e) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/events/create`, eventForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Event created successfully!");
      setEvents([response.data.event, ...events]);
      setEventForm({ title: "", description: "", date: "", time: "", venue: "", organizer: "" });
    } catch (error) { toast.error("Failed to create event"); }
    finally { setIsLoading(false); }
  };
  const handleGeneratePasses = async () => {
    if (!selectedEvent || selectedStudents.length === 0) { toast.error("Please select an event and at least one student"); return; }
    setIsLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/events/${selectedEvent}/generate-passes`, { studentIds: selectedStudents }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        toast.success(response.data.message);
        if (response.data.errors?.length > 0) response.data.errors.forEach(err => toast.warning(err));
        setSelectedStudents([]);
      } else { toast.error(response.data.message || "Failed to generate passes"); }
    } catch (error) {
      console.error("Generate passes error:", error.message);
      toast.error(error.response?.status === 404 ? "Event not found. Please create the event first." : (error.response?.data?.message || "Failed to generate passes"));
    } finally { setIsLoading(false); }
  };
  const handleQRScan = async (qrData) => {
    try {
      const response = await axios.post(`${apiUrl}/events/validate-qr`, { qrData }, { headers: { Authorization: `Bearer ${token}` } });
      setScannerResult(response.data);
      response.data.valid ? toast.success(response.data.message) : toast.error(response.data.message);
    } catch (error) { toast.error("Failed to validate QR code"); }
  };
  const toggleStudentSelection = (studentId) => { setSelectedStudents(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]); };
  const selectAllStudents = () => setSelectedStudents(students.map(s => s._id));
  const clearSelection = () => setSelectedStudents([]);
  const generateEventQRData = (event) => JSON.stringify({ eventId: event.eventId, type: "event_info", title: event.title, date: event.date, time: event.time });
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/60 border border-slate-100/80 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2.5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-200/50">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
        <GradientText colors={["#8b5cf6", "#a78bfa", "#8b5cf6"]} animationSpeed={4}>Event Management</GradientText>
      </h2>
      <div className="flex gap-1 p-1 bg-slate-100/80 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === t.key ? "text-white" : "text-slate-500 hover:text-slate-700 hover:bg-white/60"}`}>
            {activeTab === t.key && <motion.div layoutId="eventTabBg" className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg shadow-md" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
            <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {activeTab === "create" && (
          <motion.div key="create" {...fadeTab}>
            <h3 className="text-lg font-semibold text-slate-800 mb-1"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>Create New Event</GradientText></h3>
            <p className="text-sm text-slate-400 mb-5"><ShinyText text="Fill in the details to create an event and auto-generate a QR code." speed={3} className="text-sm" /></p>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <InputField label="Event Title" required><input type="text" required value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className={inputCls} placeholder="Enter event title" maxLength={100} /></InputField>
              <InputField label="Description"><textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows="3" className={`${inputCls} resize-none`} placeholder="Event description" maxLength={200} /></InputField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Date" required><input type="date" required value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className={inputCls} /></InputField>
                <InputField label="Time" required><input type="time" required value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} className={inputCls} /></InputField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Venue" required><input type="text" required value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} className={inputCls} placeholder="Event venue" maxLength={50} /></InputField>
                <InputField label="Organizer" required><input type="text" required value={eventForm.organizer} onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })} className={inputCls} placeholder="Organizer name" maxLength={50} /></InputField>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
                {isLoading ? (<><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>) : (<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Create Event & Generate QR</>)}
              </button>
            </form>
          </motion.div>
        )}
        {activeTab === "passes" && (
          <motion.div key="passes" {...fadeTab}>
            <h3 className="text-lg font-semibold text-gray-800 mb-1"><GradientText colors={["#10b981", "#14b8a6", "#10b981"]} animationSpeed={4}>Generate Event Passes</GradientText></h3>
            <p className="text-sm text-gray-400 mb-5">Select an event and pick students to issue digital passes.</p>
            <InputField label="Select Event">
              <select value={selectedEvent || ""} onChange={(e) => setSelectedEvent(e.target.value)} className={inputCls}>
                <option value="">Choose an event</option>
                {events.map(event => (<option key={event._id} value={event.eventId}>{event.title} - {new Date(event.date).toLocaleDateString()}</option>))}
              </select>
            </InputField>
            <div className="mt-5 mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-600">
                  Select Students <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold">{selectedStudents.length}</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={selectAllStudents} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition">Select All</button>
                  <button onClick={clearSelection} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition">Clear</button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {students.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No students found</div>
                ) : students.map(student => (
                  <label key={student._id} className="flex items-center p-3 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                    <input type="checkbox" checked={selectedStudents.includes(student._id)} onChange={() => toggleStudentSelection(student._id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                    <span className="ml-3 text-sm text-slate-700">{student.name} <span className="text-slate-400">({student.email})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleGeneratePasses} disabled={!selectedEvent || selectedStudents.length === 0 || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
              {isLoading ? (<><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating...</>) : (<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>Generate {selectedStudents.length} Passes</>)}
            </button>
          </motion.div>
        )}
        {activeTab === "scanner" && (
          <motion.div key="scanner" {...fadeTab}>
            <h3 className="text-lg font-semibold text-slate-800 mb-1"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>QR Code Scanner</GradientText></h3>
            <p className="text-sm text-slate-400 mb-5">Validate event passes by scanning or pasting QR code data.</p>
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 rounded-2xl border border-slate-200/60 mb-5">
              <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Paste QR code data below to validate event passes.
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Paste QR code data here..." value={qrInput} onChange={(e) => setQrInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && qrInput.trim()) handleQRScan(qrInput.trim()); }} className={inputCls} />
                <button onClick={() => { if (qrInput.trim()) handleQRScan(qrInput.trim()); }} disabled={!qrInput.trim()} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition">Validate QR</button>
              </div>
            </div>
            <AnimatePresence>
              {scannerResult && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-2xl border ${scannerResult.valid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <h4 className={`font-semibold flex items-center gap-2 ${scannerResult.valid ? "text-emerald-800" : "text-red-800"}`}>
                    {scannerResult.valid ? (<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Valid QR Code</>) : (<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Invalid QR Code</>)}
                  </h4>
                  <p className={`mt-2 text-sm ${scannerResult.valid ? "text-emerald-700" : "text-red-700"}`}>{scannerResult.message}</p>
                  {scannerResult.data && (
                    <pre className="mt-3 bg-white/80 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600 overflow-auto">{JSON.stringify(scannerResult.data, null, 2)}</pre>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {activeTab === "events" && (
          <motion.div key="events" {...fadeTab}>
            <h3 className="text-lg font-semibold text-slate-800 mb-1"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>My Events</GradientText></h3>
            <p className="text-sm text-slate-400 mb-5">View and manage all your created events.</p>
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="font-medium">No events created yet</p>
                <p className="text-sm mt-1">Create your first event to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, i) => (
                  <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200/60 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                        {event.description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{event.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                          <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                          <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{event.venue}</span>
                          <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{event.organizer}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 font-mono">ID: {event.eventId}</p>
                      </div>
                      <div className="text-center ml-5 shrink-0">
                        <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                          <QRCodeSVG value={generateEventQRData(event)} size={72} level="M" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-medium">Event QR</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                      <button onClick={() => { setSelectedEvent(event.eventId); setActiveTab("passes"); }}
                        className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                        Manage Passes
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(generateEventQRData(event))}
                        className="text-sm px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        Copy QR
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default EventManager;