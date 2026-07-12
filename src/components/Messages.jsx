import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaPaperPlane,
  FaInbox,
  FaSearch,
  FaFilter,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaUser,
  FaCalendar,
  FaEye,
} from "react-icons/fa";
import axios from "axios";
import "./Messages.css";

const Messages = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("inbox"); // "inbox" or "sent" or "compose"
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "unread", or eventId
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [composeError, setComposeError] = useState("");
  const [composeSuccess, setComposeSuccess] = useState(false);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipient_id: "",
    recipient_type: "user", // "user" or "role"
    event_id: "",
    subject: "",
    body: "",
  });

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Fetch inbox messages
  const fetchInboxMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = {};
      if (filter === "unread") {
        params.unread = "true";
      } else if (filter !== "all") {
        params.eventId = filter;
      }

      const response = await axios.get("/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sent messages
  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/messages/sent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSentMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching sent messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events for filter
  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend returns events with 'titre' field, map to 'nom' for consistency
      const eventsData = (response.data.events || []).map((event) => ({
        ...event,
        nom: event.titre || event.nom,
        name: event.titre || event.name,
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Fetch users for recipient selection
  const fetchUsers = async (eventId = null) => {
    if (!eventId) {
      setUsers([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const usersList = [];
      const userIds = new Set();

      // 1. Get Event Details (Organizer + Committee)
      try {
        const eventRes = await axios.get(`/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (eventRes.data) {
          const { event, comite } = eventRes.data;

          // Add Organizer
          if (event && event.id_organisateur && !userIds.has(event.id_organisateur)) {
            usersList.push({
              id: event.id_organisateur,
              nom: "Organisateur",
              prenom: "",
              email: event.contact || "",
              role: "ORGANISATEUR"
            });
            userIds.add(event.id_organisateur);
          }

          // Add Committee Members
          if (comite && Array.isArray(comite)) {
            comite.forEach(member => {
              if (!userIds.has(member.id)) {
                usersList.push({
                  id: member.id,
                  nom: member.nom,
                  prenom: member.prenom,
                  email: member.email,
                  role: "COMITE"
                });
                userIds.add(member.id);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching event members:", err);
      }

      // 2. Get Participants (Only if authorized)
      try {
        const partRes = await axios.get(`/api/inscriptions/event/${eventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (partRes.data && Array.isArray(partRes.data.participants)) {
          partRes.data.participants.forEach(p => {
            if (!userIds.has(p.utilisateurId)) {
              usersList.push({
                id: p.utilisateurId,
                nom: p.nom,
                prenom: p.prenom,
                email: p.email,
                role: p.profil
              });
              userIds.add(p.utilisateurId);
            }
          });
        }
      } catch (err) {
        // Silently ignore 403 as we might not have permission
        if (err.response?.status !== 403) {
          console.error("Error fetching participants:", err);
        }
      }

      setUsers(usersList);
    } catch (error) {
      console.error("Error in fetchUsers:", error);
    }
  };

  // Mark message as read
  const handleMarkAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/messages/${messageId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Update local state
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, lu: true } : m))
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, lu: true });
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Handle message click
  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    if (!message.lu && view === "inbox") {
      handleMarkAsRead(message.id);
    }
  };

  // Handle compose form change
  const handleComposeChange = (e) => {
    const { name, value } = e.target;
    setComposeForm((prev) => ({ ...prev, [name]: value }));
    setComposeError("");
  };

  // Handle compose submit
  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    setComposeError("");
    setComposeSuccess(false);

    if (!composeForm.recipient_id) {
      setComposeError("Please select a recipient");
      return;
    }

    if (!composeForm.body.trim()) {
      setComposeError("Message body cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/messages/send",
        {
          destinataire_id: parseInt(composeForm.recipient_id, 10),
          evenement_id: composeForm.event_id
            ? parseInt(composeForm.event_id, 10)
            : null,
          contenu: composeForm.body,
          type: composeForm.subject || "notif",
          sujet: composeForm.subject,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComposeSuccess(true);
      setComposeForm({
        recipient_id: "",
        recipient_type: "user",
        event_id: "",
        subject: "",
        body: "",
      });

      setTimeout(() => {
        setComposeSuccess(false);
        setView("inbox");
        fetchInboxMessages();
      }, 2000);
    } catch (error) {
      console.error("Error sending message:", error);
      setComposeError(
        error.response?.data?.message ||
        "Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and view change
  useEffect(() => {
    if (view === "inbox") {
      fetchInboxMessages();
      fetchEvents();
    } else if (view === "sent") {
      fetchSentMessages();
    } else if (view === "compose") {
      fetchUsers(composeForm.event_id || null);
      fetchEvents();
    }
  }, [view, filter]);

  // Fetch users when event changes in compose
  useEffect(() => {
    if (view === "compose") {
      fetchUsers(composeForm.event_id || null);
    }
  }, [composeForm.event_id]);

  // Get displayed messages based on view
  const displayedMessages = useMemo(() => {
    return view === "inbox" ? messages : sentMessages;
  }, [view, messages, sentMessages]);

  // Get unique events from messages for filter
  const messageEvents = useMemo(() => {
    const eventMap = new Map();
    messages.forEach((msg) => {
      if (msg.evenement_id && msg.evenement_nom) {
        eventMap.set(msg.evenement_id, msg.evenement_nom);
      }
    });
    return Array.from(eventMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [messages]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <div className="messages-wrapper">
      <div className="messages-inner">
        {/* Header */}
        <header className="messages-header">
          <div className="header-content">
            <button
              className="messages-back-btn"
              onClick={() => navigate(-1)}
              type="button"
            >
              <FaArrowLeft />
              Back
            </button>
            <div className="header-title-row">
              <h1>Messages</h1>
              <span className="header-pill">Communication</span>
            </div>
            <p className="messages-subtitle">
              Manage your messages and communicate with organizers,
              participants, and committee members.
            </p>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="messages-tabs">
          <button
            className={`messages-tab ${view === "inbox" ? "active" : ""}`}
            onClick={() => setView("inbox")}
            type="button"
          >
            <FaInbox />
            Inbox
            {messages.filter((m) => !m.lu).length > 0 && (
              <span className="messages-badge">
                {messages.filter((m) => !m.lu).length}
              </span>
            )}
          </button>
          <button
            className={`messages-tab ${view === "sent" ? "active" : ""}`}
            onClick={() => setView("sent")}
            type="button"
          >
            <FaPaperPlane />
            Sent
          </button>
          <button
            className={`messages-tab ${view === "compose" ? "active" : ""}`}
            onClick={() => setView("compose")}
            type="button"
          >
            <FaEnvelope />
            Compose
          </button>
        </div>

        {/* Content Area */}
        <div className="messages-content">
          {view === "compose" ? (
            /* Compose Form */
            <div className="messages-compose">
              <h2 className="compose-title">Compose New Message</h2>
              {composeSuccess && (
                <div className="messages-success">
                  <FaCheck />
                  Message sent successfully!
                </div>
              )}
              {composeError && (
                <div className="messages-error">
                  <FaTimes />
                  {composeError}
                </div>
              )}
              <form onSubmit={handleComposeSubmit} className="compose-form">
                <div className="compose-field">
                  <label>Event (Optional)</label>
                  <select
                    name="event_id"
                    value={composeForm.event_id}
                    onChange={handleComposeChange}
                    className="compose-select"
                  >
                    <option value="">Select an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.nom || event.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="compose-field">
                  <label>Recipient *</label>
                  <select
                    name="recipient_id"
                    value={composeForm.recipient_id}
                    onChange={handleComposeChange}
                    required
                    className="compose-select"
                  >
                    <option value="">Select a recipient...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.prenom} {user.nom} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="compose-field">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={composeForm.subject}
                    onChange={handleComposeChange}
                    placeholder="Message subject..."
                    className="compose-input"
                  />
                </div>

                <div className="compose-field">
                  <label>Message *</label>
                  <textarea
                    name="body"
                    value={composeForm.body}
                    onChange={handleComposeChange}
                    required
                    rows="8"
                    placeholder="Type your message here..."
                    className="compose-textarea"
                  />
                </div>

                <div className="compose-actions">
                  <button
                    type="button"
                    onClick={() => setView("inbox")}
                    className="compose-btn cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="compose-btn primary"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedMessage ? (
            /* Message Detail View */
            <div className="messages-detail">
              <button
                className="messages-back-to-list"
                onClick={() => setSelectedMessage(null)}
                type="button"
              >
                <FaArrowLeft />
                Back to {view === "inbox" ? "Inbox" : "Sent"}
              </button>
              <div className="message-detail-card">
                <div className="message-detail-header">
                  <div className="message-detail-meta">
                    <div className="message-detail-from">
                      <FaUser />
                      <div>
                        <strong>
                          {view === "inbox"
                            ? `${selectedMessage.prenom || ""} ${selectedMessage.nom || ""
                            }`
                            : `To: ${selectedMessage.prenom || ""} ${selectedMessage.nom || ""
                            }`}
                        </strong>
                        <span>{selectedMessage.email || ""}</span>
                      </div>
                    </div>
                    <div className="message-detail-date">
                      <FaCalendar />
                      {formatDate(selectedMessage.date_envoi)}
                    </div>
                  </div>
                  {selectedMessage.evenement_nom && (
                    <div className="message-detail-event">
                      <FaCalendar />
                      {selectedMessage.evenement_nom}
                    </div>
                  )}
                </div>
                <div className="message-detail-body">
                  <h3>{selectedMessage.type || "Message"}</h3>
                  <div className="message-detail-content">
                    {selectedMessage.contenu}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="messages-list-container">
              {/* Filters for Inbox */}
              {view === "inbox" && (
                <div className="messages-filters">
                  <button
                    className={`messages-filter-btn ${filter === "all" ? "active" : ""
                      }`}
                    onClick={() => setFilter("all")}
                    type="button"
                  >
                    All
                  </button>
                  <button
                    className={`messages-filter-btn ${filter === "unread" ? "active" : ""
                      }`}
                    onClick={() => setFilter("unread")}
                    type="button"
                  >
                    Unread
                  </button>
                  {messageEvents.map((event) => (
                    <button
                      key={event.id}
                      className={`messages-filter-btn ${filter === event.id.toString() ? "active" : ""
                        }`}
                      onClick={() => setFilter(event.id.toString())}
                      type="button"
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages List */}
              {loading ? (
                <div className="messages-loading">
                  <FaSpinner className="spin" />
                  Loading messages...
                </div>
              ) : displayedMessages.length === 0 ? (
                <div className="messages-empty">
                  <FaEnvelope />
                  <p>No messages found</p>
                </div>
              ) : (
                <div className="messages-list">
                  {displayedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-item ${!message.lu && view === "inbox" ? "unread" : ""
                        }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="message-item-main">
                        <div className="message-item-avatar">
                          <FaUser />
                        </div>
                        <div className="message-item-content">
                          <div className="message-item-header">
                            <strong>
                              {view === "inbox"
                                ? `${message.prenom || ""} ${message.nom || ""}`
                                : `To: ${message.prenom || ""} ${message.nom || ""
                                }`}
                            </strong>
                            <span className="message-item-date">
                              {formatDate(message.date_envoi)}
                            </span>
                          </div>
                          <div className="message-item-subject">
                            {message.type || "Message"}
                          </div>
                          <div className="message-item-preview">
                            {message.contenu.substring(0, 100)}
                            {message.contenu.length > 100 ? "..." : ""}
                          </div>
                          {message.evenement_nom && (
                            <div className="message-item-event">
                              <FaCalendar />
                              {message.evenement_nom}
                            </div>
                          )}
                        </div>
                      </div>
                      {!message.lu && view === "inbox" && (
                        <div className="message-item-unread-badge" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
