import React from "react";
import HeaderBar from "./HeaderBar";
import AuthRequest from "./AuthRequest"
import UnassignedRoles from "./UnassignedRoles"
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
  const userEmail = localStorage.getItem("emailForSignIn"); // Get admin's email
  return (
    <div>
      <HeaderBar />
      
      <main className="leftPanel">
        {/* column 1 – profile then search */}
        <div className="sideColumn">
          <ProfileWrapper>                          {/* NEW wrapper */}
            {userEmail && <Profile email={userEmail} />}
          </ProfileWrapper>

          <ProfileSearch />
        </div>

        {/* column 2 – requests then calendar */}
        <div className="calendarColumn">
          <AvailabilityRequests />
          <Calendar isAdmin={true} />
          </div>
      </main>
      <main className="rightPanel">
        <AuthRequest />
        <UnassignedRoles />
      </main>
    </div>
  );
};

export default AdminDashboard;
