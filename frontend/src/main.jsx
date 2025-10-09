import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// El registro del Service Worker se maneja ahora en el componente UpdateNotification