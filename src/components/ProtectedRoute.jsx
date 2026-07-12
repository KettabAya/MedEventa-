import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!user) {
        // Redirect to login while saving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User authorized but not for this specific role
        // Redirect to a safe default like participant dashboard
        return <Navigate to="/participant/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
