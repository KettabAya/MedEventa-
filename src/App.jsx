// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Routes, Route, useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import "./App.css";

import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import StepThree from "./components/StepThree";
import StepFour from "./components/StepFour";
import Sidebar from "./components/Sidebar";
import SuccessModal from "./components/SuccessModal";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ContactPage from "./components/ContactPage";

// participant pages
import ParticipantDashboard from "./components/ParticipantDashboard";
import ParticipantOverview from "./components/ParticipantOverview";
import ParticipantRegistrations from "./components/ParticipantRegistrations";
import ParticipantCertificates from "./components/ParticipantCertificates";
import ParticipantProgramme from "./components/ParticipantProgramme";
import ParticipantSurveys from "./components/ParticipantSurveys";
import ActivityFeed from "./components/ActivityFeed";

// events
import EventsPage from "./components/EventsPage";
import EventDetailsPage from "./components/EventDetailsPage";

// sessions
import SessionLivePage from "./components/SessionLivePage";

// messages
import Messages from "./components/Messages";

// Author pages
import AuthorDashboard from "./components/AuthorDashboard";
import NewSubmission from "./components/NewSubmission";
import AuthorProgramme from "./components/AuthorProgramme";
import AuthorBadges from "./components/AuthorBadges";
import ProtectedRoute from "./components/ProtectedRoute";

function SignupFlow() {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    photo: null,
    email: "",
    password: "",
    confirmPassword: "",
    googleAuth: false,
    photoURL: "",
    code: "",
    role: "",
    domaine: "",
    institution: "",
    acceptTerms: false,
  });

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleNext = async () => {
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;

    setErrorMsg("");

    if (step === 2) {
      // Moving from Account info -> Email confirmation
      try {
        // Send verification code
        const trimmedEmail = formData.email ? formData.email.trim() : "";
        await axios.post("/api/auth/send-code", { email: trimmedEmail });
        nextStep();
      } catch (error) {
        console.error("Failed to send code", error);

        let msg = "Could not send verification email.";
        if (error.response) {
          msg = `Server Error (${error.response.status}): ${error.response.data?.message || "Internal Server Error"}`;
        } else if (error.request) {
          msg = "Network Error: Unable to reach the server. Is the backend running on port 5000?";
        } else {
          msg = `Error: ${error.message}`;
        }

        setErrorMsg(msg);
        return;
      }
    } else if (step === 3) {
      // Moving from Email confirmation -> Professional info
      try {
        const trimmedEmail = formData.email ? formData.email.trim() : "";
        await axios.post("/api/auth/verify-code", {
          email: trimmedEmail,
          code: formData.code
        });
        nextStep();
      } catch (error) {
        console.error("Invalid code", error);
        const msg = error.response?.data?.message || "Invalid verification code. Please try again.";
        setErrorMsg(msg);
        return;
      }
    } else {
      nextStep();
    }
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;

    let photoUrl = formData.photoURL;

    if (!photoUrl && formData.photo) {
      photoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(formData.photo);
      });
    }

    try {
      // 1. Prepare data for backend
      // FormData is often better if handling file uploads (photo)
      const registerData = new FormData();
      registerData.append("nom", formData.nom);
      registerData.append("prenom", formData.prenom);
      registerData.append("email", formData.email);
      registerData.append("password", formData.password);
      registerData.append("role", formData.role);
      registerData.append("domain", formData.domaine);
      registerData.append("institution", formData.institution);

      if (formData.photo) {
        registerData.append("photo", formData.photo);
      }

      // 2. Send to backend
      const response = await axios.post("/api/auth/register", registerData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.status === 201 || response.status === 200) {
        // 3. Store user/token if returned, or just show success
        const { user, token } = response.data;
        if (token && user) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }

        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccess(false);
    navigate("/");
  };

  const renderStep = () => {
    if (step === 1) {
      return <StepOne formData={formData} updateFormData={updateFormData} />;
    }
    if (step === 2) {
      return <StepTwo formData={formData} updateFormData={updateFormData} />;
    }
    if (step === 3) {
      return <StepThree formData={formData} updateFormData={updateFormData} />;
    }
    return <StepFour formData={formData} updateFormData={updateFormData} />;
  };

  return (
    <>
      <div className="signup-wrapper">
        <div className="app-container">
          <Sidebar currentStep={step} />

          <div className="content-area">
            <form ref={formRef} className="step-content" noValidate>
              {errorMsg && (
                <div className="signup-error-message">
                  <FaExclamationTriangle /> {errorMsg}
                </div>
              )}
              {renderStep()}
            </form>

            <div className="navigation-buttons">
              <button
                type="button"
                className="btn-previous"
                onClick={prevStep}
                disabled={step === 1}
              >
                Previous
              </button>

              <button
                type="button"
                className="btn-next"
                onClick={step < 4 ? handleNext : handleFinish}
              >
                {step < 4 ? "Next" : "Finish signup"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && <SuccessModal onClose={handleSuccessConfirm} />}
    </>
  );
}

