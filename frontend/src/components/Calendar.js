import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Calendar.css";
import { useNavigate } from "react-router-dom";


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
          res = await axios.get(`${API_URL}/api/admin/appointments`,{headers: {
          Authorization: `Bearer ${token}`,
        },}).catch((err) => {
                const status = err.response?.status;
                if (status === 302) {
                    console.warn("🚫 302 Error - redirecting to login...");
                    navigate("/signin");
                } else {
                    console.error("❌ Error:", err);
                }
            });
        } else if(isTutor) {
          res = await axios.get(`${API_URL}/api/tutors/${user.id}/bookings`,{headers: {
          Authorization: `Bearer ${token}`,
        },}).catch((err) => {
                const status = err.response?.status;
                if (status === 302) {
                    console.warn("🚫 302 Error - redirecting to login...");
                    navigate("/signin");
                } else {
                    console.error("❌ Error:", err);
                }
            });
        }
         else if (user?.id) {
          res = await axios.get(`${API_URL}/api/students/${user.id}/bookings`,{headers: {
          Authorization: `Bearer ${token}`,
        },}).catch((err) => {
                const status = err.response?.status;
                if (status === 302) {
                    console.warn("🚫 302 Error - redirecting to login...");
                    navigate("/signin");
                } else {
                    console.error("❌ Error:", err);
                }
            });
        } else {
          return;
        }

        const groupedEvents = {};
        const detailedMap = {};

        res.data.forEach((booking) => {
          const dateStr = new Date(booking.date).toISOString().split("T")[0];

          // For student view
          if (!isAdmin) {
            const label = `${booking.subjects?.join(", ") || "Session"} (${booking.startTime})`;
            if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
            groupedEvents[dateStr].push(label);
          } else {
            // For admin, just one "Appointment" label
            if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
            if (!groupedEvents[dateStr].includes("Appointment")) {
              groupedEvents[dateStr].push("Appointment");
            }

            // Store full details for modal
            if (!detailedMap[dateStr]) detailedMap[dateStr] = [];
            detailedMap[dateStr].push({
              studentName: booking.studentId?.name || "Unknown Student",
              tutorName: booking.tutorId?.name || "Unknown Tutor",
              course: booking.subjects?.join(", ") || "Session",
              time: booking.startTime || "N/A"
            });
          }
        });

        setEvents(groupedEvents);
        setDetailedEvents(detailedMap);
      } catch (err) {
        console.error("Failed to load appointments:", err);
      }
    };

    fetchAppointments();
    const interval = setInterval(fetchAppointments, 1000); // Re-fetch every 2 seconds
    return () => clearInterval(interval); // Cleanup on unmount

  }, [user, isAdmin]);

  const openModal = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setShowModal(false);
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
              
              {/* Student's here */}
              {!isAdmin &&
                (events[dateStr] || []).map((e, idx) => (
                  <div key={idx} className="event">{e}</div>
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
                      <hr />
                    </>
                  ) : (
                    item
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
