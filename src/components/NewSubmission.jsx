import React, { useState, useEffect } from "react";
import AuthorLayout from "./AuthorLayout";
import "./NewSubmission.css";
import { FiPlus, FiUploadCloud } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Notification from "./Notification";

const NewSubmission = () => {
    const navigate = useNavigate();
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [notify, setNotify] = useState({ message: "", type: "" });

    const [formData, setFormData] = useState({
        title: "",
        abstract: "",
        type: "oral", // default
        file: null,
        fileName: "",
        authors: [
            {
                fullName: user ? `${user.nom || ''} ${user.prenom || ''}`.trim() || user.name : "",
                affiliation: user && user.institution ? user.institution : "",
                email: user && user.email ? user.email : "",
                isSpeaker: true,
            },
        ],
    });

    const [submitting, setSubmitting] = useState(false);

    // Fetch Events for dropdown
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get("/api/events");
                if (res.data) {
                    setEvents(res.data);
                    // Default to first event if available
                    if (res.data.length > 0) {
                        setSelectedEventId(res.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch events", err);
            }
        };
        fetchEvents();
    }, []);

    const showNotify = (message, type = "success") => {
        setNotify({ message, type });
    };

    const closeNotify = () => {
        setNotify({ message: "", type: "" });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, file: file, fileName: file.name }));
        }
    };

    const handleAuthorChange = (index, field, value) => {
        const newAuthors = [...formData.authors];
        newAuthors[index][field] = value;
        setFormData((prev) => ({
            ...prev,
            authors: newAuthors,
        }));
    };

    const handleSpeakerToggle = (index) => {
        const newAuthors = formData.authors.map((author, i) => ({
            ...author,
            isSpeaker: i === index,
        }));
        setFormData((prev) => ({ ...prev, authors: newAuthors }));
    };

    const addAuthor = () => {
        setFormData((prev) => ({
            ...prev,
            authors: [
                ...prev.authors,
                { fullName: "", affiliation: "", email: "", isSpeaker: false },
            ],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        closeNotify();

        if (!selectedEventId) {
            showNotify("Please select an event to submit to.", "error");
            setSubmitting(false);
            return;
        }

        if (!formData.file) {
            showNotify("Please upload the abstract PDF.", "error");
            setSubmitting(false);
            return;
        }

        try {
            const payload = new FormData();
            payload.append("titre", formData.title);
            payload.append("resume", formData.abstract); // We map abstract text to 'resume'
            payload.append("type", formData.type);
            payload.append("resumePdf", formData.file); // 'resumePdf' is key expected by backend

            // Note: Backend might not support multiple authors in the DB relational model yet,
            // but we are sending the core submission data. 
            // Authors might be expected to be IN the PDF or stringified in resume?
            // For now, we stick to the required backend fields.

            if (token) {
                await axios.post(`/api/events/${selectedEventId}/submissions`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                showNotify("Abstract submitted successfully!", "success");
                setTimeout(() => navigate("/author/dashboard"), 2000);
            } else {
                showNotify("You must be logged in.", "error");
            }

        } catch (error) {
            console.error("Submission failed", error);
            const msg = error.response?.data?.message || "Failed to submit abstract.";
            showNotify(msg, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthorLayout>
            <div className="ns-container">
                <Notification message={notify.message} type={notify.type} onClose={closeNotify} />
                <div className="ns-header">
                    <h1>Submit Abstract</h1>
                    <p>Fill in the details for your scientific communication.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Event Selection */}
                    <div className="ns-card">
                        <div className="ns-form-group">
                            <label className="ns-label">Select Event</label>
                            <select
                                className="ns-input"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                                {events.length === 0 && <option value="">Loading events...</option>}
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Section 1: details */}
                    <div className="ns-card">
                        <div className="ns-section-header">
                            <div className="ns-step-badge">1</div>
                            <div className="ns-section-title">Communication Details</div>
                        </div>

                        <div className="ns-form-group">
                            <label className="ns-label">Title of Communication</label>
                            <input
                                type="text"
                                name="title"
                                className="ns-input"
                                placeholder="Enter a descriptive title..."
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="ns-form-group">
                            <label className="ns-label">Type</label>
                            <select
                                name="type"
                                className="ns-input"
                                value={formData.type}
                                onChange={handleInputChange}
                            >
                                <option value="oral">Oral Communication</option>
                                <option value="poster">Poster</option>
                                <option value="workshop">Workshop</option>
                            </select>
                        </div>

                        <div className="ns-form-group">
                            <label className="ns-label">Abstract Text (Summary)</label>
                            <textarea
                                name="abstract"
                                className="ns-textarea"
                                placeholder="Summarize your research, findings, and conclusions..."
                                value={formData.abstract}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="ns-form-group">
                            <label className="ns-label">Upload Abstract PDF</label>
                            <div className="file-upload-wrapper" style={{ border: '2px dashed #e2e8f0', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                                <div style={{ pointerEvents: 'none' }}>
                                    <FiUploadCloud size={24} color="#64748b" />
                                    <p style={{ margin: '8px 0 0', color: '#64748b' }}>
                                        {formData.fileName ? formData.fileName : "Click or drag PDF here"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Authors */}
                    <div className="ns-card">
                        <div className="ns-section-header">
                            <div className="ns-step-badge">2</div>
                            <div className="ns-section-title">Authors & Affiliations</div>
                            <div className="ns-section-actions">
                                <button type="button" className="ns-add-btn" onClick={addAuthor}>
                                    <FiPlus /> Add Author
                                </button>
                            </div>
                        </div>

                        {formData.authors.map((author, index) => (
                            <div key={index} style={{ marginBottom: "2rem", borderBottom: index < formData.authors.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: index < formData.authors.length - 1 ? "2rem" : "0" }}>
                                <div className="ns-grid-2">
                                    <div className="ns-form-group">
                                        <label className="ns-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="ns-input"
                                            value={author.fullName}
                                            onChange={(e) => handleAuthorChange(index, "fullName", e.target.value)}
                                            placeholder="Dr. John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="ns-form-group">
                                        <label className="ns-label">Institution / Affiliation</label>
                                        <input
                                            type="text"
                                            className="ns-input"
                                            value={author.affiliation}
                                            onChange={(e) => handleAuthorChange(index, "affiliation", e.target.value)}
                                            placeholder="University Hospital..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="ns-grid-2">
                                    <div className="ns-form-group">
                                        <label className="ns-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="ns-input"
                                            value={author.email}
                                            onChange={(e) => handleAuthorChange(index, "email", e.target.value)}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="ns-form-group" style={{ display: "flex", alignItems: "flex-end", height: "100%", paddingBottom: "10px" }}>
                                        <div className="ns-checkbox-group" onClick={() => handleSpeakerToggle(index)}>
                                            <input
                                                type="checkbox"
                                                className="ns-checkbox"
                                                checked={author.isSpeaker}
                                                onChange={() => handleSpeakerToggle(index)}
                                            />
                                            <span className="ns-checkbox-label">Designated Speaker for this session</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="ns-footer">
                        <button type="button" className="ns-btn-secondary" onClick={() => navigate("/author/dashboard")}>
                            Cancel
                        </button>
                        <button type="submit" className="ns-btn-primary" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit for Review"}
                        </button>
                    </div>
                </form>
            </div>
        </AuthorLayout>
    );
};

export default NewSubmission;
