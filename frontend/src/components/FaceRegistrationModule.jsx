import { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { GradientText } from "./reactbits";
const inputCls = "w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition text-sm";
const FaceRegistrationModule = ({ token, apiUrl }) => {
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ studentId: "", studentName: "", image: "", imageFile: null });
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const captureImage = () => {
    if (!webcamRef.current) { toast.error("Camera not ready. Please wait and try again."); return; }
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) { toast.error("Unable to capture image"); return; }
    const blob = dataURLtoBlob(imageSrc);
    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
    setFormData({ ...formData, image: imageSrc, imageFile: file });
    setShowCamera(false);
    toast.success("Image captured successfully");
  };
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], { type: mime });
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match(/^image\//)) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, image: event.target.result, imageFile: file });
      toast.success("Image selected successfully");
    };
    reader.readAsDataURL(file);
  };
  const handleRegister = async () => {
    if (!formData.studentId || !formData.studentName || !formData.imageFile) {
      toast.error("Please provide all fields and capture/upload a face image."); return;
    }
    try {
      setIsLoading(true);
      const payload = { student_id: formData.studentId, name: formData.studentName, image: formData.image };
      const response = await axios.post(`${apiUrl}/register-face`, payload, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (response.data.success) {
        setRegistrationStatus({ studentId: formData.studentId, name: formData.studentName, status: "Registered" });
        toast.success(response.data.message || "Student registered successfully!");
        setFormData({ studentId: "", studentName: "", image: "", imageFile: null });
        setShowCamera(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else { toast.error(response.data.message || "Registration failed"); }
    } catch (error) {
      console.error("Registration error:", error.message);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Registration failed. Please try again.");
    } finally { setIsLoading(false); }
  };
  const canSubmit = formData.studentId && formData.studentName && formData.imageFile && !isLoading;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/60 border border-slate-100/80 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2.5">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-200/50">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </span>
        <GradientText colors={["#06b6d4", "#3b82f6", "#06b6d4"]} animationSpeed={4}>Student Face Registration</GradientText>
      </h2>
      <p className="text-sm text-slate-400 mb-6 ml-[46px]">Register student faces for automated attendance recognition.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Student ID <span className="text-rose-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </span>
              <input type="text" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className={`${inputCls} pl-10`} placeholder="Enter student ID" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name <span className="text-rose-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <input type="text" value={formData.studentName} onChange={(e) => setFormData({ ...formData, studentName: e.target.value })} className={`${inputCls} pl-10`} placeholder="Enter student's full name" required />
            </div>
          </div>
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-600 mb-3">Face Image <span className="text-rose-400">*</span></label>
            <div className="flex flex-col space-y-3">
              <button type="button" onClick={() => setShowCamera(true)} disabled={!formData.studentId || !formData.studentName}
                className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${!formData.studentId || !formData.studentName ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Use Camera
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" id="face-file-upload" />
              <label htmlFor="face-file-upload" className="px-5 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-center cursor-pointer font-medium text-sm text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Upload Image
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <AnimatePresence mode="wait">
            {showCamera ? (
              <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md space-y-3">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} className="w-full" />
                </div>
                <div className="flex gap-3">
                  <button onClick={captureImage} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                    Capture
                  </button>
                  <button onClick={() => setShowCamera(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 transition">Cancel</button>
                </div>
              </motion.div>
            ) : formData.image ? (
              <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md space-y-3">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                  <img src={formData.image} alt="Captured" className="w-full" />
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
                  <span className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Image ready
                  </span>
                  <button onClick={() => setFormData({ ...formData, image: "", imageFile: null })} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 font-medium hover:bg-red-200 transition">Remove</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md h-64 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                <div className="text-center p-4">
                  <svg className="h-12 w-12 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-sm font-medium">No image selected</p>
                  <p className="text-xs mt-1 text-slate-400">Capture or upload a face image</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleRegister} disabled={!canSubmit}
          className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${canSubmit ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          {isLoading ? (
            <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Registering...</>
          ) : (
            <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>Register Student</>
          )}
        </button>
      </div>
      <AnimatePresence>
        {registrationStatus && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-200/60">
            <h3 className="text-base font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Registration Successful
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{registrationStatus.studentId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Name:</span>
                <span className="font-semibold text-slate-800">{registrationStatus.name}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default FaceRegistrationModule;
