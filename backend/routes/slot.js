const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  bookSlot,
  cancelBooking,
  deleteSlot,
  getSlotById
} = require('../controllers/slotController');

// Slot Management
router.get('/', getAvailableSlots);                // Get all available slots
router.get('/:slotId', getSlotById);               // Get slot by ID
router.post('/:slotId/book', bookSlot);           // Book a slot
router.post('/:slotId/cancel', cancelBooking);    // Cancel a booking
router.delete('/:slotId', deleteSlot);             // Delete a slot (Admin/internal only)

module.exports = router;
