import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentAttendance.css";
import { useNavigate } from "react-router-dom";

const StudentAttendance = ({ user }) => {
  const [visits, setVisits] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("firebase_token");

  useEffect(() => {
    console.log("📌 StudentAttendance mounted");
    console.log("👤 user.email is:", user?.email);

    if (!user?.email) return;

    const fetchAttendance = async () => {
      try {
        console.log("📥 Fetching attendance history...");
        const res = await axios.get(
          `/api/students/attendance/${user.email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("📊 Fetched attendance:", res.data);

        // Backend now returns an array of visits:
        // [{ visitNumber, checkIn, checkOut }, ...]
        let data = res.data;

        // Be defensive: if backend ever changes shape
        if (!Array.isArray(data)) {
          if (data && Array.isArray(data.visits)) {
            data = data.visits;
          } else {
            data = [];
          }
        }

        setVisits(data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 302) {
          console.warn("🚫 302 Error - redirecting to login...");
          navigate("/signin");
        } else {
          console.error("❌ Error fetching attendance:", err);
        }
      }
    };

    fetchAttendance();
  }, [user?.email, navigate, token]);

  return (
    <div className="attendance-container">
      <h3 className="attendance-title">Attendance History</h3>

      <div className="attendance-log">
        {visits.length === 0 && (
          <div>No visits recorded yet.</div>
        )}

        {visits.map((visit, index) => {
          const visitNum =
            visit.visitNumber || visits.length - index; // fallback numbering

          const checkIn = visit.checkIn
            ? new Date(visit.checkIn).toLocaleString()
            : "—";

          const checkOut = visit.checkOut
            ? new Date(visit.checkOut).toLocaleString()
            : visit.checkIn
              ? "In progress"
              : "—";

          return (
            <div key={index} className="attendance-visit">
              <strong>Visit {visitNum}</strong>

              <div>
                In: <span>{checkIn}</span>
              </div>

              <div>
                Out: <span>{checkOut}</span>
              </div>

              <hr />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentAttendance;
