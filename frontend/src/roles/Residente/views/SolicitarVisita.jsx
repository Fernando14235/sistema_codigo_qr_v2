import React, { useState, useEffect } from "react";
import api from "../../../api";
import CustomPhoneInput from "../../../components/PhoneInput";

// Formulario para solicitar visita al administrador
const FormSolicitarVisita = ({ token, onSuccess, onCancel, setVista }) => {
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [dniVisitante, setDniVisitante] = useState("");
  const [telefonoVisitante, setTelefonoVisitante] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [marcaVehiculo, setMarcaVehiculo] = useState("");
  const [colorVehiculo, setColorVehiculo] = useState("");
  const [placaVehiculo, setPlacaVehiculo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const tiposVehiculo = ["Moto", "Camioneta", "Turismo", "Bus", "Otro"];
  const motivosVisita = ["Visita Familiar", "Visita de Amistad", "Delivery", "Reunión de Trabajo", "Mantenimiento", "Otros"];
  const marcasPorTipo = {
    Moto: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Otra"],
    Camioneta: ["Toyota", "Ford", "Chevrolet", "Nissan", "Hyundai", "Otra"],
    Turismo: ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Kia", "Hyundai", "Volkswagen", "Otra"],
    Bus: ["No aplica"],
    Otro: ["Otra"]
  };
  const coloresVehiculo = ["Blanco", "Negro", "Rojo", "Azul", "Gris", "Verde", "Amarillo", "Plateado"];

  // Actualizar marca si cambia tipo de vehículo
  useEffect(() => {
    if (tipoVehiculo === "Bus") {
      setMarcaVehiculo("No aplica");
    } else if (marcasPorTipo[tipoVehiculo] && !marcasPorTipo[tipoVehiculo].includes(marcaVehiculo)) {
      setMarcaVehiculo("");
    }
  }, [tipoVehiculo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const data = {
        nombre_visitante: nombreVisitante,
        dni_visitante: dniVisitante || undefined,
        telefono_visitante: telefonoVisitante.trim() && telefonoVisitante.length > 5 ? telefonoVisitante : "no agregado",
        fecha_entrada: fechaEntrada || null,
        motivo_visita: motivo,
        tipo_vehiculo: tipoVehiculo,
        marca_vehiculo: tipoVehiculo === "Bus" ? "No aplica" : marcaVehiculo,
        color_vehiculo: colorVehiculo || undefined,
        placa_vehiculo: placaVehiculo || "sin placa"
      };
      await api.post(`/visitas/residente/solicitar_visita`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess && onSuccess();
      if (typeof setVista === 'function') setVista('visitas');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Error al enviar la solicitud. Verifica los datos."
      );
    }
    setCargando(false);
  };

  const handleTelefonoChange = (phone) => {
    setTelefonoVisitante(phone);
  };

  return (
    <form className="form-visita form-visita-residente" onSubmit={handleSubmit}>
      <h2 className="crear-visita-title">Solicitar Visita al Administrador</h2>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input type="text" value={nombreVisitante} onChange={e => setNombreVisitante(e.target.value)} required disabled={cargando} />
      </div>
      <div className="form-row">
        <label>DNI del visitante: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={dniVisitante} onChange={e => setDniVisitante(e.target.value)} disabled={cargando} />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <CustomPhoneInput
          value={telefonoVisitante}
          onChange={handleTelefonoChange}
          placeholder="Número de teléfono"
          disabled={cargando}
          required={false}
        />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select value={tipoVehiculo} onChange={e => setTipoVehiculo(e.target.value)} disabled={cargando}>
          <option value="">Selecciona un tipo</option>
          {tiposVehiculo.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Marca del vehículo:</label>
        <select value={marcaVehiculo} onChange={e => setMarcaVehiculo(e.target.value)} disabled={cargando}>
          <option value="">Selecciona una marca</option>
          {(marcasPorTipo[tipoVehiculo] || []).map(marca => (
            <option key={marca} value={marca}>{marca}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Color del vehículo:</label>
        <select value={colorVehiculo} onChange={e => setColorVehiculo(e.target.value)} disabled={cargando}>
          <option value="">Selecciona un color</option>
          {coloresVehiculo.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Placa del vehículo: <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}>(Opcional)</span></label>
        <input type="text" value={placaVehiculo} onChange={e => setPlacaVehiculo(e.target.value)} disabled={cargando} />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} required disabled={cargando}>
          <option value="">Selecciona un motivo</option>
          {motivosVisita.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>Fecha y hora de entrada:</label>
        <input type="datetime-local" value={fechaEntrada} onChange={e => setFechaEntrada(e.target.value)} required disabled={cargando} />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={cargando}>
          {cargando ? "Enviando..." : "Enviar Solicitud"}
        </button>
        <button className="btn-regresar" type="button" onClick={onCancel} style={{ marginLeft: 10 }} disabled={cargando} >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default FormSolicitarVisita;
