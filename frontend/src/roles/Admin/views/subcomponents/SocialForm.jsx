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
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(", ")
        : typeof detail === "string"
        ? detail
        : "Error al guardar publicación";
      setMensaje(`Error: ${msg}`);
    }
    setBloqueado(false);
  };

  const residentesOptions = residentes.map((r) => ({
    value: r.residente_id || r.id,
    label: `${r.nombre} (${r.unidad_residencial || "Sin unidad"})`,
  }));

  return (
    <form onSubmit={handleCrear} className={styles["social-form-revamped"]}>
      <div className={styles["form-header"]}>
        <div className={styles["header-title"]}>
          <span className={styles["header-icon"]}>{editId ? "📝" : "📍"}</span>
          <h3>{editId ? "Editar Publicación" : "Nueva Publicación"}</h3>
        </div>
        <p className={styles["header-subtitle"]}>
          {editId ? "Modifica los detalles de tu publicación existente." : "Crea contenido relevante para los residentes de tu comunidad."}
        </p>
      </div>

      <div className={styles["form-grid"]}>
        {/* SECCIÓN 1: CONTENIDO PRINCIPAL */}
        <div className={styles["form-section"]}>
          <div className={styles["section-title"]}>
            <span role="img" aria-label="content">📄</span> Contenido Principal
          </div>
          <div className={styles["section-content"]}>
            <div className={styles["field-group"]}>
              <label>Título de la publicación</label>
              <input
                name="titulo"
                placeholder="Ej: Mantenimiento de áreas verdes"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                disabled={bloqueado}
                className={styles["form-input"]}
              />
            </div>

            <div className={styles["field-group"]}>
              <label>Tipo de comunicación</label>
              <select
                name="tipo_publicacion"
                value={formData.tipo_publicacion}
                onChange={handleInputChange}
                required
                disabled={bloqueado}
                className={styles["form-select"]}
              >
                <option value="comunicado">📢 Comunicado (Importante)</option>
                <option value="publicacion">📰 Publicación General</option>
                <option value="encuesta">📊 Encuesta / Votación</option>
              </select>
            </div>

            {formData.tipo_publicacion === "encuesta" ? (
              <div className={styles["survey-container"]}>
                <div className={styles["field-group"]}>
                  <label>Pregunta de la encuesta</label>
                  <input
                    name="contenido"
                    placeholder="¿Qué te gustaría preguntar?"
                    value={formData.contenido}
                    onChange={handleInputChange}
                    required
                    disabled={bloqueado}
                    className={styles["form-input"]}
                  />
                </div>
                
                <div className={styles["survey-options-label"]}>Opciones de respuesta</div>
                <div className={styles["survey-options-list"]}>
                  {opcionesEncuesta.map((op, idx) => (
                    <div key={idx} className={styles["survey-option-row"]}>
                      <span className={styles["option-number"]}>{idx + 1}</span>
                      <input
                        type="text"
                        value={op}
                        onChange={(e) => handleOpcionesEncuestaChange(idx, e.target.value)}
                        placeholder={`Opción de respuesta...`}
                        disabled={bloqueado}
                        className={styles["form-input"]}
                      />
                      {opcionesEncuesta.length > 1 && (
                        <button
                          type="button"
                          className={styles["btn-remove-option"]}
                          onClick={() => handleEliminarOpcion(idx)}
                          disabled={bloqueado}
                          title="Eliminar opción"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles["btn-add-option"]}
                  onClick={handleAgregarOpcion}
                  disabled={bloqueado}
                >
                  <span className={styles["btn-icon"]}>+</span> Agregar otra opción
                </button>
              </div>
            ) : (
              <div className={styles["field-group"]}>
                <label>Detalle del contenido</label>
                <textarea
                  name="contenido"
                  placeholder="Escribe aquí el mensaje completo..."
                  value={formData.contenido}
                  onChange={handleInputChange}
                  required
                  disabled={bloqueado}
                  rows={6}
                  className={styles["form-textarea"]}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles["side-controls"]}>
          {/* SECCIÓN 2: AUDIENCIA */}
          <div className={`${styles["form-section"]} ${styles["audience-section"]}`}>
            <div className={styles["section-title"]}>
              <span role="img" aria-label="audience">👥</span> Audiencia
            </div>
            <div className={styles["section-content"]}>
              <div className={styles["audience-toggle"]}>
                <div className={styles["toggle-info"]}>
                  <span className={styles["toggle-label"]}>Público General</span>
                  <span className={styles["toggle-desc"]}>{formData.para_todos ? "Todos los residentes" : "Residentes específicos"}</span>
                </div>
                <label className={styles["switch"]}>
                  <input
                    type="checkbox"
                    name="para_todos"
                    checked={formData.para_todos}
                    onChange={handleInputChange}
                    disabled={bloqueado}
                  />
                  <span className={`${styles["slider"]} ${styles["round"]}`}></span>
                </label>
              </div>

              {!formData.para_todos && (
                <div className={styles["destinatarios-container"]}>
                  <label className={styles["field-sublabel"]}>
                    Seleccionar destinatarios {formData.destinatarios.length === 0 && <span className={styles["required"]}>*Requerido</span>}
                  </label>
                  <Select
                    isMulti
                    options={residentesOptions}
                    value={residentesOptions.filter((opt) =>
                      formData.destinatarios.some((d) => d.residente_id === opt.value)
                    )}
                    onChange={handleDestinatariosChange}
                    placeholder="Buscar residentes..."
                    className={styles["multi-select"]}
                    classNamePrefix="react-select"
                    styles={{
                      menu: (base) => ({ ...base, zIndex: 100 }),
                      control: (base) => ({
                        ...base,
                        borderRadius: '8px',
                        borderColor: formData.destinatarios.length === 0 ? '#ff5252' : '#e0e0e0',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#1976d2' }
                      }),
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: MULTIMEDIA */}
          <div className={styles["form-section"]}>
            <div className={styles["section-title"]}>
              <span role="img" aria-label="media">📸</span> Multimedia
            </div>
            <div className={styles["section-content"]}>
              <div className={styles["file-upload-box"]}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="social-file-input"
                  className={styles["hidden-input"]}
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
                <label htmlFor="social-file-input" className={styles["file-drop-area"]}>
                  <span className={styles["upload-icon"]}>☁️</span>
                  <span className={styles["upload-text"]}>Subir imágenes</span>
                  <span className={styles["upload-hint"]}>Máximo 10 archivos</span>
                </label>
              </div>

              {/* Imágenes Existentes */}
              {editId && imagenesExistentes.length > 0 && (
                <div className={styles["images-grid-container"]}>
                  <label>Imágenes actuales:</label>
                  <div className={styles["images-preview-grid"]}>
                    {imagenesExistentes.map((img, index) => (
                      <div key={img.id} className={`${styles["preview-item"]} ${img.eliminar ? styles["marked-for-delete"] : ""}`}>
                        <img src={getImageUrl(img.imagen_url)} alt="Thumbnail" />
                        <button
                          type="button"
                          className={styles["btn-delete-preview"]}
                          onClick={() => {
                            setImagenesExistentes((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, eliminar: !item.eliminar } : item
                              )
                            );
                          }}
                        >
                          {img.eliminar ? "↺" : "×"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nuevas Imágenes */}
              {fileList.length > 0 && (
                <div className={styles["images-grid-container"]}>
                  <label>Nuevas imágenes:</label>
                  <div className={styles["images-preview-grid"]}>
                    {fileList.map((fileObj, index) => (
                      <div key={fileObj.id} className={styles["preview-item"]}>
                        <img src={fileObj.preview} alt="New Preview" />
                        <button
                          type="button"
                          className={styles["btn-delete-preview"]}
                          onClick={() => {
                            setFileList((prev) => prev.filter((_, i) => i !== index));
                            URL.revokeObjectURL(fileObj.preview);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles["form-actions-bar"]}>
        <div className={styles["messages-container"]}>
          {mensaje && (
            <div className={`${styles["status-badge"]} ${mensaje.includes("Error") ? styles["error-msg"] : styles["success-msg"]}`}>
              {mensaje}
            </div>
          )}
        </div>
        <div className={styles["btns-container"]}>
          <button className={styles["btn-cancel"]} type="button" onClick={onCancel} disabled={bloqueado}>
            Cancelar
          </button>
          <button className={styles["btn-submit"]} type="submit" disabled={bloqueado}>
            {bloqueado ? (
              <>
                <span className={styles["spinner"]}></span> procesando...
              </>
            ) : (
              editId ? "Actualizar Publicación" : "Crear Publicación"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default SocialForm;
