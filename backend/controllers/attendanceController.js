
const User = require('../models/User');
const Attendance = require('../models/Attendance');

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

exports.recent = async (req, res) => {
  try {
    const recentAttendance = await Attendance.find({ type: "Sign In" })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to recent 50 entries

    let attendanceArr = [];

    recentAttendance.forEach(async record => {
        const ust = await User.findOne({ email: record.email }).select("name idNumber").lean();
        
        console.log(ust);

        attendanceArr.push({
            id: ust.idNumber,
            name: ust.name,
            timestamp: record.timestamp
        });

        await Promise.all(attendanceArr);
    });

    await Promise.all(attendanceArr);

    return res.status(200).json(attendanceArr);
  } catch (err) {
    console.error("Error fetching recent attendance:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

exports.checkIn = async (req, res) => {
  try {
    const { id: rawInput } = req.body;
    if (!rawInput) return res.status(400).json({ message: "Swipe data required" });

    let { id, name } = parseSwipe(rawInput);

    // if manual type-in looks like UTA ID
    if (rawInput.startsWith("100")) id = rawInput.trim();

    if (!id) {
      return res.status(400).json({ message: "Invalid swipe data" });
    }

    // fetch name from DB
    const user = await getUserBasicByIdNumber(id);
    const finalName = (user?.name) || name || "Unknown";
    const email = user?.email || "unknown@unknown";

    if (finalName === "Unknown") {
      return res.status(200).json({ message: "Error: User not registered" });
    }

    const checkIn = {
      id,
      name: finalName,
      timestamp: new Date().toISOString(),
    };

    // Check if user is already signed in
    const existingAttendance = await Attendance.findOne({ email, type: "Sign In" }).sort({ timestamp: -1 });

    if (existingAttendance) {
      // User is checking out
      existingAttendance.type = "Sign Out";
      existingAttendance.timestamp = new Date();
      await existingAttendance.save();
      
      return res.status(200).json({ 
        message: "Student checked out successfully", 
        checkIn: {
          id,
          name: finalName,
          timestamp: existingAttendance.timestamp.toISOString(),
          type: "Sign Out"
        }
      });
    } else {
      // User is checking in
      const newAttendance = await Attendance.create({
        email,
        type: "Sign In",
        timestamp: new Date(checkIn.timestamp),
      });

      console.log(`✅ ID: ${checkIn.id} — Name: ${checkIn.name} — Time: ${new Date(checkIn.timestamp).toLocaleTimeString()}`);

      return res.status(200).json({ message: "Check-in recorded", checkIn });
    }
  } catch (err) {
    console.error("checkin lookup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}