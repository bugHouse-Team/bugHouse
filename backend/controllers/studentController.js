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

// GET /api/students/attendance/:email
// Returns an array of visits: [{ visitNumber, checkIn, checkOut }, ...]
exports.getAttendance = async (req, res) => {
  try {
    const emailParam = String(req.params.email || "").toLowerCase();

    if (!emailParam) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the per-student attendance doc in mod_attendances
    const attDoc = await Attendance.findOne({ email: emailParam }).lean();

    if (!attDoc) {
      // No attendance yet
      return res.json([]);
    }

    // Build visits array with visitNumber, checkIn, checkOut
    let visits = (attDoc.visits || []).map((v, index) => ({
      visitNumber: index + 1,
      checkIn: v.checkIn || null,
      checkOut: v.checkOut || null,
    }));

    // Optional: sort newest first
    visits = visits.sort((a, b) => {
      const tA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const tB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return tB - tA;
    });

    return res.json(visits);
  } catch (err) {
    console.error("getAttendance error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load attendance history." });
  }
};


// GET /api/students/attendance/:email
exports.getAttendanceByEmail = async (req, res) => {
  try {
    const emailParam = String(req.params.email || "").toLowerCase();
    if (!emailParam) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find student's attendance doc in mod_attendances
    const attDoc = await Attendance.findOne({ email: emailParam }).lean();

    if (!attDoc) {
      return res.json([]); // no visits yet
    }

    const visits = (attDoc.visits || []).map((v, index) => ({
      visitNumber: index + 1,
      checkIn: v.checkIn,
      checkOut: v.checkOut || null,
    }));

    // optional: newest first
    visits.sort((a, b) => {
      const tA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const tB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return tB - tA;
    });

    return res.json(visits);
  } catch (err) {
    console.error("getAttendanceByEmail error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load attendance history." });
  }
};