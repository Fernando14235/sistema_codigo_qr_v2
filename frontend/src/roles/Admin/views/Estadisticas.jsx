import React, { useState, useEffect } from "react";
import api from "../../../api";
import BtnRegresar from "../components/BtnRegresar";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Estadisticas({ nombre, token, onCancel, onNotification }) {
  const [estadisticas, setEstadisticas] = useState(null);

  // Cargar estadísticas generales
  const cargarEstadisticas = async () => {
    try {
      const res = await api.get(`/admin/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstadisticas(res.data);
    } catch {
      onNotification({
        message: "Error al cargar estadísticas",
        type: "error",
      });
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    // eslint-disable-next-line
  }, []);

  if (!estadisticas) {
    return (
      <section className="admin-section">
        <BtnRegresar onClick={onCancel} />
        <div>Cargando estadísticas...</div>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3>📊 Estadísticas Generales</h3>
      <div className="estadisticas-cards">
        <div className="estadistica-card">
          <b>Total Visitas:</b>{" "}
          {estadisticas.estadisticas_generales.total_visitas}
        </div>
        <div className="estadistica-card">
          <b>Pendientes:</b>{" "}
          {estadisticas.estadisticas_generales.visitas_pendientes}
        </div>
        <div className="estadistica-card">
          <b>Aprobadas:</b>{" "}
          {estadisticas.estadisticas_generales.visitas_aprobadas}
        </div>
        <div className="estadistica-card">
          <b>Completadas:</b>{" "}
          {estadisticas.estadisticas_generales.visitas_completadas}
        </div>
        <div className="estadistica-card">
          <b>Rechazadas:</b>{" "}
          {estadisticas.estadisticas_generales.visitas_rechazadas}
        </div>
        <div className="estadistica-card">
          <b>Expiradas:</b>{" "}
          {estadisticas.estadisticas_generales.visitas_expiradas}
        </div>
        <div className="estadistica-card">
          <b>Escaneos hoy:</b>{" "}
          {estadisticas.estadisticas_generales.total_escaneos_hoy}
        </div>
        <div className="estadistica-card">
          <b>Entradas hoy:</b>{" "}
          {estadisticas.estadisticas_generales.escaneos_entrada_hoy}
        </div>
        <div className="estadistica-card">
          <b>Salidas hoy:</b>{" "}
          {estadisticas.estadisticas_generales.escaneos_salida_hoy}
        </div>
      </div>

      {estadisticas.estados_visitas &&
        estadisticas.estados_visitas.length > 0 && (
          <div style={{ maxWidth: 400, margin: "30px auto" }}>
            <h4>Estados de Visitas</h4>
            <Pie
              data={{
                labels: estadisticas.estados_visitas.map((e) => e.estado),
                datasets: [
                  {
                    data: estadisticas.estados_visitas.map((e) => e.cantidad),
                    backgroundColor: [
                      " #e53935",
                      " #00bcd4",
                      " #fbc02d",
                      " #43a047",
                      " #8e24aa",
                      " #1976d2",
                    ],
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: { position: "bottom" },
                },
              }}
            />
          </div>
        )}

      {estadisticas.horarios_actividad &&
        estadisticas.horarios_actividad.length > 0 && (
          <div style={{ maxWidth: 600, margin: "30px auto" }}>
            <h4>Horarios de Actividad</h4>
            <Bar
              data={{
                labels: estadisticas.horarios_actividad.map(
                  (h) => `${h.hora}:00`
                ),
                datasets: [
                  {
                    label: "Entradas",
                    data: estadisticas.horarios_actividad.map(
                      (h) => h.cantidad_entradas
                    ),
                    backgroundColor: " #1976d2",
                  },
                  {
                    label: "Salidas",
                    data: estadisticas.horarios_actividad.map(
                      (h) => h.cantidad_salidas
                    ),
                    backgroundColor: " #43a047",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                },
                scales: {
                  x: { stacked: true },
                  y: { beginAtZero: true, stacked: true },
                },
              }}
            />
          </div>
        )}

      <div className="estadisticas-section">
        <h4>Actividad de los Guardias (Hoy)</h4>
        <table className="estadisticas-table">
          <thead>
            <tr>
              <th>Guardia</th>
              <th>Total Escaneos</th>
              <th>Entradas</th>
              <th>Salidas</th>
            </tr>
          </thead>
          <tbody>
            {(estadisticas.guardias_actividad?.length > 0
              ? estadisticas.guardias_actividad
              : [
                  {
                    nombre_guardia: "Sin datos",
                    total_escaneos: 0,
                    escaneos_entrada: 0,
                    escaneos_salida: 0,
                  },
                ]
            ).map((g, i) => (
              <tr key={i}>
                <td>{g.nombre_guardia}</td>
                <td>{g.total_escaneos}</td>
                <td>{g.escaneos_entrada}</td>
                <td>{g.escaneos_salida}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="estadisticas-section">
        <h4>Residentes más activos</h4>
        <table className="estadisticas-table">
          <thead>
            <tr>
              <th>Residente</th>
              <th>Unidad</th>
              <th>Total Visitas</th>
            </tr>
          </thead>
          <tbody>
            {(estadisticas.residentes_activos?.length > 0
              ? estadisticas.residentes_activos
              : [
                  {
                    nombre_residente: "Sin datos",
                    unidad_residencial: "-",
                    total_visitas: 0,
                  },
                ]
            ).map((r, i) => (
              <tr key={i}>
                <td>{r.nombre_residente}</td>
                <td>{r.unidad_residencial}</td>
                <td>{r.total_visitas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20 }}>
        <b>Consulta realizada:</b>{" "}
        {estadisticas.fecha_consulta
          ? new Date(estadisticas.fecha_consulta).toLocaleString()
          : new Date().toLocaleString()}
      </div>
    </section>
  );
}

export default Estadisticas;
