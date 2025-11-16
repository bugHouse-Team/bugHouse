import React from "react";
import "../styles/HoursSection.css"

function HoursSection() {
    return (
      <section className="subSectionContainer">
        <h2 className="sectionTitle">Hours of operations:</h2>
        {/* Inner scrollable wrapper */}
        <div className="scrollInner">
          <div className="regularHours">
            <h3>Regular Hours:</h3>
            <ul>
              <li>Monday: 9:00 AM – 6:00 PM</li>
              <li>Tuesday: 8:30 AM – 7:00 PM</li>
              <li>Wednesday: 10:00 AM – 5:30 PM</li>
              <li>Thursday: 8:00 AM – 6:30 PM</li>
              <li>Friday: 9:00 AM – 4:00 PM</li>
              <li>Saturday: 10:00 AM – 3:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
  
            <h3>Special Hours:</h3>
            <ul>
              <li>
                Spring Break (March 11 – 15): Reduced Hours: 10:00 AM – 3:00 PM
              </li>
              <li>
                Finals Week (April 29 – May 3): Extended Hours: 7:00 AM – 9:00 PM
              </li>
              <li>University Holidays (Thanksgiving, Winter Break): Closed</li>
            </ul>
          </div>
        </div>
      </section>
    );
  }
  

export default HoursSection;