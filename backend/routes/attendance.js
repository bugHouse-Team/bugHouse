const express = require('express');
const router = express.Router();
const { verifyAdmin, authenticate } = require("../middleware/auth");
const {
  checkIn,
  recent
} = require('../controllers/attendanceController');

router.post('/checkin', checkIn);
router.get('/recent', recent);

module.exports = router;