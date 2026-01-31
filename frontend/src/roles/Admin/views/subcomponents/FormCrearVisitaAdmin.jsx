import React, { useState, useEffect } from "react";
import api from "../../../../api";
import { getImageUrl } from "../../../../utils/imageUtils";
import CustomPhoneInput from "../../../../components/PhoneInput";
import QRFullscreen from "../../components/QRFullscreen";

// Formulario para crear visita (igual que en el panel de residente, pero para admin)
function FormCrearVisitaAdmin({
  token,
  onSuccess,
  onCancel,
  setVista,
  usuario,
}) {
  const [nombre_conductor, setNombreConductor] = useState("");
  const [dni_conductor, setDNIConductor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [marca_vehiculo, setMarcaVehiculo] = useState("");
  const [placa_vehiculo, setPlacaVehiculo] = useState("");
  const [placa_chasis, setPlacaChasis] = useState("");
  const [destino_visita, setDestinoVisita] = useState("");
  const [tipo_vehiculo, setTipoVehiculo] = useState("");
  const [color_vehiculo, setColorVehiculo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fecha_entrada, setFechaEntrada] = useState("");
  const [cantidadAcompanantes, setCantidadAcompanantes] = useState(0);
  const [acompanantes, setAcompanantes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
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
  const [bloqueado, setBloqueado] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);

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

  // Handler para navegación interna (popstate)
  useEffect(() => {
    if (!qrUrl) return;
    const handleNav = (e) => {
      if (
        !window.confirm(
          "¿Estás seguro de salir? Si no descargas el código QR, podrías perder el acceso para tu visita."
        )
      ) {
        e.preventDefault();
        // Evitar que la URL cambie si es posible (depende del router)
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handleNav);
    window.history.pushState(null, "", window.location.href);
    return () => window.removeEventListener("popstate", handleNav);
  }, [qrUrl]);

  useEffect(() => {
    setAcompanantes((prev) => {
      const nuevaCantidad = parseInt(cantidadAcompanantes) || 0;
      if (nuevaCantidad <= 0) return [];
      if (prev.length > nuevaCantidad) return prev.slice(0, nuevaCantidad);
      return [...prev, ...Array(nuevaCantidad - prev.length).fill("")];
    });
  }, [cantidadAcompanantes]);

  useEffect(() => {
    if (tipo_vehiculo === "Bus") {
      setMarcaVehiculo("No aplica");
    } else if (
      marcasPorTipo[tipo_vehiculo] &&
      !marcasPorTipo[tipo_vehiculo].includes(marca_vehiculo)
    ) {
      setMarcaVehiculo("");
    }
  }, [tipo_vehiculo]);

  const handleAcompananteChange = (idx, value) => {
    setAcompanantes((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const handleTelefonoChange = (phone) => {
    setTelefono(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBloqueado(true);
    setError("");
    setQrUrl(null);
    try {
      const data = {
        visitantes: [
          {
            nombre_conductor,
            dni_conductor,
            telefono:
              telefono.trim() && telefono.length > 5 ? telefono : "no agregado",
            tipo_vehiculo,
            marca_vehiculo:
              tipo_vehiculo === "Bus" ? "No aplica" : marca_vehiculo,
            color_vehiculo,
            placa_vehiculo,
            placa_chasis,
            destino_visita,
            motivo_visita: motivo,
          },
        ],
        motivo,
        fecha_entrada: fecha_entrada || null,
        acompanantes: acompanantes.filter((a) => a && a.trim().length > 0),
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

      const nombreLimpio = nombre_conductor
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
    <form className="form-visita form-visita-admin" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input
          type="text"
          value={nombre_conductor}
          onChange={(e) => setNombreConductor(e.target.value)}
          required
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>
          DNI del visitante:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <input
          type="text"
          value={dni_conductor}
          onChange={(e) => setDNIConductor(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>
          Teléfono:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <CustomPhoneInput
          value={telefono}
          onChange={handleTelefonoChange}
          placeholder="Número de teléfono"
          disabled={bloqueado || !!qrUrl}
          required={false}
        />
      </div>

      <div className="form-row">
        <label>
          Tipo de vehículo:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <select
          value={tipo_vehiculo}
          onChange={(e) => setTipoVehiculo(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        >
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>
          Marca del vehículo:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <select
          value={marca_vehiculo}
          onChange={(e) => setMarcaVehiculo(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        >
          <option value="">Selecciona una marca</option>
          {(marcasPorTipo[tipo_vehiculo] || []).map((marca) => (
            <option key={marca} value={marca}>
              {marca}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>
          Color del vehículo:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <select
          value={color_vehiculo}
          onChange={(e) => setColorVehiculo(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        >
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>
          Placa del vehículo:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <input
          type="text"
          value={placa_vehiculo}
          onChange={(e) => setPlacaVehiculo(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>
          Placa Chasis:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <input
          type="text"
          value={placa_chasis}
          onChange={(e) => setPlacaChasis(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>
          Destino Visita:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <input
          type="text"
          value={destino_visita}
          onChange={(e) => setDestinoVisita(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          disabled={bloqueado || !!qrUrl}
        >
          <option value="">Selecciona un motivo</option>
          {motivosVisita.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input
          type="datetime-local"
          value={fecha_entrada}
          onChange={(e) => setFechaEntrada(e.target.value)}
          required
          disabled={bloqueado || !!qrUrl}
        />
      </div>

      <div className="form-row">
        <label>
          Cantidad de acompañantes:{" "}
          <span
            style={{ color: "#666", fontSize: "0.9em", fontWeight: "normal" }}
          >
            (Opcional)
          </span>
        </label>
        <input
          type="number"
          min="0"
          max="10"
          value={cantidadAcompanantes}
          onChange={(e) => setCantidadAcompanantes(e.target.value)}
          disabled={bloqueado || !!qrUrl}
        />
      </div>
      {acompanantes.map((a, idx) => (
        <div className="form-row" key={idx}>
          <label>Nombre del acompañante #{idx + 1}:</label>
          <input
            type="text"
            value={a}
            onChange={(e) => handleAcompananteChange(idx, e.target.value)}
            required
            disabled={bloqueado || !!qrUrl}
          />
        </div>
      ))}
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button
          className="btn-primary"
          type="submit"
          disabled={cargando || bloqueado || !!qrUrl}
        >
          {cargando ? "Creando..." : "Crear Visita"}
        </button>
        <button
          className="btn-regresar"
          type="button"
          onClick={onCancel}
          style={{ marginLeft: 10 }}
          disabled={bloqueado || !!qrUrl}
        >
          Cancelar
        </button>
      </div>
      {qrUrl && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <h4>QR de tu visita</h4>
          <img
            src={qrUrl}
            alt="QR de la visita"
            style={{
              width: 220,
              height: 220,
              objectFit: "contain",
              border: "2px solid #1976d2",
              borderRadius: 12,
              background: "#fff",
              marginBottom: 10,
              cursor: "pointer",
            }}
            onClick={() => setShowQRFullscreen(true)}
            title="Haz clic para ver en pantalla completa"
          />
          <br />
          <div
            style={{
              textAlign: "center",
              marginTop: 8,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={handleDownloadQR}
              className="btn-primary"
            >
              Descargar QR
            </button>
          </div>
          <div style={{ color: "#1976d2", marginTop: 6, fontSize: "0.98em" }}>
            Guarda este QR en su galería para mostrarlo en la entrada
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

export default FormCrearVisitaAdmin;
