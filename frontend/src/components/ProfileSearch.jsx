import React, { useState, useEffect } from "react";
import "../styles/ProfileSearch.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ProfileSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          // Normalize role casing
          role: full.role
            ? full.role.charAt(0).toUpperCase() +
              full.role.slice(1).toLowerCase()
            : "Student",
        };
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
                </select>
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
