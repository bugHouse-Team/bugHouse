import React, { useEffect, useState } from "react";
import "../styles/AuthRequest.css";

function HoursSection() {
  const [people, setPeople] = useState([]);   // users ≠ admins
  const [roles,  setRoles]  = useState({});   // idNumber → role

  /* -------------------------------------------
     1. fetch users (skip admins) on mount
  ------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("http://localhost:5000/api/users");
        const data = await res.json();        // [{ name, idNumber, role }, …]

        // 🔑 drop any Admin accounts
        const nonAdmins = data.filter(u => u.role !== "Admin");
        setPeople(nonAdmins);

        // build lookup for the radios
        const initial = {};
        nonAdmins.forEach(u => { initial[u.idNumber] = u.role; });
        setRoles(initial);
      } catch (err) {
        console.error("Could not fetch users:", err);
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
                onChange={() => handleRoleChange(person.idNumber, "Student")}
              />
              <input
                type="radio"
                name={`role-${person.idNumber}`}
                value="Tutor"
                checked={roles[person.idNumber] === "Tutor"}
                onChange={() => handleRoleChange(person.idNumber, "Tutor")}
              />
            </li>
          ))}
        </ul>
      </div>

      <button className="pill" disabled>
        Assign
      </button>
    </section>
  );
}

export default HoursSection;
