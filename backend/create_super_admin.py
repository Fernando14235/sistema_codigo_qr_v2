import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.usuario import Usuario
from app.models.admin import Administrador
from app.utils.security import get_password_hash
from app.core.config import settings

def create_super_admin():
    super_admin_data = {
        "nombre": "HARED MEZA",
        "email": "haredmeza@tekhnosupport.com",
        "password": "Superadmin123",  # Cambia esta contraseña
        "telefono": "+50494745358"
    }
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un super admin
        existing_super_admin = db.query(Usuario).filter(
            Usuario.rol == "admin",
            Usuario.residencial_id.is_(None)
        ).first()
        
        if existing_super_admin:
            print("❌ Ya existe un super administrador en el sistema.")
            print(f"   Email: {existing_super_admin.email}")
            return False
        
        # Crear el usuario super admin
        super_admin_user = Usuario(
            nombre=super_admin_data["nombre"],
            email=super_admin_data["email"],
            password_hash=get_password_hash(super_admin_data["password"]),
            rol="admin",
            residencial_id=None  # Super admin no tiene residencial asignada
        )
        
        db.add(super_admin_user)
        db.flush()  # Para obtener el ID
        
        # Crear el registro de administrador
        super_admin_record = Administrador(
            usuario_id=super_admin_user.id,
            residencial_id=None,  # Super admin no tiene residencial asignada
            telefono=super_admin_data["telefono"]
        )
        
        db.add(super_admin_record)
        db.commit()
        
        print("✅ Super administrador creado exitosamente!")
        print(f"   Nombre: {super_admin_data['nombre']}")
        print(f"   Email: {super_admin_data['email']}")
        print(f"   Contraseña: {super_admin_data['password']}")
        print(f"   Teléfono: {super_admin_data['telefono']}")
        print("\n🔐 IMPORTANTE: Cambia la contraseña después del primer login!")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear super administrador: {str(e)}")
        return False
    
    finally:
        db.close()

def main():
    """Función principal"""
    print("🏗️  Creando Super Administrador para Residencial Access")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("app"):
        print("❌ Error: Ejecuta este script desde el directorio 'backend'")
        sys.exit(1)
    
    # Crear super admin
    success = create_super_admin()
    
    if success:
        print("\n🎉 Configuración completada!")
        print("\n📋 Próximos pasos:")
        print("1. Inicia sesión con el super admin")
        print("2. Crea las residenciales necesarias")
        print("3. Crea administradores para cada residencial")
        print("4. Cambia la contraseña del super admin")
    else:
        print("\n❌ No se pudo crear el super administrador")
        sys.exit(1)

if __name__ == "__main__":
    main() 