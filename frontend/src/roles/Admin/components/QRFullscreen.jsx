import React, { useEffect } from "react";

// Componente para vista en pantalla completa del QR
function QRFullscreen({ qrUrl, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          color: "white",
          fontSize: "24px",
          cursor: "pointer",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>
      <div
        style={{
          textAlign: "center",
          color: "white",
          maxWidth: "90vw",
          maxHeight: "90vh",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "24px" }}>
          Código QR de Acceso
        </h2>
        <img
          src={qrUrl}
          alt="QR de la visita"
          style={{
            maxWidth: "80vw",
            maxHeight: "60vh",
            objectFit: "contain",
            border: "4px solid white",
            borderRadius: "16px",
            backgroundColor: "white",
            marginBottom: "20px",
          }}
        />
        <p style={{ color: "white", fontSize: "18px" }}>
          Presiona ESC o clic en la X para cerrar
        </p>
      </div>
    </div>
  );
}

export default QRFullscreen;
