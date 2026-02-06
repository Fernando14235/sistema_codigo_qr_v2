import React, { useState, useEffect, useRef } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import api from "../../../api"; // import { API_URL } from "./api";
import { API_URL } from "../../../api"; // Keep API_URL in case it's used elsewhere

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
      console.log("🧹 Limpiando componente QrScannerGuardia");
      // Limpiar URLs de preview
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
    console.log(`🎯 Escáner QR iniciado en modo: ${modo}`);
  }, [token, modo]);

  // Cuando se escanea un QR
  const handleResult = async (result, errorScan) => {
    try {
      // Validar que tenemos un resultado válido
      if (!result?.text || qr) {
        return; // Ya hay un QR procesándose o no hay texto válido
      }

      const qrCode = result.text;
      
      // Validaciones básicas del QR
      if (typeof qrCode !== 'string' || qrCode.trim().length === 0) {
        setError("Código QR inválido: texto vacío o formato incorrecto");
        return;
      }

      if (qrCode.length < 10) {
        setError("Código QR demasiado corto, posiblemente inválido");
        return;
      }
      
      setQr(qrCode);
      setError("");
      setMensaje("");
      setEntradaAnticipada(false);
      
      // En modo entrada, si hay autoAprobar, podemos proceder SOLO si no se quiere agregar observación
      // Si el guardia activó "Agregar Observación", detenemos el autoAprobar
      if (modo === "entrada") {
        if (autoAprobar && !mostrarObservaciones) {
          console.log("🚀 Iniciando validación automática");
          setCargando(true);
          await validarQRDirecto(qrCode, null); 
        } else {
          // Mostrar opciones para aprobar/rechazar manualmente y agregar obses
          console.log("⏳ Esperando acción manual del usuario");
          setAprobando(true);
        }
      } else if (modo === "salida") {
         // En salida, también respetamos autoAprobar para permitir observaciones si está desactivado
         if (autoAprobar && !mostrarObservaciones) {
             console.log("🚪 Iniciando registro de salida automático");
             setCargando(true);
             await registrarSalida(qrCode);
         } else {
             // Si autoAprobar es false (comportamiento actual) o hay observaciones, esperamos confirmación manual
             console.log("⏳ Esperando acción manual del usuario para salida");
             // No hacemos nada, la UI mostrará el botón "Registrar Salida" y opciones de observación
         }
         }
      }
     catch (error) {
      console.error("💥 Error en handleResult:", error);
      setError(`Error al procesar QR: ${error.message || 'Error desconocido'}`);
      setCargando(false);
      setAprobando(false);
    }
    
    if (errorScan && errorScan.name !== "NotFoundException") {
       // Ignoramos errores de no focus etc.
    }
  };

  // Manejo de imágenes
  const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      // CORRECCIÓN: Usar 'imagenes' en lugar de 'images'
      if (files.length + imagenes.length > 3) {
          setError("Máximo 3 imágenes permitidas");
          // Limpiar input para permitir re-selección
          e.target.value = '';
          return;
      }
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagenes(prev => [...prev, ...files]);
      setPreviews(prev => [...prev, ...newPreviews]);
      
      // Limpiar el input para permitir seleccionar la misma imagen u otras nuevas sin problemas
      e.target.value = '';
  };

  const removeImage = (index) => {
      setImagenes(prev => prev.filter((_, i) => i !== index));
      URL.revokeObjectURL(previews[index]);
      setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Validar QR (Entrada) con FormData
  const validarQRDirecto = async (qrCode, accion) => {
    try {
      setError("");
      setMensaje("");
      
      const formData = new FormData();
      formData.append('qr_code', qrCode.trim());
      if (accion) formData.append('accion', accion);
      if (observacion) formData.append('observacion', observacion);
      
      imagenes.forEach((file) => {
          formData.append('imagenes', file);
      });

      console.log("🔍 Enviando validación QR (FormData)");
      
      const res = await api.post(
        `/visitas/guardia/validar_qr`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      if (res.data.valido) {
        const estadoTexto = res.data.estado === "aprobado" ? "aprobada" : "rechazada";
        let mensajeCompleto = `¡La visita ha sido ${estadoTexto}!\n` +
                             `Visitante: ${res.data.visitante?.nombre_conductor || 'N/A'}\n` +
                             `Acción aplicada: ${res.data.accion_aplicada || accion || 'automática'}`;
        
        if (res.data.entrada_anticipada) {
          setEntradaAnticipada(true);
          mensajeCompleto += `\n\n⚠️ ENTRADA ANTICIPADA\nEl visitante llegó antes de la hora programada`;
        } else {
          setEntradaAnticipada(false);
        }
        
        setMensaje(mensajeCompleto);
        // Limpiar formulario tras éxito
        setObservacion("");
        setImagenes([]);
        setPreviews([]);
        setMostrarObservaciones(false);

      } else {
        setError(res.data.error || "Error al validar QR");
      }
      setAprobando(false);
    } catch (err) {
      console.error("Error validando QR:", err);
      setError(err.response?.data?.detail || "Error al validar QR");
      setAprobando(false);
    }
    setCargando(false);
  };

  // Registrar Salida con FormData
  const registrarSalida = async (qr_code) => {
    setError("");
    setMensaje("");
    
    try {
      const formData = new FormData();
      formData.append('qr_code', qr_code.trim());
      if (observacion) formData.append('observacion', observacion);
      imagenes.forEach((file) => {
          formData.append('imagenes', file);
      });

      console.log("Registrando salida para QR:", qr_code);
      const res = await api.post(
        `/visitas/guardia/registrar_salida`,
        formData,
        { headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        } }
      );
      
      let mensajeSalida = "¡Escaneo de salida exitoso!";
      if (res.data.salida_tardia) {
        mensajeSalida += "\n\n⚠️ SALIDA TARDÍA\nEl QR había expirado. Se ha notificado al residente.";
      }
      
      setMensaje(mensajeSalida);
      // Limpiar
      setObservacion("");
      setImagenes([]);
      setPreviews([]);
      setMostrarObservaciones(false);
      
    } catch (err) {
      console.error("Error al registrar salida:", err);
      setError(err.response?.data?.detail || "Error al registrar salida");
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

  // Reiniciar escaneo
  const handleReiniciar = () => {
    setQr(null);
    setMensaje("");
    setError("");
    setAprobando(false);
    setCargando(false);
    setEntradaAnticipada(false);
    // No limpiamos observaciones para permitir flujo: llenar -> escanear? 
    // No, mejor limpiar para evitar datos viejos.
    setObservacion("");
    setImagenes([]);
    // Limpiar previews
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews([]);
    setMostrarObservaciones(false);
  };

  return (
    <QRErrorBoundary>
      <div className="qr-scanner-guardia-fullscreen">
        <div className="qr-scanner-guardia-video-wrapper">
          {/* Si no hay QR capturado, mostramos el video */}
          {!qr && camaraDisponible && (
            <>
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
                onError={(error) => {
                    console.error("🎥 Error de cámara:", error);
                    setCamaraDisponible(false);
                    setError("No se pudo acceder a la cámara.");
                }}
                />
                 {/* Overlay de botones sobre el video si se quiere activar observaciones antes */}
                 <div style={{
                     position: 'absolute',
                     bottom: '20px',
                     left: '50%',
                     transform: 'translateX(-50%)',
                     zIndex: 10,
                     display: 'flex',
                     gap: '10px'
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
          
          {/* Mensajes de error cámara */}
          {!camaraDisponible && !qr && (
             <div style={{ color: "white", padding: 20, textAlign: 'center' }}>
                 <p>Cámara no disponible</p>
                 <button className="btn-primary" onClick={() => setCamaraDisponible(true)}>Reintentar</button>
             </div>
          )}
        </div>
        
        {/* Panel de Contenido / Resultados / Formulario */}
        <div className="qr-scanner-guardia-content">
          {cargando && (
            <div className="loading-overlay">Procesando...</div>
          )}
          
          {error && <div className="qr-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
          
          {/* Si hay QR pero estamos en proceso (aprobando o mostrando observaciones) */}
          {qr && !mensaje && (
              <div className="qr-action-panel">
                  
                  {mostrarObservaciones && (
                      <div className="observaciones-form" style={{background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, marginBottom: 10}}>
                          <label style={{color: '#fff', display: 'block', marginBottom: 5}}>Observación ({modo}):</label>
                          <textarea 
                             value={observacion}
                             onChange={e => setObservacion(e.target.value)}
                             style={{width: '100%', borderRadius: 6, padding: 8, minHeight: 60}}
                             placeholder="Escribe detalles adicionales..."
                          />
                          
                          <label style={{color: '#fff', display: 'block', marginTop: 10, marginBottom: 5}}>Evidencia (Máx 3):</label>
                          <div style={{display: 'flex', gap: 10}}>
                             <input 
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                style={{color: '#fff', flex: 1}}
                                disabled={imagenes.length >= 3}
                             />
                             {/* Botón opcional para forzar cámara si el input normal no lo hace en algunos dispositivos */}
                             {/* <button type="button" onClick={() => fileInputRef.current.click()}>📷</button> */}
                          </div>
                          <div style={{display: 'flex', gap: 5, marginTop: 5, overflowX: 'auto'}}>
                              {previews.map((src, idx) => (
                                  <div key={idx} style={{position: 'relative'}}>
                                      <img src={src} alt="preview" style={{width: 50, height: 50, objectFit: 'cover', borderRadius: 4}} />
                                      <button 
                                        onClick={() => removeImage(idx)}
                                        style={{position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 18, height: 18, border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
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
                            <button className="btn-regresar" onClick={() => validarQR("rechazar")} disabled={cargando} style={{ marginLeft: 10, backgroundColor: '#e53935', borderColor: '#e53935', color: 'white' }}>
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
                         style={{color: '#bbb', marginTop: 10, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', display: 'block', width: '100%'}}
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