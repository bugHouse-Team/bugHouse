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
  const [storedId, setStoredId] = useState("");
  const [userObject, setUserObject] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ Step 1: Handle Firebase login flow
  useEffect(() => {
    const auth = getAuth();

    const checkLogin = async () => {
      try {
        let email = localStorage.getItem("emailForSignIn");
        const isLink = isSignInWithEmailLink(auth, window.location.href);

        if (isLink) {
          if (!email) {
            email = window.prompt("Please confirm your email for sign-in:");
            if (!email) {
              setLoading(false);
              return;
            }
          }

          // Sign in with email link
          const result = await signInWithEmailLink(auth, email, window.location.href);
          const idToken = await result.user.getIdToken(true);

          // Store tokens
          localStorage.setItem("firebase_token", idToken);
          localStorage.setItem("emailForSignIn", email);

          setUserEmail(email);
          setAuthenticated(true);

          // Remove the query params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (email) {
          // Already logged in previously
          setUserEmail(email);
          setAuthenticated(true);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Firebase login error:", err);
        setError("Login failed. Please try again.");
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // ✅ Step 2: Fetch user data from backend only when email & token are ready
  useEffect(() => {
    const token = localStorage.getItem("firebase_token");
    if (!userEmail || !token) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/email/${userEmail}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        console.log("✅ User found:", data);

        setUserObject(data);
        setStoredId(data.idNumber?.trim() || "");
        setRole(data.role);

        // Store locally
        localStorage.setItem("id", data.idNumber);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user", JSON.stringify(data));

        setAuthenticated(true);
        setLoading(false);

        navigate(getDashboardPath(data.role));
      } catch (err) {
        const status = err.response?.status;
        console.warn("⚠️ Backend fetch failed:", status, err);

        if (status === 404 || status === 401) {
          localStorage.removeItem("role");
          localStorage.removeItem("user");
          navigate("/signup", { state: { email: userEmail } });
        } else if (status === 302) {
          navigate("/signin");
        } else {
          setError("Failed to fetch user data.");
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [userEmail, API_URL, navigate]);

  // ✅ Dashboard route helper
  const getDashboardPath = (role) => {
    switch (role) {
      case "Student":
        return "/student-dashboard";
      case "Tutor":
        return "/tutor-dashboard";
      case "Admin":
      case "SysAdmin":
        return "/admin-dashboard";
      default:
        return "/";
    }
  };

  // ✅ UI Rendering
  if (loading) {
    return <div className="loading">⏳ Loading...</div>;
  }

  return (
    <div className="landing-page">
      <HeaderBar />

      <div className="content">
        {error ? (
          <p className="error">{error}</p>
        ) : authenticated ? (
          <p>✅ Authentication Successful! Redirecting...</p>
        ) : (
          <p>Please check your email to complete sign-in.</p>
        )}
      </div>

      <InfoPanel />
    </div>
  );
}

export default LandingPage;
