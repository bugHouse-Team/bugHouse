// const express = require("express");
// const router = express.Router();
// const { authenticate } = require("../middleware/auth");
// const reportsController = require("../controllers/reportsController");

// // Option B: auth middleware then role check inside controller
// router.get("/overview", authenticate, reportsController.getOverview);

// module.exports = router;


// backend/routes/reports.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const reportsController = require("../controllers/reportsController");

// Overview used by ReportsPage
router.get("/overview", authenticate, reportsController.getOverview);

// Center-wide CSV report
// Frontend calls: GET /api/reports/center-csv
router.get("/center-csv", authenticate, reportsController.downloadCenterCsv);

// Individual tutor CSV report
// Frontend calls: GET /api/reports/tutor-csv/:tutorId
router.get(
    "/tutor-csv/:tutorId",
    authenticate,
    reportsController.downloadTutorCsv
);

module.exports = router;

