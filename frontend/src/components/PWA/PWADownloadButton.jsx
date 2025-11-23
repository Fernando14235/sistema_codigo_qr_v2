import React, { useState, useEffect } from 'react';

const PWADownloadButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMainDashboard, setIsMainDashboard] = useState(false);

  useEffect(() => {
    // Verificar si la app ya está instalada
    const checkIfInstalled = () => {
      // Verificar modo standalone (PWA instalada)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA detectada en modo standalone');
        setIsInstalled(true);
        setShowButton(false);
        return true;
      }
      
      // Verificar en iOS
      if (window.navigator.standalone === true) {
        console.log('PWA detectada en iOS standalone');
        setIsInstalled(true);
        setShowButton(false);
        return true;
      }
      
      // Verificar si está en modo fullscreen (algunos navegadores)
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        console.log('PWA detectada en modo fullscreen');
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
      console.log('App instalada');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Verificar compatibilidad y mostrar botón
    const checkCompatibilityAndShow = () => {
      const isCompatible = 'serviceWorker' in navigator;
      
      if (isCompatible && !checkIfInstalled()) {
        setShowButton(true);
      }
    };

    // Verificar inmediatamente
    checkCompatibilityAndShow();

    // Verificar después de un pequeño delay para asegurar que todo esté cargado
    const timer = setTimeout(checkCompatibilityAndShow, 1000);
    
    // Verificar después de 3 segundos como respaldo
    const backupTimer = setTimeout(() => {
      const isCompatible = 'serviceWorker' in navigator;
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      const isEdge = /Edg/.test(navigator.userAgent);
      
      if (isCompatible && !isInstalled && (isMobile || isChrome || isEdge)) {
        setShowButton(true);
      }
    }, 3000);

    // Agregar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detectar si estamos en el dashboard principal
    const checkMainDashboard = () => {
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
      setIsMainDashboard(shouldShow);
    };

    // Detectar scroll para ocultar botón
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop < 100); // Ocultar después de 100px de scroll
    };

    // Verificar dashboard inicialmente
    checkMainDashboard();

    // Verificar dashboard después de delays para asegurar que el DOM esté actualizado
    const dashboardTimer1 = setTimeout(checkMainDashboard, 100);
    const dashboardTimer2 = setTimeout(checkMainDashboard, 500);
    const dashboardTimer3 = setTimeout(checkMainDashboard, 1000);

    // Observar cambios en el DOM para detectar cambios de vista
    const observer = new MutationObserver(() => {
      checkMainDashboard();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Agregar event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMainDashboard);

    return () => {
      clearTimeout(timer);
      clearTimeout(backupTimer);
      clearTimeout(dashboardTimer1);
      clearTimeout(dashboardTimer2);
      clearTimeout(dashboardTimer3);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMainDashboard);
      observer.disconnect();
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

  // Mostrar el botón si no está instalada, independientemente del prompt
  if (isInstalled) {
    console.log('No mostrando botón: app ya instalada');
    return null;
  }

  // Lógica simplificada: mostrar el botón si es compatible y no está instalada
  const isCompatible = 'serviceWorker' in navigator;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  
  // Mostrar el botón si:
  // 1. Está habilitado explícitamente, O
  // 2. Es compatible y no está instalada, O
  // 3. Es un navegador compatible (Chrome, Edge, Firefox, móvil)
  const shouldShow = showButton || 
                    (isCompatible && !isInstalled) || 
                    (isChrome || isEdge || isFirefox || isMobile);
  

  // Solo mostrar si:
  // 1. No está instalada
  // 2. Está en el dashboard principal
  // 3. No se ha hecho scroll
  if (isInstalled) {
    return null;
  }

  if (!isMainDashboard) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`pwa-download-button ${!isVisible ? 'hidden' : ''}`}
      onClick={handleInstallClick}
      title="Instalar aplicación en tu dispositivo"
    >
      <span style={{ fontSize: '16px' }}>📱</span>
      <span>{isMobile ? 'Instalar' : 'Instalar App'}</span>
    </div>
  );
};

export default PWADownloadButton; 