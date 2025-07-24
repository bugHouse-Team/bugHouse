import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AuthRequest.css";

function HoursSection() {
  const [people, setPeople] = useState([]);   // users ≠ admins
  const [roles,  setRoles]  = useState({});   // idNumber → role
  const [isSysAdmin,  setSysAdmin]  = useState(false);

  const userEmail = localStorage.getItem("emailForSignIn");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("firebase_token");
  /* -------------------------------------------
     1. fetch users (skip admins) on mount
  ------------------------------------------- */
  useEffect(() => {
    (async () => {
      if (userEmail) {
        console.log("🔄 Fetching user data for:", userEmail);

        try {
          const res = await axios.get(`${API_URL}/api/users/email/${userEmail}`);
          const role = res.data?.role;

          console.log("✅ Full API Response:", res.data);

          const isAdmin = role === "SysAdmin";
          setSysAdmin(isAdmin);

          const userList = await axios.get(`${API_URL}/api/users`, {headers: {
            Authorization: `Bearer ${token}`,
          },});
          const data = userList.data;

          const filtered = isAdmin ? data : data.filter(u => u.role !== "Admin" && u.role !== "SysAdmin");
          setPeople(filtered);

          const initial = {};
          filtered.forEach(u => {
            initial[u.idNumber] = u.role;
          });
          setRoles(initial);
        } catch (err) {
          console.error("❌ Error fetching user data or users:", err);
        }
      }
    })();
  }, []);

  /* -------------------------------------------
     2. role change handler (unchanged)
  ------------------------------------------- */
  const handleRoleChange = async (idNumber, newRole) => {
    setRoles(prev => ({ ...prev, [idNumber]: newRole }));

    try {
      await fetch(`http://localhost:5000/api/users/${idNumber}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  return (
    <section className="authSubSectionContainer">
      <h2 className="roleSelectionHeader">
        <span className="sectionTitle">Role Selection:</span>
        <span className="studentColumnHeader">Student</span>
        <span className="tutorColumnHeader">Tutor</span>
        <span className="adminColumnHeader">Admin</span>
      </h2>

      <div className="scrollInner">
        <ul className="peopleList">
          {people.map(person => (
            <li key={person.idNumber} className="rolesRow">
              <span className="personName">
                {person.name}<br />{person.idNumber}
              </span>

              <input
                type="radio"
                name={`role-${person.idNumber}`}
                value="Student"
                checked={roles[person.idNumber] === "Student"}
                disabled={roles[person.idNumber] === "SysAdmin"}
                onChange={() => handleRoleChange(person.idNumber, "Student")}
              />
              <input
                type="radio"
                name={`role-${person.idNumber}`}
                value="Tutor"
                checked={roles[person.idNumber] === "Tutor"}
                disabled={roles[person.idNumber] === "SysAdmin"}
                onChange={() => handleRoleChange(person.idNumber, "Tutor")}
              />
              <input
                type="radio"
                name={`role-${person.idNumber}`}
                value="Admin"
                disabled={!isSysAdmin || roles[person.idNumber] === "SysAdmin"}
                checked={roles[person.idNumber] === "Admin" || roles[person.idNumber] === "SysAdmin"}
                onChange={() => handleRoleChange(person.idNumber, "Admin")}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default HoursSection;
