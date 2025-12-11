# Imagen base
FROM python:3.11

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia todo el contenido del backend al contenedor
COPY . .

# Instala dependencias
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Expone el puerto (debe coincidir con el que configures en Railway)
EXPOSE 8000

# Comando para aplicar migraciones y luego iniciar FastAPI con Uvicorn
CMD alembic stamp head && uvicorn app.main:app --host 0.0.0.0 --port 8000