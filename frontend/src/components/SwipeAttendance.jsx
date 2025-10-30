import React, { useState } from "react";
import "../styles/SwipeAttendance.css";

function SwipeAttendance() {
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");

  // Extract clean ID + Name from swipe
  const parseSwipeData = (rawInput) => {
    let id = "";
    let name = "";

    const track1 = rawInput.match(/%B(\d+)\^([^\/]+)\/([^\\^]+)/);
    if (track1) {
      id = track1[1];
      name = `${track1[3].trim()} ${track1[2].trim()}`;
    } else {
      const track2 = rawInput.match(/;(\d+)=/);
      if (track2) id = track2[1];
      if (!id) id = rawInput.replace(/[^0-9]/g, "");
      name = "Unknown";
    }

    return { id, name };
  };

  const handleInputChange = (e) => setStudentId(e.target.value);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!studentId.trim()) {
    setMessage("Please swipe your card or enter your ID.");
    return;
  }

  try {
    // Send the full raw swipe string to backend
    const res = await fetch("http://localhost:5000/api/attendance/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: studentId.trim() }),
    });

    if (!res.ok) throw new Error("Check-in failed");

    setMessage(`✅ Check-in successful!`);
    setStudentId("");
  } catch (err) {
    console.error(err);
    setMessage("❌ Error: Unable to record attendance.");
  }
};


  return (
    <div className="swipe-container">
      <h1>Welcome to UTA Student Success Center</h1>
      <form onSubmit={handleSubmit} className="swipe-form">
        <label htmlFor="email">Check in</label>
        <input
          type="text"
          value={studentId}
          onChange={handleInputChange}
          placeholder="Swipe or type your ID"
          autoFocus
        />
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default SwipeAttendance;
