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

let recentCheckIns = [];
let lastNameBuffer = null; // store last name until ID arrives

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

// ✅ POST: check-in
router.post("/checkin", (req, res) => {
  const { id: rawInput } = req.body;
  if (!rawInput) return res.status(400).json({ message: "Swipe data required" });

  const { id, name } = parseSwipe(rawInput);

  // If Track 1 only (name), save it for later
  if (name && !id) {
    lastNameBuffer = name;
    return res.status(200).json({ message: "Name captured, waiting for ID track" });
  }

  // If Track 2 / 3 only (ID), use buffered name if exists
  if (id) {
    const finalName = name || lastNameBuffer || "Unknown";
    lastNameBuffer = null; // reset buffer after using

    // Prevent duplicates
    const existing = recentCheckIns.find(entry => entry.id === id);
    if (existing) {
      return res.status(200).json({ message: "Student already checked in", checkIn: existing });
    }

    const checkIn = {
      id,
      name: finalName,
      timestamp: new Date().toISOString(),
    };

    recentCheckIns.unshift(checkIn);
    if (recentCheckIns.length > 50) recentCheckIns.pop();

    console.log(
      `✅ ID: ${checkIn.id} — Name: ${checkIn.name} — Time: ${new Date(checkIn.timestamp).toLocaleTimeString()}`
    );

    return res.status(200).json({ message: "Check-in recorded", checkIn });
  }

  return res.status(400).json({ message: "Invalid swipe data" });
});

// ✅ GET: recent check-ins
router.get("/recent", (req, res) => {
  res.json(recentCheckIns);
});

module.exports = router;
