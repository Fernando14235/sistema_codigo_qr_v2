import React, { useState, useEffect } from "react";
import api from "../../../../api";
import styles from "../../../../SocialDashboard.module.css";
import { getImageUrl } from "../../../../utils/imageUtils";
import Select from "react-select";

function SocialForm({
  token,
  editId,
  initialData,
  onSuccess,
  onCancel,
  existingImages = [],
}) {
  const [formData, setFormData] = useState(initialData);
  const [fileList, setFileList] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [opcionesEncuesta, setOpcionesEncuesta] = useState([""]);
  const [residentes, setResidentes] = useState([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    // Cargar residentes para selección múltiple
    api
      .get(`/usuarios/residentes_full`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data.data || res.data;
        setResidentes(Array.isArray(data) ? data : []);
      })
      .catch(() => setResidentes([]));

    // Si es edición, preparar imágenes existentes y opciones
    if (editId) {
      setImagenesExistentes(
        existingImages.map((img) => ({
          id: img.id,
          imagen_url: img.imagen_url,
          eliminar: false,
        }))
      );

      // Si es encuesta, cargar opciones
      // Nota: initialData.contenido ya trae la pregunta
      // Las opciones deberían venir en initialData.opciones si las pasamos,
      // pero SocialAdmin solo pasa lo básico.
      // Mejor fetch el detalle completo si es edición?
      // Por ahora confiamos en que initialData tenga lo necesario o lo buscamos.
      if (initialData.tipo_publicacion === "encuesta") {
        api
          .get(`/social/obtener_social/admin`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const pub = (res.data.data || res.data).find((p) => p.id === editId);
            if (pub && pub.opciones) {
              setOpcionesEncuesta(pub.opciones.map((op) => op.texto));
            }
          });
      }
    }
    // eslint-disable-next-line
  }, [editId, token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "tipo_publicacion") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        requiere_respuesta: value === "encuesta",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleDestinatariosChange = (selectedOptions) => {
    const selected = (selectedOptions || []).map((opt) => ({
      residente_id: opt.value,
    }));
    setFormData((prev) => ({ ...prev, destinatarios: selected }));
  };

  const handleOpcionesEncuestaChange = (idx, val) => {
    setOpcionesEncuesta((prev) => prev.map((op, i) => (i === idx ? val : op)));
  };

  const handleAgregarOpcion = () => setOpcionesEncuesta((prev) => [...prev, ""]);

  const handleEliminarOpcion = (idx) =>
    setOpcionesEncuesta((prev) => prev.filter((_, i) => i !== idx));

  const handleCrear = async (e) => {
    e.preventDefault();
    if (
      !formData.para_todos &&
      (!formData.destinatarios || formData.destinatarios.length === 0)
    ) {
      setMensaje(
        "Error: Si la publicación no es para todos, debe seleccionar al menos un destinatario"
      );
      return;
    }

    setBloqueado(true);
    setMensaje(editId ? "Actualizando..." : "Creando...");

    try {
      const destinatariosFormateados = formData.para_todos
        ? []
        : formData.destinatarios.map((d) => ({
            residente_id: d.residente_id,
          }));

      const opciones =
        formData.tipo_publicacion === "encuesta"
          ? opcionesEncuesta
              .filter((op) => op.trim() !== "")
              .map((op) => ({ texto: op.trim() }))
          : [];

      const socialData = {
        titulo: formData.titulo,
        contenido: formData.contenido,
        tipo_publicacion: formData.tipo_publicacion,
        requiere_respuesta: formData.tipo_publicacion === "encuesta",
        para_todos: formData.para_todos,
        destinatarios:
          destinatariosFormateados.length > 0
            ? destinatariosFormateados
            : undefined,
        opciones: opciones.length > 0 ? opciones : undefined,
        imagenes_existentes: editId ? imagenesExistentes : undefined,
      };

      const data = new FormData();
      data.append("social_data", JSON.stringify(socialData));
      fileList.forEach((fileObj) => data.append("imagenes", fileObj.file));

      if (editId) {
        await api.put(`/social/actualizar_social/admin/${editId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post(`/social/create_social/admin`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onSuccess();
    } catch (err) {
      setMensaje(err.response?.data?.detail || "Error al guardar publicación");
    }
    setBloqueado(false);
  };

  const residentesOptions = residentes.map((r) => ({
    value: r.residente_id || r.id,
    label: `${r.nombre} (${r.unidad_residencial || "Sin unidad"})`,
  }));

  return (
    <form onSubmit={handleCrear} className={styles["social-form"]}>
      <h3>{editId ? "Editar Publicación" : "Nueva Publicación"}</h3>

      <div className="form-row">
        <label>Título</label>
        <input
          name="titulo"
          placeholder="Título"
          value={formData.titulo}
          onChange={handleInputChange}
          required
          disabled={bloqueado}
        />
      </div>

      {formData.tipo_publicacion === "encuesta" ? (
        <>
          <div className="form-row">
            <label>Pregunta de la encuesta</label>
            <input
              name="contenido"
              placeholder="Pregunta de la encuesta"
              value={formData.contenido}
              onChange={handleInputChange}
              required
              disabled={bloqueado}
            />
          </div>
          <div className="form-row">
            <label>Opciones de respuesta</label>
            {opcionesEncuesta.map((op, idx) => (
              <div
                key={idx}
                style={{ display: "flex", gap: 8, marginBottom: 8 }}
              >
                <input
                  type="text"
                  value={op}
                  onChange={(e) =>
                    handleOpcionesEncuestaChange(idx, e.target.value)
                  }
                  placeholder={`Opción ${idx + 1}`}
                  style={{ flex: 1 }}
                  disabled={bloqueado}
                />
                {opcionesEncuesta.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleEliminarOpcion(idx)}
                    style={{
                      background: "#e53935",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0 12px",
                      cursor: "pointer",
                    }}
                    disabled={bloqueado}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAgregarOpcion}
              style={{
                marginBottom: 16,
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "8px 16px",
                cursor: "pointer",
              }}
              disabled={bloqueado}
            >
              + Agregar opción
            </button>
          </div>
        </>
      ) : (
        <div className="form-row">
          <label>Contenido</label>
          <textarea
            name="contenido"
            placeholder="Contenido"
            value={formData.contenido}
            onChange={handleInputChange}
            required
            disabled={bloqueado}
            rows={5}
          />
        </div>
      )}

      <div className="form-row">
        <label>Tipo de publicación</label>
        <select
          name="tipo_publicacion"
          value={formData.tipo_publicacion}
          onChange={handleInputChange}
          required
          disabled={bloqueado}
        >
          <option value="comunicado">Comunicado</option>
          <option value="publicacion">Publicación</option>
          <option value="encuesta">Encuesta</option>
        </select>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "16px 0",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            margin: 0,
          }}
        >
          <span style={{ fontWeight: 500, color: "#1976d2" }}>
            Para todos los residentes
          </span>
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: 40,
              height: 22,
            }}
          >
            <input
              type="checkbox"
              name="para_todos"
              checked={formData.para_todos}
              onChange={handleInputChange}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: formData.para_todos ? "#1976d2" : "#b0bec5",
                borderRadius: 22,
                transition: "background 0.2s",
              }}
            ></span>
            <span
              style={{
                position: "absolute",
                left: formData.para_todos ? 20 : 2,
                top: 2,
                width: 18,
                height: 18,
                background: "#fff",
                borderRadius: "50%",
                boxShadow: "0 1px 4px #0002",
                transition: "left 0.2s",
              }}
            ></span>
          </span>
        </label>
      </div>

      {!formData.para_todos && (
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              color: formData.destinatarios.length === 0 ? "#d32f2f" : "#000",
              display: "block",
              marginBottom: 8,
            }}
          >
            Destinatarios (selecciona uno o más residentes)
            {formData.destinatarios.length === 0 && " *Obligatorio*"}:
          </label>
          <Select
            isMulti
            options={residentesOptions}
            value={residentesOptions.filter((opt) =>
              formData.destinatarios.some((d) => d.residente_id === opt.value)
            )}
            onChange={handleDestinatariosChange}
            placeholder="Buscar y seleccionar residentes..."
            classNamePrefix="react-select"
            styles={{
              menu: (base) => ({ ...base, zIndex: 9999 }),
              container: (base) => ({ ...base, width: "100%" }),
              control: (base) => ({
                ...base,
                borderColor:
                  formData.destinatarios.length === 0
                    ? "#d32f2f"
                    : base.borderColor,
              }),
            }}
          />
        </div>
      )}

      {editId && imagenesExistentes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: "bold", marginBottom: 8, display: "block" }}>
            Imágenes actuales:
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {imagenesExistentes.map((img, index) => (
              <div
                key={img.id}
                style={{ position: "relative", display: "inline-block" }}
              >
                <img
                  src={getImageUrl(img.imagen_url)}
                  alt={`Imagen ${index + 1}`}
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: img.eliminar ? "3px solid #e53935" : "1px solid #ccc",
                    opacity: img.eliminar ? 0.5 : 1,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagenesExistentes((prev) =>
                      prev.map((item, i) =>
                        i === index ? { ...item, eliminar: !item.eliminar } : item
                      )
                    );
                  }}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: img.eliminar ? "#43a047" : "#e53935",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {img.eliminar ? "↺" : "×"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-row">
        <label>
          {editId ? "Agregar nuevas imágenes:" : "Imágenes (máximo 10):"}
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setFileList((prev) => [
              ...prev,
              ...files.map((file) => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: URL.createObjectURL(file),
              })),
            ]);
          }}
          disabled={bloqueado}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {fileList.map((fileObj, index) => (
          <div
            key={fileObj.id}
            style={{ position: "relative", display: "inline-block" }}
          >
            <img
              src={fileObj.preview}
              alt={`Preview ${index + 1}`}
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
            <button
              type="button"
              onClick={() => {
                setFileList((prev) => prev.filter((_, i) => i !== index));
                URL.revokeObjectURL(fileObj.preview);
              }}
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "#e53935",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className={styles["social-form-btns"]} style={{ marginTop: 24 }}>
        <button className="btn-primary" type="submit" disabled={bloqueado}>
          {editId ? "Actualizar Publicación" : "Crear Publicación"}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={onCancel}
          disabled={bloqueado}
        >
          Cancelar
        </button>
      </div>
      {mensaje && (
        <div
          className={styles["mensaje"]}
          style={{
            marginTop: 15,
            color: mensaje.includes("Error") ? "#e53935" : "#1976d2",
            fontWeight: "bold",
          }}
        >
          {mensaje}
        </div>
      )}
    </form>
  );
}

export default SocialForm;
