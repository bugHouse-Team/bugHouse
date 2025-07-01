import React, { useState } from "react";
import axios from "axios";

// UI Components
import HeaderBar from "./HeaderBar";
import Modal from "./ui/Modal";
import Profile from "./Profile";
import Calendar from "./Calendar";
import InfoPanel from "./InfoPanel";

// Tutor-Specific Components
import TutorAvailabilityForm from "./TutorAvailabilityForm";
import TutorCurrentAvailability from "./TutorCurrentAvailability";
import TutorAppointments from "./TutorAppointments";
import TutorReport from "./TutorReport";

// Styles
import "../styles/TutorDashboard.css";

function TutorDashboard({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availabilityKey, setAvailabilityKey] = useState(0); // Used to re-render after update
  const userEmail = localStorage.getItem("emailForSignIn");

  const handleNewRequest = () => {
    setIsModalOpen(true);
  };

  return (
    <div>
      <HeaderBar />

      <main className="tutor-left-panel">
        <div className="tutor-profile-chat-container">
          <div className="student-profile">
            <Profile email={user?.email} />
          </div>
          <div className="tutor-chat">
            <TutorCurrentAvailability
              tutorId={user.id}
              onRequestNew={handleNewRequest}
              key={availabilityKey}
            />
          </div>
        </div>

        <div className="tutor-section-box tutor-appointments">
          <TutorAppointments user={user} refreshTrigger={availabilityKey} />
        </div>

        <div className="tutor-section-box tutor-report">
          <TutorReport tutorId={user.id} />
        </div>

        <div className="tutor-section-box tutor-calendar">
          <Calendar user={user} isTutor={true} />
        </div>

        <main className="tutor-right-panel">
          <InfoPanel />
        </main>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Submit Weekly Availability"
        >
          <TutorAvailabilityForm
            tutorId={user.id}
            onClose={() => {
              setIsModalOpen(false);
              setAvailabilityKey((prev) => prev + 1); // refresh availability
            }}
          />
        </Modal>
      </main>
    </div>
  );
}

export default TutorDashboard;
