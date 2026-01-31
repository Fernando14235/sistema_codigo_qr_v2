import React from "react";

// Botón de regresar estándar
function BtnRegresar({ onClick }) {
  return (
    <button className="btn-regresar" onClick={onClick}>
      ← Regresar
    </button>
  );
}

export default BtnRegresar;
