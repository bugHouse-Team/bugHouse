import React, { useEffect, useState } from "react";
import "../styles/AuthRequest.css";

// Component for Attendance Tracking Box
function AttendanceTrackingBox() {
  const [recentCheckIns, setRecentCheckIns] = useState([]);

  const fetchCheckIns = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/attendance/recent");
      const data = await res.json();
      console.log(data);
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
              ✅ ID: {entry.id}  Name: {entry.name} — Time: {new Date(entry.timestamp).toLocaleTimeString()}
            </li>
          ))
        ) : (
          <li>No check-ins yet</li>
        )}
      </ul>
    </div>
  );
}

function HoursSection() {
  // list of people with ids
  const people = [
    { id: 100112341, name: "John Doe" },
    { id: 100112342, name: "Jane Smith" },
    { id: 100112343, name: "Alice Johnson" },
    { id: 1001123451, name: "Bob Williams" },
    { id: 100112344, name: "John Doe" },
    { id: 100112345, name: "Jane Smith" },
    { id: 100112346, name: "Alice Johnson" },
    { id: 1001123471, name: "Bob Williams" },
    { id: 100112348, name: "John Doe" },
    { id: 100112349, name: "Jane Smith" },
    { id: 1001123450, name: "Alice Johnson" },
    { id: 100112323, name: "Bob Williams" },
    { id: 1001123454, name: "John Doe" },
    { id: 100114562, name: "Jane Smith" },
    { id: 100769209, name: "Alice Johnson" },
    { id: 100105800, name: "Bob Williams" },
    { id: 100000000, name: "John Doe" },
  ];

  return (
    <div className="authRequestContainer">
      {/* --- Authentication Requests Box --- */}
      <section className="authSubSectionContainer">
        <h2 className="sectionTitle">Authentication Requests:</h2>
        <div className="scrollInner">
          <ul className="peopleList">
            {people.map((person, index) => {
              const nameWithComma = `${person.name}`.padEnd(15, " ");
              const line = `${nameWithComma} ${person.id}`;
              return (
                <li key={index} className="personItem">
                  <pre className="personName">{line}</pre>
                  <input type="checkbox" className="personCheckbox" />
                </li>
              );
            })}
          </ul>
        </div>
        <button className="pill">Authenticate</button>
      </section>

      {/* --- Attendance Tracking Box --- */}
      <section className="authSubSectionContainer">
        <h2 className="sectionTitle">Attendance Tracking:</h2>
        <AttendanceTrackingBox />
      </section>
    </div>
  );
}

export default HoursSection;
