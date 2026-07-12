import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import "./ParticipantSurveys.css";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "participantSurveys";

const ParticipantSurveys = ({ registrations }) => {
  const navigate = useNavigate();

  // Fetch filled surveys from backend
  const [surveyState, setSurveyState] = useState({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSurveys = async () => {
      if (!token) return;
      try {
        // Assuming this endpoint returns list of events user has surveyed
        const res = await axios.get("/api/surveys/my-surveys", {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Map backend data to surveyState format: { eventId: { status: 'completed', rating: ... } }
        const newState = {};
        res.data.forEach(s => {
          newState[s.eventId] = {
            status: "completed",
            rating: s.rating,
            comment: s.comment,
            // ... other fields
          };
        });
        setSurveyState(newState);
      } catch (e) {
        console.error("Failed to fetch surveys", e);
      }
    };
    fetchSurveys();
  }, [token]);

  const [search, setSearch] = useState("");
  const [activeSurvey, setActiveSurvey] = useState(null); // row currently filling

  // main overall rating + comment
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // extra survey fields
  const [contentRating, setContentRating] = useState(0);
  const [orgRating, setOrgRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState("yes");


  const handleSubmit = async () => {
    if (!activeSurvey) return;

    try {
      await axios.post(`/api/events/${activeSurvey.id}/feedback`, {
        rating,
        comment,
        contentRating,
        orgRating,
        wouldRecommend
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSurveyState((prev) => ({
        ...prev,
        [activeSurvey.id]: {
          status: "completed",
          rating,
          comment,
          contentRating,
          orgRating,
          wouldRecommend,
        },
      }));

      setActiveSurvey(null);
      setRating(0);
      setComment("");
      setContentRating(0);
      setOrgRating(0);
      setWouldRecommend("yes");
    } catch (e) {
      console.error("Failed to submit survey", e);
      alert("Failed to submit survey. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/participant/dashboard");
  };

  return (
    <>
      <div className="ps-wrapper">
        <div className="ps-inner">
          <header className="ps-header">
            <div>
              <h1>Surveys &amp; Feedback</h1>
              <p className="ps-subtitle">
                Your voice helps improve future events. Fill surveys for the
                sessions and events you attended.
              </p>
            </div>

            <button type="button" className="ps-back-btn" onClick={handleBack}>
              <ArrowLeft />
              <span>Back to dashboard</span>
            </button>
          </header>

          {/* search bar */}
          <div className="ps-toolbar">
            <div className="ps-search">
              <Search className="ps-search-icon" />
              <input
                type="text"
                placeholder="Search surveys..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="ps-filter-btn">
              <SlidersHorizontal />
            </button>
          </div>

          {/* header row */}
          <div className="ps-list-header">
            <span>Event / Session name</span>
            <span>Date</span>
            <span>Type</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {/* list */}
          <div className="ps-list">
            {items.map((item) => (
              <div key={item.id} className="ps-row">
                <div className="ps-row-main">
                  <div className="ps-icon-badge">
                    <span className="ps-icon-inner">✓</span>
                  </div>
                  <div className="ps-row-text">
                    <span className="ps-row-title">{item.title}</span>
                    {item.parent && (
                      <span className="ps-row-sub">{item.parent}</span>
                    )}
                  </div>
                </div>

                <div className="ps-col" data-label="Date">
                  {item.date}
                </div>

                <div className="ps-col" data-label="Type">
                  <span className="ps-type-pill">{item.type}</span>
                </div>

                <div className="ps-col" data-label="Status">
                  <span
                    className={`ps-status-pill ps-status-${item.surveyStatus}`}
                  >
                    {item.surveyStatus === "completed"
                      ? "COMPLETED"
                      : "PENDING"}
                  </span>
                </div>

                <div className="ps-col" data-label="Action">
                  {item.surveyStatus === "completed" ? (
                    <button className="ps-action-btn ps-action-secondary">
                      Filled
                    </button>
                  ) : (
                    <button
                      className="ps-action-btn"
                      onClick={() => handleOpenSurvey(item)}
                    >
                      Fill survey
                    </button>
                  )}
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="ps-empty">
                No surveys available yet. Once you attend events, surveys will
                appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* survey modal */}
      {activeSurvey && (
        <div className="ps-modal-backdrop">
          <div className="ps-modal">
            <h2>Feedback – {activeSurvey.title}</h2>
            <p className="ps-modal-sub">
              Rate your overall experience and share any comments.
            </p>

            {/* overall rating */}
            <h3 className="ps-q-title">Overall experience</h3>
            <div className="ps-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`ps-star ${rating >= n ? "active" : ""}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>

            {/* extra question 1 */}
            <h3 className="ps-q-title">Content quality</h3>
            <div className="ps-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`ps-star ${contentRating >= n ? "active" : ""}`}
                  onClick={() => setContentRating(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* extra question 2 */}
            <h3 className="ps-q-title">Organization</h3>
            <div className="ps-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`ps-star ${orgRating >= n ? "active" : ""}`}
                  onClick={() => setOrgRating(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* extra question 3 */}
            <h3 className="ps-q-title">Would you recommend this event?</h3>
            <div className="ps-recommend">
              <label>
                <input
                  type="radio"
                  name="recommend"
                  value="yes"
                  checked={wouldRecommend === "yes"}
                  onChange={(e) => setWouldRecommend(e.target.value)}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="recommend"
                  value="no"
                  checked={wouldRecommend === "no"}
                  onChange={(e) => setWouldRecommend(e.target.value)}
                />
                No
              </label>
            </div>

            <textarea
              className="ps-textarea"
              rows={4}
              placeholder="Your comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="ps-modal-actions">
              <button
                type="button"
                className="ps-modal-btn ps-modal-secondary"
                onClick={() => setActiveSurvey(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ps-modal-btn"
                onClick={handleSubmit}
                disabled={rating === 0}
              >
                Submit feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParticipantSurveys;
