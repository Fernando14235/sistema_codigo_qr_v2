import React, { useState, useEffect } from "react";
import BtnRegresar from "../components/BtnRegresar";
import TablaEscaneos from "../components/TablaEscaneos";
import PaginationControls from "../../../components/PaginationControls";
import api from "../../../api";

function Escaneos({ token, onCancel }) {
  const [escaneos, setEscaneos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [pageEscaneos, setPageEscaneos] = useState(1);
  const [totalPagesEscaneos, setTotalPagesEscaneos] = useState(1);
  const limitEscaneos = 15;

  useEffect(() => {
    const cargarEscaneos = async () => {
      setCargando(true);
      setError("");
      try {
        const response = await api.get(`/visitas/guardia/escaneos-dia`, {
          params: {
            page: pageEscaneos,
            limit: limitEscaneos
          }
        });
        
        // El endpoint devuelve el objeto con escaneos y total_pages
        setEscaneos(response.data.escaneos || []);
        setTotalPagesEscaneos(response.data.total_pages || 1);
      } catch (err) {
        console.error("Error cargando escaneos:", err);
        setError("No se pudieron cargar los escaneos del día.");
      }
      setCargando(false);
    };

    if (token) {
      cargarEscaneos();
    }
  }, [token, pageEscaneos]);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3>Mis Escaneos del Día</h3>
      {cargando && <p>Cargando escaneos...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!cargando && (
        <>
          <TablaEscaneos escaneos={escaneos} />
          <PaginationControls
            currentPage={pageEscaneos}
            totalPages={totalPagesEscaneos}
            onPageChange={setPageEscaneos}
          />
        </>
      )}
    </section>
  );
}

export default Escaneos;
