// controllers/reportsController.js
const ModAttendance = require("../models/ModAttendance");
const User = require("../models/User");
const Slot = require("../models/Slot");

/*
    ROUTE: GET /api/reports/overview
    ACCESS: Admin | SysAdmin
*/
exports.getOverview = async (req, res) => {
    try {
        // Must be Admin or SysAdmin
        if (!["Admin", "SysAdmin"].includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        // ==== Pull all attendance data ====
        const records = await ModAttendance.find().lean();

        let totalStudents = records.length;
        let totalVisits = 0;
        let totalMinutes = 0;

        let dateStart = null;
        let dateEnd = null;

        for (const r of records) {
            for (const v of r.visits || []) {
                if (v.checkIn) {
                    totalVisits++;

                    // track date range
                    const cIn = new Date(v.checkIn);
                    if (!dateStart || cIn < dateStart) dateStart = cIn;
                    if (!dateEnd || cIn > dateEnd) dateEnd = cIn;

                    if (v.checkOut) {
                        const cOut = new Date(v.checkOut);
                        const diff = (cOut - cIn) / 60000; // minutes
                        if (diff > 0) totalMinutes += diff;
                    }
                }
            }
        }

        const avgVisitMinutes = totalVisits > 0
            ? Math.round(totalMinutes / totalVisits)
            : 0;

        // ==== Tutor Stats (from Slots collection) ====
        const booked = await Slot.find({ isBooked: true })
            .populate("tutorId", "name email")
            .lean();

        const tutorMap = {};

        booked.forEach(b => {
            if (!b.tutorId) return;

            const tId = b.tutorId._id.toString();

            if (!tutorMap[tId]) {
                tutorMap[tId] = {
                    tutorId: tId,
                    tutorName: b.tutorId.name,
                    tutorEmail: b.tutorId.email,
                    totalSessions: 0,
                    totalStudents: new Set(),
                    totalMinutes: 0,
                };
            }

            tutorMap[tId].totalSessions++;
            if (b.studentId) tutorMap[tId].totalStudents.add(b.studentId.toString());

            if (b.startTime && b.endTime) {
                const m = (new Date(`2000-01-01T${b.endTime}`) - new Date(`2000-01-01T${b.startTime}`)) / 60000;
                if (m > 0) tutorMap[tId].totalMinutes += m;
            }
        });

        const tutorStats = Object.values(tutorMap).map(t => ({
            ...t,
            totalStudents: t.totalStudents.size,
            avgSessionMinutes:
                t.totalSessions > 0 ? Math.round(t.totalMinutes / t.totalSessions) : 0,
        }));

        return res.json({
            generatedAt: new Date(),
            user: { email: req.user.email, role: req.user.role },
            summary: {
                totalStudents,
                totalVisits,
                totalMinutes: Math.round(totalMinutes),
                avgVisitMinutes,
                dateRange: {
                    start: dateStart,
                    end: dateEnd,
                },
            },
            tutorStats,
        });

    } catch (err) {
        console.error("Error generating report:", err);
        return res.status(500).json({ message: "Failed to generate report" });
    }
};
