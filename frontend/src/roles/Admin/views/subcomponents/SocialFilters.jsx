import React from "react";
import styles from "../../../../SocialDashboard.module.css";

function SocialFilters({ filtros, setFiltros, onNew, showNewBtn }) {
  return (
    <div
      className={styles["social-filtros"]}
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 12,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <select
        name="tipo_publicacion"
        value={filtros.tipo_publicacion}
        onChange={(e) =>
          setFiltros((f) => ({ ...f, tipo_publicacion: e.target.value }))
        }
      >
        <option value="">Tipo</option>
        <option value="comunicado">Comunicado</option>
        <option value="publicacion">Publicación</option>
        <option value="encuesta">Encuesta</option>
      </select>
      <select
        name="estado"
        value={filtros.estado}
        onChange={(e) =>
          setFiltros((f) => ({ ...f, estado: e.target.value }))
        }
      >
        <option value="">Estado</option>
        <option value="publicado">Publicado</option>
        <option value="fallido">Fallido</option>
      </select>
      {showNewBtn && (
        <button
          className="btn-primary"
          style={{ marginLeft: 8 }}
          onClick={onNew}
        >
          + Nueva Publicación
        </button>
      )}
    </div>
  );
}

export default SocialFilters;
