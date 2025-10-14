import React, { useState, useMemo, useEffect } from "react";
import "../styles/booking.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BookingFilters = ({ onFilterChange, availableSlots = [] }) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedTutor, setSelectedTutor] = useState("");
  const [tutorSearch, setTutorSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const token = localStorage.getItem("firebase_token");
  const today = new Date();

  useEffect(() => {
    setSelectedDate(today);

    // Fetch tutors
    const fetchTutors = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/tutors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTutors(res.data);
      } catch (err) {
        console.error("❌ Error fetching tutors:", err);
      }
    };

    // Fetch subjects
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/tutors/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(res.data);
      } catch (err) {
        console.error("❌ Error fetching subjects:", err);
      }
    };

    fetchTutors();
    fetchSubjects();
  }, []);

  // Filter tutors by search
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) =>
      tutor.name?.toLowerCase().includes(tutorSearch.toLowerCase())
    );
  }, [tutors, tutorSearch]);

  // Filter subjects by search
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      subject.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  const applyFilters = () => {
    onFilterChange({
      subject: selectedSubject,
      date: selectedDate,
      tutorEmail: selectedTutor,
    });
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  return (
    <div className="filters-container">
      <h3 className="filters-title">Filters</h3>

      {/* Subject Filter */}
      <div className="filter-group">
        <label className="filter-label">Subject</label>

        {/* Subject Search Input */}
        <input
          type="text"
          placeholder="Search subject..."
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "8px",
            fontSize: "0.95rem",
          }}
        />

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="filter-select"
          style={{
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          <option value="">All Subjects</option>
          {filteredSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Date + Mode */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 48%" }} className="filter-group">
          <label className="filter-label">Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date.toISOString())}
            filterDate={isWeekday}
            minDate={today}
            placeholderText="Select a date"
            className="filter-input"
            dateFormat="MM-dd-yyyy"
          />
        </div>

        <div style={{ flex: "1 1 48%" }} className="filter-group">
          <label className="filter-label">Mode</label>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="filter-select"
          >
            <option value="">Any Mode</option>
            <option value="Online">Online</option>
            <option value="In-Person">In-Person</option>
          </select>
        </div>
      </div>

      {/* Tutor Filter */}
      <div
        className="filter-group"
        style={{
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <label className="filter-label">Tutor</label>

        <input
          type="text"
          placeholder="Search tutor..."
          value={tutorSearch}
          onChange={(e) => setTutorSearch(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "8px",
            fontSize: "0.95rem",
          }}
        />

        <select
          value={selectedTutor}
          onChange={(e) => setSelectedTutor(e.target.value)}
          className="filter-select"
          style={{
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          <option value="">All Tutors</option>
          {filteredTutors.map((tutor) => (
            <option key={tutor.email} value={tutor.email}>
              {tutor.name}
            </option>
          ))}
        </select>
      </div>

      {/* Apply Button */}
      <button
        onClick={applyFilters}
        className="uta-btn uta-btn-secondary full-width apply-button"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default BookingFilters;
