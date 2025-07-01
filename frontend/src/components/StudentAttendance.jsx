import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentAttendance.css";


const StudentAttendance = ({ user }) => {
  const [attendanceLog, setAttendanceLog] = useState([]);

  useEffect(() => {
    console.log("📌 StudentAttendance mounted");
    console.log("👤 user.email is:", user?.email);

    if (!user?.email) return;

    const logAttendance = async () => {
      try {
        console.log("📤 Sending POST to log attendance...");
        await axios.post("/api/students/attendance/log", {
          email: user.email,
          type: "Sign In",
        });
        console.log("✅ Attendance logged");
        fetchAttendance();
      } catch (err) {
        console.error("❌ Failed to log sign in:", err);
      }
    };

    const fetchAttendance = async () => {
      try {
        console.log("📥 Fetching attendance history...");
        const res = await axios.get(`/api/students/attendance/${user.email}`);
        console.log("📊 Fetched attendance:", res.data);
        setAttendanceLog(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch attendance:", err);
      }
    };

    logAttendance();
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const handleBeforeUnload = () => {
      const url = "/api/students/attendance/log";
      const payload = JSON.stringify({
        email: user.email,
        type: "Sign Out",
      });

      const headers = {
        type: "application/json",
      };

      navigator.sendBeacon(url, new Blob([payload], headers));
      console.log("📤 Sent Sign Out via beacon");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user?.email]);

  return (
    <div className="attendance-container">
      <h3 className="attendance-title">Attendance History</h3>
      <div className="attendance-log">
        {attendanceLog.map((entry, index) => (
          <div key={index}>
            <strong>{entry.type}</strong> –{" "}
            {new Date(entry.timestamp).toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );
  

}; // ✅ this closes the StudentAttendance function

export default StudentAttendance;
