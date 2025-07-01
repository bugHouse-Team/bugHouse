const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  type: { type: String, enum: ["Sign In", "Sign Out"], default: "Sign In" },
  timestamp: { type: Date, default: Date.now }
});

// ✅ Confirm model is loaded (for debug purposes)
console.log("✅ Attendance model loaded");

module.exports = mongoose.model("Attendance", AttendanceSchema);
