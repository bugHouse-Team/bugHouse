import React, { useState } from "react";
import HeaderBar from "./HeaderBar";
import InfoPanel from "./InfoPanel";
import AppointmentsPage from "./AppointmentsPage";
import TodaysAvailableSlots from "./TodaysAvailableSlots";
import Calendar from "./Calendar";
import Profile from "./Profile";
import StudentAttendance from "./StudentAttendance";
import { useNavigate } from "react-router-dom";

import "../styles/StudentDashboard.css";

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  
  const [refreshAppointmentsFlag, setRefreshAppointmentsFlag] = useState(false);

  const triggerRefreshAppointments = () => {
    setRefreshAppointmentsFlag((prev) => !prev);
  };

  return (
    <div>
      <HeaderBar />

      <main className="student-left-panel">
        <div className="student-profile-chat-container">
          <div className="student-profile">
            <Profile email={user?.email} />
          </div>
          <div  className="student-attendance"> <StudentAttendance user={user} /> </div>
        </div>

        <div className="student-section-box student-available-turors">
          <TodaysAvailableSlots user={user} onChange={triggerRefreshAppointments} refreshTrigger={refreshAppointmentsFlag} />
        </div>

        <div className="student-section-box student-appointments">
          <AppointmentsPage user={user} onChange={triggerRefreshAppointments} refreshTrigger={refreshAppointmentsFlag} />
        </div>

        <div className="student-section-box student-calendar">
        <Calendar user={user} onChange={triggerRefreshAppointments} refreshTrigger={refreshAppointmentsFlag} />
        </div>
      </main>

      <main className="student-right-panel">
        <InfoPanel />
      </main>
    </div>
  );
};


export default StudentDashboard;
