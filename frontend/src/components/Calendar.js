import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Calendar.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Calendar = ({ user, isAdmin, isTutor }) => {
  const [events, setEvents] = useState({});
  const [detailedEvents, setDetailedEvents] = useState({}); // ⬅️ for admin detailed view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("firebase_token");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        let res;

        if (isAdmin) {
          res = await axios.get(`${API_URL}/api/admin/appointments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (isTutor) {
          res = await axios.get(`${API_URL}/api/tutors/${user.id}/bookings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (user?.id) {
          res = await axios.get(`${API_URL}/api/students/${user.id}/bookings`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          return;
        }

        const groupedEvents = {};
        const detailedMap = {};

        // Sort bookings by startTime
        const sortByTime = (a, b) => {
          const t1 = new Date(`1970-01-01T${a.startTime}`);
          const t2 = new Date(`1970-01-01T${b.startTime}`);
          return t1 - t2;
        };

        res.data.sort(sortByTime).forEach((booking) => {
          const dateStr = new Date(booking.date).toISOString().split("T")[0];

          if (!isAdmin) {
            const label = `${booking.subjects?.join(", ") || "Session"} (${booking.startTime})`;
            if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
            groupedEvents[dateStr].push({ label, bookingId: booking._id });
          } else {
            if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
            if (!groupedEvents[dateStr].includes("Appointment")) {
              groupedEvents[dateStr].push("Appointment");
            }

            if (!detailedMap[dateStr]) detailedMap[dateStr] = [];
            detailedMap[dateStr].push({
              bookingId: booking._id,
              studentName: booking.studentId?.name || "Unknown Student",
              tutorName: booking.tutorId?.name || "Unknown Tutor",
              course: booking.subjects?.join(", ") || "Session",
              time: booking.startTime || "N/A",
            });
          }
        });

        console.log(detailedMap);

        setEvents(groupedEvents);
        setDetailedEvents(detailedMap);
      } catch (err) {
        console.error("Failed to load appointments:", err);
      }
    };

    fetchAppointments();
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, [user, isAdmin, isTutor]);


  const openModal = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setShowModal(false);
  };

  const cancelBooking = async (bookingId) => {
    try {
      console.log(bookingId);
      await axios.delete(`${API_URL}/api/slots/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDetailedEvents((prev) => {
        const updated = { ...prev };

        for (const date in updated) {
          updated[date] = updated[date].filter(
            (appt) => appt.bookingId !== bookingId
          );

          if (updated[date].length === 0) delete updated[date];
        }

        return updated;
      });

      setEvents((prev) => {
        const updated = { ...prev };

        for (const date in updated) {
          updated[date] = updated[date].filter(
            (appt) => appt.bookingId !== bookingId
          );
          if (updated[date].length === 0) delete updated[date];
        }

        return updated;
      });

      toast.success("Appointment Cancelled Successfully");
    } catch (err) {
      console.error("Error canceling appointment:", err);
      toast.error("Failed to cancel appointment.");
    }
  };

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = firstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - firstDay + 1;
      if (i < firstDay || dayNum > daysInMonth) {
        days.push(<div key={i} className="calendar-day empty"></div>);
      } else {
        const dateObj = new Date(year, month, dayNum);
        const dateStr = dateObj.toISOString().split("T")[0];
        const isToday = new Date().toDateString() === dateObj.toDateString();

        const dayEvents = events[dateStr] || [];

        days.push(
          <div
            key={i}
            className={`calendar-day ${isToday ? 'today' : ''}`}
            data-date={dateStr}
          >
            <span>{dayNum}</span>
            <div className="events-container">
              {/* For admins: just show "Appointment" label */}
              {isAdmin && dayEvents.length > 0 && (
                <div
                  className="event"
                  onClick={() => openModal(dateStr)}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Appointments
                </div>
              )}
              
              {/* Student/Tutor here */}
              {!isAdmin &&
                (events[dateStr] || []).map((e, idx) => (
                  <div key={idx} className="event">
                    {e.label}
                    {isTutor && (
                      <button
                        className="cancel-btn"
                        onClick={() => cancelBooking(e.bookingId)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return days;
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar">
        <div className="calendar-header">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))}>&lt;</button>
          <span>{currentDate.toLocaleString('default', { month: 'long' })} {year}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))}>&gt;</button>
        </div>
        <div className="calendar-day-names">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="calendar-day-name">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {renderDays()}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="calendar-modal-overlay" onClick={closeModal}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Appointments on {selectedDate}</h3>
            <ul>
              {(isAdmin ? detailedEvents[selectedDate] : events[selectedDate])?.map((item, idx) => (
                <li key={idx}>
                  {isAdmin ? (
                    <>
                      <strong>Student:</strong> {item.studentName}<br />
                      <strong>Tutor:</strong> {item.tutorName}<br />
                      <strong>Course:</strong> {item.course}<br />
                      <strong>Time:</strong> {item.time}<br />
                      {(isAdmin || isTutor) && (
                        <button
                          className="cancel-btn"
                          onClick={() => cancelBooking(item.bookingId)}
                        >
                          Cancel
                        </button>
                      )}
                      <hr />
                    </>
                  ) : (
                    <>
                      {item.label}
                      {isTutor && (
                        <button
                          className="cancel-btn"
                          onClick={() => cancelBooking(item.bookingId)}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>

            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
