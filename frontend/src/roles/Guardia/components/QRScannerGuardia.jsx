import React, { useState, useEffect, useRef } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import api from "../../../api";

// Error Boundary Component
class QRErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 QR Scanner Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>
          <h3>Error en el escáner QR</h3>
          <p>Ha ocurrido un error inesperado. Por favor, cierra y vuelve a abrir el escáner.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function QrScannerGuardia({ modo, token, onClose, autoAprobar = true }) {
  const [qr, setQr] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [aprobando, setAprobando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [camaraDisponible, setCamaraDisponible] = useState(true);
  const [entradaAnticipada, setEntradaAnticipada] = useState(false);

  // Estados para Observaciones e Imágenes
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [imagenes, setImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Cleanup cuando el componente se desmonte
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Validar props requeridas
  useEffect(() => {
    if (!token) {
      setError("Token de autenticación no disponible");
      return;
    }
    if (!modo || !["entrada", "salida"].includes(modo)) {
      setError("Modo de escaneo inválido");
      return;
    }
  }, [token, modo]);

  // Cuando se escanea un QR
  const handleResult = async (result, errorScan) => {
    try {
      if (!result?.text || qr) return;

      const qrCode = result.text;

      if (typeof qrCode !== 'string' || qrCode.trim().length === 0) {
        setError("Código QR inválido");
        return;
      }
      if (qrCode.length < 10) {
        setError("Código QR demasiado corto");
        return;
      }

      setQr(qrCode);
      setError("");
      setMensaje("");
      setEntradaAnticipada(false);

      if (modo === "entrada") {
        if (autoAprobar && !mostrarObservaciones) {
          setCargando(true);
          await validarQRDirecto(qrCode, null);
        } else {
          setAprobando(true);
        }
      } else if (modo === "salida") {
        if (autoAprobar && !mostrarObservaciones) {
          setCargando(true);
          await registrarSalida(qrCode);
        }
      }
    } catch (err) {
      console.error("💥 Error en handleResult:", err);
      setError(`Error al procesar QR: ${err.message || 'Error desconocido'}`);
      setCargando(false);
      setAprobando(false);
    }

    if (errorScan && errorScan.name !== "NotFoundException") {
      // ignorar errores de cámara no críticos
    }
  };

  // Manejo de imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagenes.length > 3) {
      setError("Máximo 3 imágenes permitidas");
      e.target.value = '';
      return;
    }
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagenes(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Validar QR de entrada - llamada directa al backend
  const validarQRDirecto = async (qrCode, accion) => {
    try {
      setError("");
      setMensaje("");

      const formData = new FormData();
      formData.append('qr_code', qrCode);
      if (accion) formData.append('accion', accion);
      if (observacion) formData.append('observacion', observacion);
      if (imagenes && imagenes.length > 0) {
        imagenes.forEach(file => formData.append('imagenes', file));
      }

      const res = await api.post(`/visitas/guardia/validar_qr`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = res.data;
      if (data.valido) {
        const estadoTexto = data.estado === "aprobado" ? "aprobada" : "rechazada";
        let mensajeCompleto = `¡La visita ha sido ${estadoTexto}!\n` +
          `Visitante: ${data.visitante?.nombre_conductor || 'N/A'}`;

        if (data.entrada_anticipada) {
          setEntradaAnticipada(true);
          mensajeCompleto += `\n\n⚠️ ENTRADA ANTICIPADA\nEl visitante llegó antes de la hora programada`;
        } else {
          setEntradaAnticipada(false);
        }

        setMensaje(mensajeCompleto);
      } else {
        setError(data.error || "Error al validar QR");
      }

      setObservacion("");
      setImagenes([]);
      setPreviews([]);
      setMostrarObservaciones(false);
      setAprobando(false);

    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || "Error inesperado al validar QR";
      setError(detail);
      setAprobando(false);
    }
    setCargando(false);
  };

  // Registrar salida - llamada directa al backend
  const registrarSalida = async (qr_code) => {
    setError("");
    setMensaje("");

    try {
      const formData = new FormData();
      formData.append('qr_code', qr_code);
      if (observacion) formData.append('observacion', observacion);
      if (imagenes && imagenes.length > 0) {
        imagenes.forEach(file => formData.append('imagenes', file));
      }

      const res = await api.post(`/visitas/guardia/registrar_salida`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = res.data;
      let mensajeSalida = "¡Escaneo de salida exitoso!";
      if (data.salida_tardia) {
        mensajeSalida += "\n\n⚠️ SALIDA TARDÍA\nEl QR había expirado.";
      }
      setMensaje(mensajeSalida);

      setObservacion("");
      setImagenes([]);
      setPreviews([]);
      setMostrarObservaciones(false);

    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || "Error inesperado al registrar salida";
      setError(detail);
    }
    setCargando(false);
  };

  const validarQR = async (accion) => {
    if (!qr) return;
    setCargando(true);
    await validarQRDirecto(qr, accion);
  };

  const handleRegistrarSalidaManual = async () => {
    if (!qr) return;
    setCargando(true);
    await registrarSalida(qr);
  };

  const handleReiniciar = () => {
    setQr(null);
    setMensaje("");
    setError("");
    setAprobando(false);
    setCargando(false);
    setEntradaAnticipada(false);
    setObservacion("");
    setImagenes([]);
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews([]);
    setMostrarObservaciones(false);
  };

  return (
    <QRErrorBoundary>
      <div className="qr-scanner-guardia-fullscreen">
        <div className="qr-scanner-guardia-video-wrapper">
          {!qr && camaraDisponible && (
            <>
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={handleResult}
                scanDelay={300}
                videoStyle={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }}
                containerStyle={{ width: "100%", height: "100%", minHeight: "250px" }}
                onError={(err) => {
                  console.error("🎥 Error de cámara:", err);
                  setCamaraDisponible(false);
                  setError("No se pudo acceder a la cámara.");
                }}
              />
              <div style={{
                position: 'absolute', bottom: '20px', left: '50%',
                transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '10px'
              }}>
                <button
                  type="button"
                  className={`btn-secondary ${mostrarObservaciones ? 'active' : ''}`}
                  style={{
                    backgroundColor: mostrarObservaciones ? '#ffca28' : 'rgba(255,255,255,0.2)',
                    color: mostrarObservaciones ? '#000' : '#fff',
                    border: '1px solid #fff',
                    backdropFilter: 'blur(4px)'
                  }}
                  onClick={() => setMostrarObservaciones(!mostrarObservaciones)}
                >
                  {mostrarObservaciones ? "📝 Con Observaciones" : "📝 Agregar Observación"}
                </button>
              </div>
            </>
          )}

          {!camaraDisponible && !qr && (
            <div style={{ color: "white", padding: 20, textAlign: 'center' }}>
              <p>Cámara no disponible</p>
              <button className="btn-primary" onClick={() => setCamaraDisponible(true)}>Reintentar</button>
            </div>
          )}
        </div>

        <div className="qr-scanner-guardia-content">
          {cargando && <div className="loading-overlay">Procesando...</div>}

          {error && <div className="qr-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}

          {qr && !mensaje && (
            <div className="qr-action-panel">
              {mostrarObservaciones && (
                <div className="observaciones-form" style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                  <label style={{ color: '#fff', display: 'block', marginBottom: 5 }}>Observación ({modo}):</label>
                  <textarea
                    value={observacion}
                    onChange={e => setObservacion(e.target.value)}
                    style={{ width: '100%', borderRadius: 6, padding: 8, minHeight: 60 }}
                    placeholder="Escribe detalles adicionales..."
                  />

                  <label style={{ color: '#fff', display: 'block', marginTop: 10, marginBottom: 5 }}>
                    Evidencia (Máx 3)
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      style={{ color: '#fff', flex: 1 }}
                      disabled={imagenes.length >= 3}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 5, overflowX: 'auto' }}>
                    {previews.map((src, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img src={src} alt="preview" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                        <button
                          onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 18, height: 18, border: 'none', fontSize: 10, cursor: 'pointer' }}
                        >x</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="qr-aprobar-rechazar">
                {modo === "entrada" ? (
                  <>
                    <button className="btn-primary" onClick={() => validarQR("aprobar")} disabled={cargando}>
                      ✅ Aprobar Entrada
                    </button>
                    <button className="btn-regresar" onClick={() => validarQR("rechazar")} disabled={cargando}
                      style={{ marginLeft: 10, backgroundColor: '#e53935', borderColor: '#e53935', color: 'white' }}>
                      ❌ Rechazar Entrada
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={handleRegistrarSalidaManual} disabled={cargando}>
                    🚪 Registrar Salida
                  </button>
                )}
              </div>

              {!mostrarObservaciones && (
                <button
                  className="btn-text"
                  style={{ color: '#bbb', marginTop: 10, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', display: 'block', width: '100%' }}
                  onClick={() => setMostrarObservaciones(true)}
                >
                  Agregar Observación / Fotos
                </button>
              )}
            </div>
          )}

          {mensaje && (
            <div className="qr-mensaje-resultado">
              <pre style={{
                whiteSpace: 'pre-line',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: (entradaAnticipada || mensaje.includes('SALIDA TARDÍA')) ? '#f57c00' : '#2e7d32',
                backgroundColor: (entradaAnticipada || mensaje.includes('SALIDA TARDÍA')) ? '#fff3e0' : '#e8f5e8',
                border: (entradaAnticipada || mensaje.includes('SALIDA TARDÍA')) ? '2px solid #ff9800' : 'none',
                padding: '15px',
                borderRadius: '8px',
                margin: '10px 0'
              }}>
                {mensaje}
              </pre>
            </div>
          )}

          <div className="qr-botones">
            <button className="btn-regresar" onClick={onClose} disabled={cargando}>
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
    </QRErrorBoundary>
  );
}

export default QrScannerGuardia;
