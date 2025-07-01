import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/TutorCurrentAvailability.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TutorCurrentAvailability = ({ tutorId, onRequestNew }) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tutors/${tutorId}/availability`);
      setAvailability(res.data);
    } catch (err) {
      console.error("No availability found:", err);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/api/tutors/${tutorId}/availability`);
      setAvailability(null);
      toast.success("Availability deleted successfully!");
    } catch (err) {
      console.error("Error deleting availability:", err);
      toast.error("Failed to delete availability.");
    }
  };

  if (loading) return <p>Loading current availability...</p>;

  return (
    <div className="availability-card">
      <h3>Your Current Availability</h3>
      {availability ? (
        <>
          <div className="availability-status">
  <span className="status-label">Approval Status:</span>
  <span className={`status-badge ${availability.isApproved ? "approved" : "pending"}`}>
    {availability.isApproved ? "Approved" : "Pending"}
  </span>
</div>

          <ul className="schedule-list">
  {availability.weeklySchedule.map((day, i) => (
    <li key={i}>
      <strong>{day.day}</strong>
      <div className="time-blocks">
      {day.blocks.map((b, j) => (
  <span key={j} className="time-slot">
    {b.startTime} – {b.endTime}
  </span>
))}

      </div>
    </li>
  ))}
</ul>
          <div className="button-group">
            <button className="uta-btn uta-btn-danger" onClick={handleDelete}>
              Delete Availability
            </button>
            <button className="uta-btn uta-btn-primary" onClick={onRequestNew}>
              Submit New Availability
            </button>
          </div>
        </>
      ) : (
        <div className="no-availability">
        <p>You have not submitted availability yet.</p>
        <div className="add-availability-btn-container">
          <button className="uta-btn uta-btn-primary" onClick={onRequestNew}>
            + Add Availability
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default TutorCurrentAvailability;
