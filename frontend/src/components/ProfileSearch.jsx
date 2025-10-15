import React, { useState, useEffect } from "react";
import "../styles/ProfileSearch.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import BookingSessionModal from "./BookingSessionModal";
import AppointmentsPage from "./AppointmentsPage";

function ProfileSearch({onAvailabilityChange}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showBookings, setShowBookings] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [id, setId] = useState(localStorage.getItem("id") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");

  const userEmail = localStorage.getItem("emailForSignIn");
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("firebase_token");

  // ─────────────────────────── FETCH ALL USERS ────────────────────────────
  useEffect(() => {
    console.log("🔄 Fetching current user info for:", userEmail);

    axios
      .get(`${API_URL}/api/users/email/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data) {
          console.log("✅ User info fetched:", response.data);
          setId(response.data.idNumber.trim());
          setRole(response.data.role);
        }
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 302) {
          console.warn("🚫 302 Error - redirecting to login...");
          navigate("/signin");
        } else {
          console.error("❌ Error fetching user data:", err);
          setError("Failed to fetch user data.");
          setLoading(false);
        }
      });

    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);

        const data = await res.json();

        const processed = data.map((u) => {
          if (!u.profileImage) return u;
          const img = u.profileImage.includes("http")
            ? u.profileImage
            : `${API_URL}/uploads/${u.profileImage.replace(/\\/g, "/")}`;
          return { ...u, profileImage: img };
        });

        setPeople(processed);
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong fetching users.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [API_URL]);

  // ─────────────────────────── ROLE CHANGE ────────────────────────────
  const handleRoleChange = async (idNumber, newRole) => {
    try {
      // Optimistically update UI
      setPeople((prev) =>
        prev.map((p) =>
          p.idNumber === idNumber ? { ...p, role: newRole } : p
        )
      );

      if (selectedUser && selectedUser.idNumber === idNumber) {
        setSelectedUser((prev) => ({ ...prev, role: newRole }));
      }

      const res = await fetch(`${API_URL}/api/users/${idNumber}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.status === 302) {
        console.warn("🚫 302 Error - redirecting to login...");
        navigate("/signin");
        return;
      }

      if (!res.ok) throw new Error(`Error updating role: ${res.status}`);
      console.log(`✅ Role updated for ${idNumber} to ${newRole}`);
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  // ─────────────────────────── FILTERING ────────────────────────────
  let filteredPeople = people.filter((p) =>
    p.name?.toLowerCase().startsWith(searchTerm.toLowerCase())
  );
  filteredPeople =
    roleFilter === "all"
      ? filteredPeople
      : filteredPeople.filter(
          (p) => p.role?.toLowerCase() === roleFilter.toLowerCase()
        );

  // ─────────────────────────── MODAL HANDLERS ────────────────────────────
  const buildImageUrl = (raw) => {
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return `${API_URL}/uploads/${raw
      .replace(/\\/g, "/")
      .replace(/^uploads\/?/, "")}`;
  };

  const openUser = async (partialUser) => {
    try {
      const res = await fetch(
        `${API_URL}/api/profile/user/${partialUser.email || partialUser.idNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let user = partialUser;
      if (res.ok) {
        const full = await res.json();
        user = {
          ...full,
          profileImage: buildImageUrl(full.profileImage),
          role: full.role || "Student",
        };
      }

      // ──────────────── Fetch availability if Tutor or SysAdmin ────────────────
      if (user.role === "Tutor" || user.role === "SysAdmin") {
        try {
          const availRes = await fetch(
            `${API_URL}/api/tutors/${user._id || user.idNumber}/availability`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (availRes.ok) {
            const availability = await availRes.json();

            availability.forEach((avail) => {
              user.availability = avail;

              if (!avail.isApproved) {
                return;
              }
            });

          } else {
            console.warn("No availability found for user", user.name);
            user.availability = [];
          }
        } catch (e) {
          console.error("Error fetching availability:", e);
          user.availability = [];
        }
      }

      console.log("👤 Opened user:", user);
      setSelectedUser(user);
    } catch (err) {
      console.error("Profile fetch (modal) failed:", err);
      setSelectedUser(partialUser);
    } finally {
      setShowModal(true);
    }
  };


  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleApprove = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/admin/availability/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Availability request approved successfully");

      onAvailabilityChange();

      if (selectedUser) await openUser(selectedUser);
    } catch (err) {
      const status = err.response?.status;
      if (status === 302) {
        console.warn("🚫 302 Error - redirecting to login...");
        navigate("/signin");
      } else {
        console.error("❌ Approval failed:", err);
        toast.error("Failed to approve availability request");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/admin/availability/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Availability request deleted successfully");

      onAvailabilityChange();

      if (selectedUser) await openUser(selectedUser);

    } catch (err) {
      const status = err.response?.status;
      if (status === 302) {
        console.warn("🚫 302 Error - redirecting to login...");
        navigate("/signin");
      } else {
        console.error("❌ Delete failed:", err);
        toast.error("Failed to delete availability request");
      }
    }
  };

  // ─────────────────────────── RENDER ────────────────────────────
  return (
    <main className="outerPanel">
      <main className="innerPanel">
        <h3 className="profileSearchHeader">Profile Search</h3>

        {/* Search + role filter */}
        <section className="searchBarSection">
          <input
            className="searchInput"
            placeholder="Search by name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="radioGroup">
            {["all", "student", "tutor"].map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={roleFilter === r}
                  onChange={() => setRoleFilter(r)}
                />
                {r[0].toUpperCase() + r.slice(1)}
              </label>
            ))}
          </div>
        </section>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* User list */}
        <section className="profileSearchSubSec">
          <div className="scrollInner">
            <ul className="peopleList">
              {filteredPeople.map((p) => {
                const line = `${p.name?.padEnd(15, " ") ?? ""}${String(
                  p.idNumber
                ).padEnd(13, " ")}${p.role ?? ""}`;
                return (
                  <li
                    key={p.idNumber}
                    className="personItem"
                    onClick={() => openUser(p)}
                    style={{ cursor: "pointer" }}
                  >
                    <pre className="personName">{line}</pre>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ──────────────── MODAL ──────────────── */}
        {showModal && selectedUser && (
          <div className="modalBackdrop">
            <div className="modalContent">
              <h2>User Info</h2>

              {selectedUser.profileImage && (
                <img
                  src={selectedUser.profileImage}
                  alt={`${selectedUser.name}'s profile`}
                  className="modalAvatar"
                  onError={(e) => {
                    e.target.src = "../assets/images/maverick.png";
                  }}
                />
              )}

              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>ID Number:</strong> {selectedUser.idNumber}
              </p>

              {/* Editable Role Dropdown */}
              <div style={{ marginTop: "10px" }}>
                <strong>Role:</strong>{" "}
                <select
                  value={selectedUser.role || ""}
                  onChange={(e) =>
                    handleRoleChange(selectedUser.idNumber, e.target.value)
                  }
                  className="roleDropdown"
                  disabled={
                    selectedUser.idNumber === id ||
                    selectedUser.role === "SysAdmin" ||
                    (selectedUser.role === "Admin" && role !== "SysAdmin")
                  }
                >
                  <option value="Student">Student</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Admin" disabled={role !== "SysAdmin"}>Admin</option>
                  <option value="SysAdmin" disabled>SysAdmin</option>
                </select>

                {/* ──────────────── AVAILABILITY ──────────────── */}
                {["Tutor", "SysAdmin"].includes(selectedUser.role) && (
                  <div className="availabilitySection" style={{ marginTop: "15px" }}>
                    <h3>Weekly Availability</h3>
                    {selectedUser.availability ? (
                      <div>
                        <strong>
                          Status:{" "}
                          {selectedUser.availability.isApproved ? "APPROVED" : "PENDING"}
                        </strong>
                        <br /><br />
                      </div>
                    ) : (
                      <p>No availability submitted.</p>
                    )}

                    {selectedUser.availability?.weeklySchedule?.length > 0 ? (
                      selectedUser.availability.weeklySchedule.map((schedule, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                          <strong>{schedule.day}</strong>
                          <ul style={{ marginTop: "4px", marginLeft: "15px" }}>
                            {schedule.blocks?.length > 0 ? (
                              schedule.blocks.map((block, j) => (
                                <li key={j}>
                                  {block.startTime} – {block.endTime}
                                  {block.subjects?.length > 0 && (
                                    <span> ({block.subjects.join(", ")})</span>
                                  )}
                                </li>
                              ))
                            ) : (
                              <li>No blocks listed</li>
                            )}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <p>No availability submitted.</p>
                    )}

                    {selectedUser.availability?.weeklySchedule?.length > 0 &&
                    !selectedUser.availability.isApproved ? (
                      <div
                        className="action-buttons"
                        style={{ display: "block", alignItems: "center", alignContent: "center" }}
                      >
                        <button
                          className="approve"
                          onClick={() => handleApprove(selectedUser.availability.id)}
                          title="Approve"
                        >
                          Approve
                        </button>

                        <button
                          className="deny"
                          onClick={() => handleDelete(selectedUser.availability.id)}
                          title="Delete"
                        >
                          Deny
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {["Student", "Tutor", "SysAdmin"].includes(selectedUser.role) && (
                  <div className="appointmentsSection" style={{ marginTop: "15px" }}>
                    <AppointmentsPage
                      user={selectedUser}
                    />
                  </div>
                )}



              </div>

              <button onClick={closeModal} className="closeButton">
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </main>
  );
}

export default ProfileSearch;
