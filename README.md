# 🏠 Residencial Access - Sistema de Control de Acceso

Sistema completo de control de acceso residencial mediante códigos QR, desarrollado con FastAPI (backend) y React (frontend).

## 📋 Descripción

Residencial Access es una aplicación web que permite gestionar el acceso de visitantes a residenciales mediante códigos QR. El sistema incluye:

- **Gestión de usuarios**: Administradores, guardias y residentes
- **Creación de visitas**: Los residentes pueden crear visitas con códigos QR únicos
- **Validación de acceso**: Los guardias escanean códigos QR para validar entradas y salidas
- **Notificaciones**: Sistema de notificaciones por email
- **Historial**: Seguimiento completo de todas las visitas
- **Estadísticas**: Dashboard con métricas del sistema

## 🏗️ Arquitectura

```
residencial_access/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── core/           # Configuración y CORS
│   │   ├── models/         # Modelos de base de datos
│   │   ├── routers/        # Endpoints de la API
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── services/       # Lógica de negocio
│   │   └── utils/          # Utilidades (QR, notificaciones, etc.)
│   ├── alembic/            # Migraciones de base de datos
│   └── requirements.txt    # Dependencias Python
├── frontend/               # Aplicación React
│   ├── src/               # Código fuente React
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias Node.js
└── README.md              # Este archivo
```

## 🚀 Instalación

### Prerrequisitos

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Git

### Backend

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd residencial_access
   ```

2. **Configurar entorno virtual**
   ```bash
   cd backend
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Linux/Mac:
   source venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar base de datos**
   - Crear base de datos PostgreSQL
   - Configurar variables de entorno en `.env`
   - Ejecutar migraciones:
   ```bash
   alembic upgrade head
   ```

5. **Ejecutar servidor**
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. **Instalar dependencias**
   ```bash
   cd frontend
   npm install
   ```

2. **Ejecutar aplicación**
   ```bash
   npm run dev
   ```

## ⚙️ Configuración

## 📱 Uso

### Roles de Usuario

1. **Administrador**: Gestión completa del sistema
2. **Guardia**: Escaneo de códigos QR y control de acceso
3. **Residente**: Creación de visitas y gestión de invitados

### Flujo de Trabajo

1. **Crear visita**: El residente crea una visita con datos del visitante
2. **Generar QR**: El sistema genera un código QR único
3. **Notificación**: Se envía email al residente con el QR
4. **Validar entrada**: El guardia escanea el QR para permitir entrada
5. **Registrar salida**: El guardia registra la salida del visitante

## 🔧 Tecnologías

### Backend
- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para base de datos
- **PostgreSQL**: Base de datos principal
- **Alembic**: Migraciones de base de datos
- **JWT**: Autenticación y autorización
- **APScheduler**: Programación de tareas
- **QR Code**: Generación de códigos QR

### Frontend
- **React**: Biblioteca de interfaz de usuario
- **Vite**: Herramienta de construcción
- **Axios**: Cliente HTTP
- **React Router**: Enrutamiento
- **Chart.js**: Gráficos y estadísticas
- **QR Scanner**: Lectura de códigos QR

## 📊 API Endpoints

### Autenticación
- `POST /auth/token` - Login
- `POST /auth/refresh` - Renovar token
- `GET /auth/secure` - Endpoint seguro

### Visitas
- `POST /visitas/residente/crear_visita` - Crear visita
- `POST /visitas/guardia/validar_qr` - Validar QR
- `POST /visitas/guardia/registrar_salida` - Registrar salida
- `GET /visitas/residente/mis_visitas` - Ver visitas del residente

### Usuarios (Admin)
- `GET /usuarios/admin` - Listar usuarios
- `POST /create_usuarios/admin` - Crear usuario
- `PUT /update_usuarios/admin/{id}` - Actualizar usuario
- `DELETE /delete_usuarios/admin/{id}` - Eliminar usuario

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas, contactar al administrador del sistema.

---

**Desarrollado para Residencial**
