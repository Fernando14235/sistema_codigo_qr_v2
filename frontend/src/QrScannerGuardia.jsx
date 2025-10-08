import React, { useState, useEffect } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import axios from "axios";
import { API_URL } from "./api";

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

  // Cleanup cuando el componente se desmonte
  useEffect(() => {
    return () => {
      console.log("🧹 Limpiando componente QrScannerGuardia");
      // Limpiar cualquier timeout o interval si los hubiera
    };
  }, []);

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
      console.log("📱 QR escaneado:", qrCode);
      console.log("📏 Longitud del QR:", qrCode.length);
      console.log("🔤 Tipo de dato:", typeof qrCode);
      
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
      
      // Probar comunicación con backend primero (solo en modo debug)
      if (process.env.NODE_ENV === 'development') {
        const communicationOK = await testCommunication(qrCode);
        if (!communicationOK) {
          setError("Error de comunicación con el servidor");
          return;
        }
      }
      
      if (modo === "entrada") {
        if (autoAprobar) {
          // Validar automáticamente (aprobar por defecto)
          console.log("🚀 Iniciando validación automática");
          setCargando(true);
          await validarQRDirecto(qrCode, null); // Pasar el QR directamente
        } else {
          // Mostrar opciones para aprobar/rechazar manualmente
          console.log("⏳ Esperando acción manual del usuario");
          setAprobando(true);
        }
      } else if (modo === "salida") {
        console.log("🚪 Iniciando registro de salida");
        setCargando(true);
        await registrarSalida(qrCode); // Pasar el QR directamente
      }
    } catch (error) {
      console.error("💥 Error en handleResult:", error);
      setError(`Error al procesar QR: ${error.message || 'Error desconocido'}`);
      setCargando(false);
      setAprobando(false);
    }
    
    // Manejar errores de escaneo
    if (errorScan && errorScan.name !== "NotFoundException") {
      console.warn("⚠️ Error de escaneo:", errorScan);
      setError("Error al escanear el código QR. Intenta de nuevo.");
    }
  };

  // Validar QR directamente con código específico
  const validarQRDirecto = async (qrCode, accion) => {
    try {
      setError("");
      setMensaje("");
      
      // Validar que tenemos un QR válido
      if (!qrCode || typeof qrCode !== 'string' || qrCode.trim() === '') {
        throw new Error("Código QR inválido o vacío");
      }

      console.log("🔍 Iniciando validación QR directa");
      console.log("📱 QR Code:", qrCode);
      console.log("⚡ Acción:", accion);
      // Construir payload correctamente - no enviar accion si es null
      const payload = { qr_code: qrCode.trim() };
      if (accion !== null && accion !== undefined) {
        payload.accion = accion;
      }
      
      console.log("🔍 Enviando validación QR:", payload);
      console.log("🌐 URL:", `${API_URL}/visitas/guardia/validar_qr`);
      
      const res = await axios.post(
        `${API_URL}/visitas/guardia/validar_qr`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log("✅ Respuesta del servidor:", res.data);
      console.log("📊 Status:", res.status);
      
      if (res.data.valido) {
        const estadoTexto = res.data.estado === "aprobado" ? "aprobada" : "rechazada";
        let mensajeCompleto = `¡La visita ha sido ${estadoTexto}!\n` +
                             `Estado: ${res.data.estado}\n` +
                             `Visitante: ${res.data.visitante?.nombre_conductor || 'N/A'}\n` +
                             `Acción aplicada: ${res.data.accion_aplicada || accion || 'automática'}`;
        
        // Manejar entrada anticipada
        if (res.data.entrada_anticipada) {
          setEntradaAnticipada(true);
          mensajeCompleto += `\n\n⚠️ ENTRADA ANTICIPADA\nEl visitante llegó antes de la hora programada`;
        } else {
          setEntradaAnticipada(false);
        }
        
        setMensaje(mensajeCompleto);
        
        // Mostrar información adicional del visitante
        if (res.data.visitante) {
          console.log("👤 Información del visitante:", res.data.visitante);
        }
        
        if (res.data.guardia) {
          console.log("👮 Información del guardia:", res.data.guardia);
        }
      } else {
        console.error("❌ Validación falló:", res.data);
        setError(res.data.error || "Error al validar QR");
      }
      
      setAprobando(false);
    } catch (err) {
      console.error("💥 Error completo:", err);
      console.error("📡 Response data:", err.response?.data);
      console.error("📊 Response status:", err.response?.status);
      
      let errorMessage = "Error al validar QR";
      
      // Manejar errores de validación 422
      if (err.response?.status === 422 && err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Error de validación de Pydantic
          const validationErrors = err.response.data.detail.map(error => {
            const location = Array.isArray(error.loc) ? error.loc.join('.') : 'campo';
            const message = error.msg || 'error de validación';
            return `${location}: ${message}`;
          }).join(', ');
          errorMessage = `Error de validación: ${validationErrors}`;
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else {
          errorMessage = "Error de validación en la petición";
        }
      } else if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : "Error en la respuesta del servidor";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setAprobando(false);
    }
    
    setCargando(false);
  };

  // Validar QR para entrada (Aprobar o Rechazar) - usa el QR del estado
  const validarQR = async (accion) => {
    if (!qr) {
      setError("No hay código QR para validar");
      return;
    }
    setCargando(true);
    await validarQRDirecto(qr, accion);
  };

  // Registrar salida
  const registrarSalida = async (qr_code) => {
    setError("");
    setMensaje("");
    
    // Validar que tenemos un QR válido
    if (!qr_code || typeof qr_code !== 'string' || qr_code.trim() === '') {
      setError("Código QR inválido o vacío para salida");
      setCargando(false);
      return;
    }
    
    try {
      console.log("Registrando salida para QR:", qr_code);
      const res = await axios.post(
        `${API_URL}/visitas/guardia/registrar_salida`,
        { qr_code: qr_code.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Respuesta de salida:", res.data);
      setMensaje("¡Escaneo de salida exitoso!");
    } catch (err) {
      console.error("Error al registrar salida:", err);
      setError(err.response?.data?.detail || "Error al registrar salida");
    }
    setCargando(false);
  };

  // Función de prueba para validar comunicación con backend
  const testCommunication = async (qrCode) => {
    try {
      console.log("🧪 Probando comunicación con backend...");
      const payload = { qr_code: qrCode };
      
      const res = await axios.post(
        `${API_URL}/visitas/debug/test-qr-payload`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log("✅ Test de comunicación exitoso:", res.data);
      return true;
    } catch (err) {
      console.error("❌ Test de comunicación falló:", err);
      return false;
    }
  };

  // Reiniciar escaneo
  const handleReiniciar = () => {
    setQr(null);
    setMensaje("");
    setError("");
    setAprobando(false);
    setCargando(false);
    setEntradaAnticipada(false);
  };

  return (
    <QRErrorBoundary>
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
              onError={(error) => {
                console.error("🎥 Error de cámara:", error);
                setCamaraDisponible(false);
                setError("No se pudo acceder a la cámara. Verifica permisos o usa otro dispositivo.");
              }}
            />
          )}
          {!camaraDisponible && (
            <div style={{ color: "#fff", textAlign: "center", padding: 20 }}>
              <b>No se pudo acceder a la cámara.<br />Verifica los permisos o prueba en otro navegador/dispositivo.</b>
              <br /><br />
              <button 
                className="btn-primary" 
                onClick={() => {
                  setCamaraDisponible(true);
                  setError("");
                }}
              >
                Reintentar Cámara
              </button>
            </div>
          )}
        </div>
        <div className="qr-scanner-guardia-content">
          {cargando && (
            <div style={{ textAlign: 'center', padding: 10 }}>
              <b>Procesando...</b>
            </div>
          )}
          {error && (
            <div className="qr-error" style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              padding: '15px',
              borderRadius: '8px',
              margin: '10px 0',
              textAlign: 'center'
            }}>
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}
          {qr && modo === "entrada" && aprobando && !cargando && (
            <div className="qr-aprobar-rechazar">
              <button className="btn-primary" onClick={() => validarQR("aceptar")} disabled={cargando}>
                {cargando ? "Cargando..." : "Aprobar Entrada"}
              </button>
              <button className="btn-regresar" onClick={() => validarQR("rechazar")} disabled={cargando} style={{ marginLeft: 10 }}>
                {cargando ? "Cargando..." : "Rechazar Entrada"}
              </button>
            </div>
          )}
          {mensaje && (
            <div className="qr-mensaje-resultado">
              <pre style={{ 
                whiteSpace: 'pre-line', 
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: entradaAnticipada ? '#f57c00' : '#2e7d32',
                backgroundColor: entradaAnticipada ? '#fff3e0' : '#e8f5e8',
                border: entradaAnticipada ? '2px solid #ff9800' : 'none',
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