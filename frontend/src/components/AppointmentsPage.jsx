import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import BookingSessionModal from "./BookingSessionModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/AppointmentsPage.css";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AppointmentsPage({ user, onChange, refreshTrigger }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const token = localStorage.getItem("firebase_token");
  const navigate = useNavigate();

  const studentId = user.id;
  const boxRef = useRef();

  useEffect(() => {
    if (studentId) fetchAppointments();
  }, [studentId, refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setSelectedAppointment(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/students/${studentId}/bookings`,{headers: {
          Authorization: `Bearer ${token}`,
        },});
      const formatted = res.data.map((booking) => ({
        id: booking.id,
        tutor: booking.tutorId?.name || "Unknown Tutor",
        time: formatBookingTime(booking),
        subjects: booking.subjects.join(", ") || "No subjects listed",
      }));
      setAppointments(formatted);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    }
  };

  const formatBookingTime = (booking) => {
    const date = new Date(booking.date);
    const options = { month: "long", day: "numeric", year: "numeric", weekday: "short" };
    const formattedDate = date.toLocaleDateString(undefined, options);
    return `${formattedDate} ${booking.startTime} - ${booking.endTime}`;
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleKeepAppointment = () => {
    toast.success("Appointment Remains Unchanged");
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = async () => {
    try {
      await axios.delete(`${API_URL}/api/slots/${selectedAppointment.id}`, {headers: {
          Authorization: `Bearer ${token}`,
        },});
      setAppointments((prev) => prev.filter((appt) => appt.id !== selectedAppointment.id));
      toast.success("Appointment Cancelled Successfully");
      setSelectedAppointment(null);
      if (onChange) onChange();
    } catch (err) {
      console.error("Error canceling appointment:", err);
      toast.error("Failed to cancel appointment.");
    }
  };

  return (
    <div className="appointments-container">
      <div className="appointments-box" ref={boxRef}>
        <h2>Upcoming Appointments:</h2>
        <div className="appointments-scroll">
          <ul>
            {appointments.length === 0 ? (
              <p className="no-appointments">No upcoming appointments</p>
            ) : (
              appointments.map((appointment) => (
                <li
                  key={appointment.id}
                  onClick={() => handleAppointmentClick(appointment)}
                  className={selectedAppointment?.id === appointment.id ? "selected" : ""}
                >
                  <strong>{appointment.tutor}</strong><br />
                  {appointment.time}<br />
                  <em>Subjects:</em> {appointment.subjects}
                </li>
              ))
            )}
          </ul>
        </div>

        {!selectedAppointment && (
          <div className="schedule-session-btn-container">
            <button className="uta-btn uta-btn-primary" onClick={() => setIsBookingModalOpen(true)}>
              Schedule a Session
            </button>
          </div>
        )}

        {selectedAppointment && (
          <div className="edit-options" ref={boxRef}>
            <button className="uta-btn uta-btn-danger" onClick={handleCancelAppointment}>
              Cancel Appointment
            </button>
            <button className="uta-btn uta-btn-secondary" onClick={handleKeepAppointment}>
              Keep Appointment
            </button>
          </div>
        )}
      </div>

      <BookingSessionModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          fetchAppointments();
        }}
        user={user}
      />
    </div>
  );
}

export default AppointmentsPage;
