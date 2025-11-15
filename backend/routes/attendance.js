const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance"); // this exports the ModAttendance model (collection: mod_attendances)

let recentCheckIns = [];

// ----------------- Helpers -----------------

function getUserBasicByIdNumber(idNumber) {
  return User.findOne({ idNumber: String(idNumber) })
    .select("name email idNumber")
    .lean();
}

// Parse swipe data (same logic as before)
function parseSwipe(rawInput) {
  if (!rawInput) return { id: "", name: "" };

  var id = "";
  var name = "";

  // Track 1 (name): %B6391500926068134^NGUYEN/TRUONG B ^
  var track1 = rawInput.match(/%B\d+\^([^/]+)\/([^\^]+)/);
  if (track1) {
    var last = track1[1].trim().replace(/[^A-Za-z]/g, "");
    var first = track1[2].trim().replace(/[^A-Za-z]/g, "");
    name = first + " " + last;
  }

  // Track 2 / Track 3 (ID): ;1002151686?
  var trackId = rawInput.match(/;(\d{6,})\?/);
  if (trackId) id = trackId[1];

  return { id: id, name: name };
}

// ----------------- Routes -----------------

// POST: swipe / check-in / check-out
router.post("/checkin", async (req, res) => {
  try {
    var rawInput = "";
    if (req.body && req.body.id) {
      rawInput = String(req.body.id).trim();
    }

    if (!rawInput) {
      return res.status(400).json({ message: "Swipe data required" });
    }

    // 1) Parse swipe or manual ID
    var parsed = parseSwipe(rawInput);
    var studentId = parsed.id;
    var parsedName = parsed.name;

    // If manual type-in looks like UTA ID (100...)
    if (rawInput.indexOf("100") === 0) {
      studentId = rawInput;
    }

    if (!studentId) {
      return res.status(400).json({ message: "Invalid swipe data" });
    }

    // 2) Look up user by idNumber in Users collection
    var user = await getUserBasicByIdNumber(studentId);

    var finalName =
      user && user.name
        ? user.name
        : parsedName
          ? parsedName
          : "Unknown";

    var email =
      user && user.email
        ? user.email
        : "unknown@unknown";

    var resolvedStudentId =
      user && user.idNumber
        ? user.idNumber
        : studentId;

    if (!user || finalName === "Unknown") {
      // keep your old behavior
      return res
        .status(200)
        .json({ message: "Error: User not registered" });
    }

    var now = new Date();
    var nowIso = now.toISOString();

    // 3) Find or create per-student attendance doc in mod_attendances
    var attendanceDoc = await Attendance.findOne({ studentId: resolvedStudentId });

    if (!attendanceDoc) {
      attendanceDoc = new Attendance({
        studentId: resolvedStudentId,
        email: email,
        name: finalName,
        type: "Signed-OUT",
        visits: [],
      });
    } else {
      // keep email/name synced with User on each swipe
      attendanceDoc.email = email;
      attendanceDoc.name = finalName;
    }

    var visits = attendanceDoc.visits || [];
    var lastVisit = visits.length > 0 ? visits[visits.length - 1] : null;

    // 4) SIGN-IN vs SIGN-OUT based on last visit
    if (!lastVisit || lastVisit.checkOut) {
      // ---------- SIGN-IN ----------
      attendanceDoc.visits.push({
        checkIn: now,
      });
      attendanceDoc.type = "Signed-IN";

      await attendanceDoc.save();

      // Update in-memory list (remove old entry if any)
      var idxIn = -1;
      for (var i = 0; i < recentCheckIns.length; i++) {
        if (recentCheckIns[i].id === resolvedStudentId) {
          idxIn = i;
          break;
        }
      }
      if (idxIn !== -1) {
        recentCheckIns.splice(idxIn, 1);
      }

      var checkInRecord = {
        id: resolvedStudentId,
        name: finalName,
        timestamp: nowIso,
        status: "Signed-IN",
      };

      recentCheckIns.unshift(checkInRecord);
      if (recentCheckIns.length > 50) recentCheckIns.pop();

      console.log(
        "✅ SIGN-IN — ID: " +
        resolvedStudentId +
        " — Name: " +
        finalName +
        " — Time: " +
        now.toLocaleTimeString()
      );

      return res.status(200).json({
        message: "Check-in recorded",
        checkIn: checkInRecord,
      });
    } else {
      // ---------- SIGN-OUT ----------
      lastVisit.checkOut = now;
      attendanceDoc.type = "Signed-OUT";

      await attendanceDoc.save();

      var durationMs = lastVisit.checkOut - lastVisit.checkIn;
      var minutes = Math.round(durationMs / 60000);

      // Update in-memory list
      var idxOut = -1;
      for (var j = 0; j < recentCheckIns.length; j++) {
        if (recentCheckIns[j].id === resolvedStudentId) {
          idxOut = j;
          break;
        }
      }
      if (idxOut !== -1) {
        recentCheckIns.splice(idxOut, 1);
      }

      var checkoutRecord = {
        id: resolvedStudentId,
        name: finalName,
        timestamp: nowIso,
        status: "Signed-OUT",
        durationMinutes: minutes,
      };

      recentCheckIns.unshift(checkoutRecord);
      if (recentCheckIns.length > 50) recentCheckIns.pop();

      console.log(
        "✅ SIGN-OUT — ID: " +
        resolvedStudentId +
        " — Name: " +
        finalName +
        " — Time: " +
        now.toLocaleTimeString() +
        " — Duration: " +
        minutes +
        " min"
      );

      return res.status(200).json({
        message: "Student checked out successfully",
        checkIn: checkoutRecord,
      });
    }
  } catch (err) {
    console.error("checkin error:", err);
    return res
      .status(500)
      .json({ message: "Invalid check-in data" });
  }
});

// GET: recent check-ins
router.get("/recent", (req, res) => {
  try {
    return res.json(recentCheckIns);
  } catch (err) {
    console.error("recent error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load recent check-ins" });
  }
});

module.exports = router;
