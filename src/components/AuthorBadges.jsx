import React, { useRef, useState, useEffect } from "react";
import AuthorLayout from "./AuthorLayout";
import "./AuthorBadges.css";
import { FiDownload } from "react-icons/fi";
import { FaQrcode } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import { Link } from "react-router-dom";

const AuthorBadges = () => {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");
    const badgeRef = useRef(null);

    const [attestations, setAttestations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttestation, setSelectedAttestation] = useState(null);

    useEffect(() => {
        const fetchAttestations = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                // Fetch list of generated attestations
                const res = await axios.get("/api/attestations/me/list", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAttestations(res.data);
                if (res.data.length > 0) {
                    setSelectedAttestation(res.data[0]);
                }
            } catch (err) {
                console.error("Error fetching attestations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttestations();
    }, [token]);

    const handleDownloadPDF = async () => {
        if (!badgeRef.current) return;

        try {
            const canvas = await html2canvas(badgeRef.current, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`medeventa-badge-${selectedAttestation?.type || 'doc'}.pdf`);
        } catch (err) {
            console.error("PDF generation failed", err);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    return (
        <AuthorLayout>
            <div className="ab-container">
                <div className="ab-header">
                    <h1>Badges & Attestations</h1>
                    <p>Download and print your event credentials.</p>
                </div>

                <div className="ab-layout">
                    <div>
                        <div className="ab-selection-card">
                            <div className="ab-card-title">My Certifications</div>

                            {loading ? (
                                <p>Loading...</p>
                            ) : attestations.length === 0 ? (
                                <p className="ab-no-data">No certifications available yet.</p>
                            ) : (
                                <div className="ab-comm-list">
                                    {attestations.map((att) => (
                                        <div
                                            key={att.id}
                                            className={`ab-comm-item ${selectedAttestation?.id === att.id ? 'active' : ''}`}
                                            onClick={() => setSelectedAttestation(att)}
                                        >
                                            <div className="ab-comm-title">{att.event_title || `Event #${att.evenement_id}`}</div>
                                            <div className="ab-comm-author">{att.type}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback Display if no data but user wants to see badge preview */}
                            {attestations.length === 0 && (
                                <div className="ab-comm-item active" style={{ marginTop: '10px', opacity: 0.5 }}>
                                    <div className="ab-comm-title">Preview Badge</div>
                                    <div className="ab-comm-author">Example Event</div>
                                </div>
                            )}
                        </div>

                        <div className="ab-info-card">
                            <div className="ab-info-title">Quick Tip</div>
                            <div className="ab-info-text">
                                Ensure your affiliation is correct before printing. You can update your profile in the settings tab. For attestations, names are generated exactly as entered in the submission form.
                            </div>
                            <Link to="/profile/edit" className="ab-update-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                                Update Profile
                            </Link>
                        </div>
                    </div>

                    <div className="ab-badge-preview">
                        <div className="badge-frame" ref={badgeRef}>
                            <div className="badge-header">
                                <div className="badge-logo">MEDEVENTA</div>
                            </div>
                            <div className="badge-body">
                                {/* Placeholder image if user photo not available */}
                                <img
                                    src={user?.photo || user?.photoUrl || "https://via.placeholder.com/150"}
                                    alt="Profile"
                                    className="badge-photo"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                                <div className="badge-name">{user ? `${user.nom} ${user.prenom}` : "Dr. Name"}</div>
                                <div className="badge-role">{selectedAttestation?.type || "PARTICIPANT"}</div>

                                <div className="badge-inst">INSTITUTION</div>
                                <div className="badge-inst-name">{user?.institution || "Medical Institution"}</div>

                                <div className="badge-qr">
                                    <FaQrcode />
                                </div>
                                <div className="badge-id">ID: {selectedAttestation?.unique_code || "PENDING"}</div>
                            </div>
                        </div>

                        <div className="ab-download-actions">
                            <button className="ab-download-btn" onClick={handleDownloadPDF}>
                                <FiDownload /> Download Badge PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthorLayout>
    );
};

export default AuthorBadges;
