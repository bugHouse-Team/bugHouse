import React, { useEffect, useState } from "react";
import "../styles/TutorReport.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TutorReport = ({ tutorId }) => {
  const token = localStorage.getItem("firebase_token");
  const [report, setReport] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tutors/${tutorId}/report`,{headers: {
          Authorization: `Bearer ${token}`,
        },}).catch((err) => {
                const status = err.response?.status;
                if (status === 302) {
                    console.warn("🚫 302 Error - redirecting to login...");
                    navigate("/signin");
                } else {
                    console.error("❌ Error:", err);
                }
            });
      setReport(res.data);
    } catch (err) {
      console.error("Failed to fetch tutor report:", err);
      setReport(null);
    }
  };

  if (!report) return <p className="tutor-report-loading">Loading report...</p>;

  return (
    <div className="tutor-report-card">
      <h3>Your Tutoring Report</h3>

      <div className="tutor-report-item">
        <strong>Total Sessions:</strong> {report.totalSessions || 0}
      </div>

      <div className="tutor-report-item">
        <strong>Students Helped:</strong> {report.totalStudents || 0}
      </div>

      <div className="tutor-report-item">
        <strong>Subjects:</strong> {report.subjects?.length ? report.subjects.join(", ") : "N/A"}
      </div>
    </div>
  );
};

export default TutorReport;
