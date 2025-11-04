import React, { useState } from "react";
import "../styles/SwipeAttendance.css";

function SwipeAttendance() {
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Helper: Parse swipe data
function parseSwipe(rawInput) {
  if (!rawInput) return { id: "", name: "" };

  let id = "";
  let name = "";

  // Track 1 (name): %B6391500926068134^NGUYEN/TRUONG B ^
  const track1 = rawInput.match(/%B\d+\^([^/]+)\/([^\^]+)/);
  if (track1) {
    const last = track1[1].trim().replace(/[^A-Za-z]/g, "");
    const first = track1[2].trim().replace(/[^A-Za-z]/g, "");
    name = `${first} ${last}`;
  }

  // Track 2 / Track 3 (ID): ;1002151686?
  const trackId = rawInput.match(/;(\d{6,})\?/);
  if (trackId) id = trackId[1];

  return { id, name };
}

  const handleInputChange = (e) => setStudentId(e.target.value);

const handleSubmit = async (e) => {
  
  e.preventDefault();
  if (!studentId.trim()) {
    setMessage("Please swipe your card or enter your ID.");
    return;
  }

  var { id, name } = parseSwipe(studentId);

  console.log("Submit:");
  console.log(id);
  console.log(", ");
  console.log(name);

  if(id.length >= 10 || studentId.startsWith("100")) {
    try {
      // Send the full raw swipe string to backend
      const res = await fetch("http://localhost:5000/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId.trim() }),
      });

      if (!res.ok) throw new Error("Check-in failed");


      const data = await res.json()
      console.log(data);
      //setMessage(`✅ Check-in successful!`);
      setMessage(data.message);
      setStudentId("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error: Unable to record attendance.");
    }
  } else {
    if(!(studentId[0] == ';' || studentId[0] == '%'))
      setMessage("❌ Error: Invalid data.");

    setStudentId("");
  }
};


  return (
    <div className="swipe-container">
      <h1>Welcome to UTA Student Success Center</h1>
      <form onSubmit={handleSubmit} className="swipe-form">
        <label htmlFor="email">Check in/out</label>
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
