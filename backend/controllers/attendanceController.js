const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

let csvLock = Promise.resolve();
const withCsvLock = (fn) => {
  const next = csvLock.then(fn, fn);
  csvLock = next.catch(() => {});
  return next;
};

const updateAttendanceCSV = (studentId, date, time, newStatus) => {
  return withCsvLock(() => new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../../backend/attendance.csv');
    if (!fs.existsSync(filePath)) return reject(new Error("Attendance file not found"));
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err);
      const lines = data.split('\n');
      let updated = false;
      const updatedLines = lines.map((line, index) => {
        if (!line.trim() || index === 0) return line;
        const fields = line.split(',');
        if (fields.length >= 6) {
          const lineStudentId = fields[0]?.trim();
          const lineDate = fields[2]?.trim();
          const lineTime = fields[3]?.trim();
          if (lineStudentId === studentId && lineDate === date && lineTime === time) {
            fields[5] = newStatus;
            updated = true;
            return fields.join(',');
          }
        }
        return line;
      });
      if (!updated) return reject(new Error("record_not_found"));
      fs.writeFile(filePath, updatedLines.join('\n'), 'utf8', (writeErr) => {
        if (writeErr) return reject(writeErr);
        resolve(true);
      });
    });
  }));
};

const parseRecord = (fields) => {
  const studentId = fields[0]?.trim();
  const recordDate = fields[2]?.trim();
  const time = fields[3]?.trim();
  const _id = `${studentId}_${recordDate}_${time.replace(/:/g, '-')}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  return {
    _id,
    student_id: studentId || 'N/A',
    name: fields[1]?.trim() || 'N/A',
    date: recordDate || 'N/A',
    time: time || 'N/A',
    subject: fields[4]?.trim() || 'N/A',
    status: fields[5]?.trim() || 'N/A'
  };
};

const emptyStats = () => ({
  total: 0, present: 0, absent: 0, presentPercentage: 0, absentPercentage: 0, bySubject: {}
});

const CSV_PATH = path.join(__dirname, '../../backend/attendance.csv');

const readCsvLines = async () => {
  if (!fs.existsSync(CSV_PATH)) return null;
  const content = await fsPromises.readFile(CSV_PATH, 'utf-8');
  return content.split('\n').filter(line => line.trim());
};

const attendanceController = {
  updateAttendanceStatus: async (req, res) => {
    const { recordId, status } = req.body;
    if (!recordId || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields: recordId and status are required" });
    }
    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value. Must be 'Present' or 'Absent'" });
    }
    try {
      const parts = recordId.split('_');
      if (parts.length < 3) {
        return res.status(400).json({ success: false, message: "Invalid recordId format. Expected: studentId_date_time-with-hyphens" });
      }
      const studentId = parts[0];
      const date = parts[1];
      const time = parts[2].replace(/-/g, ':');
      if (!/^[a-zA-Z0-9]+$/.test(studentId)) {
        return res.status(400).json({ success: false, message: "Invalid student ID format" });
      }
      await updateAttendanceCSV(studentId, date, time, status);
      res.status(200).json({
        success: true,
        message: "Attendance status updated successfully",
        data: { recordId, studentId, date, time, status, updatedAt: new Date().toISOString() }
      });
    } catch (error) {
      console.error("Update Attendance Error:", error.message);
      if (error.message === "record_not_found") {
        return res.status(404).json({ success: false, message: "Attendance record not found for the specified student, date, and time" });
      }
      res.status(500).json({ success: false, message: "Failed to update attendance status" });
    }
  },

  getAttendance: async (req, res) => {
    try {
      const { date } = req.query;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const skip = (page - 1) * limit;
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: "Invalid date format. Please use YYYY-MM-DD" });
      }
      const lines = await readCsvLines();
      if (!lines || lines.length === 0) {
        return res.status(200).json({ success: true, records: [], message: lines === null ? "Attendance file not found" : "Attendance file is empty" });
      }
      const records = [];
      const startIndex = lines[0].includes('student_id') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const fields = lines[i].split(',');
        if (fields.length >= 6) {
          const record = parseRecord(fields);
          if (!date || record.date === date) records.push(record);
        }
      }
      res.status(200).json({
        success: true,
        records: records.slice(skip, skip + limit),
        count: records.length,
        pagination: { page, limit, total: records.length, totalPages: Math.ceil(records.length / limit) }
      });
    } catch (error) {
      console.error("Error processing attendance request:", error.message);
      res.status(500).json({ success: false, message: "Failed to process attendance records" });
    }
  },

  getAllAttendance: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
      const skip = (page - 1) * limit;
      const lines = await readCsvLines();
      if (!lines || lines.length === 0) {
        return res.status(200).json({ success: true, records: [], message: lines === null ? "Attendance file not found" : "Attendance file is empty" });
      }
      const records = [];
      const startIndex = lines[0].includes('student_id') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const fields = lines[i].split(',');
        if (fields.length >= 6) records.push(parseRecord(fields));
      }
      return res.status(200).json({
        success: true,
        records: records.slice(skip, skip + limit),
        count: records.length,
        pagination: { page, limit, total: records.length, totalPages: Math.ceil(records.length / limit) }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to process attendance records" });
    }
  },

  getAttendanceStatistics: async (req, res) => {
    try {
      const { date, subject } = req.query;
      const lines = await readCsvLines();
      if (!lines || lines.length <= 1) {
        return res.status(200).json({ success: true, statistics: emptyStats() });
      }
      const statistics = { total: 0, present: 0, absent: 0, presentPercentage: 0, absentPercentage: 0, bySubject: {}, byDate: {} };
      const startIndex = lines[0].includes('student_id') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const fields = lines[i].split(',');
        if (fields.length >= 6) {
          const recordDate = fields[2]?.trim();
          const recordSubject = fields[4]?.trim();
          const status = fields[5]?.trim();
          if (date && recordDate !== date) continue;
          if (subject && recordSubject !== subject) continue;
          statistics.total++;
          if (status === 'Present') statistics.present++;
          else if (status === 'Absent') statistics.absent++;
          if (!statistics.bySubject[recordSubject]) statistics.bySubject[recordSubject] = { total: 0, present: 0, absent: 0 };
          statistics.bySubject[recordSubject].total++;
          if (status === 'Present') statistics.bySubject[recordSubject].present++;
          if (status === 'Absent') statistics.bySubject[recordSubject].absent++;
          if (!statistics.byDate[recordDate]) statistics.byDate[recordDate] = { total: 0, present: 0, absent: 0 };
          statistics.byDate[recordDate].total++;
          if (status === 'Present') statistics.byDate[recordDate].present++;
          if (status === 'Absent') statistics.byDate[recordDate].absent++;
        }
      }
      if (statistics.total > 0) {
        statistics.presentPercentage = ((statistics.present / statistics.total) * 100).toFixed(1);
        statistics.absentPercentage = ((statistics.absent / statistics.total) * 100).toFixed(1);
        Object.keys(statistics.bySubject).forEach(subject => {
          const s = statistics.bySubject[subject];
          s.presentPercentage = s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : "0";
          s.absentPercentage = s.total > 0 ? ((s.absent / s.total) * 100).toFixed(1) : "0";
        });
        Object.keys(statistics.byDate).forEach(date => {
          const d = statistics.byDate[date];
          d.presentPercentage = d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : "0";
          d.absentPercentage = d.total > 0 ? ((d.absent / d.total) * 100).toFixed(1) : "0";
        });
      }
      res.status(200).json({ success: true, statistics, filters: { date, subject } });
    } catch (error) {
      console.error("Error generating statistics:", error.message);
      res.status(500).json({ success: false, message: "Failed to generate attendance statistics" });
    }
  }
};

module.exports = attendanceController;