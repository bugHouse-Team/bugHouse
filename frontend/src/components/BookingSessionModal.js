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

const BookingSessionModal = ({ isOpen, onClose, user }) => {
  const [slots, setSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const token = localStorage.getItem("firebase_token");

  const today = new Date();


  const today = new Date();

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    await axios.get(`${API_URL}/api/tutors/slots`, {
      params: { date: today.toISOString() },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      console.log("Fetched slots:", res.data);
    await axios.get(`${API_URL}/api/tutors/slots`, {
      params: { date: today.toISOString() },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      console.log("Fetched slots:", res.data);
      setSlots(res.data);
    }).catch((err) => {
    }).catch((err) => {
      console.error("Failed to fetch slots:", err);
    });
    });
  };

  const handleFilterChange = async (filters) => {
    await axios.get(`${API_URL}/api/tutors/slots`, {
      params: { date: filters.date ? filters.date : today.toISOString(),
                subject: filters.subject,
                tutorEmail: filters.tutorEmail },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      console.log("Fetched slots:", res.data);
      setFilteredSlots(res.data);
      setSelectedSlotId(null);
    }).catch((err) => {
      console.error("Failed to fetch slots:", err);
    });
    
  const handleFilterChange = async (filters) => {
    await axios.get(`${API_URL}/api/tutors/slots`, {
      params: { date: filters.date ? filters.date : today.toISOString(),
                subject: filters.subject,
                tutorEmail: filters.tutorEmail },
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      console.log("Fetched slots:", res.data);
      setFilteredSlots(res.data);
      setSelectedSlotId(null);
    }).catch((err) => {
      console.error("Failed to fetch slots:", err);
    });
    
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

      await axios.post(`${API_URL}/api/slots/book`, { studentId : studentId, date: selectedSlot.date, startTime: selectedSlot.startTime, endTime : selectedSlot.endTime, tutorId : selectedSlot.tutorId.id, subjects: selectedSlot.subjects, },{headers: {
          Authorization: `Bearer ${token}`,
        },});

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
