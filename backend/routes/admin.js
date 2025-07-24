const express = require('express');
const router = express.Router();
const { verifyAdmin, authenticate } = require("../middleware/auth");

const {
  getPendingAvailabilities,
  approveAvailability,
  deleteAvailability,
  getAllAppointments
} = require('../controllers/adminController');
const Slot = require("../models/Slot");


// Admin Actions
router.get('/availability/pending',authenticate, getPendingAvailabilities);               // Get all pending availability submissions
router.post('/availability/:availabilityId/approve',authenticate, approveAvailability);  // Approve a specific availability
router.delete('/availability/:availabilityId',authenticate, deleteAvailability);         // Delete a specific availability
router.get('/appointments',authenticate, getAllAppointments);

module.exports = router;
