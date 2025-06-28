import React, { useState } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import axios from "axios";
import { API_URL } from "./api";

function QrScannerGuardia({ modo, token, onClose }) {
  const [qr, setQr] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [aprobando, setAprobando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [camaraDisponible, setCamaraDisponible] = useState(true);

  // Cuando se escanea un QR
  const handleResult = async (result, errorScan) => {
    if (result?.text && !qr) {
      setQr(result.text);
      setError("");
      setMensaje("");
      if (modo === "entrada") {
        setAprobando(true); // Mostrar opciones Aprobar/Rechazar
      } else if (modo === "salida") {
        setCargando(true);
        registrarSalida(result.text);
      }
    }
    if (errorScan && errorScan.name !== "NotFoundException") {
      setError("Error al escanear el código QR.");
    }
  };

  // Validar QR para entrada (Aprobar o Rechazar)
  const validarQR = async (accion) => {
    setCargando(true);
    setError("");
    setMensaje("");
    try {
      const res = await axios.post(
        `${API_URL}/visitas/guardia/validar_qr`,
        { qr_code: qr, accion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje(accion === "aprobar" ? "¡La visita ha sido aprobada!" : "La visita ha sido rechazada.");
      setAprobando(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al validar QR");
      setAprobando(false);
    }
    setCargando(false);
  };

  // Registrar salida
  const registrarSalida = async (qr_code) => {
    setError("");
    setMensaje("");
    try {
      await axios.post(
        `${API_URL}/visitas/guardia/registrar_salida`,
        { qr_code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensaje("¡Escaneo de salida exitoso!");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrar salida");
    }
    setCargando(false);
  };

  // Reiniciar escaneo
  const handleReiniciar = () => {
    setQr(null);
    setMensaje("");
    setError("");
    setAprobando(false);
    setCargando(false);
  };

  return (
    <div className="qr-scanner-guardia-fullscreen">
      <div className="qr-scanner-guardia-video-wrapper">
        {!qr && camaraDisponible && (
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={handleResult}
            scanDelay={300}
            videoStyle={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "16px"
            }}
            containerStyle={{
              width: "100%",
              height: "100%",
              minHeight: "250px"
            }}
            onError={() => {
              setCamaraDisponible(false);
              setError("No se pudo acceder a la cámara. Verifica permisos o usa otro dispositivo.");
            }}
          />
        )}
        {!camaraDisponible && (
          <div style={{ color: "#fff", textAlign: "center", padding: 20 }}>
            <b>No se pudo acceder a la cámara.<br />Verifica los permisos o prueba en otro navegador/dispositivo.</b>
          </div>
        )}
      </div>
      <div className="qr-scanner-guardia-content">
        {error && <div className="qr-error">{error}</div>}
        {qr && modo === "entrada" && aprobando && (
          <div className="qr-aprobar-rechazar">
            <button className="btn-primary" onClick={() => validarQR("aprobar")} disabled={cargando}>
              {cargando ? "Cargando..." : "Aprobar Entrada"}
            </button>
            <button className="btn-regresar" onClick={() => validarQR("rechazar")} disabled={cargando} style={{ marginLeft: 10 }}>
              {cargando ? "Cargando..." : "Rechazar Entrada"}
            </button>
          </div>
        )}
        {mensaje && (
          <div className="qr-mensaje-resultado">
            <b>{mensaje}</b>
          </div>
        )}
        <div className="qr-botones">
          <button className="btn-regresar" onClick={onClose}>
            Cerrar Escaneo
          </button>
          {qr && (
            <button className="btn-primary" style={{ marginLeft: 10 }} onClick={handleReiniciar} disabled={cargando}>
              Escanear Otro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QrScannerGuardia;