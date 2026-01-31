import React, { useState, useEffect } from "react";
import api from "../../../api";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import FormCrearVisitaAdmin from "./subcomponents/FormCrearVisitaAdmin";
import TablaVisitasAdmin from "./subcomponents/TablaVisitasAdmin";
import FormEditarVisitaAdmin from "./subcomponents/FormEditarVisitaAdmin";

function MisVisitas({ token, usuario, onCancel, onNotification }) {
  const [visitasAdmin, setVisitasAdmin] = useState([]);
  const [visitaEditar, setVisitaEditar] = useState(null);
  const [vistaInterna, setVistaInterna] = useState("lista"); // lista, crear, editar
  const [pageMisVisitas, setPageMisVisitas] = useState(1);
  const [totalPagesMisVisitas, setTotalPagesMisVisitas] = useState(1);
  const limitMisVisitas = 15;

  // Cargar visitas del admin
  const cargarVisitasAdmin = async () => {
    try {
      const params = {
        page: pageMisVisitas,
        limit: limitMisVisitas,
      };

      const res = await api.get(`/visitas/residente/mis_visitas`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.data) {
        setVisitasAdmin(res.data.data || []);
        setTotalPagesMisVisitas(res.data.total_pages);
      } else {
        setVisitasAdmin(res.data || []);
      }
    } catch {
      onNotification({
        message: "Error al cargar las visitas",
        type: "error",
      });
    }
  };

  const eliminarVisitaAdmin = async (id) => {
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar este registro del historial?"
      )
    )
      return;
    try {
      await api.delete(`/visitas/admin/historial/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onNotification({ message: "Registro eliminado", type: "success" });
      cargarVisitasAdmin();
    } catch (error) {
      onNotification({ message: "Error al eliminar registro", type: "error" });
    }
  };

  useEffect(() => {
    if (vistaInterna === "lista") {
      cargarVisitasAdmin();
    }
    // eslint-disable-next-line
  }, [vistaInterna, pageMisVisitas]);

  // Renderizado condicional basado en vista interna
  if (vistaInterna === "crear") {
    return (
      <section className="admin-section">
        <BtnRegresar onClick={() => setVistaInterna("lista")} />
        <h2 className="crear-visita-title">Crear Nueva Visita</h2>
        <FormCrearVisitaAdmin
          token={token}
          onSuccess={() => {
            onNotification({
              message: "Visita creada correctamente",
              type: "success",
            });
            setVistaInterna("lista");
          }}
          onCancel={() => setVistaInterna("lista")}
          setVista={setVistaInterna}
          usuario={usuario}
        />
      </section>
    );
  }

  if (vistaInterna === "editar" && visitaEditar) {
    return (
      <section className="admin-section">
        <BtnRegresar
          onClick={() => {
            setVisitaEditar(null);
            setVistaInterna("lista");
          }}
        />
        <FormEditarVisitaAdmin
          token={token}
          visita={visitaEditar}
          onSuccess={() => {
            onNotification({
              message: "Visita editada correctamente",
              type: "success",
            });
            setVisitaEditar(null);
            setVistaInterna("lista");
            cargarVisitasAdmin();
          }}
          onCancel={() => {
            setVisitaEditar(null);
            setVistaInterna("lista");
          }}
        />
      </section>
    );
  }

  // Vista lista (por defecto)
  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3>Mis Visitas</h3>
        <button
          className="btn-primary"
          onClick={() => setVistaInterna("crear")}
          style={{ padding: "10px 20px", fontSize: "14px" }}
        >
          ➕ Crear Visita
        </button>
      </div>
      <TablaVisitasAdmin
        visitas={visitasAdmin}
        onEditar={(visita) => {
          setVisitaEditar(visita);
          setVistaInterna("editar");
        }}
        onEliminar={eliminarVisitaAdmin}
      />
      <PaginationControls
        currentPage={pageMisVisitas}
        totalPages={totalPagesMisVisitas}
        onPageChange={setPageMisVisitas}
      />
    </section>
  );
}

export default MisVisitas;
