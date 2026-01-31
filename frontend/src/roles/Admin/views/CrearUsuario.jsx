import React, { useState, useEffect } from "react";
import api from "../../../api";
import CustomPhoneInput from "../../../components/PhoneInput";

function CrearUsuario({
  token,
  onUsuarioCreado,
  usuarioEditar,
  setUsuarioEditar,
  setVista,
  onNotification,
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("residente");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [unidadResidencial, setUnidadResidencial] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (usuarioEditar) {
      setNombre(usuarioEditar.nombre || "");
      setEmail(usuarioEditar.email || "");
      setRol(usuarioEditar.rol || "residente");
      setTelefono(usuarioEditar.telefono || "");
      setUnidadResidencial(usuarioEditar.unidad_residencial || "");
      setPassword("");
      setMensaje("Editando usuario");
    } else {
      setNombre("");
      setEmail("");
      setRol("residente");
      setPassword("");
      setTelefono("");
      setUnidadResidencial("");
      setMensaje("");
    }
  }, [usuarioEditar]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (telefono.trim() && (!telefono.startsWith("+") || telefono.length < 8)) {
      setMensaje(
        "Por favor ingrese un número de teléfono válido con código de país."
      );
      return;
    }
    setMensaje(
      usuarioEditar ? "Actualizando usuario..." : "Creando usuario..."
    );
    setBloqueado(true);
    try {
      const payload = {
        nombre,
        email,
        rol,
        password,
        telefono:
          telefono.trim() && telefono.length > 5 ? telefono : "no agregado",
      };
      if (rol === "residente" || rol === "admin") {
        payload.unidad_residencial = unidadResidencial;
      }
      if (usuarioEditar) {
        await api.put(
          `/update_usuarios/admin/${usuarioEditar.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMensaje("Usuario actualizado correctamente");
        setUsuarioEditar(null);
        // Mostrar notificación de éxito
        if (onNotification)
          onNotification({
            message: "Usuario actualizado correctamente",
            type: "success",
          });
        // Llamar onUsuarioCreado para recargar la lista
        if (onUsuarioCreado) onUsuarioCreado();
        // Redirigir después de un breve delay para mostrar el mensaje
        setTimeout(() => {
          if (typeof setVista === "function") setVista("usuarios");
        }, 1000);
      } else {
        await api.post(`/create_usuarios/admin`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMensaje("Usuario creado correctamente");
        // Mostrar notificación de éxito
        if (onNotification)
          onNotification({
            message: "Usuario creado correctamente",
            type: "success",
          });
        // Limpiar formulario
        setNombre("");
        setEmail("");
        setRol("residente");
        setPassword("");
        setTelefono("");
        setUnidadResidencial("");
        // Llamar onUsuarioCreado para recargar la lista
        if (onUsuarioCreado) onUsuarioCreado();
        // Redirigir después de un breve delay para mostrar el mensaje
        setTimeout(() => {
          if (typeof setVista === "function") setVista("usuarios");
        }, 1000);
      }
    } catch (err) {
      console.error("Error completo:", err);
      if (err.response && err.response.data) {
        if (typeof err.response.data.detail === "string") {
          setMensaje("Error: " + err.response.data.detail);
        } else if (
          err.response.data.detail &&
          typeof err.response.data.detail === "object"
        ) {
          setMensaje("Error: " + JSON.stringify(err.response.data.detail));
        } else if (err.response.data.message) {
          setMensaje("Error: " + err.response.data.message);
        } else {
          setMensaje("Error: " + JSON.stringify(err.response.data));
        }
      } else if (err.message) {
        setMensaje("Error: " + err.message);
      } else {
        setMensaje("Error al crear/actualizar usuario");
      }
    }
    setBloqueado(false);
  };

  const handleTelefonoChange = (phone) => {
    setTelefono(phone);
  };

  return (
    <form
      onSubmit={handleCrear}
      className="crear-usuario-form crear-usuario-form-responsive"
    >
      <h3 style={{ color: "#1976d2", marginBottom: 10 }}>
        {usuarioEditar ? "Editar Usuario" : "Crear Usuario"}
      </h3>
      <div className="form-row">
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={bloqueado}
        />
        <input
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          disabled={bloqueado}
        />
      </div>
      <div className="form-row">
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          disabled={bloqueado}
        >
          <option value="residente">Residente</option>
          <option value="guardia">Guardia</option>
          <option value="admin">Admin</option>
        </select>
        <div style={{ width: "200px" }}>
          <CustomPhoneInput
            value={telefono}
            onChange={handleTelefonoChange}
            disabled={bloqueado}
            required={true}
          />
        </div>
        {rol === "residente" || rol === "admin" ? (
          <input
            placeholder="Unidad Residencial"
            value={unidadResidencial}
            onChange={(e) => setUnidadResidencial(e.target.value)}
            required={rol === "residente"}
            disabled={bloqueado}
          />
        ) : null}
      </div>
      <div className="form-row">
        <div style={{ position: "relative", width: "100%" }}>
          <input
            placeholder={usuarioEditar ? "Nueva Contraseña" : "Contraseña"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type={showPassword ? "text" : "password"}
            disabled={bloqueado}
            style={{ width: "100%", paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#1976d2",
              padding: 0,
            }}
            tabIndex={-1}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M1 1L23 23" stroke="#1976d2" strokeWidth="2" />
                <path
                  d="M12 5C7 5 2.73 8.11 1 12C1.73 13.66 2.91 15.09 4.41 16.17M9.9 9.9C10.27 9.63 10.73 9.5 11.2 9.5C12.49 9.5 13.5 10.51 13.5 11.8C13.5 12.27 13.37 12.73 13.1 13.1M7.11 7.11C8.39 6.4 10.13 6 12 6C17 6 21.27 9.11 23 13C22.27 14.66 21.09 16.09 19.59 17.17"
                  stroke="#1976d2"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse
                  cx="12"
                  cy="12"
                  rx="10"
                  ry="6"
                  stroke="#1976d2"
                  strokeWidth="2"
                />
                <circle cx="12" cy="12" r="2.5" fill="#1976d2" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <button type="submit" className="btn-primary" disabled={bloqueado}>
          {usuarioEditar ? "Actualizar" : "Crear"}
        </button>
        {usuarioEditar && (
          <button
            type="button"
            className="btn-secondary"
            style={{ marginLeft: 10 }}
            onClick={() => setUsuarioEditar(null)}
            disabled={bloqueado}
          >
            Cancelar
          </button>
        )}
        {mensaje && (
          <div
            style={{
              marginLeft: 16,
              padding: "8px 12px",
              borderRadius: "6px",
              backgroundColor: mensaje.includes("Error")
                ? "#ffebee"
                : "#e8f5e8",
              color: mensaje.includes("Error") ? "#c62828" : "#2e7d32",
              border: `1px solid ${
                mensaje.includes("Error") ? "#ffcdd2" : "#c8e6c9"
              }`,
              fontSize: "0.9em",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {mensaje.includes("Error")
              ? "❌"
              : mensaje.includes("correctamente")
              ? "✅"
              : "⏳"}
            {mensaje}
          </div>
        )}
      </div>
    </form>
  );
}

export default CrearUsuario;
