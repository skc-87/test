import { toast } from "react-toastify";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { GradientText } from "./reactbits";

const InputField = ({ id, label, value, onChange, placeholder, icon }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input id={id} type="text" placeholder={placeholder} value={value} onChange={onChange}
        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition bg-slate-50/50 hover:bg-white text-sm"
        aria-label={label} />
    </div>
  </div>
);
const FileUploadForm = ({ onUpload, isLoading }) => {
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file to upload'); return; }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) { toast.error('Only JPG, PNG, and PDF files are allowed'); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error('File size must be less than 5MB'); return; }
    if (!studentId && !studentName) { toast.error('Please provide either Student ID or Name'); return; }
    onUpload({ studentId, studentName, file });
  };
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };
  const handleFileClick = () => { fileInputRef.current.click(); };

  return (
    <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100/80">
      <div className="text-center mb-7">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200/50 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </span>
        <h2 className="text-xl font-bold text-slate-800"><GradientText colors={["#6366f1", "#8b5cf6", "#6366f1"]} animationSpeed={4}>Upload Handwriting Sample</GradientText></h2>
        <p className="text-sm text-slate-400 mt-1">Submit student work for analysis</p>
      </div>
      <div className="space-y-4">
        <InputField id="studentId" label="Student ID" value={studentId}
          onChange={(e) => setStudentId(e.target.value)} placeholder="Enter Student ID"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>} />
        <div className="flex items-center my-1">
          <div className="flex-grow h-px bg-slate-200" />
          <span className="px-3 text-xs text-slate-400 font-semibold tracking-wider uppercase">or</span>
          <div className="flex-grow h-px bg-slate-200" />
        </div>
        <InputField id="studentName" label="Student Name" value={studentName}
          onChange={(e) => setStudentName(e.target.value)} placeholder="Enter Student Name"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <div className="mt-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Document File</label>
          <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
              isDragging ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
                : file ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20"}`}
            onClick={handleFileClick} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
            onDragOver={handleDragOver} onDrop={handleDrop}>
            <input ref={fileInputRef} id="fileInput" type="file" accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setFile(e.target.files[0])} className="hidden" aria-label="File upload" required />
            <div className="flex flex-col items-center justify-center space-y-2">
              {file ? (
                <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              {file ? (
                <>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="mt-1 text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">JPG, PNG or PDF (max. 5MB)</p>
                </>
              )}
            </div>
          </div>
        </div>
        <button type="submit" disabled={isLoading || !file}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
            isLoading || !file ? "bg-slate-300 cursor-not-allowed text-slate-500"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:-translate-y-0.5"}`}>
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Document
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default FileUploadForm;