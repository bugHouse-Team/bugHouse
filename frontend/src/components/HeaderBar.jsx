import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import UTAlogo from "../assets/images/UTA.png";
import "../styles/HeaderBar.css";

function HeaderBar() {
    const [signoutSuccess, setSignoutSuccess] = useState(false); // Sign-out success message
    const userEmail = localStorage.getItem("emailForSignIn");
    const [loading, setLoading] = useState(true); // ✅ Track loading state
    const [selectedView, setSelectedView] = useState(localStorage.getItem("view") || "Student");
    const [role, setRole] = useState("");
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("firebase_token");

    useEffect(() => {
        if (userEmail) {
            console.log("🔄 Fetching user data for:", userEmail);
            axios.get(`${API_URL}/api/users/email/${userEmail}`,{headers: {
                Authorization: `Bearer ${token}`,
            },})
                .then((response) => {
                    console.log("✅ Full API Response:", response.data); // ✅ Debugging
    
                    if (response.data && response.data.idNumber) {
                        console.log("✅ Stored ID from Database:", response.data.idNumber);
                        setRole(response.data.role);
                        localStorage.setItem("role", response.data.role);
                        localStorage.setItem("user", JSON.stringify(response.data));
                        localStorage.setItem("id", response.data.idNumber);
                    } else {
                        console.error("❌ ID not found in API response for", userEmail);
                    }
                })
                .catch((err) => {
                    const status = err.response?.status;
                    if (status === 302) {
                        console.warn("🚫 302 Error - redirecting to login...");
                        navigate("/signin");
                    } else {
                        console.error("❌ Error fetching user data:", err);
                    }
                })
                .finally(() => {
                    setLoading(false); // ✅ Mark API call as complete
                });
        }
    }, [userEmail, API_URL]);
    
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

    useEffect(() => {
        if (!loading) {
            navigate(getDashboardPath(selectedView));
        }
    }, [selectedView, loading, navigate]);

    const handleSignOutClick = async () => {
        const email = localStorage.getItem("emailForSignIn");
    
        if (email) {
            await axios.post(`${API_URL}/api/students/attendance/log`,
                {email, type:"Sign Out"},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                },).then((res) => {
                    console.log("✅ Manual Sign Out logged");
                }).catch((err) => {
                    console.error("❌ Failed to log sign out:", err);
                });
        }

        setSignoutSuccess(true);
        
        setTimeout(() => {
            setSignoutSuccess(false);
            navigate("/signin");
        }, 2000);

    };

    
    return (
        <div className="header-bar">
            <img src={UTAlogo} alt="UTA Logo" className="header-logo" />
            <h1>STUDENT SUCCESS CENTER</h1>
            {role !== "Student" && role !== "Admin" && <div className="view-dropdown">
                    <label htmlFor="view-select">View as: </label>
                    <select
                        id="view-select"
                        value={selectedView}
                        onChange={(e) => {
                            const newView = e.target.value;
                            setSelectedView(newView);
                            localStorage.setItem("view", newView); // ✅ Persist change
                        }}
                    >
                        {(role == "SysAdmin" || role == "Tutor" || role == "Student") && <option value="Student">Student</option>}
                        {(role == "SysAdmin" || role == "Tutor") && <option value="Tutor">Tutor</option>}
                        {(role == "SysAdmin" || role == "Admin") && <option value="Admin">Admin</option>}
                    </select>
                </div>
            }
            <button className="sign-out-btn" onClick={handleSignOutClick}>Sign Out</button>

            {/* Success Message */}
            {signoutSuccess && (
                <div className="signout-success">
                    <p>✅ Sign-out successful! Redirecting...</p>
                </div>
            )}
        </div>
    );
}

export default HeaderBar;
