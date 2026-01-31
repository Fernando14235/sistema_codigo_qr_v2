import React, { useState } from "react";
import BtnRegresar from "../components/BtnRegresar";
import QrScannerGuardia from "../components/QRScannerGuardia";

function RegistrarSalida({ token, onCancel }) {
  const [mostrarScanner, setMostrarScanner] = useState(false);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3>Registrar Salida</h3>
      <button className="btn-primary" onClick={() => setMostrarScanner(true)}>
        Activar Cámara para Escanear QR
      </button>
      {mostrarScanner && (
        <QrScannerGuardia 
          modo="salida" 
          token={token} 
          autoAprobar={false} 
          onClose={() => setMostrarScanner(false)} 
        />
      )}
    </section>
  );
}

export default RegistrarSalida;
