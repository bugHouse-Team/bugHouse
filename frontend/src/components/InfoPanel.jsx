import React from "react";
import "../styles/InfoPanel.css";
import AnnouncementsSection from "./AnnoucementsSection";
import HoursSection from "./HoursSection";
import SupportSection from "./SupportSection";


//make the height flex, widht set (can disapear if too small)
function InfoPanel() {
  return (
    <main className="info-panel">
      <AnnouncementsSection />
      <HoursSection />
      <SupportSection />
    </main>
  );
}

export default InfoPanel;