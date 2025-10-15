import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/TodaysAvailableSlots.css";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";


function TodaysAvailableSlots({ user, onSessionBooked }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const studentId = user.id;
  const boxRef = useRef();
  const navigate = useNavigate();
  const token = localStorage.getItem("firebase_token");

  useEffect(() => {
    if (studentId) fetchTodaysSlots();
  }, [studentId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setSelectedSlot(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTodaysSlots = async () => {
    const today = new Date().toISOString().split("T")[0];
    await axios.get(`${API_URL}/api/tutors/slots`, {
      params: { date: new Date().toISOString() },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const todaysSlots = res.data;

      const formatted = todaysSlots.map((slot) => ({
        id: slot.id,
        tutor: slot.tutorId?.name || "Unknown Tutor",
        time: `${slot.startTime} - ${slot.endTime}`,
        subjects: slot.subjects.join(", ") || "No subjects listed",
        date: slot.date,
        tutorId: slot.tutorId,
        mode: slot.mode || "Online",
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectsArray: slot.subjects || [],
      }));
      setSlots(formatted);
    }).catch((err) => {
      console.error("Failed to fetch today's slots:", err);
      toast.error("Error fetching today's sessions");
    });
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleCancel = () => {
    setSelectedSlot(null);
  };

  const handleBook = async () => {
    try {
      await axios.post(`${API_URL}/api/slots/book`, { studentId : studentId, date: selectedSlot.date, startTime: selectedSlot.startTime, endTime : selectedSlot.endTime, tutorId : selectedSlot.tutorId.id, subjects: selectedSlot.subjectsArray},{headers: {
          Authorization: `Bearer ${token}`,
        },});
      toast.success(`Session booked with ${selectedSlot.tutor}`);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setSelectedSlot(null);
      if (onSessionBooked) onSessionBooked();
    } catch (err) {
      console.error("Error booking slot:", err);
      toast.error("Booking failed. Please try again.");
    }
  };

  return (
    <div className="todays-slots-container">
      <div className="todays-slots-box" ref={boxRef}>
        <h2>Today's Available Tutors:</h2>
        <div className="todays-slots-scroll">
          <ul>
            {slots.length === 0 ? (
              <p className="no-appointments">No available tutors today</p>
            ) : (
              slots.map((slot) => (
                <li
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className={selectedSlot?.id === slot.id ? "selected" : ""}
                >
                  <strong>{slot.tutor}</strong><br />
                  {slot.time}<br />
                  <em>Subjects:</em> {slot.subjects}
                </li>
              ))
            )}
          </ul>
        </div>
        {selectedSlot && (
          <div className="todays-action-buttons" ref={boxRef}>
            <button className="uta-btn uta-btn-primary" onClick={handleBook}>Book</button>
            <button className="uta-btn uta-btn-secondary" onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaysAvailableSlots;
