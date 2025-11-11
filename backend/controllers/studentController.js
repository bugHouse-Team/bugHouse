const User = require('../models/User');
const Slot = require('../models/Slot');
const Attendance = require("../models/Attendance");

// GET /api/students
exports.getAllStudents = async (req, res) => {
  try {
    if 
    (
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      const users = await User.find({ role: { $in: ['Student', 'Tutor'] }, _id: req.user.id });
      return res.status(201).json(users);
    }

    const students = await User.find({ role: { $in: ['Student', 'Tutor'] } });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// GET /api/students/:studentId
exports.getStudentById = async (req, res) => {
  try {
    if (
      req.user.role !== "Student" &&
      req.user.role !== "Admin" &&
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role !== "SysAdmin" &&
      req.user.role !== "Admin" &&
      req.params.studentId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    const student = await User.findOne({ _id: req.params.studentId, role: { $in: ['Student', 'Tutor'] } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
};

// GET /api/students/:studentId/bookings
exports.getStudentBookings = async (req, res) => {
  try {
    if (
      req.user.role !== "SysAdmin" &&
      req.user.role !== "Admin" &&
      req.params.studentId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Slot.find({ studentId: req.params.studentId }).select("_id date startTime subjects studentId tutorId endTime")
      .populate("studentId", "name email")
      .populate("tutorId", "name email")
      .lean();

    const formatted = bookings.map(b => ({
      _id: b._id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      subjects: b.subjects,
      studentId: b.studentId,
      tutorId: b.tutorId,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch student bookings' });
  }
};

// PATCH /api/students/:studentId
exports.updateStudent = async (req, res) => {
  try {
    if (
      req.user.role !== "SysAdmin" &&
      req.params.studentId !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    const updates = req.body;
    const student = await User.findOneAndUpdate(
      { _id: req.params.studentId, role: { $in: ['Student', 'Tutor'] } },
      updates,
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update student' });
  }
};

// DELETE /api/students/:studentId
exports.deleteStudent = async (req, res) => {
  try {
    if (
      req.user.role !== "SysAdmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    const result = await User.findOneAndDelete({
      _id: req.params.studentId,
      role: { $in: ['Student', 'Tutor'] }
    });
    if (!result) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete student' });
  }
};

exports.logAttendance = async (req, res) => {
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
};

exports.getAttendance = async (req, res) => {
  console.log("📥 GET /attendance → email:", req.params.email);

  try {
    const records = await Attendance.find({ email: req.params.email }).sort({ timestamp: -1 });
    console.log(`📊 Found ${records.length} attendance records`);
    res.status(200).json(records);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};