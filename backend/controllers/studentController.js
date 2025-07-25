const User = require('../models/User');
const Slot = require('../models/Slot');

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

    const bookings = await Slot.find({ studentId: req.params.studentId }).populate('tutorId');
    res.json(bookings);
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
