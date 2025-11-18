import React, { useEffect, useState } from "react";
import "../styles/AttendanceSection.css";

// Component for Attendance Tracking Box
function AttendanceTrackingBox() {
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  const fetchCheckIns = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/attendance/recent");
      const data = await res.json();
      setRecentCheckIns(data);
    } catch (err) {
      console.error("Failed to fetch recent check-ins:", err);
    }
  };

  useEffect(() => {
    fetchCheckIns();
    const interval = setInterval(fetchCheckIns, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scrollInner">
      <ul className="attendanceList">
        {recentCheckIns.length > 0 ? (
          recentCheckIns.map((entry, index) => (
            <li key={index}>
              ✅ Name: {entry.name} ID: {entry.id} — Time: {new Date(entry.timestamp).toLocaleTimeString()}
            </li>
          ))
        ) : (
          <li>No check-ins yet</li>
        )}
      </ul>
    </div>
  );
}

function AttendanceSection() {

  return (
    <div className="attendanceSectionContainer">
      {/* --- Attendance Tracking Box --- */}
      <section className="authSubSectionContainer">
        <h2 className="sectionTitle">Attendance Tracking:</h2>
        <AttendanceTrackingBox />
      </section>
    </div>
  );
}

export default AttendanceSection;