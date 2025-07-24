import React, { useState, useEffect } from "react";
import "../styles/ProfileSearch.css";
import { useNavigate } from "react-router-dom";

function ProfileSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  // 👇 same base URL you use in <Profile>
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("firebase_token");
  // ─────────────────────────── FETCH ALL USERS ────────────────────────────
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/api/users`,{headers: {
          Authorization: `Bearer ${token}`,
        },});
        
        if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);

        const data = await res.json();

        // ⬇️ normalize profileImage just like in <Profile>
        const processed = data.map((u) => {
          if (!u.profileImage) return u; // none set

          const img =
            u.profileImage.includes("http")
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

  // ─────────────────────────── FILTERING ────────────────────────────
  let filteredPeople = people.filter((p) =>
    p.name?.toLowerCase().startsWith(searchTerm.toLowerCase())
  );
  filteredPeople =
    roleFilter === "all"
      ? filteredPeople
      : filteredPeople.filter((p) => p.role?.toLowerCase() === roleFilter);

  // ─────────────────────────── MODAL HANDLERS ────────────────────────────
  const buildImageUrl = (raw) => {
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return `${API_URL}/uploads/${raw.replace(/\\/g, "/").replace(/^uploads\/?/, "")}`;
  };
  
  const openUser = async (partialUser) => {
    try {
      // same endpoint the <Profile> component calls
      const res = await fetch(
        `${API_URL}/api/profile/user/${partialUser.email || partialUser.idNumber}`,{headers: {
          Authorization: `Bearer ${token}`,
        },}
        
      );
  
      let user = partialUser; // fallback
      if (res.ok) {
        const full = await res.json();
        console.log(full.profileImage)
        user = {
          ...full,
          profileImage: buildImageUrl(full.profileImage),
        };
      }
  
      setSelectedUser(user);
    } catch (err) {
      console.error("Profile fetch (modal) failed:", err);
      // still show what we had
      setSelectedUser(partialUser);
    } finally {
      setShowModal(true);
    }
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // helper to build a usable URL out of whatever the backend gives us
  const resolveProfileImage = (raw, API_URL) => {
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    // strip a leading "uploads/" if it’s already there so we don’t double it
    const clean = raw.replace(/\\/g, "/").replace(/^uploads\/?/, "");
    return `${API_URL}/uploads/${clean}`;
  };


  // ─────────────────────────── RENDER ────────────────────────────
  return (
    <main className="outerPanel">
      <main className="innerPanel">
        <h3 className="profileSearchHeader">Profile Search</h3>

        {/* Search + radio buttons */}
        <section className="searchBarSection">
          <input
            className="searchInput"
            placeholder="Search by name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="radioGroup">
            {["all", "student", "tutor"].map((role) => (
              <label key={role}>
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={roleFilter === role}
                  onChange={() => setRoleFilter(role)}
                />
                {role[0].toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>
        </section>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* users list */}
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

        {/* modal */}
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
                    e.target.src = '../assets/images/maverick.png'; // ⚠️ no “public/”
                  }}
                />
              )}

              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>ID Number:</strong> {selectedUser.idNumber}
              </p>
              <p>
                <strong>Role:</strong> {selectedUser.role}
              </p>

              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        )}
      </main>
    </main>
  );
}

export default ProfileSearch;
