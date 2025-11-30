// frontend/src/components/ReportsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ReportsPage.css";

const ReportsPage = () => {
    const [data, setData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(true);

    // Date range (YYYY-MM-DD strings)
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Download state
    const [downloadingCenter, setDownloadingCenter] = useState(false);
    const [downloadingTutorId, setDownloadingTutorId] = useState(null);

    const token = localStorage.getItem("firebase_token");

    // ----- Fetch overview (optionally with date range) -----
    const fetchOverview = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const params = {};
            if (startDate && endDate) {
                params.start = startDate;
                params.end = endDate;
            }

            const res = await axios.get("/api/reports/overview", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
            });

            setData(res.data);
        } catch (err) {
            console.error("Error loading reports overview:", err);
            const msg = err.response?.data?.message || "Failed to load reports.";
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    // Initial load (no date filter)
    useEffect(() => {
        fetchOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const summary = data?.summary || {};
    const tutorStats = data?.tutorStats || [];
    const centerPreview = data?.centerPreview || [];


    // ----- CSV download helpers -----
    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadCenterReport = async () => {
        try {
            setDownloadingCenter(true);

            const params = {};
            if (startDate && endDate) {
                params.start = startDate;
                params.end = endDate;
            }

            const res = await axios.get("/api/reports/center-csv", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params,
                responseType: "blob", // important for file download
            });

            const blob = new Blob([res.data], {
                type: "text/csv;charset=utf-8;",
            });
            downloadBlob(blob, "bughouse-center-report.csv");
        } catch (err) {
            console.error("Error downloading center report:", err);
            alert("Failed to download center report.");
        } finally {
            setDownloadingCenter(false);
        }
    };

    const handleDownloadTutorReport = async (tutor) => {
        if (!tutor?.tutorId) return;

        try {
            setDownloadingTutorId(tutor.tutorId);

            const params = {};
            if (startDate && endDate) {
                params.start = startDate;
                params.end = endDate;
            }

            const res = await axios.get(
                `/api/reports/tutor-csv/${tutor.tutorId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params,
                    responseType: "blob",
                }
            );

            const safeName =
                (tutor.tutorName || "tutor")
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, "") || "tutor";

            const blob = new Blob([res.data], {
                type: "text/csv;charset=utf-8;",
            });
            downloadBlob(blob, `tutor-report-${safeName}.csv`);
        } catch (err) {
            console.error("Error downloading tutor report:", err);
            alert("Failed to download tutor report.");
        } finally {
            setDownloadingTutorId(null);
        }
    };

    const handleApplyDateRange = () => {
        // Only apply if both dates set; otherwise we just refetch full range
        fetchOverview();
    };

    const handleResetDateRange = () => {
        // Clear any local date input state
        if (setStartDate) setStartDate("");
        if (setEndDate) setEndDate("");

        // Re-fetch default overview (backend defaults to current month)
        if (typeof fetchOverview === "function") {
            fetchOverview(); // if you have it extracted
        } else {
            // Fallback: reload the page-level data the same way as initial load
            setLoading(true);
            axios
                .get("/api/reports/overview", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    setData(res.data);
                    setErrorMsg("");
                })
                .catch((err) => {
                    console.error("Error resetting reports overview:", err);
                    const msg =
                        err.response?.data?.message ||
                        "Failed to reset date range.";
                    setErrorMsg(msg);
                })
                .finally(() => setLoading(false));
        }
    };


    return (
        <div className="reports-page">
            {/* MAIN CARD */}
            <div className="reports-card">
                <h2 className="reports-title">Attendance Reports</h2>

                {/* Date range picker + actions */}
                <div className="reports-filter-row">
                    <div className="reports-date-filter">
                        <label>
                            Start:
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>
                        <label>
                            End:
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>
                        <button
                            className="reports-apply-btn"
                            onClick={handleApplyDateRange}
                            disabled={loading}
                        >
                            Apply
                        </button>

                        <button
                            className="reports-reset-btn"
                            onClick={handleResetDateRange}
                            disabled={loading}
                        >
                            Reset to Current Month
                        </button>
                    </div>

                    <div className="reports-actions">
                        <button
                            className="reports-download-btn"
                            onClick={handleDownloadCenterReport}
                            disabled={downloadingCenter || loading || !!errorMsg}
                        >
                            {downloadingCenter
                                ? "Downloading Center Report..."
                                : "Download Center Report (CSV)"}
                        </button>
                    </div>
                </div>

                {errorMsg && <p className="reports-error">{errorMsg}</p>}

                {!errorMsg && loading && (
                    <p className="reports-loading">Loading reports...</p>
                )}

                {!loading && !errorMsg && data && (
                    <>
                        {/* ===== Overall summary ===== */}
                        <div className="reports-meta">
                            <p>
                                <strong>Generated:</strong>{" "}
                                {new Date(data.generatedAt).toLocaleString()}
                            </p>
                            <p>
                                <strong>Viewing as:</strong>{" "}
                                {data.user?.email} ({data.user?.role})
                            </p>
                        </div>

                        <div className="reports-summary-grid">
                            <div className="reports-summary-item">
                                <span className="label">Total Students</span>
                                <span className="value">
                                    {summary.totalStudents ?? 0}
                                </span>
                            </div>

                            <div className="reports-summary-item">
                                <span className="label">Total Visits</span>
                                <span className="value">
                                    {summary.totalVisits ?? 0}
                                </span>
                            </div>

                            <div className="reports-summary-item">
                                <span className="label">Total Minutes</span>
                                <span className="value">
                                    {summary.totalMinutes
                                        ? Math.round(summary.totalMinutes)
                                        : 0}
                                </span>
                            </div>

                            <div className="reports-summary-item">
                                <span className="label">Avg Visit (min)</span>
                                <span className="value">
                                    {summary.avgVisitMinutes ?? 0}
                                </span>
                            </div>
                        </div>

                        <div className="reports-daterange">
                            <p>
                                <strong>Date Range (data):</strong>{" "}
                                {summary.dateRange?.start
                                    ? new Date(
                                        summary.dateRange.start
                                    ).toLocaleDateString()
                                    : "—"}{" "}
                                →{" "}
                                {summary.dateRange?.end
                                    ? new Date(
                                        summary.dateRange.end
                                    ).toLocaleDateString()
                                    : "—"}
                            </p>
                        </div>

                        {/* ===== Per-tutor stats section ===== */}
                        <div className="tutors-section">
                            <h3 className="tutors-title">Tutor Stats</h3>

                            {tutorStats.length === 0 ? (
                                <p className="tutors-empty">
                                    No tutor data available for this range.
                                </p>
                            ) : (
                                <div className="tutors-table">
                                    <div className="tutors-header-row">
                                        <span className="tutor-col tutor-main">Tutor</span>
                                        <span className="tutor-col">Sessions</span>
                                        <span className="tutor-col">Unique Students</span>
                                        <span className="tutor-col">Total Minutes</span>
                                        <span className="tutor-col">Avg Session (min)</span>
                                        <span className="tutor-col">Actions</span>
                                    </div>

                                    {tutorStats.map((tutor) => (
                                        <div
                                            key={tutor.tutorId}
                                            className="tutors-row"
                                        >
                                            <span className="tutor-col tutor-main">
                                                <span className="tutor-name">
                                                    {tutor.tutorName || "Unknown Tutor"}
                                                </span>
                                                {tutor.tutorEmail && (
                                                    <span className="tutor-email">
                                                        {tutor.tutorEmail}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="tutor-col">
                                                {tutor.totalSessions ?? 0}
                                            </span>
                                            <span className="tutor-col">
                                                {tutor.totalStudents ?? 0}
                                            </span>
                                            <span className="tutor-col">
                                                {tutor.totalMinutes ?? 0}
                                            </span>
                                            <span className="tutor-col">
                                                {tutor.avgSessionMinutes ?? 0}
                                            </span>
                                            <span className="tutor-col">
                                                <button
                                                    className="tutor-download-btn"
                                                    onClick={() =>
                                                        handleDownloadTutorReport(tutor)
                                                    }
                                                    disabled={
                                                        downloadingTutorId === tutor.tutorId
                                                    }
                                                >
                                                    {downloadingTutorId === tutor.tutorId
                                                        ? "Downloading..."
                                                        : "Download Tutor Report CSV"}
                                                </button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="reports-footer-note">
                            CSV exports are compatible with Excel and Google Sheets.
                        </div>
                    </>
                )}
            </div>

            {/* RECENT CENTER ATTENDANCE CARD BELOW MAIN CARD */}
            {!loading && !errorMsg && centerPreview.length > 0 && (
                <div className="reports-recent-card">
                    <h3 className="recent-title">Recent Center Attendance</h3>
                    <p className="recent-subtitle">
                        Last {centerPreview.length} visits{" "}
                        <span className="recent-unfiltered-note">
                            (unfiltered – shown regardless of selected date range)
                        </span>
                    </p>

                    <div className="recent-table">
                        <div className="recent-row recent-header-row">
                            <span>Tutor</span>
                            <span>Student</span>
                            <span>Check-In</span>
                            <span>Check-Out</span>
                            <span>Duration (mins)</span>
                            <span>Status</span>
                        </div>

                        {centerPreview.map((v, idx) => (
                            <div className="recent-row" key={idx}>
                                <span>
                                    {v.tutorName || "—"}
                                    {v.tutorEmail && (
                                        <span className="recent-email">
                                            {v.tutorEmail}
                                        </span>
                                    )}
                                </span>
                                <span>
                                    {v.studentName || "—"}
                                    {v.studentEmail && (
                                        <span className="recent-email">
                                            {v.studentEmail}
                                        </span>
                                    )}
                                </span>
                                <span>
                                    {v.checkIn
                                        ? new Date(v.checkIn).toLocaleString()
                                        : "—"}
                                </span>
                                <span>
                                    {v.checkOut
                                        ? new Date(v.checkOut).toLocaleString()
                                        : "In progress"}
                                </span>
                                <span>
                                    {typeof v.durationMinutes === "number"
                                        ? Math.round(v.durationMinutes)
                                        : "—"}
                                </span>
                                <span>{v.status || "—"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );


};

export default ReportsPage;


