// frontend/src/components/ReportsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ReportsPage.css";

const ReportsPage = () => {
    const [data, setData] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(true);
    const [downloadingCenter, setDownloadingCenter] = useState(false);
    const [downloadingTutorId, setDownloadingTutorId] = useState(null);

    const token = localStorage.getItem("firebase_token");

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const res = await axios.get("/api/reports/overview", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setData(res.data);
            } catch (err) {
                console.error("Error loading reports overview:", err);
                const msg =
                    err.response?.data?.message || "Failed to load reports.";
                setErrorMsg(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [token]);

    const summary = data?.summary || {};
    const tutorStats = data?.tutorStats || [];

    // ===== CSV download helpers =====
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
            const res = await axios.get("/api/reports/center-csv", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

            const res = await axios.get(
                `/api/reports/tutor-csv/${tutor.tutorId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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

    return (
        <div className="reports-page">
            <div className="reports-layout">
                {/* LEFT: Overview + tutor stats card */}
                <div className="reports-card">
                    <h2 className="reports-title">Attendance Reports</h2>

                    {/* Top-level actions */}
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

                    {errorMsg && <p className="reports-error">{errorMsg}</p>}

                    {!errorMsg && loading && (
                        <p className="reports-loading">Loading reports...</p>
                    )}

                    {!loading && !errorMsg && data && (
                        <>
                            {/* ===== Overall summary (existing card) ===== */}
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
                                    <strong>Date Range:</strong>{" "}
                                    {summary.dateRange?.start
                                        ? new Date(summary.dateRange.start).toLocaleDateString()
                                        : "—"}{" "}
                                    →{" "}
                                    {summary.dateRange?.end
                                        ? new Date(summary.dateRange.end).toLocaleDateString()
                                        : "—"}
                                </p>
                            </div>

                            {/* ===== Per-tutor stats section ===== */}
                            <div className="tutors-section">
                                <h3 className="tutors-title">Tutor Stats</h3>

                                {tutorStats.length === 0 ? (
                                    <p className="tutors-empty">
                                        No tutor data available yet.
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
                                                            ? "Downloading Tutor CSV..."
                                                            : "Download Tutor Report (CSV)"}
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

                {/* RIGHT side is currently empty – reserved for future charts */}
                <div className="reports-charts">
                    {/* Intentionally blank for now */}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
