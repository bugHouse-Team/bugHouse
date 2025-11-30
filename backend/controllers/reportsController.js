// backend/controllers/reportsController.js
const Attendance = require("../models/Attendance"); // mod_attendances
const Slot = require("../models/Slot");
const User = require("../models/User");

// ---------- helpers ----------

function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function toCsv(rows) {
    return rows.map((row) => row.map((v) => csvEscape(v)).join(",")).join("\n");
}

function buildDateTime(dateValue, timeString) {
    if (!dateValue || !timeString) return null;

    const base = new Date(dateValue);
    if (Number.isNaN(base.getTime())) return null;

    // Expect "HH:MM" 24h format
    const parts = String(timeString).split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    base.setHours(hours, minutes, 0, 0);
    return base;
}

function findMaxKey(counterObj) {
    let bestKey = null;
    let bestVal = -Infinity;
    for (const [k, v] of Object.entries(counterObj)) {
        if (v > bestVal) {
            bestVal = v;
            bestKey = k;
        }
    }
    return bestKey;
}

// Parse start/end from query as YYYY-MM-DD
function parseDateRange(query) {
    const { start, end } = query || {};
    let startDate = null;
    let endDate = null;

    if (start) {
        const d = new Date(`${start}T00:00:00.000Z`);
        if (!Number.isNaN(d.getTime())) startDate = d;
    }
    if (end) {
        const d = new Date(`${end}T23:59:59.999Z`);
        if (!Number.isNaN(d.getTime())) endDate = d;
    }

    return { startDate, endDate };
}

function withinRange(d, start, end) {
    if (!d) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
}

