const express = require("express");
const router = express.Router();
const {
  checkIn,
  getRecentAttendance
} = require('../controllers/attendanceController');

router.post("/checkin", checkIn);
router.get("/recent", getRecentAttendance);

module.exports = router;
