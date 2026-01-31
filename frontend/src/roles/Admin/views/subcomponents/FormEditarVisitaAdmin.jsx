import React, { useState } from "react";
import api from "../../../../api";
import CustomPhoneInput from "../../../../components/PhoneInput";

function FormEditarVisitaAdmin({ token, visita, onSuccess, onCancel }) {
  const [nombre_conductor, setNombreConductor] = useState(
    visita.visitante?.nombre_conductor || ""
  );
  const [dni_conductor, setDNIConductor] = useState(
    visita.visitante?.dni_conductor || ""
  );
  const [telefono, setTelefono] = useState(visita.visitante?.telefono || "");
  const [marca_vehiculo, setMarcaVehiculo] = useState(
    visita.visitante?.marca_vehiculo || ""
  );
  const [placa_vehiculo, setPlacaVehiculo] = useState(
    visita.visitante?.placa_vehiculo || ""
  );
  const [placa_chasis, setPlacaChasis] = useState(
    visita.visitante?.placa_chasis || ""
  );
  const [destino_visita, setDestinoVisita] = useState(
    visita.visitante?.destino_visita || ""
  );
  const [tipo_vehiculo, setTipoVehiculo] = useState(
    visita.visitante?.tipo_vehiculo || ""
  );
  const [color_vehiculo, setColorVehiculo] = useState(
    visita.visitante?.color_vehiculo || ""
  );
  const [motivo, setMotivo] = useState(visita.notas || "");
  const [fecha_entrada, setFechaEntrada] = useState(
    visita.fecha_entrada
      ? new Date(visita.fecha_entrada).toISOString().slice(0, 16)
      : ""
  );
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
  const [bloqueadoEditar, setBloqueadoEditar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setBloqueadoEditar(true);
    setError("");
    try {
      const data = {
        fecha_entrada: fecha_entrada || null,
        notas: motivo,
        visitante: {
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
      };
      await api.patch(
        `/visitas/residente/editar_visita/${visita.id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onSuccess && onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Error al editar la visita. Verifica los datos."
      );
    }
    setCargando(false);
    setBloqueadoEditar(false);
  };

  const handleTelefonoChange = (phone) => {
    setTelefono(phone);
  };

  return (
    <form className="form-visita form-visita-admin" onSubmit={handleSubmit}>
      <h2 className="crear-visita-title">Editar Visita</h2>
      <div className="form-row">
        <label>Nombre del visitante:</label>
        <input
          type="text"
          value={nombre_conductor}
          onChange={(e) => setNombreConductor(e.target.value)}
          required
          disabled={cargando || bloqueadoEditar}
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
          disabled={cargando || bloqueadoEditar}
        />
      </div>
      <div className="form-row">
        <label>Teléfono:</label>
        <CustomPhoneInput
          value={telefono}
          onChange={handleTelefonoChange}
          placeholder="Número de teléfono"
          disabled={cargando || bloqueadoEditar}
          required={true}
        />
      </div>
      <div className="form-row">
        <label>Tipo de vehículo:</label>
        <select
          value={tipo_vehiculo}
          onChange={(e) => setTipoVehiculo(e.target.value)}
          required
          disabled={cargando || bloqueadoEditar}
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
        <label>Marca del vehículo:</label>
        <select
          value={marca_vehiculo}
          onChange={(e) => setMarcaVehiculo(e.target.value)}
          required
          disabled={cargando || bloqueadoEditar}
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
        <label>Color del vehículo:</label>
        <select
          value={color_vehiculo}
          onChange={(e) => setColorVehiculo(e.target.value)}
          required
          disabled={cargando || bloqueadoEditar}
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
          disabled={cargando || bloqueadoEditar}
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
          disabled={cargando || bloqueadoEditar}
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
          disabled={cargando || bloqueadoEditar}
        />
      </div>
      <div className="form-row">
        <label>Motivo de la visita:</label>
        <select
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          disabled={cargando || bloqueadoEditar}
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
          disabled={cargando || bloqueadoEditar}
        />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div className="form-actions">
        <button
          className="btn-primary"
          type="submit"
          disabled={cargando || bloqueadoEditar}
        >
          {cargando ? "Guardando..." : "Guardar Cambios"}
        </button>
        <button
          className="btn-regresar"
          type="button"
          onClick={onCancel}
          style={{ marginLeft: 10 }}
          disabled={cargando || bloqueadoEditar}
        >
          Cancelar
        </button>
      </div>
      <br />
      <div style={{ color: "#1976d2", marginTop: 6, fontSize: "0.98em" }}>
        <b>Se usa el mismo QR generado originalmente para la visita.</b>
        <br />
        <b>
          Si no lo pudo descargar, el codigo QR se encuentra en su correo de
          Gmail.
        </b>
      </div>
    </form>
  );
}

export default FormEditarVisitaAdmin;
