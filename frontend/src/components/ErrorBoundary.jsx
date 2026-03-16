import { Component } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Uncaught UI error:", error.message); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-8">An unexpected error occurred. Please try again or contact support if the problem persists.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <RotateCcw className="w-4 h-4" />Try Again
              </button>
              <button onClick={() => (window.location.href = "/")} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors">
                <Home className="w-4 h-4" />Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
