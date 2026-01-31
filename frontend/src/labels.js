// labels.js - Diccionario de etiquetas generalizadas para Porto Pass
// Este archivo permite adaptar la terminología de la aplicación para diferentes tipos de organizaciones
export const LABELS = {
  // Términos principales de la organización
  RESIDENCIAL: "Organización",
  RESIDENCIAL_PLURAL: "Organizaciones", 
  RESIDENCIAL_NOMBRE: "Nombre de la Organización",
  RESIDENCIAL_ACCESS: "Porto Pass",
  
  // Roles de usuario generalizados
  RESIDENTE: "Miembro",
  RESIDENTE_PLURAL: "Miembros",
  RESIDENTES: "Miembros",
  GUARDIA: "Seguridad",
  GUARDIA_PLURAL: "Seguridad",
  GUARDIAS: "Seguridad",
  ADMINISTRADOR: "Administrador",
  ADMINISTRADOR_PLURAL: "Administradores",
  SUPER_ADMIN: "Super Administrador",
  
  // Ubicaciones y espacios
  UNIDAD_RESIDENCIAL: "Unidad/Área",
  UNIDAD_RESIDENCIAL_PLACEHOLDER: "Ej: Oficina 101, Aula 205, Casa 15",
  UNIDAD: "Unidad",
  AREA: "Área",
  
  // Acciones y procesos
  CREAR_VISITA: "Crear Acceso",
  NUEVA_VISITA: "Nuevo Acceso",
  VISITA: "Acceso",
  VISITA_PLURAL: "Accesos",
  VISITAS: "Accesos",
  VISITANTE: "Visitante",
  VISITANTE_PLURAL: "Visitantes",
  VISITANTES: "Visitantes",
  
  // Estados y procesos de acceso
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  INGRESO: "Ingreso",
  ACCESO_AUTORIZADO: "Acceso Autorizado",
  ACCESO_DENEGADO: "Acceso Denegado",
  PENDIENTE_APROBACION: "Pendiente de Aprobación",
  
  // Navegación y menús
  DASHBOARD_RESIDENTE: "Panel de Miembro",
  DASHBOARD_GUARDIA: "Panel de Seguridad", 
  DASHBOARD_ADMIN: "Panel de Administrador",
  MIS_VISITAS: "Mis Accesos",
  HISTORIAL_VISITAS: "Historial de Accesos",
  GESTIONAR_USUARIOS: "Gestionar Usuarios",
  GESTIONAR_RESIDENTES: "Gestionar Miembros",
  GESTIONAR_GUARDIAS: "Gestionar Seguridad",
  
  // Formularios y campos
  DATOS_RESIDENTE: "Datos del Miembro",
  DATOS_VISITANTE: "Datos del Visitante",
  DATOS_GUARDIA: "Datos del Seguridad",
  NOMBRE_RESIDENTE: "Nombre del Miembro",
  EMAIL_RESIDENTE: "Email del Miembro",
  TELEFONO_RESIDENTE: "Teléfono del Miembro",
  
  // Notificaciones y mensajes
  BIENVENIDO_RESIDENTE: "Bienvenido, Miembro",
  BIENVENIDO_GUARDIA: "Bienvenido, Seguridad",
  BIENVENIDO_ADMIN: "Bienvenido, Administrador",
  VISITA_CREADA: "Acceso creado exitosamente",
  VISITA_ACTUALIZADA: "Acceso actualizado exitosamente",
  VISITA_ELIMINADA: "Acceso eliminado exitosamente",
  
  // Reportes y estadísticas
  ESTADISTICAS_RESIDENCIAL: "Estadísticas de la Organización",
  REPORTE_VISITAS: "Reporte de Accesos",
  TOTAL_RESIDENTES: "Total de Miembros",
  TOTAL_GUARDIAS: "Total de Seguridad",
  TOTAL_VISITAS: "Total de Accesos",
  
  // QR y códigos
  CODIGO_QR: "Código QR",
  ESCANEAR_QR: "Escanear Código",
  GENERAR_QR: "Generar Código",
  QR_VALIDO: "Código Válido",
  QR_INVALIDO: "Código Inválido",
  QR_EXPIRADO: "Código Expirado",
  
  // Vehículos y transporte
  VEHICULO: "Vehículo",
  TIPO_VEHICULO: "Tipo de Vehículo",
  PLACA_VEHICULO: "Placa del Vehículo",
  MARCA_VEHICULO: "Marca del Vehículo",
  COLOR_VEHICULO: "Color del Vehículo",
  
  // Tiempo y fechas
  FECHA_ENTRADA: "Fecha de Entrada",
  FECHA_SALIDA: "Fecha de Salida",
  FECHA_EXPIRACION: "Fecha de Expiración",
  HORA_ENTRADA: "Hora de Entrada",
  HORA_SALIDA: "Hora de Salida",
  
  // Estados generales
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
  
  // Acciones de botones
  CREAR: "Crear",
  EDITAR: "Editar",
  ELIMINAR: "Eliminar",
  GUARDAR: "Guardar",
  CANCELAR: "Cancelar",
  APROBAR: "Aprobar",
  RECHAZAR: "Rechazar",
  BUSCAR: "Buscar",
  FILTRAR: "Filtrar",
  EXPORTAR: "Exportar",
  IMPRIMIR: "Imprimir",
  
  // Navegación
  REGRESAR: "Regresar",
  SIGUIENTE: "Siguiente",
  ANTERIOR: "Anterior",
  INICIO: "Inicio",
  MENU_PRINCIPAL: "Menú Principal",
  CERRAR_SESION: "Cerrar Sesión",
  
  // Configuración y ajustes
  CONFIGURACION: "Configuración",
  PERFIL: "Perfil",
  AJUSTES: "Ajustes",
  PREFERENCIAS: "Preferencias",
  
  // Comunicación y social
  PUBLICACIONES: "Publicaciones",
  COMUNICADOS: "Comunicados",
  NOTIFICACIONES: "Notificaciones",
  MENSAJES: "Mensajes",
  
  // Soporte y ayuda
  TICKETS: "Tickets de Soporte",
  CREAR_TICKET: "Crear Ticket",
  SOPORTE: "Soporte",
  AYUDA: "Ayuda",
  FAQ: "Preguntas Frecuentes",
  
  // Términos específicos por contexto
  CONTEXTS: {
    // Para residenciales/condominios
    RESIDENTIAL: {
      RESIDENCIAL: "Residencial",
      RESIDENTE: "Residente", 
      UNIDAD_RESIDENCIAL: "Unidad Residencial",
      GUARDIA: "Guardia de Seguridad"
    },
    
    // Para empresas/oficinas
    CORPORATE: {
      RESIDENCIAL: "Empresa",
      RESIDENTE: "Empleado",
      UNIDAD_RESIDENCIAL: "Oficina/Departamento", 
      GUARDIA: "Personal de Seguridad"
    },
    
    // Para instituciones educativas
    EDUCATIONAL: {
      RESIDENCIAL: "Institución",
      RESIDENTE: "Estudiante/Personal",
      UNIDAD_RESIDENCIAL: "Aula/Oficina",
      GUARDIA: "Personal de Seguridad"
    },
    
    // Para centros comerciales
    COMMERCIAL: {
      RESIDENCIAL: "Centro Comercial",
      RESIDENTE: "Comerciante",
      UNIDAD_RESIDENCIAL: "Local Comercial",
      GUARDIA: "Personal de Seguridad"
    },
    
    // Para hospitales/clínicas
    HEALTHCARE: {
      RESIDENCIAL: "Centro Médico",
      RESIDENTE: "Personal Médico",
      UNIDAD_RESIDENCIAL: "Consultorio/Área",
      GUARDIA: "Personal de Seguridad"
    }
  }
};

// Función para obtener etiquetas según contexto
export const getLabels = (context = 'DEFAULT') => {
  if (context === 'DEFAULT') {
    return LABELS;
  }
  
  const contextLabels = LABELS.CONTEXTS[context];
  if (contextLabels) {
    return { ...LABELS, ...contextLabels };
  }
  
  return LABELS;
};

// Función para obtener una etiqueta específica
export const getLabel = (key, context = 'DEFAULT') => {
  const labels = getLabels(context);
  return labels[key] || key;
};

// Configuración por defecto (puede ser modificada dinámicamente)
export let CURRENT_CONTEXT = 'DEFAULT';

// Función para cambiar el contexto globalmente
export const setContext = (context) => {
  CURRENT_CONTEXT = context;
};

// Función helper para obtener etiqueta con contexto actual
export const label = (key) => {
  return getLabel(key, CURRENT_CONTEXT);
};

export default LABELS;