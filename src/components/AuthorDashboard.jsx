import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthorLayout from "./AuthorLayout";
import "./AuthorDashboard.css";
import {
    FiCheckCircle,
    FiClock,
    FiEye,
    FiFileText,
    FiPlus
} from "react-icons/fi";
import axios from "axios";

const AuthorDashboard = () => {
    const navigate = useNavigate();
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");

    const [stats, setStats] = useState({
        accepted: 0,
        pending: 0,
        views: 0
    });
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Simulate API delay
                // await new Promise(resolve => setTimeout(resolve, 800));

                let fetchedStats = { accepted: 0, pending: 0, views: 0 };
                let fetchedSubmissions = [];

                if (token) {
                    try {
                        // Attempt to fetch real data
                        const [statsRes, subsRes] = await Promise.all([
                            axios.get("/api/author/stats", { headers: { Authorization: `Bearer ${token}` } }),
                            axios.get("/api/author/submissions", { headers: { Authorization: `Bearer ${token}` } })
                        ]);
                        fetchedStats = statsRes.data;
                        fetchedSubmissions = subsRes.data;
                    } catch (err) {
                        console.log("Backend endpoints not ready, using mock data for Author Dashboard.");
                        // Mock Data
                        fetchedStats = {
                            accepted: 1,
                            pending: 1,
                            views: 1200
                        };
                        fetchedSubmissions = [
                            {
                                id: 1,
                                title: "Advancements in Cardiovascular Robotics",
                                authors: "Dr. Sarah Connor, Dr. John Smith",
                                date: "2024-03-15",
                                status: "Accepted"
                            },
                            {
                                id: 2,
                                title: "Genomic Markers in Pediatric Oncology",
                                authors: "Prof. Elena Vance",
                                date: "2024-03-20",
                                status: "Pending"
                            }
                        ];
                    }
                }

                setStats(fetchedStats);
                setSubmissions(fetchedSubmissions);
            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const handleNewSubmission = () => {
        navigate("/author/new-submission");
    };

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case "accepted": return "ad-status-accepted";
            case "pending": return "ad-status-pending";
            case "rejected": return "ad-status-rejected";
            default: return "";
        }
    };

    return (
        <AuthorLayout>
            <div className="ad-inner">
                {/* Header */}
                <header className="ad-header">
                    <div>
                        <h1>Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
                        <p>Manage your scientific communications and event participation.</p>
                    </div>
                    <button className="pd-btn" onClick={handleNewSubmission} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <FiPlus /> Submit New Abstract
                    </button>
                </header>

                {/* Stats Cards */}
                <div className="ad-stats-summary">
                    <div className="ad-stat-card">
                        <div className="ad-stat-header">Accepted Papers</div>
                        <div className="ad-stat-value" style={{ color: "#0f9d8a" }}>
                            {loading ? "..." : stats.accepted}
                        </div>
                        <div className="ad-stat-icon"><FiCheckCircle /></div>
                    </div>

                    <div className="ad-stat-card">
                        <div className="ad-stat-header">Pending Review</div>
                        <div className="ad-stat-value" style={{ color: "#d97706" }}>
                            {loading ? "..." : stats.pending}
                        </div>
                        <div className="ad-stat-icon" style={{ color: "#d97706", background: "rgba(217, 119, 6, 0.1)" }}>
                            <FiClock />
                        </div>
                    </div>

                    <div className="ad-stat-card">
                        <div className="ad-stat-header">Total Views</div>
                        <div className="ad-stat-value" style={{ color: "#12324a" }}>
                            {loading ? "..." : (stats.views > 1000 ? (stats.views / 1000).toFixed(1) + "k" : stats.views)}
                        </div>
                        <div className="ad-stat-icon" style={{ color: "#12324a", background: "rgba(18, 50, 74, 0.1)" }}>
                            <FiEye />
                        </div>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="ad-submissions-section">
                    <div className="ad-section-title">
                        <FiFileText /> My Submissions
                    </div>

                    {loading ? (
                        <p>Loading submissions...</p>
                    ) : submissions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#6c8895" }}>
                            You haven't submitted any abstracts yet.
                        </div>
                    ) : (
                        <table className="ad-submissions-table">
                            <thead>
                                <tr>
                                    <th>Title & Authors</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="ad-submission-row">
                                        <td>
                                            <div className="ad-sub-title">{sub.title}</div>
                                            <div className="ad-sub-authors">{sub.authors}</div>
                                        </td>
                                        <td className="ad-sub-date">{sub.date}</td>
                                        <td>
                                            <span className={`ad-status-badge ${getStatusClass(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="ad-action-btn">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthorLayout>
    );
};

export default AuthorDashboard;
