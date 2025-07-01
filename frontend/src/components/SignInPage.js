//SigInPage.js

import React, { useState } from "react";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/SignInPage.css";
import { auth } from "../firebase"; // Import Firebase authentication instance

function SignInPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [linkSent, setLinkSent] = useState(false); // New state to track if link was sent
  const navigate = useNavigate();

  // Firebase Action Code Settings
  const actionCodeSettings = {
    url: "http://localhost:3000/landing", // Change this to your actual redirect URL
    handleCodeInApp: true,
  };

  const handleSendSignInLink = async (e) => {
    e.preventDefault();

    if (!email.endsWith("@mavs.uta.edu")) {
      setMessage("Only @mavs.uta.edu email addresses are allowed.");
      return;
    }

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email); // Store email for later use

      setMessage("Sign-in link sent successfully! Please check your email.");
      setLinkSent(true); // Update state to show confirmation message
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  return (
    <div className="signin-container">
      <h1>Welcome to UTA Student Success Center</h1>

      {!linkSent ? (
        <form className="signin-form" onSubmit={handleSendSignInLink}>
          <label htmlFor="email">UTA Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your @mavs.uta.edu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Sign-In Link</button>
        </form>
      ) : (
        <div className="confirmation-message">
          <p style={{ color: "green", fontWeight: "bold" }}>
            ✅ Sign-in link sent successfully!
          </p>
          <p>You can now close this tab and check your email.</p>
        </div>
      )}

      <p>{message}</p>
    </div>
  );
}

export default SignInPage;
