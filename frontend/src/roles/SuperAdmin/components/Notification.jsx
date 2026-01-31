import React from "react";

// Notificación tipo tarjeta
function Notification({ message, type, onClose }) {
  if (!message) return null;
  
  // Auto-cerrar después de 4 segundos
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [message, onClose]);
  
  return (
    <div className={`notification-card ${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

export default Notification;