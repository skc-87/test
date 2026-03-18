import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../config";
import { GradientText, ShinyText } from "./reactbits";

const CompareHandwriting = ({ studentId, isReadyForComparison, onComparisonFailed }) => {
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [randomFact, setRandomFact] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [progress, setProgress] = useState(0);

  const funFacts = [
    "Handwriting can reveal over 5,000 personality traits!",
    "No two people write the same – even identical twins.",
    "Leonardo da Vinci wrote in mirror writing.",
    "The word 'graphology' comes from Greek: 'graph' = write, 'ology' = study.",
    "Your brain makes over 1000 decisions per second when you write!",
    "Writing by hand activates more regions of the brain than typing.",
    "Cursive writing improves fine motor skills and brain development.",
    "Some schools in the world still teach calligraphy as a subject.",
    "In the digital age, handwritten notes are shown to improve memory retention.",
    "The loops and slants in your handwriting may reflect your mood and confidence.",
  ];

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 10) + 5, 95));
      }, 800);
      return () => clearInterval(timer);
    } else {
      setProgress(0);
    }
  }, [loading]);

  const handleCompare = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) { toast.error("User not authenticated. Please log in."); return; }

    setLoading(true);
    setComparisonResult(null);
    setError(null);
    setRandomFact(funFacts[Math.floor(Math.random() * funFacts.length)]);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/model/compare-handwriting/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;

      // Both "success" (matched) and "mismatch" (didn't match) are valid completed results
      if (data.status === "success" || data.status === "mismatch") {
        setComparisonResult(data);
        setProgress(100);
        toast.success("Analysis complete!");
      } else {
        throw new Error(data.message || "Comparison failed with an unknown error.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Server error while comparing handwriting.";
      const wasDeleted = err.response?.data?.deleted === true;
      setError(errorMessage);
      toast.error(`Analysis Failed: ${errorMessage}`);
      if (onComparisonFailed) onComparisonFailed(wasDeleted);
    } finally {
      setLoading(false);
    }
  };

  // Determine matched state — works for both "success" and "mismatch" statuses
  const isMatched = comparisonResult?.matched === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100/80"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
          Handwriting Analysis
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <ShinyText text={showDetails ? "Hide details" : "How it works"} speed={3} className="text-sm" />
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl text-sm text-slate-700 border border-indigo-100/60">
              <p className="mb-3 font-medium text-indigo-800">Our AI-powered system analyzes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Letter shapes and formations",
                  "Spacing between words and letters",
                  "Pen pressure and stroke patterns",
                  "Slant angles and baseline alignment",
                  "Unique flourishes and signatures",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleCompare}
        disabled={!isReadyForComparison || loading}
        className={`w-full py-3.5 text-white font-semibold rounded-xl flex justify-center items-center gap-2.5 transition-all duration-300 ${
          !isReadyForComparison || loading
            ? "bg-slate-300 cursor-not-allowed text-slate-500"
            : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5"
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Compare Handwriting
          </>
        )}
      </button>

      {!isReadyForComparison && (
        <p className="text-center text-sm text-slate-400 mt-2.5">
          Upload an assignment first to enable comparison.
        </p>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5"
          >
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium">Analyzing samples...</span>
              <span className="font-semibold text-indigo-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {randomFact && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-sm text-amber-800 flex items-start gap-2"
              >
                <span className="text-base leading-none mt-0.5">💡</span>
                <span><strong>Did you know?</strong> {randomFact}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comparisonResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`mt-6 p-5 rounded-2xl border-2 ${isMatched ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`flex items-center justify-center w-10 h-10 rounded-full ${isMatched ? "bg-emerald-100" : "bg-red-100"}`}>
                {isMatched ? (
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <div>
                <h4 className={`text-lg font-bold ${isMatched ? "text-emerald-800" : "text-red-800"}`}>
                  <GradientText
                    colors={isMatched ? ["#059669", "#10b981", "#059669"] : ["#dc2626", "#ef4444", "#dc2626"]}
                    animationSpeed={3}
                  >
                    {isMatched ? "Match Found" : "No Match Found"}
                  </GradientText>
                </h4>
                <p className="text-sm text-slate-500">AI analysis complete</p>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${isMatched ? "bg-emerald-100/60" : "bg-red-100/60"}`}>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-slate-600">Average Similarity:</span>
                <span className={`text-2xl font-bold ${isMatched ? "text-emerald-700" : "text-red-700"}`}>
                  {comparisonResult.average_similarity?.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Individual page scores: {comparisonResult.individual_similarities?.join("%, ")}%
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3"
          >
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CompareHandwriting;