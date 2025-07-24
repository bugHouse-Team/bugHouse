import React, { useEffect, useState } from "react";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function SignUpPage() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(""); // You can store email temporarily or use localStorage
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Check if the URL is a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email stored in localStorage or prompt the user for email
      let storedEmail = window.localStorage.getItem("emailForSignIn");
      if (!storedEmail) {
        storedEmail = prompt("Please provide your email for confirmation");
      }

      // Complete the sign-in process with the link and email
      signInWithEmailLink(auth, storedEmail, window.location.href)
        .then((result) => {
          // Successfully signed in
          setMessage("Sign-in successful! Redirecting...");
          window.localStorage.removeItem("emailForSignIn"); // Clear stored email
          setTimeout(() => navigate("/landing"), 2000); // Redirect after 2 seconds
        })
        .catch((error) => {
          // Error in sign-in
          setMessage("Error: " + error.message);
        });
    }
  }, [auth, navigate]);

  return (
    <div className="signup-container">
      <h1>{message ? message : "Please wait, processing your sign-in..."}</h1>
    </div>
  );
}

export default SignUpPage;
