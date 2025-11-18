const express = require('express');
const router = express.Router();
const studentController = require("../controllers/studentController");
const { verifyAdmin, authenticate } = require("../middleware/auth");

const {
  getAllStudents,
  getStudentById,
  getStudentBookings,
  updateStudent,
  deleteStudent,
  logAttendance,
  getAttendance
} = require('../controllers/studentController');

// ⬇️ Student routes
router.get('/:studentId/bookings', authenticate, getStudentBookings);
router.get('/', authenticate, getAllStudents);
router.get('/:studentId', authenticate, getStudentById);
router.patch('/:studentId', authenticate, updateStudent);
router.delete('/:studentId', authenticate, deleteStudent);
router.post('/attendance/log', authenticate, logAttendance);
router.get('/attendance/:email', authenticate, getAttendance);

module.exports = router;