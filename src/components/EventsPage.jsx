// src/components/EventsPage.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiUsers, FiCheckCircle } from "react-icons/fi";
import "./EventsPage.css";

// Featured images
import digitalHealthImg from "../assets/digital-health.jpg";
import cancerResearchImg from "../assets/cancer-research.jpg";
import mentalHealthImg from "../assets/mental-health.jpg";
import pediatricImg from "../assets/pediatric.jpg";
import cardiovascularImg from "../assets/cardiovascular.jpg";
import neuroscienceImg from "../assets/neuroscience.jpg";
import infectiousDiseaseImg from "../assets/infectious-disease.jpg";

// Grid images
import allEv1 from "../assets/1.png";
import allEv2 from "../assets/2.png";
import allEv3 from "../assets/3.png";
import allEv4 from "../assets/4.png";
import allEv5 from "../assets/5.png";
import allEv6 from "../assets/6.png";
import allEv7 from "../assets/7.png";
import allEv8 from "../assets/8.png";

const formatRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} – ${e.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;
};

const EventsPage = ({ extraEvents = [] }) => {
  const featuredEventsRef = useRef(null);
  const allEventsRef = useRef(null);
  const navigate = useNavigate();

  // STATIC events (always there)
  const staticEvents = [
    {
      id: 1,
      name: "Innovations in Digital Health",
      startDate: "2025-03-15",
      endDate: "2025-03-17",
      participants: 285,
      category: "Digital Health",
      location: "Barcelona, Spain",
      description:
        "Mobile apps, wearables and remote monitoring for routine clinical practice.",
      image: allEv1,
    },
    {
      id: 2,
      name: "AI in Healthcare Summit 2025",
      startDate: "2025-03-20",
      endDate: "2025-03-22",
      participants: 450,
      category: "Digital Health",
      location: "Paris, France",
      description:
        "Clinical decision support, medical imaging and responsible use of AI.",
      image: allEv2,
    },
    {
      id: 3,
      name: "Mental Health & Wellness Summit",
      startDate: "2025-05-08",
      endDate: "2025-05-10",
      participants: 418,
      category: "Mental Health",
      location: "Lisbon, Portugal",
      description:
        "Integrates psychiatry, psychology and digital tools for mental well‑being.",
      image: allEv3,
    },
    {
      id: 4,
      name: "Depression & Anxiety Research Forum",
      startDate: "2025-06-03",
      endDate: "2025-06-05",
      participants: 340,
      category: "Mental Health",
      location: "London, UK",
      description:
        "Novel treatments, biomarkers and prevention programs for mood disorders.",
      image: allEv4,
    },
    {
      id: 5,
      name: "Pediatric Oncology Conference",
      startDate: "2025-07-15",
      endDate: "2025-07-17",
      participants: 280,
      category: "Cancer Research",
      location: "Amsterdam, Netherlands",
      description:
        "Management of childhood leukemias, solid tumors and survivorship.",
      image: allEv5,
    },
    {
      id: 6,
      name: "Pediatric Care Innovation Forum",
      startDate: "2025-06-05",
      endDate: "2025-06-07",
      participants: 356,
      category: "Pediatrics",
      location: "Madrid, Spain",
      description:
        "Improving inpatient and outpatient pediatric care pathways.",
      image: allEv6,
    },
    {
      id: 7,
      name: "Cardiovascular Medicine Summit",
      startDate: "2025-06-20",
      endDate: "2025-06-22",
      participants: 478,
      category: "Cardiovascular",
      location: "Vienna, Austria",
      description:
        "Heart failure, coronary disease and preventive cardiology updates.",
      image: allEv7,
    },
    {
      id: 8,
      name: "Neuroscience Research Week",
      startDate: "2025-07-10",
      endDate: "2025-07-12",
      participants: 392,
      category: "Neuroscience",
      location: "Munich, Germany",
      description:
        "From basic neurobiology to clinical neurology and psychiatry.",
      image: allEv8,
    },
  ];

  // merge static + admin events
  const allEvents = [...staticEvents, ...extraEvents];

  // FEATURED section
  const featuredEvents = [
    {
      id: 1,
      name: "Innovations in Digital Health",
      startDate: "2025-03-15",
      endDate: "2025-03-17",
      color: "orange",
      featured: false,
      participants: 285,
      badge: "TRENDING",
      image: digitalHealthImg,
    },
    {
      id: 2,
      name: "Cancer Research Conference",
      startDate: "2025-04-10",
      endDate: "2025-04-12",
      color: "teal",
      featured: true,
      participants: 512,
      badge: "FEATURED",
      image: cancerResearchImg,
    },
    {
      id: 3,
      name: "Mental Health & Wellness Summit",
      startDate: "2025-05-08",
      endDate: "2025-05-10",
      color: "orange",
      featured: false,
      participants: 418,
      badge: "POPULAR",
      image: mentalHealthImg,
    },
    {
      id: 4,
      name: "Pediatric Care Innovation Forum",
      startDate: "2025-06-05",
      endDate: "2025-06-07",
      color: "teal",
      featured: true,
      participants: 356,
      badge: "FEATURED",
      image: pediatricImg,
    },
    {
      id: 5,
      name: "Cardiovascular Medicine Summit",
      startDate: "2025-06-20",
      endDate: "2025-06-22",
      color: "orange",
      featured: false,
      participants: 478,
      badge: "TRENDING",
      image: cardiovascularImg,
    },
    {
      id: 6,
      name: "Neuroscience Research Week",
      startDate: "2025-07-10",
      endDate: "2025-07-12",
      color: "teal",
      featured: true,
      participants: 392,
      badge: "FEATURED",
      image: neuroscienceImg,
    },
    {
      id: 7,
      name: "Infectious Disease Conference",
      startDate: "2025-08-01",
      endDate: "2025-08-03",
      color: "orange",
      featured: false,
      participants: 544,
      badge: "HOT",
      image: infectiousDiseaseImg,
    },
    {
      id: 8,
      name: "AI in Healthcare Summit 2025",
      startDate: "2025-03-20",
      endDate: "2025-03-22",
      color: "teal",
      featured: false,
      participants: 450,
      badge: "TRENDING",
      image: digitalHealthImg,
    },
  ];

  const processSteps = [
    {
      number: "01",
      title: "Create Event",
      description: "Set up your event with key dates, topics and committees.",
      color: "orange",
    },
    {
      number: "02",
      title: "Call for Papers",
      description: "Open submissions and manage abstracts online.",
      color: "teal",
    },
    {
      number: "03",
      title: "Evaluate & Program",
      description: "Assign reviewers, score submissions and build sessions.",
      highlighted: true,
      color: "teal",
      icon: "check-double",
    },
    {
      number: "04",
      title: "Host & Report",
      description: "Run the conference and generate detailed statistics.",
      color: "orange",
    },
  ];

  const scrollLeft = (ref) => {
    ref.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = (ref) => {
    ref.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  const [allEventsPage, setAllEventsPage] = useState(0);
  const eventsPerPage = 6;
  const totalPages = Math.ceil(allEvents.length / eventsPerPage);

  const startIndex = allEventsPage * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentAllEvents = allEvents.slice(startIndex, endIndex);

  const handlePrevAllEvents = () => {
    setAllEventsPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextAllEvents = () => {
    setAllEventsPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  const openEvent = (ev) => {
    navigate(`/events/${ev.id}`, { state: { event: ev } });
  };

  return (
    <div className="events-page">
      {/* FEATURED / TRENDING */}
      <section className="events-section">
        <div className="events-header">
          <div className="events-badge">FEATURED & TRENDING</div>
          <h2 className="events-title">
            <span className="highlight-text"></span> Top {featuredEvents.length}{" "}
            Events
          </h2>
          <p className="events-subtitle">
            Most popular scientific conferences this season
          </p>
          <div className="title-underline"></div>
        </div>

        <div className="events-carousel">
          <button
            className="carousel-btn prev"
            onClick={() => scrollLeft(featuredEventsRef)}
          >
            ◀
          </button>

          <div className="events-list" ref={featuredEventsRef}>
            {featuredEvents.map((event) => (
              <div
                key={event.id}
                className={`event-card ${event.featured ? "featured" : ""}`}
                onClick={() => openEvent(event)}
              >
                <div
                  className={`event-badge-tag ${event.featured ? "featured-badge" : ""
                    }`}
                >
                  {event.badge}
                </div>

                <div className="event-circle-wrapper">
                  <div className={`event-circle ${event.color}`}>
                    <img
                      src={event.image}
                      alt={event.name}
                      className="circle-image"
                    />
                  </div>
                </div>

                <div className="event-content">
                  <h3 className="event-name">{event.name}</h3>
                  <div className="event-info">
                    <span className="event-date">
                      <FiCalendar style={{ marginRight: "0.5rem" }} />
                      {formatRange(event.startDate, event.endDate)}
                    </span>
                    <span className="event-participants">
                      <FiUsers style={{ marginRight: "0.5rem" }} /> {event.participants}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="event-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEvent(event);
                    }}
                  >
                    Explore
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-btn next"
            onClick={() => scrollRight(featuredEventsRef)}
          >
            ▶
          </button>
        </div>
      </section>

      {/* ALL EVENTS GRID */}
      <section className="all-events-section">
        <div className="section-header">
          <h2 className="section-title">All Events</h2>
          <p className="section-subtitle">
            Browse our {allEvents.length} upcoming scientific conferences
          </p>
        </div>

        <div className="events-carousel">
          <button
            className="carousel-btn prev"
            onClick={handlePrevAllEvents}
            disabled={allEventsPage === 0}
          >
            ◀
          </button>

          <div className="all-events-scroll" ref={allEventsRef}>
            {currentAllEvents.map((event) => (
              <div
                key={event.id}
                className="event-grid-card"
                onClick={() => openEvent(event)}
              >
                <div className="event-image-wrapper">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="event-image"
                  />
                </div>

                <h3 className="event-grid-title">{event.name}</h3>

                <div className="event-grid-info">
                  <span className="event-grid-date">
                    <FiCalendar style={{ marginRight: "0.5rem" }} />
                    {formatRange(event.startDate, event.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-btn next"
            onClick={handleNextAllEvents}
            disabled={allEventsPage === totalPages - 1}
          >
            ▶
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          Page {allEventsPage + 1} of {totalPages}
        </div>
      </section>

      {/* PROCESS */}
      <section className="process-section">
        <div className="process-header">
          <h2 className="process-title">How MedEventa Works</h2>
          <p className="process-subtitle">
            4 simple steps to organize your event
          </p>
        </div>

        <div className="process-grid">
          {processSteps.map((step, index) => (
            <div
              key={index}
              className={`process-card ${step.highlighted ? "highlighted" : ""
                }`}
            >
              <div className="process-number-circle-wrapper">
                <div className={`process-number-circle ${step.color}`}>
                  {step.icon && (
                    <div
                      style={{
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "22px"
                      }}
                    >
                      <FiCheckCircle />
                    </div>
                  )}
                  <span className="circle-number">{step.number}</span>
                </div>
              </div>

              <h3 className="process-step-title">{step.title}</h3>
              <p className="process-step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
