import React from "react";
import "../styles/AuthRequest.css"

function HoursSection() {

    //list of people with ids here
    const people = [
        { id: 100112341, name: "John Doe" },
        { id: 100112342, name: "Jane Smith" },
        { id: 100112343, name: "Alice Johnson" },
        { id: 1001123451, name: "Bob Williams" },
        { id: 100112344, name: "John Doe" },
        { id: 100112345, name: "Jane Smith" },
        { id: 100112346, name: "Alice Johnson" },
        { id: 1001123471, name: "Bob Williams" },
        { id: 100112348, name: "John Doe" },
        { id: 100112349, name: "Jane Smith" },
        { id: 1001123450, name: "Alice Johnson" },
        { id: 100112323, name: "Bob Williams" },
        { id: 1001123454, name: "John Doe" },
        { id: 100114562, name: "Jane Smith" },
        { id: 100769209, name: "Alice Johnson" },
        { id: 100105800, name: "Bob Williams" },
        { id: 100000000, name: "John Doe" },
      ];

    return (
    <section className="authSubSectionContainer">
        <h2 className="sectionTitle">Authentication Requests:</h2>
      
        {/* Inner scrollable wrapper */}
        <div className="scrollInner">
          <ul className="peopleList">
            {people.map((person, index) => {
              // Add a comma after the name, then pad it to 20 characters
              const nameWithComma = `${person.name}`.padEnd(15, " ");
              // Combine them into one string
              const line = `${nameWithComma} ${person.id}`;
      
              return (
                <li key={index} className="personItem">
                  {/* Use <pre> + monospace so the spacing is preserved exactly */}
                  <pre className="personName">
                    {line}
                  </pre>
                  <input type="checkbox" className="personCheckbox" />
                </li>
              );
            })}
          </ul>
        </div>
      
        <button className="pill">Authenticate</button>
    </section>
    );
  }
  

export default HoursSection;