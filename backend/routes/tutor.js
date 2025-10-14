const express = require('express');
const router = express.Router();
const { verifyAdmin, authenticate } = require("../middleware/auth");
const {
  createAvailability,
  getAvailabilityByTutor,
  getAllTutors,
  getTutorById,
  updateTutor,
  deleteTutor,
  deleteAvailability,
  getTutorBookings,
  getTutorReport,
  getSubjects,
  getSlots
} = require('../controllers/tutorController');
const { get } = require('mongoose');

// Tutor Availability
router.post('/:tutorId/availability',authenticate, createAvailability);
router.get('/:tutorId/availability',authenticate, getAvailabilityByTutor);
router.delete('/:tutorId/availability',authenticate, deleteAvailability);

// Tutor Bookings
router.get('/:tutorId/bookings',authenticate, getTutorBookings);

// Tutor Reports
router.get('/:tutorId/report',authenticate, getTutorReport)

// Tutor Profile Management
router.get('/',authenticate, getAllTutors);            // Get all tutors

router.get('/subjects',authenticate, getSubjects);
router.get('/slots',authenticate, getSlots);

router.get('/:tutorId',authenticate, getTutorById);    // Get tutor by ID
router.patch('/:tutorId',authenticate, updateTutor);   // Update tutor info
router.delete('/:tutorId',authenticate, deleteTutor);  // Delete tutor 


module.exports = router;
