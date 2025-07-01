const express = require('express');
const router = express.Router();
const {
  createAvailability,
  getAvailabilityByTutor,
  getAllTutors,
  getTutorById,
  updateTutor,
  deleteTutor,
  deleteAvailability,
  getTutorBookings,
  getTutorReport
} = require('../controllers/tutorController');
const { get } = require('mongoose');

// Tutor Availability
router.post('/:tutorId/availability', createAvailability);
router.get('/:tutorId/availability', getAvailabilityByTutor);
router.delete('/:tutorId/availability', deleteAvailability);

// Tutor Bookings
router.get('/:tutorId/bookings', getTutorBookings);

// Tutor Reports
router.get('/:tutorId/report', getTutorReport)

// Tutor Profile Management
router.get('/', getAllTutors);            // Get all tutors
router.get('/:tutorId', getTutorById);    // Get tutor by ID
router.patch('/:tutorId', updateTutor);   // Update tutor info
router.delete('/:tutorId', deleteTutor);  // Delete tutor 


module.exports = router;
