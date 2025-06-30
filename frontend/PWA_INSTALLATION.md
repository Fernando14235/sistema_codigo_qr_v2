# Funcionalidad de Descarga PWA

## Descripción

El sistema incluye un botón de descarga de PWA (Progressive Web App) que aparece en la parte superior izquierda de la pantalla cuando el usuario puede instalar la aplicación en su dispositivo.

## Características

### Botón de Descarga
- **Ubicación**: Esquina superior izquierda de la pantalla
- **Diseño**: Botón moderno con gradiente azul y efectos hover
- **Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Inteligente**: Solo aparece cuando es posible instalar la app

### Funcionalidades

1. **Detección Automática**: 
   - Detecta si la app ya está instalada
   - Verifica compatibilidad del navegador
   - Escucha eventos de instalación

2. **Instalación Automática**:
   - Utiliza el prompt nativo del navegador cuando está disponible
   - Proporciona instrucciones manuales cuando es necesario

3. **Instrucciones por Plataforma**:
   - **iOS**: Instrucciones para Safari
   - **Android**: Instrucciones para Chrome y otros navegadores
   - **Desktop**: Instrucciones para Chrome, Edge, Firefox

### Compatibilidad

- ✅ Chrome (Android y Desktop)
- ✅ Edge (Desktop)
- ✅ Firefox (Desktop)
- ✅ Safari (iOS) - Instalación manual
- ✅ Samsung Internet (Android)

### Estados del Botón

1. **Visible**: Cuando la app puede ser instalada
2. **Oculto**: Cuando la app ya está instalada
3. **No compatible**: En navegadores que no soportan PWA

## Implementación Técnica

### Componente: `PWADownloadButton.jsx`

```javascript
// Eventos principales
- beforeinstallprompt: Captura el prompt de instalación
- appinstalled: Detecta cuando la app se instala
- display-mode: standalone: Detecta si ya está instalada
```

### Estilos: `App.css`

```css
.pwa-download-button {
  /* Estilos del botón */
}

/* Responsive design */
@media (max-width: 700px) { /* Móviles */ }
@media (max-width: 500px) { /* Pantallas pequeñas */ }
```

## Configuración PWA

### Manifest.json
- Configuración completa para instalación
- Iconos en múltiples tamaños
- Screenshots para tiendas de apps

### Vite Config
- Plugin PWA configurado
- Service Worker automático
- Cache estratégico

## Uso

1. El botón aparece automáticamente cuando es posible instalar
2. El usuario hace clic en "📱 Instalar App"
3. Se muestra el prompt de instalación del navegador
4. Si no hay prompt, se muestran instrucciones manuales
5. La app se instala y el botón desaparece

## Beneficios

- **Experiencia de Usuario**: Instalación fácil y rápida
- **Acceso Offline**: La app funciona sin conexión
- **Actualizaciones**: Se actualiza automáticamente
- **Nativo**: Se comporta como una app nativa
- **Multiplataforma**: Funciona en móviles y desktop 