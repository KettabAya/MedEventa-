import React, { useState } from "react";
import {
  FiHome,
  FiLogOut,
  FiMenu,
  FiX,
  FiGrid,
  FiPlusSquare,
  FiCalendar,
  FiAward,
  FiUser
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import "./AuthorLayout.css";

const AuthorLayout = ({ children }) => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation menu items for Author Space
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FiGrid />,
      path: "/author/dashboard",
    },
    {
      id: "new-submission",
      label: "New Submission",
      icon: <FiPlusSquare />,
      path: "/author/new-submission",
    },
    {
      id: "programme",
      label: "Programme",
      icon: <FiCalendar />,
      path: "/author/programme",
    },
    {
      id: "badges",
      label: "Badges",
      icon: <FiAward />,
      path: "/author/badges",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: <FiUser />,
      path: "/profile", // Changed to /profile main view as generic nav, from there they can click edit. 
      // Actually user asked "take me to edit profile page" for the button.
      // For sidebar "My Profile" standard is profile view. 
      // I'll stick to /profile/edit if they want quick edit, but /profile is safer.
      // Let's go with /profile
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="dashboard-layout-wrapper">
      {/* App Bar at the top */}
      <div className="dashboard-appbar">
        <div className="dashboard-appbar-left">
          <button
            className="dashboard-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="dashboard-appbar-brand">
            <div className="dashboard-appbar-logo">ME</div>
            <span className="dashboard-appbar-title">MedEventa</span>
          </div>
        </div>

        <div className="dashboard-appbar-right">
          <button type="button" className="dashboard-home-btn" onClick={handleHome}>
            <FiHome className="dashboard-home-icon" />
            Back to home
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`dashboard-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="dashboard-sidebar-header">
          <div className="dashboard-user-info">
            <div className="dashboard-user-avatar">{user?.name?.charAt(0) || "C"}</div>
            <div className="dashboard-user-details">
              <span className="dashboard-user-name">{user?.name || "Communicant"}</span>
              <span className="dashboard-user-role">Communicant</span>
            </div>
          </div>
        </div>

        <div className="dashboard-nav-items">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                type="button"
                className={`dashboard-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
              >
                <span className="dashboard-nav-icon">{item.icon}</span>
                <span className="dashboard-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="dashboard-sidebar-footer">
          <button
            type="button"
            className="dashboard-logout-btn"
            onClick={handleLogout}
          >
            <FiLogOut className="dashboard-logout-icon" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-main-content">
        {children}
      </div>
    </div>
  );
};

export default AuthorLayout;
