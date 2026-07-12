import React, { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import "./Notification.css";

const Notification = ({ message, type = "success", onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0 && message) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`notification-toast notification-${type}`}>
            <div className="notification-icon">
                {type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
            </div>
            <div className="notification-content">{message}</div>
            <button className="notification-close" onClick={onClose}>
                <FiX />
            </button>
        </div>
    );
};

export default Notification;
