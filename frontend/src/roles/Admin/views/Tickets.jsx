import React, { useState, useEffect } from "react";
import api from "../../../api";
import BtnRegresar from "../components/BtnRegresar";
import PaginationControls from "../../../components/PaginationControls";
import TicketsCardsMobile from "./subcomponents/TicketsCardsMobile";
import TablaTickets from "./subcomponents/TablaTickets";
import TicketDetalle from "./subcomponents/TicketDetalle";
import FormActualizarTicket from "./subcomponents/FormActualizarTicket";

function Tickets({ token, onCancel, onNotification }) {
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(false);
  const [busquedaTicket, setBusquedaTicket] = useState("");
  const [filtroTicketEstado, setFiltroTicketEstado] = useState("");
  const [pageTickets, setPageTickets] = useState(1);
  const [totalPagesTickets, setTotalPagesTickets] = useState(1);
  const limitTickets = 15;

  const [ticketDetalle, setTicketDetalle] = useState(null);
  const [ticketActualizar, setTicketActualizar] = useState(null);
  const [vistaInterna, setVistaInterna] = useState("lista"); // lista, detalle, actualizar

  // Cargar tickets
  const cargarTickets = async () => {
    setCargandoTickets(true);
    try {
      const params = {};
      if (filtroTicketEstado) params.estado = filtroTicketEstado;
      if (busquedaTicket) params.titulo = busquedaTicket;
      params.page = pageTickets;
      params.limit = limitTickets;

      const res = await api.get(`/tickets/listar_tickets/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.data) {
        setTickets(res.data.data || []);
        setTotalPagesTickets(res.data.total_pages);
      } else {
        setTickets(res.data || []);
      }
    } catch (err) {
      onNotification({ message: "Error al cargar tickets", type: "error" });
    }
    setCargandoTickets(false);
  };

  // Eliminar ticket
  const eliminarTicket = async (ticketId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este ticket?")) {
      return;
    }

    try {
      await api.delete(`/tickets/eliminar_ticket/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onNotification({
        message: "Ticket eliminado exitosamente",
        type: "success",
      });
      cargarTickets();
    } catch (error) {
      onNotification({ message: "Error al eliminar ticket", type: "error" });
    }
  };

  // Ver detalle de ticket
  const verTicketDetalle = async (ticket) => {
    try {
      const res = await api.get(`/tickets/obtener_ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTicketDetalle(res.data);
      setVistaInterna("detalle");
    } catch (err) {
      onNotification({ message: "Error al cargar el ticket", type: "error" });
    }
  };

  // Actualizar ticket
  const actualizarTicket = async (ticket) => {
    try {
      const res = await api.get(`/tickets/obtener_ticket/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTicketActualizar(res.data);
      setVistaInterna("actualizar");
    } catch (err) {
      onNotification({ message: "Error al cargar el ticket", type: "error" });
    }
  };

  // Manejar éxito en actualización
  const handleTicketActualizado = () => {
    onNotification({
      message: "Ticket actualizado correctamente",
      type: "success",
    });
    setTicketActualizar(null);
    setVistaInterna("lista");
    cargarTickets();
  };

  useEffect(() => {
    if (vistaInterna === "lista") {
      cargarTickets();
    }
    // eslint-disable-next-line
  }, [vistaInterna, filtroTicketEstado, busquedaTicket, pageTickets]);

  useEffect(() => {
    setPageTickets(1);
  }, [filtroTicketEstado, busquedaTicket]);

  if (vistaInterna === "detalle" && ticketDetalle) {
    return (
      <section className="admin-section">
        <BtnRegresar
          onClick={() => {
            setTicketDetalle(null);
            setVistaInterna("lista");
          }}
        />
        <TicketDetalle
          ticket={ticketDetalle}
          onRegresar={() => {
            setTicketDetalle(null);
            setVistaInterna("lista");
          }}
          onActualizar={actualizarTicket}
        />
      </section>
    );
  }

  if (vistaInterna === "actualizar" && ticketActualizar) {
    return (
      <section className="admin-section">
        <BtnRegresar
          onClick={() => {
            setTicketActualizar(null);
            setVistaInterna("lista");
          }}
        />
        <FormActualizarTicket
          ticket={ticketActualizar}
          onSuccess={handleTicketActualizado}
          onCancel={() => {
            setTicketActualizar(null);
            setVistaInterna("lista");
          }}
          token={token}
        />
      </section>
    );
  }

  return (
    <section className="admin-section">
      <BtnRegresar onClick={onCancel} />
      <h3>🎫 Gestión de Tickets</h3>

      <div className="admin-search">
        <input
          type="text"
          placeholder="Buscar ticket..."
          value={busquedaTicket}
          onChange={(e) => setBusquedaTicket(e.target.value)}
        />
        <select
          value={filtroTicketEstado}
          onChange={(e) => setFiltroTicketEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En Proceso</option>
          <option value="resuelto">Resuelto</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <button
          className="btn-refresh"
          onClick={cargarTickets}
          disabled={cargandoTickets}
        >
          {cargandoTickets ? "🔄" : "🔄"}
        </button>
      </div>

      {cargandoTickets ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Cargando tickets...
        </div>
      ) : window.innerWidth < 750 ? (
        <TicketsCardsMobile
          tickets={tickets}
          onVerDetalle={verTicketDetalle}
          onActualizar={actualizarTicket}
          onEliminar={eliminarTicket}
        />
      ) : (
        <TablaTickets
          tickets={tickets}
          onVerDetalle={verTicketDetalle}
          onActualizar={actualizarTicket}
          onEliminar={eliminarTicket}
        />
      )}
      <PaginationControls
        currentPage={pageTickets}
        totalPages={totalPagesTickets}
        onPageChange={setPageTickets}
      />
    </section>
  );
}

export default Tickets;
