import React, { useState, useEffect, useRef } from "react";
import api from "../../../../api";
import { getImageUrl } from "../../../../utils/imageUtils";

function FormActualizarTicket({ ticket, onSuccess, onCancel, token }) {
  const [estado, setEstado] = useState(ticket.estado || "pendiente");
  const [respuesta, setRespuesta] = useState(ticket.respuesta_admin || "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const datos = {
        estado: estado,
        respuesta_admin: respuesta,
      };
      await api.put(
        `/tickets/actualizar_ticket/admin/${ticket.id}`,
        datos,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (isMounted.current) {
        onSuccess();
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.detail || "Error al actualizar el ticket");
      }
    }
    
    if (isMounted.current) {
      setCargando(false);
    }
  };

  return (
    <form
      className="form-actualizar-ticket"
      onSubmit={handleSubmit}
      autoComplete="off"
      style={{
        background: "#fff",
        boxShadow: "0 8px 32px #1976d220",
        borderRadius: 18,
        padding: "32px 24px",
        maxWidth: 420,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <h3
        style={{
          color: "#1976d2",
          fontWeight: 700,
          fontSize: "1.35em",
          textAlign: "center",
          marginBottom: 18,
          letterSpacing: 0.5,
        }}
      >
        Responder Ticket #{ticket.id}
      </h3>

      <div
        className="form-row"
        style={{
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <label
          htmlFor="titulo"
          style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}
        >
          Título
        </label>
        <input
          id="titulo"
          type="text"
          value={ticket.titulo}
          disabled
          style={{
            padding: "13px 14px",
            border: "1.8px solid #e3eafc",
            borderRadius: 10,
            fontSize: "1.04em",
            background: "#f5f8fe",
            color: "#222",
            boxShadow: "0 1.5px 6px #1976d220",
            outline: "none",
          }}
        />
      </div>

      <div
        className="form-row"
        style={{
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <label
          htmlFor="residente"
          style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}
        >
          Residente
        </label>
        <input
          id="residente"
          type="text"
          value={ticket.nombre_residente || "N/A"}
          disabled
          style={{
            padding: "13px 14px",
            border: "1.8px solid #e3eafc",
            borderRadius: 10,
            fontSize: "1.04em",
            background: "#f5f8fe",
            color: "#222",
            boxShadow: "0 1.5px 6px #1976d220",
            outline: "none",
          }}
        />
      </div>

      <div
        className="form-row"
        style={{
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <label
          htmlFor="descripcion"
          style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}
        >
          Descripción
        </label>
        <div
          style={{
            padding: "13px 14px",
            border: "1.8px solid #e3eafc",
            borderRadius: 10,
            fontSize: "1.04em",
            background: "#f5f8fe",
            color: "#222",
            boxShadow: "0 1.5px 6px #1976d220",
            minHeight: "60px",
            whiteSpace: "pre-line",
          }}
          className="ticket-description"
        >
          {ticket.descripcion}
        </div>
      </div>
      <div
        className="form-row"
        style={{
          marginBottom: 18,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "center",
        }}
      >
        <label style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}>
          Imagen adjunta
        </label>
        <div
          className="ticket-imagen-preview"
          style={{
            margin: "10px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 90,
          }}
        >
          {ticket.imagen_url ? (
            <img
              src={getImageUrl(ticket.imagen_url)}
              alt="Imagen del ticket"
              style={{
                width: 250,
                height: 250,
                borderRadius: 14,
                border: "2.5px solid #e3eafc",
                boxShadow: "0 4px 16px #1976d220",
                background: "#fff",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              className="img-placeholder"
              style={{
                width: 80,
                height: 80,
                borderRadius: 14,
                background: "linear-gradient(135deg,#e3eafc 60%,#f5f8fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b0b8c9",
                fontSize: "2.2em",
                border: "2.5px dashed #e3eafc",
                boxShadow: "0 2px 8px #1976d220",
              }}
            >
              📎
            </div>
          )}
        </div>
      </div>
      <div
        className="form-row"
        style={{
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <label
          htmlFor="estado"
          style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}
        >
          Estado
        </label>
        <select
          id="estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          disabled={cargando}
          style={{
            padding: "13px 14px",
            border: "1.8px solid #e3eafc",
            borderRadius: 10,
            fontSize: "1.04em",
            background: "#f5f8fe",
            color: "#222",
            boxShadow: "0 1.5px 6px #1976d220",
            outline: "none",
          }}
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="resuelto">Resuelto</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>
      <div
        className="form-row"
        style={{
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <label
          htmlFor="respuesta"
          style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}
        >
          Respuesta del administrador
        </label>
        <textarea
          id="respuesta"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          rows={4}
          disabled={cargando}
          style={{
            padding: "13px 14px",
            border: "1.8px solid #e3eafc",
            borderRadius: 10,
            fontSize: "1.04em",
            background: "#f5f8fe",
            color: "#222",
            boxShadow: "0 1.5px 6px #1976d220",
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>
      {error && <div className="qr-error">{error}</div>}
      <div
        className="form-actions"
        style={{
          display: "flex",
          gap: 16,
          marginTop: 18,
          justifyContent: "center",
        }}
      >
        <button
          type="submit"
          className="btn-primary"
          disabled={cargando}
          style={{ width: "60%", minWidth: 140 }}
        >
          {cargando ? "Guardando..." : "Guardar Respuesta"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={cargando}
          style={{ width: "40%", minWidth: 100 }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default FormActualizarTicket;
