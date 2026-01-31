// Función helper para manejar ordenamiento de tablas
export const handleOrden = (campo, ordenActual, setOrden, cargarDatos) => {
  const nuevoOrden = {
    campo,
    asc: ordenActual.campo === campo ? !ordenActual.asc : true,
  };
  setOrden(nuevoOrden);
  if (cargarDatos) cargarDatos();
};
