import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RoleTestPage() {
  const [role, setRole] = useState(null);  // State to store role
  const navigate = useNavigate();

  useEffect(() => {
    // Get the role from localStorage
    const storedRole = localStorage.getItem("role");
    
    if (storedRole) {
      setRole(storedRole);  // Set the role if it exists
    } else {
      setRole("No role assigned yet.");  // If no role is assigned, show a default message
    }

    // Redirect based on role, but wait until role is set
    if (storedRole === "Student") {
      navigate("/student-dashboard");
    } else if (storedRole === "Tutor") {
      navigate("/tutor-dashboard");
    }
  }, [navigate]);

  return (
    <div className="role-test-page">
      <h1>Role-Based Access Test</h1>
      {/* Show role before redirecting */}
      <p>Your assigned role: {role}</p>
      <p>If you're not redirected to the appropriate dashboard, check the role stored in localStorage.</p>
    </div>
  );
}

export default RoleTestPage;
