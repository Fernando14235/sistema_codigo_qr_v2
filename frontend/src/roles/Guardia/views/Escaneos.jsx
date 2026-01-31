import React, { useState, useEffect } from "react";
import BtnRegresar from "../components/BtnRegresar";
import TablaEscaneos from "../components/TablaEscaneos";
import PaginationControls from "../../../components/PaginationControls";
import OfflineMessage from "../../../components/Offline/OfflineMessage";
import DataStatusIndicator from "../../../components/Offline/DataStatusIndicator";
import { useOfflineOperations } from "../../../hooks/offline/useOfflineOperations";

function Escaneos({ token, onCancel }) {
  const [escaneos, setEscaneos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState(null);
  const [pageEscaneos, setPageEscaneos] = useState(1);
  const [totalPagesEscaneos, setTotalPagesEscaneos] = useState(1);
  const limitEscaneos = 15;

  // Use hook specifically for loading scans
  const { isOnline, loadEscaneosGuardia } = useOfflineOperations(token, 'guardia');

  useEffect(() => {
    const cargarEscaneos = async () => {
      setCargando(true);
      setError("");
      try {
        const result = await loadEscaneosGuardia(pageEscaneos, limitEscaneos);
        setEscaneos(result.data.escaneos || []);
        setTotalPagesEscaneos(result.data.total_pages || 1);
        setDataSource(result.source);
      } catch (err) {
        setError("No se pudieron cargar los escaneos del día.");
      }
      setCargando(false);
    };

    cargarEscaneos();
  }, [token, pageEscaneos, loadEscaneosGuardia]);

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3>Mis Escaneos del Día</h3>
      {!isOnline && <OfflineMessage rol="guardia" />}
      <DataStatusIndicator source={dataSource} isOnline={isOnline} />
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
