/* import React, { useState } from "react";
import "../styles/AuthRequest.css";

function AttendanceSection() {
  const [studentId, setStudentId] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedId = studentId.trim();
    if (trimmedId === "") return;

    // Here we simulate looking up a student's profile by ID
    // Later you can replace this with a real fetch from your backend
    const studentProfile = {
      id: trimmedId,
      name: "Student " + trimmedId.slice(-3), // fake name for now
    };

    // Avoid duplicates
    if (!attendanceList.find((s) => s.id === trimmedId)) {
      setAttendanceList([...attendanceList, studentProfile]);
    }

    setStudentId(""); // clear the input after submitting
  };

  return (
    <section className="authSubSectionContainer">
      <h2 className="sectionTitle">Attendance Tracking:</h2>
      <div className="scrollInner">
        <ul className="attendanceList">
          {checkedInStudents.map((student, index) => (
            <li key={index}>
              ✅ {student.name} ({student.id})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default AttendanceSection;
 */