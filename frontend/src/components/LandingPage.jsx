import React, { useState, useEffect, use } from "react";
import axios from "axios";
import HeaderBar from "./HeaderBar";
import "../styles/LandingPage.css";
import { useNavigate } from "react-router-dom";
import InfoPanel from "./InfoPanel";


function LandingPage() {
    const [storedId, setStoredId] = useState(""); // ID from database
    const [userObject, setUserObject] = useState({}); // User object
    const [swipeMode, setSwipeMode] = useState(true); // Toggle between swipe/manual
    const [manualId, setManualId] = useState(""); // Manually entered ID
    const [userName, setUserName] = useState("");
    const [userClass, setUserClass] = useState("");
    const [error, setError] = useState(""); // Error message
    const [loading, setLoading] = useState(true); // Track loading state
    const [authenticated, setAuthenticated] = useState(false);
    const [registerMode, setRegisterMode] = useState(false) // Track if user is verified
    const [role, setRole] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [regInputEmail, setRegInputEmail] = useState("");
    const [regInputID, setRegInputID] = useState(""); // Store user role
    const navigate = useNavigate();
    
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    useEffect(() => {
        const storedEmail = localStorage.getItem("emailForSignIn") || "";
        setUserEmail(storedEmail);
    }, []);

    // ✅ Fetch User Data on Page Load
    useEffect(() => {
        if (!userEmail) {
            setLoading(false);
            return;
        }

        axios.get(`${API_URL}/api/users/email/${userEmail}`)
            .then((response) => {
                if (response.data) {
                    console.log(response.data);
                    setUserObject(response.data);
                    setStoredId(response.data.idNumber.trim());
                    setRole(response.data.role);
                    localStorage.setItem("role", response.data.role)
                    console.log("✅ Stored ID from Database:", response.data.idNumber);
                } else {
                    console.error("❌ User not found in API response.");
                }
            })
            .catch((err) => console.error("❌ Error fetching user data:", err))
            .finally(() => {
                setLoading(false);
            });
    }, [userEmail, API_URL]);

    // ✅ Capture Swipe Data
    useEffect(() => {
        if (!swipeMode) return; // Only listen for swipe input when swipe mode is active

        let buffer = "";
        let scanning = false;

        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                scanning = false;
                processSwipedData(buffer);
                buffer = "";
            } else {
                buffer += event.key;
                scanning = true;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [swipeMode]);

    // ✅ Process Swiped Data
    const processSwipedData = (data) => {
        console.log("Raw Swiped Data:", data);

        if (loading || !storedId) {
            setError("⚠️ Please wait. Loading user data...");
            return;
        }

        const cleanedData = data.replace(/Shift/g, "").trim();
        const match = cleanedData.match(/\+(\d+)\?/);
        let extractedId = match ? match[1].trim() : null;

        if (!extractedId) {
            setError("❌ Failed to extract ID. Please swipe again.");
            return;
        }

        extractedId = extractedId.replace(/\s+/g, "").trim();

        console.log("Extracted ID:", extractedId);
        verifyId(extractedId);
    };

    // ✅ Verify ID Before Redirecting
    const verifyId = (inputId) => {
        console.log("Stored ID:", storedId);
        console.log("Input ID:", inputId);

        if (inputId !== storedId) {
            if(storedId === "")
            {
                setRegInputEmail(userEmail);
                setRegInputID(inputId);
                setStoredId(inputId);
                setUserClass("Freshman");
                setRegisterMode(true);
            }
            else
            {
                console.log("this is inputId ", inputId, " and this is storedId ", storedId);
                setError(`❌ ID did not match. Expected: ${storedId}, Got: ${inputId}`);
            }
            
        } else
        {
            console.log("✅ Authentication Successful!");
            setAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(userObject));
            window.location.href = getDashboardPath(userObject.role);
        }

        

    };

    const registerUser = () => {
        axios.post(`${API_URL}/api/users`, {
            email: regInputEmail,
            name: userName,
            idNumber: regInputID,
            gradeLevel: userClass,
            role: "Student"
        })
        .then((response) => {
            if (response.data) {
                setAuthenticated(true);
                console.log("✅ User created:", response.data.user);
                console.log("✅ Authentication Successful!");
                localStorage.setItem("role", response.data.user.role)
                localStorage.setItem("user", JSON.stringify(response.data.user));
                window.location.href = getDashboardPath(response.data.user.role);
            } else {
                console.error("❌ Failed to create user: No data returned");
            }
        })
        .catch((err) => {
            console.error("❌ Error creating user:", err.response?.data?.message || err.message);
        })
        .finally(() => {
            setLoading(false);
        });


    };

    // ✅ Get Dashboard Path Based on Role
    const getDashboardPath = (role) => {
        switch (role) {
            case "Student":
                return "/student-dashboard";
            case "Tutor":
                return "/tutor-dashboard";
            case "Admin":
                return "/admin-dashboard";
            default:
                return "/";
        }
    };

    if (loading) return <div>⏳ Loading...</div>;

    return (
        <div className="landing-page">
            <HeaderBar />
            <div className="content">
                {!registerMode && <>
                    <h1>Authentication Required</h1>
                    
                    {/* Authentication Modal */}
                    <div className="auth-modal">
                        <h2>Verify Your Identity</h2>
                        <p>Select a method to authenticate:</p>

                        {/* Toggle Between Swipe and Manual Entry */}
                        <div className="auth-options">
                            <button
                                className={swipeMode ? "active" : ""}
                                onClick={() => setSwipeMode(true)}
                                disabled={loading}
                            >
                                Swipe ID
                            </button>
                            <button
                                className={!swipeMode ? "active" : ""}
                                onClick={() => setSwipeMode(false)}
                                disabled={loading}
                            >
                                Enter ID Manually
                            </button>
                        </div>

                        {swipeMode ? (
                            <p>Swipe your ID card using the scanner.</p>
                        ) : (
                            <>
                                <label htmlFor="manual-id">Enter ID:</label>
                                <input
                                    type="text"
                                    id="manual-id"
                                    value={manualId}
                                    onChange={(e) => setManualId(e.target.value)}
                                    disabled={loading}
                                />
                                <button onClick={() => verifyId(manualId)} disabled={loading}>
                                    Confirm
                                </button>
                            </>
                        )}

                        {error && <p className="error-text">{error}</p>}
                    </div>
                    </>
                }
                {registerMode && 
                    <div className="register-modal">
                        <h1>User Registration</h1>
                        <table className="register-table">
                            <tbody>
                                <tr>
                                    <td><label htmlFor="user-email">Email:</label></td>
                                    <td>
                                        <input
                                            type="text"
                                            id="user-email"
                                            value={regInputEmail}
                                            onChange={(e) => setRegInputEmail(e.target.value)}
                                            disabled={userEmail !== null && userEmail !== ""}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="user-id">ID:</label></td>
                                    <td>
                                        <input
                                            type="text"
                                            id="user-id"
                                            value={regInputID}
                                            onChange={(e) => setRegInputID(e.target.value)}
                                            disabled={storedId !== null && storedId !== ""}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="user-name">Enter Username:</label></td>
                                    <td>
                                        <input
                                            type="text"
                                            id="user-name"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            disabled={loading}
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><label htmlFor="user-class">Enter Class:</label></td>
                                    <td>
                                        <select
                                            id="user-class"
                                            onChange={(e) => setUserClass(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="Select">Select</option>
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
                                        <button onClick={() => registerUser()} disabled={loading}>
                                            Register
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                }


                {authenticated && <p>✅ Authentication Successful! Redirecting...</p>}
            </div>
            <InfoPanel />
        </div>
    );
}

export default LandingPage;
