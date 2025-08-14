#!/usr/bin/env python3
"""
Script para crear un Super Administrador en el sistema de Residencial Access
Este script crea automáticamente un usuario con rol 'super_admin' y lo asocia
con la tabla super_admins para darle control total sobre todos los residenciales.

Uso:
    python create_super_admin_simple.py

Configuración:
    - Edita las variables SUPER_ADMIN_* al inicio del script
    - Asegúrate de que la base de datos esté configurada correctamente
"""

import os
import sys
from pathlib import Path

# Agregar el directorio del proyecto al path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models import Usuario, SuperAdmin, Rol
from app.utils.security import get_password_hash
from app.core.config import settings

# Configurar variables de entorno temporalmente
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:platense14@localhost:5432/residencial_v2")
os.environ.setdefault("SECRET_KEY", "rzKp9JPakU7tfORpn-IpsQhmOb1xwufoEjhvmpDmvMrWbxBbYt2mtiVHVh1Hv_RNzw5dDDtO3dzv3E8jZmdrbA")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "14")
os.environ.setdefault("TOKEN_TYPE", "bearer")
os.environ.setdefault("PASSWORD_HASH_ALGORITHM", "bcrypt")
os.environ.setdefault("FERNET_KEY", "M7T6EUvtoU5WYjQcuit0c5VgOdJxU5J8D9JWeceIxUo=")
os.environ.setdefault("HMAC_SECRET", "tdxrH-EpKqW0LLecAq72JK%0Et1Zhux9")
os.environ.setdefault("EMAIL_ADDRESS", "jfvela.1803@gmail.com")
os.environ.setdefault("EMAIL_PASSWORD", "vvvxtqbavdcekidr")
os.environ.setdefault("EMAIL_SMTP_SERVER", "smtp.gmail.com")
os.environ.setdefault("EMAIL_SMTP_PORT", "465")
os.environ.setdefault("EMAIL_USE_TLS", "true")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

# Configuración del Super Admin
SUPER_ADMIN_NOMBRE = "FERVELA"
SUPER_ADMIN_EMAIL = "josevelasquez9463@gmail.com"
SUPER_ADMIN_PASSWORD = "Superadmin123!"
SUPER_ADMIN_TELEFONO = "+50498781721"

def create_super_admin():
    """Crea un super administrador en el sistema"""
    print("🏗️  Creando Super Administrador para Residencial Access con la cuenta de Hared")
    print("=" * 60)
    
    try:
        # Verificar si ya existe un super admin
        db = next(get_db())
        existing_super_admin = db.query(Usuario).filter(
            Usuario.rol == Rol.super_admin
        ).first()
        
        # if existing_super_admin:
        #     print(f"⚠️  Ya existe un super administrador con email: {existing_super_admin.email}")
        #     print("   Si deseas crear uno nuevo, elimina el existente primero.")
        #     return False
        
        # Crear el usuario super admin
        password_hash = get_password_hash(SUPER_ADMIN_PASSWORD)
        
        nuevo_usuario = Usuario(
            nombre=SUPER_ADMIN_NOMBRE,
            email=SUPER_ADMIN_EMAIL,
            password_hash=password_hash,
            rol=Rol.super_admin,
            residencial_id=None  # Los super admins no pertenecen a un residencial específico
        )
        
        db.add(nuevo_usuario)
        db.flush()  # Para obtener el ID del usuario
        
        # Crear el registro en la tabla super_admins
        nuevo_super_admin = SuperAdmin(
            usuario_id=nuevo_usuario.id,
            telefono=SUPER_ADMIN_TELEFONO
        )
        
        db.add(nuevo_super_admin)
        db.commit()
        
        print("✅ Super Administrador creado exitosamente!")
        print(f"   📧 Email: {SUPER_ADMIN_EMAIL}")
        print(f"   🔑 Contraseña: {SUPER_ADMIN_PASSWORD}")
        print(f"   📱 Teléfono: {SUPER_ADMIN_TELEFONO}")
        print(f"   🆔 ID de Usuario: {nuevo_usuario.id}")
        print(f"   🆔 ID de Super Admin: {nuevo_super_admin.id}")
        print("\n🔐 Credenciales de acceso:")
        print(f"   Usuario: {SUPER_ADMIN_EMAIL}")
        print(f"   Contraseña: {SUPER_ADMIN_PASSWORD}")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al crear super administrador: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    try:
        success = create_super_admin()
        if not success:
            print("\n❌ No se pudo crear el super administrador")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        sys.exit(1) 