function App() {
  const navigate = useNavigate();

  // admin‑created events (dynamic)
  const [adminEvents] = useState([]);

  // shared participant registrations
  const [registrations, setRegistrations] = useState([]);
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const token = localStorage.getItem("token");

  // Fetch registrations from backend on mount
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user || !token) return;
      try {
        const response = await axios.get("/api/inscriptions/my-inscriptions", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Transform backend data to frontend format if necessary
        // Assuming backend returns array of objects similar to what we need
        // or we map it:
        const mappedRegistrations = response.data.map(reg => ({
          id: reg._id || reg.id,
          type: reg.type || "Event", // Default to Event if missing
          title: reg.event_name || reg.title,
          parent: "", // Can be filled if workshop
          place: reg.event_location || reg.place || "",
          date: reg.event_date || reg.date,
          status: reg.status || "confirmed",
          paymentStatus: reg.paymentStatus || "a_payer"
        }));
        setRegistrations(mappedRegistrations);

      } catch (error) {
        console.error("Error fetching registrations:", error);
      }
    };

    fetchRegistrations();
  }, [user?.id, token]);

  // Listen for registration updates (real-time from EventDetailsPage)
  useEffect(() => {
    const handleRegistrationUpdate = (event) => {
      const newRegistration = event.detail;

      // Check if registration already exists (avoid duplicates)
      setRegistrations((prev) => {
        const exists = prev.some(
          (reg) =>
            (reg.id === newRegistration.id) ||
            (reg.title === newRegistration.title &&
              reg.type === newRegistration.type &&
              reg.date === newRegistration.date)
        );

        if (!exists) {
          return [...prev, newRegistration];
        }
        return prev;
      });
    };

    window.addEventListener("registration-updated", handleRegistrationUpdate);

    return () => {
      window.removeEventListener(
        "registration-updated",
        handleRegistrationUpdate
      );
    };
  }, []);

  const addRegistration = (registration) => {
    setRegistrations((prev) => {
      // similar duplicate check
      const exists = prev.some((reg) => reg.id === registration.id);
      if (!exists) return [...prev, registration];
      return prev;
    });
  };

  return (
    <Routes>
      {/* Public pages */}
      <Route
        path="/"
        element={
          <HomePage
            onGoLogin={() => navigate("/login")}
            onGoSignup={() => navigate("/signup")}
            onGoProfile={() => navigate("/profile")}
            onGoContact={() => navigate("/contact")}
            onGoParticipantDashboard={() => navigate("/participant/dashboard")}
          />
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />

      {/* Profile */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={<EditProfile />} />

      {/* Contact */}
      <Route path="/contact" element={<ContactPage />} />

      {/* Participant pages */}
      <Route
        path="/participant/dashboard"
        element={
          <ParticipantDashboard
            onGoRegistrations={() => navigate("/participant/registrations")}
            onGoCertificates={() => navigate("/participant/certificates")}
            onGoProgramme={() => navigate("/participant/programme")}
            onGoSurveys={() => navigate("/participant/surveys")}
            onGoOverview={() => navigate("/participant/overview")}
            onGoActivity={() => navigate("/participant/activity")}
            onGoHome={() => navigate("/")}
            onAddRegistration={addRegistration}
          />
        }
      />

      <Route
        path="/participant/registrations"
        element={<ParticipantRegistrations registrations={registrations} />}
      />

      <Route
        path="/participant/certificates"
        element={<ParticipantCertificates registrations={registrations} />}
      />

      <Route
        path="/participant/programme"
        element={<ParticipantProgramme registrations={registrations} />}
      />

      <Route
        path="/participant/surveys"
        element={<ParticipantSurveys registrations={registrations} />}
      />

      <Route path="/participant/overview" element={<ParticipantOverview />} />

      {/* Activity feed */}
      <Route path="/participant/activity" element={<ActivityFeed />} />

      {/* Signup */}
      <Route path="/signup" element={<SignupFlow />} />

      {/* Events list + details, with admin events */}
      <Route
        path="/events"
        element={<EventsPage extraEvents={adminEvents} />}
      />
      <Route path="/events/:id" element={<EventDetailsPage />} />

      {/* Sessions */}
      <Route path="/sessions/:sessionId/live" element={<SessionLivePage />} />

      {/* Messages */}
      <Route path="/messages" element={<Messages />} />

      {/* Author Space */}
      {/* Author Space - Protected */}
      <Route
        path="/author/dashboard"
        element={
          <ProtectedRoute allowedRoles={["communicant"]}>
            <AuthorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/new-submission"
        element={
          <ProtectedRoute allowedRoles={["communicant"]}>
            <NewSubmission />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/programme"
        element={
          <ProtectedRoute allowedRoles={["communicant"]}>
            <AuthorProgramme />
          </ProtectedRoute>
        }
      />
      <Route
        path="/author/badges"
        element={
          <ProtectedRoute allowedRoles={["communicant"]}>
            <AuthorBadges />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
