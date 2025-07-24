// BookingFilters.jsx
import React, { useState, useMemo } from "react";
import "../styles/booking.css";

const BookingFilters = ({ onFilterChange, availableSlots = [] }) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMode, setSelectedMode] = useState("");

  const subjects = useMemo(() => {
    const allSubjects = availableSlots.flatMap(slot => slot.subjects || []);
    return Array.from(new Set(allSubjects));
  }, [availableSlots]);

  const modes = useMemo(() => {
    const allModes = availableSlots.map(slot => slot.mode || "Online");
    return Array.from(new Set(allModes));
  }, [availableSlots]);

  const applyFilters = () => {
    onFilterChange({ subject: selectedSubject, date: selectedDate, mode: selectedMode });
  };

  return (
    <div className="filters-container">
      <h3 className="filters-title">Filters</h3>

      <div className="filter-group">
        <label className="filter-label">Subject</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="filter-select"
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Mode</label>
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          className="filter-select"
        >
          <option value="">Any Mode</option>
          {modes.map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>

      <button onClick={applyFilters} className="uta-btn uta-btn-secondary full-width apply-button">
        Apply Filters
      </button>
    </div>
  );
};

export default BookingFilters;
