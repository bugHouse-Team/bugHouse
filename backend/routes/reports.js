const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const reportsController = require("../controllers/reportsController");

// Option B: auth middleware then role check inside controller
router.get("/overview", authenticate, reportsController.getOverview);

module.exports = router;
