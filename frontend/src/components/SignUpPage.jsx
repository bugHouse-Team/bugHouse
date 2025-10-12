// src/components/RegisterPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("firebase_token");
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Pre-fill values from navigation state (if provided)
  const { email: initialEmail = "", id: initialId = "" } = location.state || {};

  const [regInputEmail, setRegInputEmail] = useState(initialEmail);
  const [regInputID, setRegInputID] = useState(initialId);
  const [userName, setUserName] = useState("");
  const [userClass, setUserClass] = useState("Freshman");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registerUser = () => {
    setLoading(true);
    axios
      .post(
        `${API_URL}/api/users`,
        {
          email: regInputEmail,
          name: userName,
          idNumber: regInputID,
          gradeLevel: userClass,
          role: "Student",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        if (response.data) {
          console.log("✅ User created:", response.data);
          localStorage.setItem("role", response.data.role);
          localStorage.setItem("user", JSON.stringify(response.data));
          navigate("/student-dashboard");
        } else {
          setError("❌ Failed to create user: No data returned");
        }
      })
      .catch((err) => {
        console.error("❌ Error creating user:", err);
        setError("Error creating user. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="register-page">
      <h1>User Registration</h1>

      <table className="register-table">
        <tbody>
          <tr>
            <td><label>Email:</label></td>
            <td>
              <input
                type="text"
                value={regInputEmail}
                onChange={(e) => setRegInputEmail(e.target.value)}
                disabled={!!initialEmail}
              />
            </td>
          </tr>
          <tr>
            <td><label>ID:</label></td>
            <td>
              <input
                type="text"
                value={regInputID}
                onChange={(e) => setRegInputID(e.target.value)}
                disabled={!!initialId}
              />
            </td>
          </tr>
          <tr>
            <td><label>Name:</label></td>
            <td>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </td>
          </tr>
          <tr>
            <td><label>Class:</label></td>
            <td>
              <select
                value={userClass}
                onChange={(e) => setUserClass(e.target.value)}
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </td>
          </tr>
          <tr>
            <td></td>
            <td>
              <button onClick={registerUser} disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
