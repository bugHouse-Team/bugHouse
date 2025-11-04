/* const express = require("express");
const router = express.Router();

// Temporary in-memory storage for demonstration
let recentCheckIns = [];

// POST: student check-in
router.post("/checkin", (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ message: "ID is required" });

  const checkIn = {
    id,
    timestamp: new Date().toISOString(),
  };

  // Add to the top of the array
  recentCheckIns.unshift(checkIn);

  // Keep only latest 50 check-ins
  if (recentCheckIns.length > 50) recentCheckIns.pop();

  res.status(200).json({ message: "Check-in recorded", checkIn });
});

// GET: get recent check-ins
router.get("/recent", (req, res) => {
  res.json(recentCheckIns);
});

module.exports = router;
 */ //almost correct ver

const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

let recentCheckIns = [];
let lastNameBuffer = null; // store last name until ID arrives


async function getUserNameByIdNumber(idNumber) {
  if (!idNumber) {
    throw new Error("idNumber required");
  }

  const user = await User.findOne({ idNumber: String(idNumber) });

  if (!user) {
    return "Unknown";
  }

  return user.name;
}

function getUserBasicByIdNumber(idNumber) {
  return User.findOne({ idNumber: String(idNumber) })
    .select("name email idNumber")
    .lean(); // returns { _id, name, email, idNumber } or null
}


// ✅ Helper: Parse swipe data
function parseSwipe(rawInput) {
  if (!rawInput) return { id: "", name: "" };

  let id = "";
  let name = "";

  // Track 1 (name): %B6391500926068134^NGUYEN/TRUONG B ^
  const track1 = rawInput.match(/%B\d+\^([^/]+)\/([^\^]+)/);
  if (track1) {
    const last = track1[1].trim().replace(/[^A-Za-z]/g, "");
    const first = track1[2].trim().replace(/[^A-Za-z]/g, "");
    name = `${first} ${last}`;
  }

  // Track 2 / Track 3 (ID): ;1002151686?
  const trackId = rawInput.match(/;(\d{6,})\?/);
  if (trackId) id = trackId[1];

  return { id, name };
}

router.post("/checkin", (req, res) => {
  const { id: rawInput } = req.body;
  if (!rawInput) return res.status(400).json({ message: "Swipe data required" });

  let { id, name } = parseSwipe(rawInput);

  // if manual type-in looks like UTA ID
  if (rawInput.startsWith("100")) id = rawInput.trim();

  if (!id) {
    return res.status(400).json({ message: "Invalid swipe data" });
  }

  // fetch name from DB asynchronously
getUserBasicByIdNumber(id)
    .then(user => {
      const finalName = (user?.name) || name || "Unknown";
      const email = user?.email || "unknown@unknown";

      if(finalName == "Unknown") {
        return res.status(200).json({ message: "Error: User not registered" });
      }

      const checkIn = {
        id,
        name: finalName,
        timestamp: new Date().toISOString(),
      };
      
      // Prevent duplicates
      const existing = recentCheckIns.find(entry => entry.id === id);
      if (existing) {
        // if already signed in --> sign out
        return Attendance.create({
          email,
          type: "Sign Out",
          timestamp: new Date(checkIn.timestamp),
        })
        .then(() => {
          // remove from check-in array
          recentCheckIns.splice(recentCheckIns.indexOf(existing), 1);
          return res.status(200).json({ message: "Student checked out successfully", checkIn: existing });
        });
      }

      // Write to Mongo attendance history
      return Attendance.create({
        email,
        type: "Sign In",
        timestamp: new Date(checkIn.timestamp),
      })
      .then(() => {
        // keep recent in memory list
        recentCheckIns.unshift(checkIn);
        if (recentCheckIns.length > 50) recentCheckIns.pop();

        console.log(`✅ ID: ${checkIn.id} — Name: ${checkIn.name} — Time: ${new Date(checkIn.timestamp).toLocaleTimeString()}`);

        return res.status(200).json({ message: "Check-in recorded", checkIn });
      });
    })
    .catch(err => {
      console.error("checkin lookup error:", err);
      return res.status(400).json({ message: "Invalid check-in data" });
    });
});

// ✅ GET: recent check-ins
router.get("/recent", (req, res) => {
  res.json(recentCheckIns);
});

module.exports = router;
