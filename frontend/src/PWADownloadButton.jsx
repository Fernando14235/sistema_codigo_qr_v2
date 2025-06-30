import React, { useState, useEffect } from 'react';

const PWADownloadButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si la app ya está instalada
    const checkIfInstalled = () => {
      // Verificar modo standalone (PWA instalada)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowButton(false);
        return true;
      }
      
      // Verificar en iOS
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        setShowButton(false);
        return true;
      }
      
      // Verificar si está en modo fullscreen (algunos navegadores)
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        setIsInstalled(true);
        setShowButton(false);
        return true;
      }
      
      return false;
    };

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    // Escuchar el evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Verificar si ya está instalada al cargar
    if (!checkIfInstalled()) {
      // Mostrar el botón si no está instalada y es compatible
      const isCompatible = 'serviceWorker' in navigator && 'PushManager' in window;
      if (isCompatible) {
        setShowButton(true);
      }
    }

    // Agregar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Si no hay prompt diferido, mostrar instrucciones manuales
      showManualInstallInstructions();
      return;
    }

    try {
      // Mostrar el prompt de instalación
      deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
      } else {
        console.log('Usuario rechazó la instalación');
      }
      
      // Limpiar el prompt
      setDeferredPrompt(null);
      setShowButton(false);
    } catch (error) {
      console.error('Error al instalar PWA:', error);
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    let message = '';
    
    if (isIOS) {
      message = '📱 Para instalar en iOS:\n\n1️⃣ Toca el botón compartir (📤) en Safari\n2️⃣ Selecciona "Agregar a pantalla de inicio"\n3️⃣ Toca "Agregar"\n\n¡Listo! La app aparecerá en tu pantalla de inicio.';
    } else if (isAndroid && isChrome) {
      message = '📱 Para instalar en Android (Chrome):\n\n1️⃣ Toca el menú (⋮) en la esquina superior derecha\n2️⃣ Selecciona "Instalar app" o "Agregar a pantalla de inicio"\n3️⃣ Confirma la instalación\n\n¡Listo! La app se instalará en tu dispositivo.';
    } else if (isAndroid) {
      message = '📱 Para instalar en Android:\n\n1️⃣ Busca el ícono de instalación en la barra de direcciones\n2️⃣ Toca "Instalar" o "Agregar a pantalla de inicio"\n3️⃣ Confirma la instalación\n\n¡Listo! La app se instalará en tu dispositivo.';
    } else if (isChrome || isEdge) {
      message = '💻 Para instalar en Chrome/Edge:\n\n1️⃣ Busca el ícono de instalación (📥) en la barra de direcciones\n2️⃣ Haz clic en "Instalar"\n3️⃣ Confirma la instalación\n\n¡Listo! La app se instalará en tu computadora.';
    } else if (isFirefox) {
      message = '💻 Para instalar en Firefox:\n\n1️⃣ Busca el ícono de instalación en la barra de direcciones\n2️⃣ Haz clic en "Instalar"\n3️⃣ Confirma la instalación\n\n¡Listo! La app se instalará en tu computadora.';
    } else {
      message = '💻 Para instalar la aplicación:\n\n1️⃣ Busca el ícono de instalación en la barra de direcciones\n2️⃣ Haz clic en "Instalar" o "Agregar"\n3️⃣ Confirma la instalación\n\n¡Listo! La app se instalará en tu dispositivo.';
    }
    
    alert(message);
  };

  if (!showButton || isInstalled) {
    return null;
  }

  return (
    <div 
      className="pwa-download-button"
      onClick={handleInstallClick}
      title="Instalar aplicación en tu dispositivo"
    >
      <span style={{ fontSize: '16px' }}>📱</span>
      <span>Instalar App</span>
    </div>
  );
};

export default PWADownloadButton; 