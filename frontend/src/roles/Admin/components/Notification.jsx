import React from "react";

// Notificación tipo tarjeta
function Notification({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default Notification;
