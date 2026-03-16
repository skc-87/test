import DataTable from "./DataTable";
import { motion } from "framer-motion";
import axios from "axios";
import { GradientText } from "./reactbits";

const handleViewFile = async (url, fileName) => {
  try {
    const token = sessionStorage.getItem("authToken");
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" });
    const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120000);
  } catch { alert("Failed to load file. Please try again."); }
};

const HandwritingSamplesTable = ({ data, isLoading, API_BASE_URL, searchTerm }) => {
  const filteredData = data.filter((sample) => sample.studentName?.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="mb-8 p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/60 border border-slate-100/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-200/50">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </span>
          <GradientText colors={["#06b6d4", "#3b82f6", "#06b6d4"]} animationSpeed={4}>Handwriting Samples</GradientText>
        </h2>
        {filteredData.length > 0 && (
          <span className="px-3 py-1 text-xs font-semibold bg-cyan-100 text-cyan-700 rounded-full">
            {filteredData.length} {filteredData.length === 1 ? 'sample' : 'samples'}
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/80">
        <DataTable title="handwriting samples" data={filteredData}
          columns={[
            { key: "studentId", header: "Student ID", headerClass: "font-semibold text-slate-700", cellClass: "font-medium text-slate-900" },
            { key: "studentName", header: "Student Name", headerClass: "font-semibold text-slate-700", cellClass: "text-slate-800" },
            { key: "uploadDate", header: "Uploaded At", headerClass: "font-semibold text-slate-700", cellClass: "text-slate-500", render: (item) => new Date(item.uploadDate).toLocaleString() },
            { key: "actions", header: "File", headerClass: "font-semibold text-slate-700",
              render: (item) => (
                <button onClick={() => handleViewFile(`${API_BASE_URL}/view-sample/${item.studentId}`, `sample-${item.studentName}`)}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors cursor-pointer bg-transparent border-none"
                  aria-label={`View handwriting sample for ${item.studentName}`}>
                  View
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}
          ]}
          isLoading={isLoading}
          emptyMessage={
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-full mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-base font-medium text-slate-500">No handwriting samples found</p>
              {searchTerm && <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>}
            </div>
          }
          rowClass="hover:bg-indigo-50/30 transition-colors duration-150"
          headerClass="bg-slate-50/80 text-left"
          loadingComponent={
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-200 border-t-cyan-600"></div>
            </div>
          }
        />
      </div>
    </motion.div>
  );
};

export default HandwritingSamplesTable;