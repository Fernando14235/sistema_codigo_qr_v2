import React from "react";
import cardStyles from "../../../../css/Cards.module.css";

function SocialList({
  publicaciones,
  onVerDetalle,
  onEditar,
  onEliminar,
  isAdmin,
  isOwnTab,
}) {
  if (!publicaciones || publicaciones.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888", fontWeight: "bold", fontSize: "1.1em", marginTop: 32 }}>
        No hay publicaciones
      </p>
    );
  }

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case "comunicado": return "📢";
      case "encuesta": return "📊";
      case "publicacion": return "📝";
      default: return "📄";
    }
  };

  return (
    <div className={cardStyles["cards-container"]}>
      {publicaciones.map((pub) => (
        <div 
          className={cardStyles["horizontal-card"]} 
          key={pub.id}
          style={pub.estado === "fallido" ? { borderColor: "#ffcdd2" } : {}}
        >
          <div className={`${cardStyles["status-stripe"]} ${
            pub.estado === "publicado" ? cardStyles["success"] : 
            pub.estado === "fallido" ? cardStyles["danger"] : cardStyles["warning"]
          }`}></div>
          
          <div className={cardStyles["card-main-content"]}>
            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Tipo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(pub.tipo_publicacion)}</span>
                <span className={cardStyles["section-value"]} style={{ textTransform: 'capitalize' }}>
                  {pub.tipo_publicacion}
                </span>
              </div>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Título</span>
              <h4 className={cardStyles["card-title"]}>{pub.titulo}</h4>
            </div>

            <div className={cardStyles["card-section"]}>
              <span className={cardStyles["section-label"]}>Estado / Fecha</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className={`${cardStyles["badge"]} ${
                  pub.estado === "publicado" ? cardStyles["badge-resuelto"] : 
                  pub.estado === "fallido" ? cardStyles["badge-rechazado"] : cardStyles["badge-pendiente"]
                }`}>
                  {pub.estado === "publicado" ? "✅ Publicado" : 
                   pub.estado === "fallido" ? "❌ Fallido" : "⏳ Pendiente"}
                </span>
                <span className={cardStyles["section-value"]} style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(pub.fecha_creacion).toLocaleDateString()} {new Date(pub.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          <div className={cardStyles["card-actions"]}>
            <button 
              className={`${cardStyles["action-btn"]} ${cardStyles["view"]}`}
              onClick={() => onVerDetalle(pub)}
              title="Ver detalle"
            >
              🔍
            </button>
            {isAdmin && isOwnTab && (
              <>
                <button 
                  className={`${cardStyles["action-btn"]} ${cardStyles["edit"]}`}
                  onClick={() => onEditar(pub)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button 
                  className={`${cardStyles["action-btn"]} ${cardStyles["delete"]}`}
                  onClick={() => onEliminar(pub.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SocialList;
