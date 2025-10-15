const express = require('express');
const router = express.Router();
const { verifyAdmin, authenticate } = require("../middleware/auth");

const {
  getAvailableSlots,
  bookSlot,
  cancelBooking,
  deleteSlot,
  getSlotById
} = require('../controllers/slotController');

// Slot Management
router.get('/',authenticate, getAvailableSlots);                // Get all available slots
router.get('/:slotId',authenticate, getSlotById);               // Get slot by ID
router.post('/book',authenticate, bookSlot);           // Book a slot
router.delete('/:slotId',authenticate, deleteSlot);             // Delete a slot (Admin/internal only)

module.exports = router;
