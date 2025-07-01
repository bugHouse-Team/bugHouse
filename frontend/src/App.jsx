import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./components/SignInPage";
import SignUpPage from "./components/SignUpPage";
import LandingPage from "./components/LandingPage";
import RoleTestPage from "./components/RoleTestPage";
import StudentDashboard from "./components/StudentDashboard";
import TutorDashboard from "./components/TutorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"

function App() {
  // Read the role once into state (so it triggers re-renders properly)
  const [role] = useState(() => localStorage.getItem("role"));


  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  
  /**
   * ProtectedRoute
   * - If no role in localStorage, redirect to /signin
   * - If role !== requiredRole, redirect to /signin
   */
  function ProtectedRoute({ children, requiredRole }) {
    // If no role was found, you might show a loader or simply redirect:
    if (!role) {
      // No role at all, definitely not authenticated
      return <Navigate to="/signin" replace />;
    }

    // If the current role doesn't match the role needed for this route, redirect
    if (role !== requiredRole) {
      return <Navigate to="/signin" replace />;
    }

    // Otherwise render the protected component
    return children;
  }

  return (
    <>

<Routes>
      {/* Unprotected routes */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/role-test" element={<RoleTestPage />} />

      {/* Student protected route */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute requiredRole="Student">
            <StudentDashboard user={user}/>
           </ProtectedRoute>
        }
      />

      {/* Tutor protected route */}
      <Route
        path="/tutor-dashboard"
        element={
          <ProtectedRoute requiredRole="Tutor">
            <TutorDashboard user={user}/>
          </ProtectedRoute>
        }
      />

      {/* Admin protected route */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
    
      <ToastContainer position="top-center" autoClose={3000} />
    </>
    
  
  );
}

export default App;
