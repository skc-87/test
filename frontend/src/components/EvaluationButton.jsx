import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EvaluationButton = ({ assignment, onEvaluate, isEvaluated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [marks, setMarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const numMarks = Number(marks);
    if (!marks || isNaN(numMarks) || numMarks < 0 || numMarks > 100) return;
    setIsSubmitting(true);
    try { await onEvaluate(assignment._id, numMarks); setIsOpen(false); }
    finally { setIsSubmitting(false); }
  };
  return (
    <div className="relative">
      <button onClick={() => { setMarks(""); setIsOpen(true); }} disabled={isEvaluated}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
          isEvaluated ? "bg-emerald-100 text-emerald-700 cursor-default"
            : "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-200/50 hover:shadow-lg hover:-translate-y-0.5"}`}>
        {isEvaluated ? (
          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Evaluated</>
        ) : (
          <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Evaluate</>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full z-10 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Evaluate Assignment</h3>
                    <p className="text-sm text-slate-500">{assignment.studentName}</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <label htmlFor="marks-input" className="block text-sm font-semibold text-slate-700 mb-2">Marks (0–100)</label>
                  <input id="marks-input" type="number" min="0" max="100" value={marks} onChange={(e) => setMarks(e.target.value)}
                    placeholder="Enter marks" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition bg-slate-50/50 text-sm mb-5"
                    required autoFocus />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsOpen(false)}
                      className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm">Cancel</button>
                    <button type="submit" disabled={isSubmitting}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-200/50 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                      ) : "Save Marks"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvaluationButton;