// backend/models/Attendance.js
const mongoose = require("mongoose");

// ----------------- VisitSchema (embedded per visit) -----------------
const VisitSchema = new mongoose.Schema(
  {
    checkIn: { type: Date, required: true },
    checkOut: { type: Date }, // set when they sign out

    // Optional extras for later analytics
    bughouse: { type: String }, // e.g. "CS1 BugHouse"
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tutorName: { type: String },
  },
  {
    _id: true, // each visit gets its own _id
  }
);

// ----------------- AttendanceSchema (one doc per student) -----------------
const AttendanceSchema = new mongoose.Schema(
  {
    // One document per student
    studentId: { type: String, required: true, unique: true }, // UTA ID / card ID
    email: { type: String, required: true },
    name: { type: String, required: true },

    // Current sign-in status (overall, based on latest visit)
    type: {
      type: String,
      enum: ["Signed-IN", "Signed-OUT"],
      default: "Signed-OUT",
      required: true,
    },

    // All check-in/out pairs for this student
    visits: [VisitSchema],
  },
  {
    timestamps: true,              // createdAt / updatedAt
    collection: "mod_attendances", // 👈 use this collection name
  }
);

// Helpful indexes
AttendanceSchema.index({ studentId: 1 });
AttendanceSchema.index({ email: 1 });

console.log("✅ Attendance model loaded (mod_attendances)");

module.exports = mongoose.model("ModAttendance", AttendanceSchema);