// ---------- GET /api/reports/overview ----------
// (used by ReportsPage UI)
exports.getOverview = async (req, res) => {
    try {
        if (req.user.role !== "Admin" && req.user.role !== "SysAdmin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { startDate, endDate } = parseDateRange(req.query);

        // Center-wide per-student visits from mod_attendances
        const attDocs = await Attendance.find().lean();

        const totalStudents = attDocs.length;
        let totalVisits = 0;
        let totalMinutes = 0;
        let earliestCheckIn = null;
        let latestCheckOut = null;

        attDocs.forEach((doc) => {
            const visits = doc.visits || [];

            visits.forEach((v) => {
                if (!v.checkIn) return;
                const start = new Date(v.checkIn);
                if (!withinRange(start, startDate, endDate)) return;

                const end = v.checkOut ? new Date(v.checkOut) : null;

                totalVisits += 1;

                if (end && end > start) {
                    const diffMin = (end - start) / 60000;
                    totalMinutes += diffMin;
                }

                if (!earliestCheckIn || start < earliestCheckIn) {
                    earliestCheckIn = start;
                }
                if (end && (!latestCheckOut || end > latestCheckOut)) {
                    latestCheckOut = end;
                }
            });
        });

        const avgVisitMinutes =
            totalVisits > 0 ? Number((totalMinutes / totalVisits).toFixed(1)) : 0;

        // Tutor stats + busiest day/hour from booked Slots
        const bookedSlots = await Slot.find({ isBooked: true })
            .select("date startTime endTime studentId tutorId")
            .populate("studentId", "name email")
            .populate("tutorId", "name email")
            .lean();

        const tutorMap = new Map();
        const dayCounts = {};
        const hourCounts = {};
        const uniqueTutorsSet = new Set();
        const uniqueStudentsSet = new Set();

        bookedSlots.forEach((slot) => {
            const dt = buildDateTime(slot.date, slot.startTime);
            if (!withinRange(dt, startDate, endDate)) return;

            const tutor = slot.tutorId;
            const student = slot.studentId;
            const tutorId =
                tutor && tutor._id ? String(tutor._id) : tutor ? String(tutor) : null;
            const studentId =
                student && student._id
                    ? String(student._id)
                    : student
                        ? String(student)
                        : null;

            if (tutorId) uniqueTutorsSet.add(tutorId);
            if (studentId) uniqueStudentsSet.add(studentId);

            const dtEnd = buildDateTime(slot.date, slot.endTime);

            let durationMin = 0;
            if (dt && dtEnd && dtEnd > dt) {
                durationMin = (dtEnd - dt) / 60000;
            }

            // tutor aggregation
            if (tutorId) {
                let agg = tutorMap.get(tutorId);
                if (!agg) {
                    agg = {
                        tutorId,
                        tutorName: tutor?.name || "Unknown Tutor",
                        tutorEmail: tutor?.email || "",
                        totalSessions: 0,
                        totalMinutes: 0,
                        studentsSet: new Set(),
                    };
                    tutorMap.set(tutorId, agg);
                }

                agg.totalSessions += 1;
                agg.totalMinutes += durationMin;
                if (studentId) agg.studentsSet.add(studentId);
            }

            if (dt) {
                const dayKey = dt.toLocaleDateString("en-US", { weekday: "long" });
                dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;

                const hourKey = `${String(dt.getHours()).padStart(2, "0")}:00`;
                hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
            }
        });

        // Sort slots by start time (newest first) for preview
        const sortedSlots = [...bookedSlots].sort((a, b) => {
            const dtA = buildDateTime(a.date, a.startTime) || new Date(0);
            const dtB = buildDateTime(b.date, b.startTime) || new Date(0);
            return dtB - dtA; // newest first
        });

        // Take up to 10 recent center sessions for inline preview
        const centerPreview = sortedSlots.slice(0, 10).map((slot, index) => {
            const tutor = slot.tutorId;
            const student = slot.studentId;
            const checkIn = buildDateTime(slot.date, slot.startTime);
            const checkOut = buildDateTime(slot.date, slot.endTime);

            let durationMin = "";
            if (checkIn && checkOut && checkOut > checkIn) {
                durationMin = Math.round((checkOut - checkIn) / 60000);
            }

            return {
                rowNumber: index + 1,
                tutorName: tutor?.name || "",
                tutorEmail: tutor?.email || "",
                studentName: student?.name || "",
                studentEmail: student?.email || "",
                checkIn,
                checkOut,
                durationMin,
            };
        });

        const tutorStats = Array.from(tutorMap.values()).map((agg) => ({
            tutorId: agg.tutorId,
            tutorName: agg.tutorName,
            tutorEmail: agg.tutorEmail,
            totalSessions: agg.totalSessions,
            totalStudents: agg.studentsSet.size,
            totalMinutes: Math.round(agg.totalMinutes),
            avgSessionMinutes:
                agg.totalSessions > 0
                    ? Number((agg.totalMinutes / agg.totalSessions).toFixed(1))
                    : 0,
        }));

        const busiestDay = findMaxKey(dayCounts) || null;
        const busiestHour = findMaxKey(hourCounts) || null;

        const summary = {
            totalStudents,
            totalVisits,
            totalMinutes: Math.round(totalMinutes),
            avgVisitMinutes,
            dateRange: {
                start: earliestCheckIn,
                end: latestCheckOut,
            },
            totalUniqueTutors: uniqueTutorsSet.size,
            totalUniqueStudents: uniqueStudentsSet.size,
            busiestDay,
            busiestHour,
        };

        return res.json({
            message: "Reports overview loaded successfully",
            generatedAt: new Date().toISOString(),
            user: {
                email: req.user.email,
                role: req.user.role,
            },
            summary,
            tutorStats,
            centerPreview,
        });
    } catch (err) {
        console.error("Reports overview error:", err);
        return res
            .status(500)
            .json({ message: "Error loading reports overview" });
    }
};

// ---------- GET /api/reports/center-csv ----------
// BugHouse Center report CSV (summary + raw attendance)
exports.downloadCenterCsv = async (req, res) => {
    try {
        if (req.user.role !== "Admin" && req.user.role !== "SysAdmin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { startDate, endDate } = parseDateRange(req.query);

        // Use booked slots as "center attendance"
        const slots = await Slot.find({ isBooked: true })
            .select("date startTime endTime subjects studentId tutorId")
            .populate("studentId", "name email")
            .populate("tutorId", "name email")
            .lean();

        const dayCounts = {};
        const hourCounts = {};
        const uniqueTutorsSet = new Set();
        const uniqueStudentsSet = new Set();

        let totalMinutes = 0;

        const studentVisitCounters = {}; // for Visit # per student
        const rows = [];

        const sortedSlots = [...slots].sort((a, b) => {
            const dtA = buildDateTime(a.date, a.startTime) || new Date(0);
            const dtB = buildDateTime(b.date, b.startTime) || new Date(0);
            return dtA - dtB;
        });

        sortedSlots.forEach((slot) => {
            const checkIn = buildDateTime(slot.date, slot.startTime);
            if (!withinRange(checkIn, startDate, endDate)) return;

            const tutor = slot.tutorId;
            const student = slot.studentId;

            const tutorName = tutor?.name || "";
            const tutorEmail = tutor?.email || "";
            const studentName = student?.name || "";
            const studentEmail = student?.email || "";

            const tutorId =
                tutor && tutor._id ? String(tutor._id) : tutor ? String(tutor) : null;
            const studentId =
                student && student._id
                    ? String(student._id)
                    : student
                        ? String(student)
                        : null;

            if (tutorId) uniqueTutorsSet.add(tutorId);
            if (studentId) uniqueStudentsSet.add(studentId);

            const checkOut = buildDateTime(slot.date, slot.endTime);

            let durationMin = "";
            if (checkIn && checkOut && checkOut > checkIn) {
                durationMin = (checkOut - checkIn) / 60000;
                totalMinutes += durationMin;
            }

            if (checkIn) {
                const dayKey = checkIn.toLocaleDateString("en-US", {
                    weekday: "long",
                });
                dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;

                const hourKey = `${String(checkIn.getHours()).padStart(2, "0")}:00`;
                hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
            }

            let visitNumber = "";
            if (studentId) {
                const current = studentVisitCounters[studentId] || 0;
                const next = current + 1;
                studentVisitCounters[studentId] = next;
                visitNumber = next;
            }

            const status = checkOut ? "Completed" : "In Progress";

            rows.push([
                tutorName,
                tutorEmail,
                studentName,
                studentEmail,
                visitNumber,
                checkIn ? checkIn.toISOString() : "",
                checkOut ? checkOut.toISOString() : "",
                durationMin !== "" ? Math.round(durationMin) : "",
                status,
            ]);
        });

        const busiestDay = findMaxKey(dayCounts) || "";
        const busiestHour = findMaxKey(hourCounts) || "";

        const totalVisits = rows.length;
        const avgVisitMinutes =
            totalVisits > 0 ? Number((totalMinutes / totalVisits).toFixed(1)) : 0;
        const totalHoursTutored = Number((totalMinutes / 60).toFixed(2));

        // Build CSV
        const headerRows = [
            ["BugHouse Center Report"],
            ["Generated At", new Date().toISOString()],
            ["Filtered Start", startDate ? startDate.toISOString() : ""],
            ["Filtered End", endDate ? endDate.toISOString() : ""],
            [],
            ["Total Visits", totalVisits],
            ["Total Unique Tutors", uniqueTutorsSet.size],
            ["Total Unique Students", uniqueStudentsSet.size],
            ["Total Hours Tutored", totalHoursTutored],
            ["Average Visit Duration (mins)", avgVisitMinutes],
            ["Busiest Day", busiestDay],
            ["Busiest Hour", busiestHour],
            [],
            [
                "Tutor Name",
                "Tutor Email",
                "Student Name",
                "Student Email",
                "Visit #",
                "Check-In Time",
                "Check-Out Time",
                "Duration (mins)",
                "Status",
            ],
        ];

        const csvString = toCsv(headerRows.concat(rows));

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="bughouse_center_report.csv"'
        );
        return res.status(200).send(csvString);
    } catch (err) {
        console.error("downloadCenterCsv error:", err);
        return res
            .status(500)
            .json({ message: "Failed to generate center CSV report" });
    }
};

// ---------- GET /api/reports/tutor-csv/:tutorId ----------
// Individual tutor report CSV (summary + visits)
exports.downloadTutorCsv = async (req, res) => {
    try {
        if (req.user.role !== "Admin" && req.user.role !== "SysAdmin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { startDate, endDate } = parseDateRange(req.query);
        const { tutorId } = req.params;

        const tutor = await User.findById(tutorId)
            .select("name email")
            .lean()
            .catch(() => null);

        const tutorName = tutor?.name || "Unknown Tutor";
        const tutorEmail = tutor?.email || "";

        const slots = await Slot.find({ tutorId, isBooked: true })
            .select("date startTime endTime subjects studentId")
            .populate("studentId", "name email")
            .lean();

        if (!slots.length) {
            const emptyRows = [
                ["Tutor Report"],
                ["Tutor Name", tutorName],
                ["Tutor Email", tutorEmail],
                [],
                ["Total Visits", 0],
            ];
            const csvString = toCsv(emptyRows);

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="tutor_report_${tutorId}.csv"`
            );
            return res.status(200).send(csvString);
        }

        let totalMinutes = 0;
        let earliestCheckIn = null;
        let latestCheckOut = null;
        const dayCounts = {};

        const rows = [];

        const sortedSlots = [...slots].sort((a, b) => {
            const dtA = buildDateTime(a.date, a.startTime) || new Date(0);
            const dtB = buildDateTime(b.date, b.startTime) || new Date(0);
            return dtA - dtB;
        });

        let visitIndex = 0;

        sortedSlots.forEach((slot) => {
            const checkIn = buildDateTime(slot.date, slot.startTime);
            if (!withinRange(checkIn, startDate, endDate)) return;

            visitIndex += 1;
            const visitNumber = visitIndex;

            const student = slot.studentId;
            const studentName = student?.name || "";
            const studentEmail = student?.email || "";

            const checkOut = buildDateTime(slot.date, slot.endTime);

            let durationMin = "";
            if (checkIn && checkOut && checkOut > checkIn) {
                durationMin = (checkOut - checkIn) / 60000;
                totalMinutes += durationMin;
            }

            if (checkIn) {
                if (!earliestCheckIn || checkIn < earliestCheckIn) {
                    earliestCheckIn = checkIn;
                }
                const dayKey = checkIn.toLocaleDateString("en-US", {
                    weekday: "long",
                });
                dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
            }

            if (checkOut) {
                if (!latestCheckOut || checkOut > latestCheckOut) {
                    latestCheckOut = checkOut;
                }
            }

            const dayOfWeek = checkIn
                ? checkIn.toLocaleDateString("en-US", { weekday: "long" })
                : "";

            rows.push([
                visitNumber,
                checkIn ? checkIn.toISOString() : "",
                checkOut ? checkOut.toISOString() : "",
                durationMin !== "" ? Math.round(durationMin) : "",
                dayOfWeek,
                studentName,
                studentEmail,
                (slot.subjects || []).join("; "),
            ]);
        });

        const totalVisits = rows.length;
        const avgVisitMinutes =
            totalVisits > 0 ? Number((totalMinutes / totalVisits).toFixed(1)) : 0;
        const totalHoursTutored = Number((totalMinutes / 60).toFixed(2));
        const busiestDay = findMaxKey(dayCounts) || "";
        const dateRangeText =
            earliestCheckIn && latestCheckOut
                ? `${earliestCheckIn.toISOString()} → ${latestCheckOut.toISOString()}`
                : "";

        const lastVisit =
            latestCheckOut ||
            (sortedSlots.length &&
                buildDateTime(
                    sortedSlots[sortedSlots.length - 1].date,
                    sortedSlots[sortedSlots.length - 1].startTime
                ));

        const headerRows = [
            ["Tutor Report"],
            ["Tutor Name", tutorName],
            ["Tutor Email", tutorEmail],
            [],
            ["Filtered Start", startDate ? startDate.toISOString() : ""],
            ["Filtered End", endDate ? endDate.toISOString() : ""],
            ["Date Range (actual data)", dateRangeText],
            ["Total Visits", totalVisits],
            ["Total Hours Tutored", totalHoursTutored],
            ["Average Visit Duration (mins)", avgVisitMinutes],
            ["Busiest Day", busiestDay],
            ["Last Visit", lastVisit ? lastVisit.toISOString() : ""],
            [],
            [
                "Visit #",
                "Check-In Time",
                "Check-Out Time",
                "Duration (mins)",
                "Day of Week",
                "Student Name",
                "Student Email",
                "Subjects",
            ],
        ];

        const csvString = toCsv(headerRows.concat(rows));

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="tutor_report_${tutorId}.csv"`
        );
        return res.status(200).send(csvString);
    } catch (err) {
        console.error("downloadTutorCsv error:", err);
        return res
            .status(500)
            .json({ message: "Failed to generate tutor CSV report" });
    }
};
