import React, { useState, useEffect } from "react";
import "../styles/AnnouncementsSection.css";

const images = [
  "/Announcement1.png",
  "/Accouncement2.png",
  "/Announcement3.png",
];

function AnnouncementsSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSliding(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsSliding(false);
      }, 500); // Animation duration (matches CSS)
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="sectionContainer">
      <h2 className="sectionTitle">Announcements</h2>
      <div className="imagesContainer">
        <img
          src={images[currentImageIndex]}
          alt="Announcement"
          className={`squareImage ${isSliding ? "slide-animation" : ""}`}
        />
      </div>
    </section>
  );
}

export default AnnouncementsSection;
