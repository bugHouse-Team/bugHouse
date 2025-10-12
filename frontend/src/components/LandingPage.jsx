import React, { useState, useEffect } from "react";
import axios from "axios";
import HeaderBar from "./HeaderBar";
import InfoPanel from "./InfoPanel";
import "../styles/LandingPage.css";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

function LandingPage() {
  const [storedId, setStoredId] = useState(""); // ID from database
  const [userObject, setUserObject] = useState({}); // User object
  const [swipeMode, setSwipeMode] = useState(true); // Toggle between swipe/manual
  const [manualId, setManualId] = useState(""); // Manually entered ID
  const [error, setError] = useState(""); // Error message
  const [loading, setLoading] = useState(true); // Track loading state
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(""); // From Firebase
  const [role, setRole] = useState("");

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("firebase_token");

  // ✅ Step 1: Handle Firebase email link login
  useEffect(() => {
    const auth = getAuth();
    const storedEmail = window.localStorage.getItem("emailForSignIn");

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const emailToUse =
        storedEmail ||
        window.prompt("Please confirm your email for sign-in:") ||
        "";

      if (!emailToUse) return;

      signInWithEmailLink(auth, emailToUse, window.location.href)
        .then(async (result) => {
          console.log("✅ Firebase login complete");

          // Get Firebase JWT
          const idToken = await result.user.getIdToken();
          console.log("🔥 Firebase JWT:", idToken);

          localStorage.setItem("firebase_token", idToken);
          window.localStorage.setItem("emailForSignIn", emailToUse);
          setUserEmail(emailToUse);
        })
        .catch((err) => {
          console.error("❌ Firebase sign-in failed:", err);
        });
    }
  }, []);

  // ✅ Step 2: Load stored email (if already logged in)
  useEffect(() => {
    const storedEmail = localStorage.getItem("emailForSignIn") || "";
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ Step 3: Fetch user data from backend
  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API_URL}/api/users/email/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data) {
          console.log("✅ User found:", response.data);
          setUserObject(response.data);
          setStoredId(response.data.idNumber.trim());
          setRole(response.data.role);
          localStorage.setItem("id", response.data.idNumber);
          localStorage.setItem("role", response.data.role);
          localStorage.setItem("user", JSON.stringify(response.data));
          setLoading(false);
          setAuthenticated(true);
          navigate(getDashboardPath(response.data.role));
        } else {
          console.error("❌ User not found, redirecting to signup...");
          navigate("/signup", { state: { email: userEmail } });
        }
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 404 || status === 401) {
          console.warn("⚠️ User not found or unauthorized. Redirecting to signup...");
          // Clear old data to avoid wrong redirects
          localStorage.removeItem("role");
          localStorage.removeItem("user");
          navigate("/signup", { state: { email: userEmail } });
        } else if (status === 302) {
          console.warn("🚫 302 Error - redirecting to login...");
          navigate("/signin");
        } else {
          console.error("❌ Error fetching user data:", err);
          setError("Failed to fetch user data.");
          setLoading(false);
        }
      });
  }, [userEmail, API_URL]);

  // ✅ Dashboard path helper
  const getDashboardPath = (role) => {
    switch (role) {
      case "Student":
        return "/student-dashboard";
      case "Tutor":
        return "/tutor-dashboard";
      case "SysAdmin":
      case "Admin":
        return "/admin-dashboard";
      default:
        return "/";
    }
  };

  if (loading) return <div className="loading">⏳ Loading...</div>;

  return (
    <div className="landing-page">
      <HeaderBar />

      <div className="content">
          <p>✅ Authentication Successful! Redirecting...</p>
      </div>

      <InfoPanel />
    </div>
  );
}

export default LandingPage;
