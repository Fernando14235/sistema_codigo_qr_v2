import React, { useState, useEffect } from 'react';
import { useOffline } from '../../hooks/offline/useOffline';

const OfflineIndicator = () => {
  const { isOnline, pendingActions } = useOffline();
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Detectar scroll y vista actual para ocultar indicador
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop < 100); // Ocultar después de 100px de scroll
    };

    const checkCurrentView = () => {
      const mainMenu = document.querySelector('.main-menu');
      const guardiaMainMenu = document.querySelector('.guardia-main-menu');
      const residenteMainMenu = document.querySelector('.residente-main-menu');
      
      // Verificar si estamos en el dashboard principal (vista 'menu')
      const isMain = mainMenu || guardiaMainMenu || residenteMainMenu;
      
      // Verificar que no estamos en otras vistas específicas
      const isInOtherView = document.querySelector('.crear-usuario-form') || 
                           document.querySelector('.perfil-usuario') ||
                           document.querySelector('.config-usuario-main') ||
                           document.querySelector('.admin-section') ||
                           document.querySelector('.guardia-section') ||
                           document.querySelector('.residente-section');
      
      // Solo mostrar en dashboard principal, no en otras vistas
      const shouldShow = isMain && !isInOtherView;
      
      if (!shouldShow) {
        setIsVisible(false);
      } else {
        // Si estamos en dashboard principal, verificar scroll
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setIsVisible(scrollTop < 100);
      }
    };

    // Verificar vista inicial
    checkCurrentView();

    // Verificar después de un delay para asegurar que el DOM esté actualizado
    const timer = setTimeout(checkCurrentView, 100);

    // Observar cambios en el DOM para detectar cambios de vista
    const observer = new MutationObserver(() => {
      checkCurrentView();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkCurrentView);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkCurrentView);
      observer.disconnect();
    };
  }, []);

  if (isOnline && pendingActions.length === 0) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    if (pendingActions.length > 0) return '🔄';
    return '🟢';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (pendingActions.length > 0) return `${pendingActions.length} acción(es) pendiente(s)`;
    return 'Conectado';
  };

  const getActionTypeText = (type) => {
    switch (type) {
      case 'REGISTER_ENTRY': return 'Registrar Entrada';
      case 'REGISTER_EXIT': return 'Registrar Salida';
      case 'CREATE_VISIT': return 'Crear Visita';
      default: return type;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 1001,
      background: isOnline ? '#4caf50' : '#f44336',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
      pointerEvents: isVisible ? 'auto' : 'none'
    }}
    onClick={() => setShowDetails(!showDetails)}
    title={isOnline ? 'Ver acciones pendientes' : 'Modo offline activo'}
    >
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      
      {showDetails && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          background: 'white',
          color: '#333',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '250px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '11px',
          zIndex: 1002
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1976d2' }}>
            {!isOnline ? 'Modo Offline' : 'Acciones Pendientes'}
          </div>
          
          {!isOnline && (
            <div style={{ marginBottom: '8px' }}>
              <p>📱 Funcionalidades disponibles offline:</p>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Ver historial de visitas</li>
                <li>Ver estadísticas recientes</li>
                <li>Ver escaneos del día</li>
                <li>Ver publicaciones recientes</li>
                <li>Registrar entrada/salida (se sincronizará después)</li>
              </ul>
            </div>
          )}
          
          {pendingActions.length > 0 && (
            <div>
              <p style={{ marginBottom: '4px' }}>📝 Acciones pendientes de sincronización:</p>
              {pendingActions.slice(0, 3).map(action => (
                <div key={action.id} style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  fontSize: '10px'
                }}>
                  {getActionTypeText(action.type)} - {new Date(action.timestamp).toLocaleTimeString()}
                </div>
              ))}
              {pendingActions.length > 3 && (
                <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                  ... y {pendingActions.length - 3} más
                </div>
              )}
            </div>
          )}
          
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #eee',
            fontSize: '10px',
            color: '#666'
          }}>
            {!isOnline ? 'Los datos se sincronizarán cuando se recupere la conexión' : 'Las acciones se procesarán automáticamente'}
          </div>
          

        </div>
      )}
    </div>
  );
};

export default OfflineIndicator; 