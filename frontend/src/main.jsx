import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import App from './App';

// Función para mostrar el toast de actualización
function showUpdateToast() {
  const toast = document.createElement('div');
  toast.textContent = '🔄 Nueva versión, actualizando...';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #1976d2;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideDown 0.3s ease-out;
  `;

  // Añadir animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  // Recargar después de 1 segundo
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Registrar Service Worker manualmente
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // Verificar actualizaciones cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60000);

        // Escuchar cambios en el controlador (nueva versión activada)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          showUpdateToast();
        });
      })
      .catch(error => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);