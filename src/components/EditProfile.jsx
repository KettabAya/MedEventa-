import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Notification from "./Notification";
import "./EditProfile.css";

function EditProfile() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Notification state
  const [notify, setNotify] = useState({ message: "", type: "" });

  const showNotify = (message, type = "success") => {
    setNotify({ message, type });
  };

  const closeNotify = () => {
    setNotify({ message: "", type: "" });
  };

  // read once from localStorage as initial state
  const storedUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [form, setForm] = useState({
    name: storedUser?.nom || storedUser?.name || "",
    surname: storedUser?.prenom || storedUser?.surname || "",
    email: storedUser?.email || "",
    role: storedUser?.role || "",
    domain: storedUser?.domain || storedUser?.domaine_recherche || "",
    institution: storedUser?.institution || "",
    bio: storedUser?.bio || "",
    photoUrl: storedUser?.photo || storedUser?.photoUrl || "",
  });

  // Fetch latest profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.user) {
          const u = res.data.user;
          setForm(prev => ({
            ...prev,
            name: u.nom || prev.name,
            surname: u.prenom || prev.surname,
            email: u.email || prev.email,
            role: u.role || prev.role,
            domain: u.domaine_recherche || prev.domain,
            institution: u.institution || prev.institution,
            bio: u.bio || prev.bio,
            photoUrl: u.photo || prev.photoUrl
          }));
          // Update local storage to keep it fresh
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch (err) {
        console.error("Failed to fetch fresh profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const goBackToProfile = () => {
    navigate("/profile");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const payload = {
        nom: form.name,
        prenom: form.surname,
        institution: form.institution,
        domaine_recherche: form.domain,
        bio: form.bio,
        role: form.role,
        photoUrl: form.photoUrl
      };

      const res = await axios.put("/api/auth/update-profile", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      showNotify("Profile updated successfully!", "success");
      setTimeout(goBackToProfile, 1500);

    } catch (err) {
      console.error("Update failed", err);
      showNotify("Failed to update profile. " + (err.response?.data?.message || err.message), "error");
    }
  };

  return (
    <div className="edit-page">
      <Notification
        message={notify.message}
        type={notify.type}
        onClose={closeNotify}
      />
      <div className="edit-container">
        {/* header */}
        <div className="edit-topbar">
          <div>
            <h1>Update Identity</h1>
            <p>Refresh your professional presence on MedEventa.</p>
          </div>
          <button className="btn-back-edit" onClick={goBackToProfile}>
            Back to profile
          </button>
        </div>

        {/* photo section */}
        <div className="edit-card image-card">
          <div className="image-wrapper">
            <div className="image-circle">
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt={form.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "999px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span className="image-initial">
                  {form.name ? form.name[0] : "A"}
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handlePhotoSelected}
            />

            <button
              type="button"
              className="btn-change-photo"
              onClick={handleChangePhotoClick}
            >
              Change photo
            </button>
          </div>
          <p className="image-hint">PNG, JPG recommended</p>
        </div>

        {/* form */}
        <form onSubmit={handleSave} className="edit-form-grid">
          <div className="edit-card">
            <label>
              First Name
              <input
                type="text"
                value={form.surname} // Assuming surname is prenom based on my map
                onChange={handleChange("surname")}
                required
              />
            </label>
          </div>
          <div className="edit-card">
            <label>
              Last Name
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </label>
          </div>

          <div className="edit-card">
            <label>
              Email identity
              <input
                type="email"
                value={form.email}
                disabled // Email usually cannot be changed easily without re-verification
                className="input-disabled"
              />
            </label>
          </div>

          <div className="edit-card">
            <label>
              Platform status
              <select
                value={form.role}
                onChange={handleChange("role")}
                className="edit-select"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="ORGANISATEUR">ORGANISATEUR</option>
                <option value="COMMUNICANT">COMMUNICANT</option>
                <option value="PARTICIPANT">PARTICIPANT</option>
                <option value="MEMBRE_COMITE">MEMBRE_COMITE</option>
                <option value="INVITE">INVITE</option>
                <option value="RESP_WORKSHOP">RESP_WORKSHOP</option>
              </select>
            </label>
          </div>

          <div className="edit-card">
            <label>
              Field of research
              <input
                type="text"
                value={form.domain}
                onChange={handleChange("domain")}
              />
            </label>
          </div>

          <div className="edit-card full-width">
            <label>
              Primary institution
              <input
                type="text"
                value={form.institution}
                onChange={handleChange("institution")}
              />
            </label>
          </div>

          <div className="edit-card full-width">
            <label>
              Professional biography
              <textarea
                rows={4}
                value={form.bio}
                onChange={handleChange("bio")}
                placeholder="Briefly describe your research interests and experience."
              />
            </label>
          </div>

          <div className="edit-actions">
            <button
              type="button"
              className="btn-discard-edit"
              onClick={goBackToProfile}
            >
              Discard changes
            </button>
            <button type="submit" className="btn-save-edit">
              Save profile update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
