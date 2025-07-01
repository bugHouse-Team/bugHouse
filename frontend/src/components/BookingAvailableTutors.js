// BookingAvailableTutors.jsx
import React from "react";
import "../styles/booking.css";

const BookingAvailableTutors = ({ slots = [], onSelectSlot, selectedSlotId }) => {
  const handleChange = (e) => {
    onSelectSlot(String(e.target.value)); // Ensure value is treated as a string
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="available-tutors-container">
      <h3>Available Sessions</h3>
      <div className="tutors-list">
        {slots.length > 0 ? (
          slots.map((slot) => (
            <label key={slot.id} className="block">
              <input
                type="radio"
                name="slot"
                value={slot.id}
                onChange={handleChange}
                checked={String(selectedSlotId) === String(slot.id)}
              />
              <div className="tutor-details">
                <div className="tutor-item">
                  <strong>Name:</strong> <span>{slot.tutorId?.name || "Unknown"}</span>
                </div>
                <div className="tutor-item">
                  <strong>Date:</strong> <span>{formatDate(slot.date)}</span>
                </div>
                <div className="tutor-item">
                  <strong>Time:</strong> <span>{slot.startTime} – {slot.endTime}</span>
                </div>
                <div className="tutor-item">
                  <strong>Mode:</strong> <span>{slot.mode || "Online"}</span>
                </div>
                <div className="tutor-item">
                  <strong>Subjects:</strong> <span>{slot.subjects.join(', ')}</span>
                </div>
              </div>
            </label>
          ))
        ) : (
          <p className="text-red-500 text-center font-medium">
            No sessions available with the selected filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingAvailableTutors;