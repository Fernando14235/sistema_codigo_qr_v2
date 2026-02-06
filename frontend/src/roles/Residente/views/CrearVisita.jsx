import React, { useState, useEffect, useRef } from "react";
import api from "../../../api";
import { getImageUrl } from "../../../utils/imageUtils";
import CustomPhoneInput from "../../../components/PhoneInput";
import QRFullscreen from "../../Admin/components/QRFullscreen";
import BtnRegresar from "../../Admin/components/BtnRegresar";

const tiposVehiculo = ["Moto", "Camioneta", "Turismo", "Bus", "Otro"];
const motivosVisita = [
  "Visita Familiar",
  "Visita de Amistad",
  "Delivery",
  "Reunión de Trabajo",
  "Mantenimiento",
  "Otros",
];
const marcasPorTipo = {
  Moto: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Otra"],
  Camioneta: ["Toyota", "Ford", "Chevrolet", "Nissan", "Hyundai", "Otra"],
  Turismo: [
    "Toyota",
    "Honda",
    "Ford",
    "Chevrolet",
    "Nissan",
    "Kia",
    "Hyundai",
    "Volkswagen",
    "Otra",
  ],
  Bus: ["No aplica"],
  Otro: ["Otra"],
};
const coloresVehiculo = [
  "Blanco",
  "Negro",
  "Rojo",
  "Azul",
  "Gris",
  "Verde",
  "Amarillo",
  "Plateado",
];

function FormCrearVisita({
  token,
  onSuccess,
  onCancel,
  setVista,
}) {
  const [formData, setFormData] = useState({
    nombre_conductor: "",
    dni_conductor: "",
    telefono: "",
    marca_vehiculo: "",
    placa_vehiculo: "",
    placa_chasis: "",
    destino_visita: "",
    tipo_vehiculo: "",
    color_vehiculo: "",
    motivo: "",
    fecha_entrada: "",
    cantidadAcompanantes: 0,
    acompanantes: [],
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const qrRef = useRef(null);

  useEffect(() => {
    if (qrUrl) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue =
          "¿Estás seguro de salir? Si no descargas el código QR, podrías perder el acceso para tu visita.";
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [qrUrl]);

  useEffect(() => {
    if (!qrUrl) return;
    const handleNav = (e) => {
      if (
        !window.confirm(
          "¿Estás seguro de salir? Si no descargas el código QR, podrías perder el acceso para tu visita."
        )
      ) {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handleNav);
    window.history.pushState(null, "", window.location.href);
    return () => window.removeEventListener("popstate", handleNav);
  }, [qrUrl]);

  useEffect(() => {
    const nuevaCantidad = parseInt(formData.cantidadAcompanantes) || 0;
    setFormData(prev => {
      let newAcompanantes = [...prev.acompanantes];
      if (nuevaCantidad <= 0) {
        newAcompanantes = [];
      } else if (newAcompanantes.length > nuevaCantidad) {
        newAcompanantes = newAcompanantes.slice(0, nuevaCantidad);
      } else {
        newAcompanantes = [...newAcompanantes, ...Array(nuevaCantidad - newAcompanantes.length).fill("")];
      }
      return { ...prev, acompanantes: newAcompanantes };
    });
  }, [formData.cantidadAcompanantes]);

  useEffect(() => {
    if (formData.tipo_vehiculo === "Bus") {
      setFormData(prev => ({ ...prev, marca_vehiculo: "No aplica" }));
    } else if (
      marcasPorTipo[formData.tipo_vehiculo] &&
      !marcasPorTipo[formData.tipo_vehiculo].includes(formData.marca_vehiculo)
    ) {
      setFormData(prev => ({ ...prev, marca_vehiculo: "" }));
    }
  }, [formData.tipo_vehiculo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAcompananteChange = (idx, value) => {
    setFormData(prev => {
      const arr = [...prev.acompanantes];
      arr[idx] = value;
      return { ...prev, acompanantes: arr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBloqueado(true);
    setError("");
    setQrUrl(null);
    setSuccessMessage("");
    try {
      const data = {
        visitantes: [
          {
            nombre_conductor: formData.nombre_conductor,
            dni_conductor: formData.dni_conductor,
            telefono: formData.telefono.trim() && formData.telefono.length > 5 ? formData.telefono : "no agregado",
            tipo_vehiculo: formData.tipo_vehiculo,
            marca_vehiculo: formData.tipo_vehiculo === "Bus" ? "No aplica" : formData.marca_vehiculo,
            color_vehiculo: formData.color_vehiculo,
            placa_vehiculo: formData.placa_vehiculo,
            placa_chasis: formData.placa_chasis,
            destino_visita: formData.destino_visita,
            motivo_visita: formData.motivo,
          },
        ],
        motivo: formData.motivo,
        fecha_entrada: formData.fecha_entrada || null,
        acompanantes: formData.acompanantes.filter((a) => a && a.trim().length > 0),
      };
      const res = await api.post(
        `/visitas/residente/crear_visita`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data && res.data.length > 0 && res.data[0].qr_url) {
        setQrUrl(getImageUrl(res.data[0].qr_url));
        setSuccessMessage("Visita creada con éxito. Descarga el QR a continuación.");
        setTimeout(() => {
          qrRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Error al crear la visita. Verifica los datos."
      );
    }
    setCargando(false);
    setBloqueado(false);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const now = new Date();
      const fechaFormato = now.toLocaleDateString("es-HN").replace(/\//g, "-");
      const horaFormato = now
        .toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })
        .replace(/:/g, "-");

      const nombreLimpio = formData.nombre_conductor
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      const fileName = `QR_${nombreLimpio}_${fechaFormato}_${horaFormato}.png`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error al descargar el QR:", error);
      alert("Error al descargar el código QR. Por favor, intenta nuevamente.");
    }
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <BtnRegresar onClick={onCancel} />
        <h3 style={{ margin: 0, color: '#1976d2' }}>Crear Nueva Visita</h3>
      </div>

      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input
          type="text"
          name="nombre_conductor"
          value={formData.nombre_conductor}
          onChange={handleChange}
          required
          disabled={bloqueado || !!qrUrl}
          placeholder="Nombre completo"
        />
      </div>

      <div className="form-row">
        <label>DNI del visitante: <small>(Opcional)</small></label>
        <input
          type="text"
          name="dni_conductor"
          value={formData.dni_conductor}
          onChange={handleChange}
          disabled={bloqueado || !!qrUrl}
          placeholder="Número de identidad"
        />
      </div>

      <div className="form-row">
        <label>Teléfono: <small>(Opcional)</small></label>
        <CustomPhoneInput
          value={formData.telefono}
          onChange={(phone) => setFormData(prev => ({ ...prev, telefono: phone }))}
          placeholder="Número de teléfono"
          disabled={bloqueado || !!qrUrl}
          required={false}
        />
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div className="form-row">
          <label>Tipo de vehículo: <small>(Opcional)</small></label>
          <select
            name="tipo_vehiculo"
            value={formData.tipo_vehiculo}
            onChange={handleChange}
            disabled={bloqueado || !!qrUrl}
          >
            <option value="">Selecciona un tipo</option>
            {tiposVehiculo.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Marca del vehículo: <small>(Opcional)</small></label>
          <select
            name="marca_vehiculo"
            value={formData.marca_vehiculo}
            onChange={handleChange}
            disabled={bloqueado || !!qrUrl}
          >
            <option value="">Selecciona una marca</option>
            {(marcasPorTipo[formData.tipo_vehiculo] || []).map((marca) => (
              <option key={marca} value={marca}>{marca}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Color del vehículo: <small>(Opcional)</small></label>
          <select
            name="color_vehiculo"
            value={formData.color_vehiculo}
            onChange={handleChange}
            disabled={bloqueado || !!qrUrl}
          >
            <option value="">Selecciona un color</option>
            {coloresVehiculo.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <label>Placa del vehículo: <small>(Opcional)</small></label>
        <input
          type="text"
          name="placa_vehiculo"
          value={formData.placa_vehiculo}
          onChange={handleChange}
          disabled={bloqueado || !!qrUrl}
          placeholder="Número de placa"
        />
      </div>

      <div className="form-row">
        <label>Número de Chasis: <small>(Opcional)</small></label>
        <input
          type="text"
          name="placa_chasis"
          value={formData.placa_chasis}
          onChange={handleChange}
          disabled={bloqueado || !!qrUrl}
          placeholder="Número de chasis"
        />
      </div>

      <div className="form-row">
        <label>Destino Visita: <small>(Opcional)</small></label>
        <input
          type="text"
          name="destino_visita"
          value={formData.destino_visita}
          onChange={handleChange}
          disabled={bloqueado || !!qrUrl}
          placeholder="Lugar de destino"
        />
      </div>

      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select
          name="motivo"
          value={formData.motivo}
          onChange={handleChange}
          required
          disabled={bloqueado || !!qrUrl}
        >
          <option value="">Selecciona un motivo</option>
          {motivosVisita.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input
          type="datetime-local"
          name="fecha_entrada"
          value={formData.fecha_entrada}
          onChange={handleChange}
          required
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>Cantidad de acompañantes: <small>(Opcional)</small></label>
        <input
          type="number"
          name="cantidadAcompanantes"
          min="0"
          max="10"
          value={formData.cantidadAcompanantes}
          onChange={handleChange}
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      {formData.acompanantes.map((a, idx) => (
        <div className="form-row" key={idx}>
          <label>Nombre del acompañante #{idx + 1}:</label>
          <input
            type="text"
            value={a}
            onChange={(e) => handleAcompananteChange(idx, e.target.value)}
            required
            disabled={bloqueado || !!qrUrl}
            placeholder={`Acompañante ${idx + 1}`}
          />
        </div>
      ))}

      {error && <div className="qr-error" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      {successMessage && <div className="qr-success" style={{ color: 'green', marginTop: '10px', fontWeight: 'bold' }}>{successMessage}</div>}

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-start' }}>
        <button
          className="btn-primary"
          type="submit"
          disabled={cargando || bloqueado || !!qrUrl}
          style={{ width: 'fit-content', minWidth: '150px' }}
        >
          {cargando ? "Creando..." : "Crear Visita"}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={onCancel}
          disabled={bloqueado || !!qrUrl}
          style={{ width: 'fit-content', minWidth: '120px' }}
        >
          Cancelar
        </button>
      </div>

      {qrUrl && (
        <div ref={qrRef} style={{ textAlign: "center", marginTop: 25, padding: '20px', background: '#f0f7ff', borderRadius: '12px' }}>
          <h4 style={{ color: '#1976d2', marginBottom: 15 }}>QR Generado Exitosamente</h4>
          <img
            src={qrUrl}
            alt="QR de la visita"
            style={{
              width: 250,
              height: 250,
              objectFit: "contain",
              border: "3px solid #1976d2",
              borderRadius: 16,
              background: "#fff",
              marginBottom: 15,
              cursor: "pointer",
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onClick={() => setShowQRFullscreen(true)}
            title="Haz clic para ver en pantalla completa"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="btn-primary"
              style={{ width: '200px' }}
            >
              Descargar Código QR
            </button>
            <p style={{ color: "#1976d2", fontSize: "0.9em", maxWidth: '300px' }}>
              Descarga o toma una captura de este código y envíaselo a tu visitante para su ingreso.
            </p>
          </div>
        </div>
      )}

      {showQRFullscreen && qrUrl && (
        <QRFullscreen
          qrUrl={qrUrl}
          onClose={() => setShowQRFullscreen(false)}
        />
      )}
    </form>
  );
}

export default FormCrearVisita;
