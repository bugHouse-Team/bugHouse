const express = require('express');
const router = express.Router();
const Attendance = require("../models/Attendance");

const {
  getAllStudents,
  getStudentById,
  getStudentBookings,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');

// 🟢 Attendance routes — PLACE FIRST!
router.post("/attendance/log", async (req, res) => {
  const { email, type = "Sign In" } = req.body;
  console.log("📩 POST /attendance/log → email:", email, "| type:", type);

  if (!email) {
    console.warn("⚠️ Missing email in attendance POST");
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const record = new Attendance({ email, type });
    await record.save();
    console.log("✅ Attendance saved for:", email);
    res.status(201).json({ message: "Attendance logged" });
  } catch (err) {
    console.error("❌ Error logging attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/attendance/:email", async (req, res) => {
  console.log("📥 GET /attendance → email:", req.params.email);

  try {
    const records = await Attendance.find({ email: req.params.email }).sort({ timestamp: -1 });
    console.log(`📊 Found ${records.length} attendance records`);
    res.status(200).json(records);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ⬇️ Student routes
router.get('/:studentId/bookings', getStudentBookings);
router.get('/', getAllStudents);
router.get('/:studentId', getStudentById);
router.patch('/:studentId', updateStudent);
router.delete('/:studentId', deleteStudent);

module.exports = router;
