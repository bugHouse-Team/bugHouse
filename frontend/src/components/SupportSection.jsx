import React from "react";
import "../styles/SupportSection.css"

function SupportSection() {
  return (
    <section className="subSectionContainer">
      <h2 className="subSectionTitle">Help &amp; Support:</h2>
      <div className="scrollInner">
      <div className="supportText">
        <article className="supportItem">
          <h3>Appointments &amp; Scheduling</h3>
          <p>
            Learn how to book, reschedule, or cancel appointments with tutors.
            Check tutor availability and ensure your sessions are scheduled at
            the right time.
          </p>
        </article>

        <article className="supportItem">
          <h3>Technical Support</h3>
          <p>
            Experiencing issues with logging in, loading pages, or accessing
            features? Try refreshing your browser, clearing cache, or switching
            devices. Contact support if problems persist.
          </p>
        </article>

        <article className="supportItem">
          <h3>Using the Platform</h3>
          <p>
            Get guidance on how to navigate the web app, find tutors, view your
            scheduled appointments, and access session details.
          </p>
        </article>

        <article className="supportItem">
          <h3>Session Guidelines</h3>
          <p>
            Understand expectations for both students and tutors, including
            attendance policies, rescheduling rules, and code of conduct during
            sessions.
          </p>
        </article>

        <article>
          <h3>Contact Support</h3>
          <p>
            For any additional help, reach out to the Student Success Center
            team via email, phone, or in person during operating hours.
          </p>
        </article>
        </div>
      </div>
    </section>
  );
}

export default SupportSection;
