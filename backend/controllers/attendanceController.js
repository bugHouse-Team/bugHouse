// backend/controllers/attendanceController.js
const Attendance = require("../models/Attendance");
const User = require("../models/User"); // adjust path if your User model is elsewhere

// Helper to parse swipe-like input (server-side copy of your front-end logic)
function parseSwipe(rawInput = "") {
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
}

// Main handler for /api/attendance/checkin
// NOTE: Frontend sends: { id: studentId.trim() }   (raw swipe or typed ID/email)
exports.handleSwipeCheckin = async (req, res) => {
    try {
        const rawInput = (req.body.id || "").trim();

        if (!rawInput) {
            return res.status(400).json({ message: "No ID or email provided." });
        }

        // Step 1: classify / parse the input
        let studentId = null;
        let email = null;
        let parsedName = "";

        if (rawInput.includes("@")) {
            // Looks like an email
            email = rawInput.toLowerCase();
        } else if (rawInput.startsWith("100") || /^\d{6,}$/.test(rawInput)) {
            // Looks like a bare numeric ID (typed)
            studentId = rawInput;
        } else {
            // Likely a swipe string; parse it
            const parsed = parseSwipe(rawInput);
            studentId = parsed.id || null;
            parsedName = parsed.name || "";
        }

        if (!studentId && !email) {
            return res
                .status(400)
                .json({ message: "Unable to parse swipe/ID/email." });
        }

        // Step 2: look up the user in the Users collection
        const userQuery = {};
        if (email) userQuery.email = email;
        if (studentId) userQuery.studentId = studentId;

        const user = await User.findOne(userQuery);

        if (!user) {
            // You can decide if you want to auto-create users instead:
            return res.status(404).json({ message: "User not found." });
        }

        // Try to get consistent fields from User model
        const finalStudentId = user.studentId || studentId;
        const finalEmail = user.email || email;
        const finalName =
            user.name ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            parsedName ||
            "Unknown";

        if (!finalStudentId || !finalEmail) {
            return res.status(400).json({
                message:
                    "User record is missing studentId or email. Please contact an admin.",
            });
        }

        // Step 3: find or create per-student Attendance doc
        let att = await Attendance.findOne({ studentId: finalStudentId });

        if (!att) {
            // First time this student has any attendance record
            att = await Attendance.create({
                studentId: finalStudentId,
                email: finalEmail,
                name: finalName,
                type: "Signed-OUT",
                visits: [],
            });
        } else {
            // Keep email/name in sync with latest from User when they swipe
            att.email = finalEmail;
            att.name = finalName;
        }

        // Step 4: sign-in vs sign-out based on last visit
        const now = new Date();
        const visits = att.visits || [];
        const lastVisit = visits[visits.length - 1];

        if (!lastVisit || lastVisit.checkOut) {
            // --- SIGN-IN ---
            att.visits.push({
                checkIn: now,
                // checkOut left undefined
            });
            att.type = "Signed-IN";

            await att.save();

            return res.json({
                message: `✅ Signed IN at ${now.toLocaleTimeString()}`,
                status: "Signed-IN",
            });
        } else {
            // --- SIGN-OUT ---
            lastVisit.checkOut = now;
            att.type = "Signed-OUT";

            await att.save();

            const durationMs = lastVisit.checkOut - lastVisit.checkIn;
            const minutes = Math.round(durationMs / 60000);

            return res.json({
                message: `✅ Signed OUT. Time spent: ${minutes} minutes.`,
                status: "Signed-OUT",
            });
        }
    } catch (err) {
        console.error("Attendance swipe error:", err);
        return res
            .status(500)
            .json({ message: "Error processing attendance swipe." });
    }
};
