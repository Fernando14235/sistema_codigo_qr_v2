import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Hay una nueva versión disponible. ¿Quieres actualizar ahora?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("La app está lista para usarse offline 🚀");
  },
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals