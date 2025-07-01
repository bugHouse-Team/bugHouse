// BookingSessionModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./ui/Modal";
import "../styles/booking.css";
import BookingAvailableTutors from "./BookingAvailableTutors";
import BookingFilters from "./BookingFilters";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BookingSessionModal = ({ isOpen, onClose }) => {
  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/slots`);
      setSlots(res.data);
    } catch (err) {
      console.error("Failed to fetch slots:", err);
    }
  };

  const handleFilterChange = (filters) => {
    const filtered = slots.filter((slot) => {
      const subjectMatch = filters.subject ? slot.subjects.includes(filters.subject) : true;
      const dateMatch = filters.date
        ? new Date(slot.date).toISOString().split("T")[0] === filters.date
        : true;
      const modeMatch = filters.mode ? (slot.mode || "Online") === filters.mode : true;
      return subjectMatch && dateMatch && modeMatch;
    });
    setFilteredSlots(filtered);
    setSelectedSlotId(null);
  };

  const handleSlotSelect = (id) => {
    setSelectedSlotId(id);
  };

  const handleSchedule = async () => {
    try {
      const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
      if (!selectedSlot) return;

      const user = JSON.parse(localStorage.getItem("user"));
      const studentId = user?.id;
      console.log("studentid for student modal was " + studentId);
      await axios.post(`${API_URL}/api/slots/${selectedSlotId}/book`, { studentId });

      setSlots(prev => prev.filter(slot => slot.id !== selectedSlotId));
      setFilteredSlots(prev => prev?.filter(slot => slot.id !== selectedSlotId) || null);
      setSelectedSlotId(null);

      toast.success(`Session booked with ${selectedSlot?.tutorId?.name}`);
      onClose();
    } catch (err) {
      console.error("Error booking session:", err);
      toast.error("Failed to book session. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book a Session">
      <BookingFilters onFilterChange={handleFilterChange} availableSlots={slots} />
      <BookingAvailableTutors
        slots={filteredSlots !== null ? filteredSlots : slots}
        onSelectSlot={handleSlotSelect}
        selectedSlotId={selectedSlotId}
      />
      <div className="schedule-btn-container">
        <button
          className="uta-btn uta-btn-primary"
          disabled={!selectedSlotId}
          onClick={handleSchedule}
        >
          Schedule
        </button>
      </div>
    </Modal>
  );
};

export default BookingSessionModal;
