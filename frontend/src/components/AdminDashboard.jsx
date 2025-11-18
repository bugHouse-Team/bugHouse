import React, { useState } from "react";
import HeaderBar from "./HeaderBar";
import AttendanceSection from "./AttendanceSection";
import ProfileSearch from "./ProfileSearch";
import AvailabilityRequests from "./AvailabilityRequests";
import Profile from "./Profile";
import Calendar from "./Calendar";
import "../styles/AdminDashboard.css"; //leftPanel is in InfoPanel
import { useNavigate } from "react-router-dom";

const ProfileWrapper = ({ children }) => (
  <div className="profileBlock">{children}</div>
);

const AdminDashboard = () => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const userEmail = localStorage.getItem("emailForSignIn"); // Get admin's email

  const refreshAvailability = () => {
    setRefreshFlag((prev) => !prev);
  };

  return (
    <div>
      <HeaderBar />
      
      <main className="leftPanel">
        {/* column 1 – profile then search */}
        <div className="sideColumn">
          <ProfileWrapper>
            {userEmail && <Profile email={userEmail} />}
          </ProfileWrapper>

          <ProfileSearch onAvailabilityChange={refreshAvailability} />
        </div>

        {/* column 2 – requests then calendar */}
        <div className="calendarColumn">
          <AvailabilityRequests refreshFlag={refreshFlag}/>
          <Calendar isAdmin={true} />
          </div>
      </main>
      <main className="rightPanel">
        <AttendanceSection />
      </main>
    </div>
  );
};

export default AdminDashboard;