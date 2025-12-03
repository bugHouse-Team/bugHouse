// backend/controllers/attendanceController.js
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const MAX_SESSION_MS = 2 * 60 * 1000; //max allowed session length: 2 hours (in ms)

// Helper to get user basic info by ID number
const getUserBasicByIdNumber = (idNumber) => {
  return User.findOne({ idNumber: String(idNumber) })
    .select("name email idNumber")
    .lean();
};

// Helper to parse swipe-like input
const parseSwipe = (rawInput = "") => {
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

  // Track 2 / 3 (ID): ;1002151686?
  const trackId = rawInput.match(/;(\d{6,})\?/);
  if (trackId) id = trackId[1];

  return { id, name };
};

// POST /api/attendance/checkin
exports.checkIn = async (req, res) => {
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

    if (lastVisit && lastVisit.checkIn && !lastVisit.checkOut) {
      var diffMs = now - lastVisit.checkIn;
      if (diffMs > MAX_SESSION_MS) {
        // You can use `now` instead if you prefer, but this caps it at exactly 2h
        lastVisit.checkOut = new Date(
          lastVisit.checkIn.getTime() + MAX_SESSION_MS
        );
        attendanceDoc.type = "Signed-OUT";
        await attendanceDoc.save();

        console.log(
          "⏲️ AUTO SIGN-OUT after 2h — ID: " +
            resolvedStudentId +
            " — Name: " +
            finalName +
            " — Original check-in: " +
            lastVisit.checkIn.toLocaleTimeString()
        );

        // lastVisit now has checkOut, so next logic will treat this swipe as a new SIGN-IN
      }
    }

    // 4) SIGN-IN vs SIGN-OUT based on last visit
    if (!lastVisit || lastVisit.checkOut) {
      // ---------- SIGN-IN ----------
      attendanceDoc.visits.push({
        checkIn: now,
      });
      attendanceDoc.type = "Signed-IN";

      await attendanceDoc.save();

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
        checkIn: {
          id: resolvedStudentId,
          name: finalName,
          timestamp: nowIso,
          status: "Signed-IN",
        },
      });
    } else {
      // ---------- SIGN-OUT ----------
      lastVisit.checkOut = now;
      attendanceDoc.type = "Signed-OUT";

      await attendanceDoc.save();

      var durationMs = lastVisit.checkOut - lastVisit.checkIn;
      var minutes = Math.round(durationMs / 60000);

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
        checkIn: {
          id: resolvedStudentId,
          name: finalName,
          timestamp: nowIso,
          status: "Signed-OUT",
          durationMinutes: minutes,
        },
      });
    }
  } catch (err) {
    console.error("checkin error:", err);
    return res
      .status(500)
      .json({ message: "Invalid check-in data" });
  }
};

// GET /api/attendance/recent
exports.getRecentAttendance = async (req, res) => {
  try {
    const now = new Date();
    // Get only signed-in users from database
    const signedInAttendance = await Attendance.find({ type: "Signed-IN" })
      .select("studentId name email type visits")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    // Transform the data to match the expected format
    const recentCheckIns = [];
    
    for (const attendance of signedInAttendance) {
      const visits = attendance.visits || [];
      if (visits.length === 0) continue;

      // Get the most recent visit (should be an active check-in)
      const lastVisit = visits[visits.length - 1];
       const diffMs = now - new Date(lastVisit.checkIn);

        // 🔔 NEW: auto sign-out here too if over 2 hours
        if (diffMs > MAX_SESSION_MS) {
          // Cap at exactly 2h after check-in
          const autoCheckOut = new Date(
            new Date(lastVisit.checkIn).getTime() + MAX_SESSION_MS
          );

          await Attendance.updateOne(
            { _id: attendance._id, "visits._id": lastVisit._id },
            {
              $set: {
                "visits.$.checkOut": autoCheckOut,
                type: "Signed-OUT",
              },
            }
          );

          console.log(
            "⏲️ AUTO SIGN-OUT (recent view) after 2h — ID: " +
              attendance.studentId +
              " — Name: " +
              attendance.name
          );

          // Don't show them as currently signed-in
          continue;
        }
        if (lastVisit.checkIn && !lastVisit.checkOut) {
        
        // Currently signed in - show check-in time
        recentCheckIns.push({
          id: attendance.studentId,
          name: attendance.name,
          timestamp: lastVisit.checkIn.toISOString(),
          status: "Signed-IN",
        });
      }
    }

    // Sort by timestamp (most recent first)
    recentCheckIns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return res.json(recentCheckIns);
  } catch (err) {
    console.error("recent error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load recent check-ins" });
  }
};

// Legacy method - keeping for backwards compatibility if needed
exports.handleSwipeCheckin = async (req, res) => {
  return exports.checkIn(req, res);
};
