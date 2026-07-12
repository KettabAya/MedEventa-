import React, { useState, useEffect } from "react";
import AuthorLayout from "./AuthorLayout";
import "./AuthorProgramme.css";
import { FiCoffee, FiEdit2, FiEye, FiX } from "react-icons/fi"; // Added icons
import axios from "axios";

const AuthorProgramme = () => {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem("token");

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPresentation, setSelectedPresentation] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", abstract: "" });

    // Fetch Events and then Program
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Events
                const eventsRes = await axios.get("/api/events", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedEvents = eventsRes.data.events || [];
                setEvents(fetchedEvents);

                if (fetchedEvents.length > 0) {
                    const firstEvent = fetchedEvents[0];
                    setSelectedEventId(firstEvent.id);
                    await fetchProgram(firstEvent.id, firstEvent.date_debut);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [token]);

    const fetchProgram = async (eventId, date) => {
        try {
            // Detailed program requires a date. We'll use the event's start date as default.
            const formattedDate = date ? new Date(date).toISOString().split('T')[0] : "";
            const res = await axios.get(`/api/events/${eventId}/program/detailed`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { date: formattedDate }
            });

            if (res.data && res.data.sessions) {
                // Map backend sessions to frontend schedule format
                const mappedSchedule = res.data.sessions.map(session => ({
                    id: session.id,
                    time: session.horaire || "TBA",
                    title: session.titre || "Unnamed Session",
                    room: session.salle || "TBA",
                    type: "session",
                    presentations: (session.communications || []).map(comm => ({
                        id: comm.id,
                        title: comm.titre,
                        authors: "Speaker", // Backend logic might need more detail for authors
                        affiliation: "",
                        isMyPresentation: comm.auteur_id === user?.id,
                        abstractText: comm.resume || comm.abstractText || "",
                        type: comm.type
                    }))
                }));
                setSchedule(mappedSchedule);
            }
        } catch (err) {
            console.error("Failed to fetch program", err);
            setSchedule([]);
        }
    };

    const handleEventChange = (e) => {
        const id = e.target.value;
        setSelectedEventId(id);
        const selectedEvent = events.find(ev => ev.id.toString() === id);
        if (selectedEvent) {
            fetchProgram(id, selectedEvent.date_debut);
        }
    };

    const handleView = (pres) => {
        setSelectedPresentation(pres);
        setViewModalOpen(true);
    };

    const handleEdit = (pres) => {
        setSelectedPresentation(pres);
        setEditForm({
            title: pres.title,
            abstract: pres.abstractText || ""
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call real backend API to update
            await axios.put(`/api/events/submissions/${selectedPresentation.id}`,
                { titre: editForm.title, resume: editForm.abstract },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state for immediate feedback
            setSchedule(prev => prev.map(item => {
                if (item.presentations) {
                    return {
                        ...item,
                        presentations: item.presentations.map(p => {
                            if (p.id === selectedPresentation.id) {
                                return { ...p, title: editForm.title, abstractText: editForm.abstract };
                            }
                            return p;
                        })
                    };
                }
                return item;
            }));

            alert("Abstract updated successfully!");
            setEditModalOpen(false);
        } catch (err) {
            console.error("Update failed", err);
            alert(err.response?.data?.message || "Failed to update abstract.");
        }
    };

    const closeModal = () => {
        setViewModalOpen(false);
        setEditModalOpen(false);
        setSelectedPresentation(null);
    };

    return (
        <AuthorLayout>
            <div className="ap-container">
                <div className="ap-header">
                    <div className="ap-header-top">
                        <div>
                            <h1>Scientific Programme</h1>
                            <p>Browse the scheduled sessions and speakers.</p>
                        </div>
                        {events.length > 0 && (
                            <div className="ap-event-selector">
                                <label>Select Event: </label>
                                <select
                                    value={selectedEventId}
                                    onChange={handleEventChange}
                                    className="ap-select"
                                >
                                    {events.map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.titre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <p>Loading schedule...</p>
                ) : (
                    <div className="ap-timeline">
                        {schedule.map((item) => (
                            <React.Fragment key={item.id}>
                                {item.type === "break" ? (
                                    <div className="ap-break">
                                        <FiCoffee /> {item.title} ({item.time})
                                    </div>
                                ) : (
                                    <div className="ap-timeline-item">
                                        <div className="ap-time-marker"></div>
                                        <span className="ap-time-label">{item.time}</span>

                                        <div className="ap-session-card">
                                            <h3 className="ap-session-title">{item.title}</h3>
                                            <div className="ap-session-meta">{item.room}</div>

                                            {item.presentations && item.presentations.map(pres => (
                                                <div key={pres.id} className="ap-abstract-box">
                                                    <div>
                                                        <div className="ap-abstract-title">{pres.title}</div>
                                                        <div className="ap-authors">
                                                            {pres.authors} <span style={{ color: "#0f9d8a" }}>•</span> <span className="ap-affiliation">{pres.affiliation}</span>
                                                        </div>
                                                        {pres.isMyPresentation && <div style={{ fontSize: "0.75rem", color: "#0f9d8a", fontWeight: "bold", marginTop: "0.25rem" }}>YOUR PRESENTATION</div>}
                                                    </div>
                                                    <div className="ap-actions">
                                                        <button className="ap-view-btn" onClick={() => handleView(pres)}>
                                                            <FiEye /> View
                                                        </button>
                                                        {pres.isMyPresentation && ( // Show Edit only if it's mine
                                                            <button className="ap-edit-btn" onClick={() => handleEdit(pres)} style={{ marginLeft: "8px" }}>
                                                                <FiEdit2 /> Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}

                        <div className="ap-timeline-item">
                            <div className="ap-time-marker" style={{ background: "#cbd5e1", borderColor: "#f1f5f9" }}></div>
                            <span className="ap-time-label" style={{ color: "#94a3b8" }}>12:30 PM</span>
                            <div style={{ color: "#94a3b8", fontStyle: "italic", paddingLeft: "0.5rem" }}>End of morning sessions</div>
                        </div>
                    </div>
                )}

                {/* VIEW MODAL */}
                {viewModalOpen && selectedPresentation && (
                    <div className="modal-overlay">
                        <div className="modal-content review-modal">
                            <button className="modal-close" onClick={closeModal}><FiX /></button>
                            <h2>{selectedPresentation.title}</h2>
                            <p className="modal-meta" style={{ color: '#64748b', marginBottom: '1rem' }}>
                                {selectedPresentation.authors} — {selectedPresentation.affiliation}
                            </p>
                            <div className="modal-body">
                                <h4>Abstract</h4>
                                <p>{selectedPresentation.abstractText || "No abstract details available."}</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={closeModal}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
                {editModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content review-modal">
                            <button className="modal-close" onClick={closeModal}><FiX /></button>
                            <h2>Edit Abstract</h2>
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Abstract</label>
                                    <textarea
                                        rows={6}
                                        value={editForm.abstract}
                                        onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={closeModal} style={{ marginRight: '1rem' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ background: '#0f9d8a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .ap-header-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
                .ap-event-selector { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; }
                .ap-event-selector label { font-weight: 600; color: #64748b; font-size: 0.9rem; }
                .ap-select { padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; color: #1e293b; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
                .ap-select:focus { border-color: #0f9d8a; }
                .ap-actions { display: flex; align-items: center; }
                .ap-edit-btn { display: flex; align-items: center; gap: 4px; border: 1px solid #0f9d8a; background: white; color: #0f9d8a; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
                .ap-edit-btn:hover { background: #0f9d8a; color: white; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 600px; position: relative; max-height: 90vh; overflow-y: auto; }
                .modal-close { position: absolute; top: 1rem; right: 1rem; border: none; background: none; font-size: 1.5rem; cursor: pointer; }
            `}</style>
        </AuthorLayout>
    );
};

export default AuthorProgramme;
