import React from 'react';
import './ReloadPrompt.css';

const ReloadPrompt = ({ updateServiceWorker, onClose }) => {
  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <div className="reload-prompt">
      <div className="reload-prompt-content">
        <span className="reload-prompt-message">
          Hay una nueva versión disponible
        </span>
        <div className="reload-prompt-actions">
          <button 
            className="reload-prompt-btn reload-prompt-btn-update"
            onClick={handleUpdate}
          >
            Actualizar
          </button>
          <button 
            className="reload-prompt-btn reload-prompt-btn-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReloadPrompt;